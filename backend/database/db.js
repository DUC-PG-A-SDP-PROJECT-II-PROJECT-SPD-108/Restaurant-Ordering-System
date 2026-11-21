import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'restaurant.db');
const db = new DatabaseSync(DB_PATH);

// Helper pragma method compatible with better-sqlite3
db.pragma = function (cmd) {
  try {
    return db.exec(`PRAGMA ${cmd};`);
  } catch (err) {
    console.warn(`Pragma warning for "${cmd}":`, err.message);
  }
};

// Helper transaction method compatible with better-sqlite3
db.transaction = function (fn) {
  return function (...args) {
    db.exec('BEGIN TRANSACTION;');
    try {
      const result = fn(...args);
      db.exec('COMMIT;');
      return result;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  };
};

// Enable WAL mode & foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema if tables don't exist
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

// Automatically add missing columns if upgrading schema
try {
  const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userColumns.includes('phone')) db.exec("ALTER TABLE users ADD COLUMN phone TEXT;");
  if (!userColumns.includes('email')) db.exec("ALTER TABLE users ADD COLUMN email TEXT;");
  if (!userColumns.includes('department')) db.exec("ALTER TABLE users ADD COLUMN department TEXT DEFAULT 'Front of House & Service';");
  if (!userColumns.includes('shift')) db.exec("ALTER TABLE users ADD COLUMN shift TEXT DEFAULT 'Morning Shift (07:00 - 15:00)';");
  if (!userColumns.includes('hourly_rate')) db.exec("ALTER TABLE users ADD COLUMN hourly_rate REAL DEFAULT 4.50;");
  if (!userColumns.includes('duty_status')) db.exec("ALTER TABLE users ADD COLUMN duty_status TEXT DEFAULT 'on_duty';");
  if (!userColumns.includes('hire_date')) db.exec("ALTER TABLE users ADD COLUMN hire_date DATE DEFAULT CURRENT_DATE;");

  const menuColumns = db.prepare("PRAGMA table_info(menu_items)").all().map(c => c.name);
  if (!menuColumns.includes('isSpicy')) db.exec("ALTER TABLE menu_items ADD COLUMN isSpicy INTEGER DEFAULT 0;");
  if (!menuColumns.includes('isVegetarian')) db.exec("ALTER TABLE menu_items ADD COLUMN isVegetarian INTEGER DEFAULT 0;");
  if (!menuColumns.includes('isChefPick')) db.exec("ALTER TABLE menu_items ADD COLUMN isChefPick INTEGER DEFAULT 0;");

  const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
  if (!orderColumns.includes('orderCode')) {
    db.exec("PRAGMA foreign_keys = OFF;");
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderCode TEXT,
        orderType TEXT DEFAULT 'dine_in',
        tableNumber TEXT,
        customerName TEXT,
        customerPhone TEXT,
        deliveryAddress TEXT,
        deliveryFee REAL NOT NULL DEFAULT 0.0,
        customerNotes TEXT,
        totalAmount REAL NOT NULL DEFAULT 0.0,
        paymentMethod TEXT DEFAULT 'cash',
        paymentStatus TEXT DEFAULT 'unpaid',
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO orders_new (id, orderCode, orderType, tableNumber, customerName, customerPhone, deliveryAddress, deliveryFee, customerNotes, totalAmount, paymentMethod, paymentStatus, status, createdAt, updatedAt)
      SELECT id, 'ORD-' || (1000 + id), orderType, CAST(tableNumber AS TEXT), customerName, customerPhone, deliveryAddress, deliveryFee, customerNotes, totalAmount, paymentMethod, paymentStatus,
             CASE WHEN status = 'preparing' THEN 'cooking' WHEN status = 'completed' THEN 'served' ELSE status END,
             createdAt, updatedAt FROM orders;
      DROP TABLE orders;
      ALTER TABLE orders_new RENAME TO orders;
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_orderType ON orders(orderType);
      CREATE INDEX IF NOT EXISTS idx_orders_orderCode ON orders(orderCode);
    `);
    db.exec("PRAGMA foreign_keys = ON;");
  } else {
    db.exec("UPDATE orders SET status = 'cooking' WHERE status = 'preparing';");
    db.exec("UPDATE orders SET status = 'served' WHERE status = 'completed' OR status = 'delivered';");
  }
} catch (e) {}

export default db;
