import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'aura_bistro_jwt_super_secret_key_2026';

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 2. Authentication: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// 3. Categories: Get All
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
  res.json(categories);
});

// 4. Menu Items: Get All (supports search & category filters)
app.get('/api/menu', (req, res) => {
  const { categoryId, search } = req.query;
  let query = `
    SELECT m.*, c.name as categoryName
    FROM menu_items m
    JOIN categories c ON m.categoryId = c.id
    WHERE 1=1
  `;
  const params = [];

  if (categoryId) {
    query += ' AND m.categoryId = ?';
    params.push(categoryId);
  }

  if (search) {
    query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY m.id ASC';
  const items = db.prepare(query).all(...params);
  res.json(items);
});

// 5. Orders: Create Order (supports Dine-in & Online Delivery)
app.post('/api/orders', (req, res) => {
  const {
    orderType = 'dine_in',
    tableNumber,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryFee = 0.0,
    customerNotes = '',
    paymentMethod = 'cash',
    items = []
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  // Calculate total from database prices
  let subtotal = 0;
  const itemRecords = [];
  const getDish = db.prepare('SELECT id, name, price FROM menu_items WHERE id = ?');

  for (const it of items) {
    const dish = getDish.get(it.menuItemId);
    if (!dish) {
      return res.status(400).json({ error: `Menu item #${it.menuItemId} not found` });
    }
    const unitPrice = Number(dish.price);
    const qty = Number(it.quantity) || 1;
    subtotal += unitPrice * qty;
    itemRecords.push({ menuItemId: dish.id, name: dish.name, quantity: qty, unitPrice });
  }

  const tax = subtotal * 0.10;
  const serviceFee = subtotal * 0.05;
  const totalAmount = subtotal + tax + serviceFee + Number(deliveryFee);

  // Atomic database transaction
  const insertOrder = db.prepare(`
    INSERT INTO orders (orderType, tableNumber, customerName, customerPhone, deliveryAddress, deliveryFee, customerNotes, totalAmount, paymentMethod, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (orderId, menuItemId, quantity, unitPrice)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const orderResult = insertOrder.run(
      orderType,
      orderType === 'dine_in' ? tableNumber : null,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryFee,
      customerNotes,
      totalAmount,
      paymentMethod
    );
    const orderId = orderResult.lastInsertRowid;

    for (const rec of itemRecords) {
      insertOrderItem.run(orderId, rec.menuItemId, rec.quantity, rec.unitPrice);
    }
    return orderId;
  });

  const orderId = tx();

  res.status(201).json({
    message: 'Order placed successfully',
    orderId,
    totalAmount
  });
});

// 6. Orders: Get All (for KDS & Admin)
app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY id DESC';

  const orders = db.prepare(query).all(...params);

  // Attach items to each order
  const getItems = db.prepare(`
    SELECT oi.*, m.name, m.image
    FROM order_items oi
    JOIN menu_items m ON oi.menuItemId = m.id
    WHERE oi.orderId = ?
  `);

  const fullOrders = orders.map(ord => ({
    ...ord,
    items: getItems.all(ord.id)
  }));

  res.json(fullOrders);
});

// 7. Orders: Update Status (pending -> cooking -> ready -> served)
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = db.prepare('UPDATE orders SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json({ message: 'Order status updated successfully', orderId: id, status });
});

// 8. Stats / Analytics Summary
app.get('/api/stats/summary', (req, res) => {
  const activeCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'preparing', 'ready')").get().count;
  const completedCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('completed', 'delivered')").get().count;
  const totalRevenue = db.prepare("SELECT SUM(totalAmount) as total FROM orders WHERE status != 'cancelled'").get().total || 0;

  res.json({
    activeOrders: activeCount,
    completedOrders: completedCount,
    totalRevenue: Number(totalRevenue.toFixed(2))
  });
});

// 9. Tables: Get Floor Status & QR Code links
app.get('/api/tables', (req, res) => {
  const defaultTables = [
    { id: 1, tableNumber: 1, zone: 'Patio Terrace', capacity: 2, status: 'available' },
    { id: 2, tableNumber: 2, zone: 'Window View', capacity: 4, status: 'available' },
    { id: 3, tableNumber: 3, zone: 'Cozy Booth', capacity: 4, status: 'available' },
    { id: 4, tableNumber: 4, zone: 'Main Dining Hall', capacity: 6, status: 'available' },
    { id: 5, tableNumber: 5, zone: 'VIP Wine Lounge', capacity: 8, status: 'available' },
    { id: 6, tableNumber: 6, zone: 'Main Dining Hall', capacity: 4, status: 'available' },
    { id: 7, tableNumber: 7, zone: 'Patio Terrace', capacity: 2, status: 'available' },
    { id: 8, tableNumber: 8, zone: 'Chef Counter', capacity: 2, status: 'available' }
  ];
  res.json(defaultTables);
});

// 10. Promo Code Verification
app.post('/api/vouchers/verify', (req, res) => {
  const { code } = req.body;
  const PROMO_CODES = {
    'AURAVIP15': { discountPercent: 15, description: '15% Off VIP Dining Special' },
    'WELCOME10': { discountPercent: 10, description: '10% Off First-Time Guest' },
    'CHEF25': { discountPercent: 25, description: '25% Off Chef Masterclass Promo' }
  };
  const promo = PROMO_CODES[code?.toUpperCase()];
  if (promo) {
    res.json({ valid: true, ...promo });
  } else {
    res.status(404).json({ valid: false, error: 'Invalid or expired voucher code' });
  }
});

// 11. Bakong KHQR Gateway Integration (https://www.lorndavid.online/docs)
const BAKONG_ACCOUNT_ID = process.env.BAKONG_ACCOUNT_ID || 'udom_vathna@bkrt';
const BAKONG_GATEWAY_URL = 'https://lorndavid.online';

app.post('/api/bakong/generate', async (req, res) => {
  try {
    const {
      amount,
      currency = 'USD',
      billNumber = `INV-${Date.now().toString().slice(-6)}`,
      merchantName = 'Aura Bistro',
      accountId = BAKONG_ACCOUNT_ID
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount required' });
    }

    const payload = {
      accountId,
      merchantName,
      amount: Number(parseFloat(amount).toFixed(2)),
      currency,
      billNumber
    };

    const gatewayRes = await fetch(`${BAKONG_GATEWAY_URL}/api/v1/khqr/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await gatewayRes.json();
    res.status(gatewayRes.status).json(data);
  } catch (error) {
    console.error('Bakong generate error:', error.message);
    res.status(500).json({ error: 'Failed to generate KHQR from gateway', details: error.message });
  }
});

app.get('/api/bakong/check/:md5', async (req, res) => {
  try {
    const { md5 } = req.params;
    const gatewayRes = await fetch(`${BAKONG_GATEWAY_URL}/api/v1/check/${md5}`);
    const data = await gatewayRes.json();
    res.status(gatewayRes.status).json(data);
  } catch (error) {
    console.error('Bakong check error:', error.message);
    res.status(500).json({ error: 'Failed to verify payment with gateway', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ROS Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
