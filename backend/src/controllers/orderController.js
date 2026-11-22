import db from '../../database/db.js';

// Live Server-Sent Events (SSE) Client Subscribers for Real-Time Kitchen Display (KDS)
const sseClients = new Set();

/**
 * Real-Time Order Stream (Server-Sent Events)
 * GET /api/orders/stream
 */
export function streamOrders(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const client = { id: Date.now(), res };
  sseClients.add(client);

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
}

/**
 * Broadcast event to all active KDS & Floor SSE subscribers
 */
export function broadcastOrderEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

/**
 * Normalizes SQLite UTC timestamps ("YYYY-MM-DD HH:MM:SS") into valid ISO-8601 with "Z"
 */
function formatIsoUtc(dateStr) {
  if (!dateStr) return new Date().toISOString();
  if (typeof dateStr === 'string') {
    const trimmed = dateStr.trim();
    if (!trimmed.endsWith('Z') && !trimmed.includes('+') && !trimmed.includes('T')) {
      const fixed = trimmed.replace(' ', 'T') + 'Z';
      const parsed = new Date(fixed);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    } else if (!trimmed.endsWith('Z') && !trimmed.includes('+') && trimmed.includes('T')) {
      const fixed = trimmed + 'Z';
      const parsed = new Date(fixed);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
}

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
      voucherCode: clientVoucherCode,
      promoCode: clientPromoCode,
      discountAmount: clientDiscountAmount,
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

    // Process & verify promotional voucher if applied
    const promoInput = (clientVoucherCode || clientPromoCode || '').trim().toUpperCase();
    let appliedVoucherCode = null;
    let finalDiscountAmount = 0;

    if (promoInput) {
      const voucher = db.prepare('SELECT code, discountPercent FROM vouchers WHERE UPPER(code) = ? AND isActive = 1').get(promoInput);
      if (voucher) {
        appliedVoucherCode = voucher.code;
        finalDiscountAmount = Number(((subtotal * voucher.discountPercent) / 100).toFixed(2));
      } else if (clientDiscountAmount && Number(clientDiscountAmount) > 0) {
        finalDiscountAmount = Number(Number(clientDiscountAmount).toFixed(2));
      }
    } else if (clientDiscountAmount && Number(clientDiscountAmount) > 0) {
      finalDiscountAmount = Number(Number(clientDiscountAmount).toFixed(2));
    }

    const discountedSubtotal = Math.max(0, subtotal - finalDiscountAmount);
    const tax = Number((discountedSubtotal * 0.10).toFixed(2));
    const serviceFee = Number((discountedSubtotal * 0.05).toFixed(2));
    const totalAmount = Number((discountedSubtotal + tax + serviceFee + Number(deliveryFee)).toFixed(2));

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        orderCode, orderType, tableNumber, customerName, customerPhone, deliveryAddress, deliveryFee, 
        customerNotes, subtotal, tax, serviceFee, discountAmount, voucherCode, totalAmount, paymentMethod, paymentStatus, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
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
        Number(subtotal.toFixed(2)),
        tax,
        serviceFee,
        finalDiscountAmount,
        appliedVoucherCode,
        totalAmount,
        paymentMethod || 'cash',
        paymentStatus || 'unpaid'
      );
      const rowId = orderResult.lastInsertRowid;

      for (const rec of itemRecords) {
        insertOrderItem.run(rowId, rec.menuItemId, rec.quantity, rec.unitPrice);
      }

      // Automatically update physical table status to occupied if dine-in
      if (normalizedOrderType === 'dine_in' && finalTable) {
        const tblNum = parseInt(finalTable, 10);
        if (!isNaN(tblNum)) {
          db.prepare("UPDATE restaurant_tables SET status = 'occupied' WHERE tableNumber = ?").run(tblNum);
        }
      }

      return rowId;
    });

    const newDbId = tx();

    // Broadcast new order to live KDS subscribers via SSE
    broadcastOrderEvent('order_created', {
      orderCode: finalOrderCode,
      orderId: newDbId,
      orderType: normalizedOrderType,
      tableNumber: finalTable,
      customerName,
      totalAmount,
      status: 'pending'
    });

    const nowIso = new Date().toISOString();

    res.status(201).json({
      message: 'Order placed successfully',
      id: finalOrderCode,
      orderId: finalOrderCode,
      orderCode: finalOrderCode,
      dbId: newDbId,
      status: 'pending',
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: finalDiscountAmount,
      voucherCode: appliedVoucherCode,
      tax,
      serviceFee,
      totalAmount,
      createdAt: nowIso,
      timestamp: nowIso
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
    const { status, date, page, limit } = req.query;
    let query = 'SELECT * FROM orders';
    const params = [];
    const conditions = [];

    if (status) {
      if (status === 'cooking' || status === 'preparing') {
        conditions.push("status IN ('cooking', 'preparing')");
      } else if (status === 'served' || status === 'completed') {
        conditions.push("status IN ('served', 'completed', 'delivered')");
      } else {
        conditions.push('status = ?');
        params.push(status);
      }
    }

    if (date) {
      conditions.push('DATE(createdAt) = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
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
        subtotal: Number(ord.subtotal != null && ord.subtotal > 0 ? ord.subtotal : (ord.totalAmount * 0.85).toFixed(2)),
        discount: Number(ord.discountAmount || 0),
        discountAmount: Number(ord.discountAmount || 0),
        voucherCode: ord.voucherCode || null,
        promoCode: ord.voucherCode || null,
        tax: Number(ord.tax != null && ord.tax > 0 ? ord.tax : (ord.totalAmount * 0.10).toFixed(2)),
        serviceFee: Number(ord.serviceFee != null && ord.serviceFee > 0 ? ord.serviceFee : (ord.totalAmount * 0.05).toFixed(2)),
        specialNotes: ord.customerNotes || '',
        customerNotes: ord.customerNotes || '',
        timestamp: formatIsoUtc(ord.createdAt),
        createdAt: formatIsoUtc(ord.createdAt),
        updatedAt: formatIsoUtc(ord.updatedAt || ord.createdAt),
        items: itemsList
      };
    });

    const isPaginated = page !== undefined || limit !== undefined;
    if (isPaginated) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const totalCount = fullOrders.length;
      const totalPages = Math.ceil(totalCount / limitNum);
      const offset = (pageNum - 1) * limitNum;
      const pagedOrders = fullOrders.slice(offset, offset + limitNum);

      return res.json({
        orders: pagedOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages
        }
      });
    }

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
    const isoCreated = formatIsoUtc(order.createdAt);
    const isoUpdated = formatIsoUtc(order.updatedAt || order.createdAt);

    res.json({
      ...order,
      id: code,
      dbId: order.id,
      orderCode: code,
      diningMode: order.orderType === 'dine_in' ? 'dine-in' : order.orderType,
      status: normalizedStatus,
      total: Number(order.totalAmount || 0),
      totalAmount: Number(order.totalAmount || 0),
      subtotal: Number(order.subtotal != null && order.subtotal > 0 ? order.subtotal : (order.totalAmount * 0.85).toFixed(2)),
      discount: Number(order.discountAmount || 0),
      discountAmount: Number(order.discountAmount || 0),
      voucherCode: order.voucherCode || null,
      promoCode: order.voucherCode || null,
      tax: Number(order.tax != null && order.tax > 0 ? order.tax : (order.totalAmount * 0.10).toFixed(2)),
      serviceFee: Number(order.serviceFee != null && order.serviceFee > 0 ? order.serviceFee : (order.totalAmount * 0.05).toFixed(2)),
      createdAt: isoCreated,
      timestamp: isoCreated,
      updatedAt: isoUpdated,
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

    const targetOrder = db.prepare('SELECT id, tableNumber, orderType FROM orders WHERE id = ? OR orderCode = ?').get(id, id);
    if (!targetOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare(`
      UPDATE orders
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(dbStatus, targetOrder.id);

    // If order was served, completed, or cancelled, check if table can be returned to available
    if (['served', 'completed', 'delivered', 'cancelled'].includes(dbStatus) && targetOrder.tableNumber) {
      const tblNum = parseInt(targetOrder.tableNumber, 10);
      if (!isNaN(tblNum)) {
        const tblStr = String(tblNum).padStart(2, '0');
        const activeAtTable = db.prepare(`
          SELECT COUNT(*) as count FROM orders 
          WHERE (tableNumber = ? OR tableNumber = ?) AND status IN ('pending', 'cooking', 'preparing', 'ready') AND id != ?
        `).get(tblStr, String(tblNum), targetOrder.id)?.count || 0;

        if (activeAtTable === 0) {
          db.prepare("UPDATE restaurant_tables SET status = 'available' WHERE tableNumber = ?").run(tblNum);
        }
      }
    }

    // Broadcast status change to live KDS subscribers via SSE
    broadcastOrderEvent('order_status_updated', {
      orderId: targetOrder.id,
      orderCode: id,
      status: dbStatus
    });

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

/**
 * Generate 80mm/58mm printable thermal receipt payload
 * GET /api/orders/:id/receipt
 */
export function getOrderReceipt(req, res) {
  try {
    const { id } = req.params;
    const targetOrder = db.prepare('SELECT * FROM orders WHERE id = ? OR orderCode = ?').get(id, id);
    if (!targetOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const dbItems = db.prepare(`
      SELECT oi.*, m.name
      FROM order_items oi
      JOIN menu_items m ON oi.menuItemId = m.id
      WHERE oi.orderId = ?
    `).all(targetOrder.id);

    const items = dbItems.map(it => ({
      name: it.name,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      total: Number((it.quantity * it.unitPrice).toFixed(2))
    }));

    const orderCode = targetOrder.orderCode || `ORD-${1000 + targetOrder.id}`;
    const subtotal = Number(targetOrder.subtotal || 0);
    const discountAmount = Number(targetOrder.discountAmount || 0);
    const tax = Number(targetOrder.tax || 0);
    const serviceFee = Number(targetOrder.serviceFee || 0);
    const deliveryFee = Number(targetOrder.deliveryFee || 0);
    const totalAmount = Number(targetOrder.totalAmount || 0);

    const receipt = {
      restaurant: {
        name: 'AURA BISTRO',
        tagline: 'Artisanal Gastronomy & Fine Dining',
        address: 'Preah Monivong Blvd, Phnom Penh, Cambodia',
        vatNumber: 'K001-902401829',
        telephone: '+855 23 999 888',
        website: 'https://aurabistro.com'
      },
      invoice: {
        orderCode,
        dateTime: formatIsoUtc(targetOrder.createdAt),
        diningMode: (targetOrder.orderType || 'dine_in').toUpperCase(),
        tableNumber: targetOrder.tableNumber ? `Table ${targetOrder.tableNumber}` : 'N/A',
        guestName: targetOrder.customerName || 'Valued Guest',
        paymentMethod: (targetOrder.paymentMethod || 'cash').toUpperCase(),
        paymentStatus: (targetOrder.paymentStatus || 'unpaid').toUpperCase(),
        orderStatus: (targetOrder.status || 'pending').toUpperCase()
      },
      lineItems: items,
      financialSummary: {
        subtotal,
        discountAmount,
        voucherCode: targetOrder.voucherCode || null,
        tax10Percent: tax,
        serviceFee5Percent: serviceFee,
        deliveryFee,
        netPayableAmount: totalAmount
      },
      footer: {
        complimentaryMessage: 'Thank you for dining with Aura Bistro!',
        invitation: 'Please visit us again. Follow us @AuraBistro'
      }
    };

    res.json(receipt);
  } catch (error) {
    console.error('getOrderReceipt error:', error);
    res.status(500).json({ error: 'Failed to generate receipt: ' + error.message });
  }
}
