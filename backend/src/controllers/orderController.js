import db from '../../database/db.js';

/**
 * Helper to resolve dish from menu_items by id, 'dish-X', or dish name
 */
function resolveDish(it) {
  let rawId = it.menuItemId || it.dishId || it.id;
  let numericId = null;

  if (typeof rawId === 'number') {
    numericId = rawId;
  } else if (typeof rawId === 'string') {
    if (rawId.startsWith('dish-')) {
      numericId = parseInt(rawId.replace('dish-', ''), 10);
    } else if (/^\d+$/.test(rawId)) {
      numericId = parseInt(rawId, 10);
    }
  }

  // 1. Try finding by numeric id
  if (numericId && !isNaN(numericId)) {
    const dish = db.prepare('SELECT id, name, price, image FROM menu_items WHERE id = ?').get(numericId);
    if (dish) return dish;
  }

  // 2. Try finding by dish name
  if (it.name) {
    const dish = db.prepare('SELECT id, name, price, image FROM menu_items WHERE LOWER(name) = LOWER(?)').get(it.name.trim());
    if (dish) return dish;
  }

  // 3. Fallback to default or item data to avoid order failure
  const fallbackDish = db.prepare('SELECT id, name, price, image FROM menu_items ORDER BY id ASC LIMIT 1').get();
  if (fallbackDish) {
    return {
      id: fallbackDish.id,
      name: it.name || fallbackDish.name,
      price: Number(it.price || it.unitPrice || fallbackDish.price),
      image: it.image || fallbackDish.image
    };
  }

  return {
    id: 1,
    name: it.name || 'Artisan Dish',
    price: Number(it.price || it.unitPrice || 10.00),
    image: it.image || ''
  };
}

/**
 * Create a new customer order (supports Dine-in, Takeaway & Online Delivery)
 * POST /api/orders
 */
export function createOrder(req, res) {
  try {
    const {
      orderCode: clientOrderCode,
      orderId: clientOrderId,
      id: clientId,
      orderType = 'dine_in',
      diningMode,
      tableNumber,
      customerName = 'Valued Guest',
      customerPhone,
      deliveryAddress,
      deliveryFee = 0.0,
      customerNotes = '',
      specialNotes = '',
      paymentMethod = 'cash',
      paymentStatus = 'unpaid',
      items = []
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Determine clean orderCode (e.g. 'ORD-2107')
    const finalOrderCode = clientOrderCode || clientOrderId || (typeof clientId === 'string' && clientId.startsWith('ORD-') ? clientId : null) || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Normalize order type and table
    const mode = diningMode || orderType;
    const isDineIn = mode === 'dine-in' || mode === 'dine_in';
    const normalizedOrderType = isDineIn ? 'dine_in' : (mode === 'takeaway' || mode === 'takeout' ? 'takeaway' : 'delivery');
    const finalTable = isDineIn ? String(tableNumber || '04').padStart(2, '0') : null;

    let subtotal = 0;
    const itemRecords = [];

    for (const it of items) {
      const dish = resolveDish(it);
      const unitPrice = Number(it.unitPrice || it.price || dish.price);
      const qty = Math.max(1, Number(it.quantity) || 1);
      subtotal += unitPrice * qty;
      itemRecords.push({
        menuItemId: dish.id,
        name: dish.name,
        quantity: qty,
        unitPrice
      });
    }

    const tax = subtotal * 0.10;
    const serviceFee = subtotal * 0.05;
    const totalAmount = subtotal + tax + serviceFee + Number(deliveryFee);

    const insertOrder = db.prepare(`
      INSERT INTO orders (orderCode, orderType, tableNumber, customerName, customerPhone, deliveryAddress, deliveryFee, customerNotes, totalAmount, paymentMethod, paymentStatus, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (orderId, menuItemId, quantity, unitPrice)
      VALUES (?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      const orderResult = insertOrder.run(
        finalOrderCode,
        normalizedOrderType,
        finalTable,
        customerName || 'Valued Guest',
        customerPhone || null,
        deliveryAddress || null,
        Number(deliveryFee),
        customerNotes || specialNotes || '',
        Number(totalAmount.toFixed(2)),
        paymentMethod || 'cash',
        paymentStatus || 'unpaid'
      );
      const rowId = orderResult.lastInsertRowid;

      for (const rec of itemRecords) {
        insertOrderItem.run(rowId, rec.menuItemId, rec.quantity, rec.unitPrice);
      }
      return rowId;
    });

    const newDbId = tx();

    res.status(201).json({
      message: 'Order placed successfully',
      id: finalOrderCode,
      orderId: finalOrderCode,
      orderCode: finalOrderCode,
      dbId: newDbId,
      status: 'pending',
      totalAmount: Number(totalAmount.toFixed(2))
    });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ error: 'Failed to place order: ' + error.message });
  }
}

/**
 * Fetch all orders (supports Kitchen KDS & Customer Tracker)
 * GET /api/orders
 */
export function getOrders(req, res) {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM orders';
    const params = [];

    if (status) {
      if (status === 'cooking' || status === 'preparing') {
        query += " WHERE status IN ('cooking', 'preparing')";
      } else if (status === 'served' || status === 'completed') {
        query += " WHERE status IN ('served', 'completed', 'delivered')";
      } else {
        query += ' WHERE status = ?';
        params.push(status);
      }
    }
    query += ' ORDER BY id DESC';

    const orders = db.prepare(query).all(...params);

    const getItems = db.prepare(`
      SELECT oi.*, m.name, m.image
      FROM order_items oi
      JOIN menu_items m ON oi.menuItemId = m.id
      WHERE oi.orderId = ?
    `);

    const fullOrders = orders.map(ord => {
      const dbItems = getItems.all(ord.id);
      const itemsList = dbItems.map(it => ({
        id: it.menuItemId,
        name: it.name,
        price: Number(it.unitPrice),
        unitPrice: Number(it.unitPrice),
        quantity: Number(it.quantity),
        image: it.image,
        spiceLevel: 'Standard',
        addOns: []
      }));

      // Normalize status into 4 customer & kitchen workflow stages:
      // 'pending' -> 'cooking' -> 'ready' -> 'served'
      let normalizedStatus = ord.status;
      if (ord.status === 'preparing') normalizedStatus = 'cooking';
      if (ord.status === 'completed' || ord.status === 'delivered') normalizedStatus = 'served';

      const code = ord.orderCode || `ORD-${1000 + ord.id}`;

      return {
        id: code,
        dbId: ord.id,
        orderCode: code,
        orderType: ord.orderType,
        diningMode: ord.orderType === 'dine_in' ? 'dine-in' : ord.orderType,
        tableNumber: ord.tableNumber ? String(ord.tableNumber) : null,
        customerName: ord.customerName || 'Valued Guest',
        phone: ord.customerPhone || '',
        address: ord.deliveryAddress || '',
        deliveryFee: Number(ord.deliveryFee || 0),
        status: normalizedStatus,
        paymentMethod: ord.paymentMethod || 'cash',
        paymentStatus: ord.paymentStatus || 'unpaid',
        total: Number(ord.totalAmount || 0),
        totalAmount: Number(ord.totalAmount || 0),
        subtotal: Number((ord.totalAmount * 0.85).toFixed(2)),
        tax: Number((ord.totalAmount * 0.10).toFixed(2)),
        serviceFee: Number((ord.totalAmount * 0.05).toFixed(2)),
        specialNotes: ord.customerNotes || '',
        customerNotes: ord.customerNotes || '',
        timestamp: ord.createdAt || new Date().toISOString(),
        createdAt: ord.createdAt || new Date().toISOString(),
        items: itemsList
      };
    });

    res.json(fullOrders);
  } catch (error) {
    console.error('getOrders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

/**
 * Fetch single order details by ID or orderCode
 * GET /api/orders/:id
 */
export function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR orderCode = ?').get(id, id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const getItems = db.prepare(`
      SELECT oi.*, m.name, m.image
      FROM order_items oi
      JOIN menu_items m ON oi.menuItemId = m.id
      WHERE oi.orderId = ?
    `);

    let normalizedStatus = order.status;
    if (order.status === 'preparing') normalizedStatus = 'cooking';
    if (order.status === 'completed' || order.status === 'delivered') normalizedStatus = 'served';

    const code = order.orderCode || `ORD-${1000 + order.id}`;

    res.json({
      ...order,
      id: code,
      dbId: order.id,
      orderCode: code,
      diningMode: order.orderType === 'dine_in' ? 'dine-in' : order.orderType,
      status: normalizedStatus,
      total: Number(order.totalAmount),
      items: getItems.all(order.id)
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
}

/**
 * Update order status (pending -> cooking -> ready -> served -> cancelled)
 * PATCH /api/orders/:id/status
 */
export function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'cooking', 'preparing', 'ready', 'served', 'completed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Normalize: cooking <-> preparing, served <-> completed
    let dbStatus = status;
    if (status === 'preparing') dbStatus = 'cooking';
    if (status === 'completed' || status === 'delivered') dbStatus = 'served';

    const result = db.prepare(`
      UPDATE orders
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? OR orderCode = ?
    `).run(dbStatus, id, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      orderId: id,
      status: dbStatus
    });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}
