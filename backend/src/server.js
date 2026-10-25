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

app.listen(PORT, () => {
  console.log(`🚀 ROS Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
