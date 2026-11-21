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

// Run safe migrations first if upgrading an existing database
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

  if (tables.includes('users')) {
    const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
    if (!userColumns.includes('phone')) db.exec("ALTER TABLE users ADD COLUMN phone TEXT;");
    if (!userColumns.includes('email')) db.exec("ALTER TABLE users ADD COLUMN email TEXT;");
    if (!userColumns.includes('department')) db.exec("ALTER TABLE users ADD COLUMN department TEXT DEFAULT 'Front of House & Service';");
    if (!userColumns.includes('shift')) db.exec("ALTER TABLE users ADD COLUMN shift TEXT DEFAULT 'Morning Shift (07:00 - 15:00)';");
    if (!userColumns.includes('hourly_rate')) db.exec("ALTER TABLE users ADD COLUMN hourly_rate REAL DEFAULT 4.50;");
    if (!userColumns.includes('duty_status')) db.exec("ALTER TABLE users ADD COLUMN duty_status TEXT DEFAULT 'on_duty';");
    if (!userColumns.includes('hire_date')) db.exec("ALTER TABLE users ADD COLUMN hire_date DATE DEFAULT CURRENT_DATE;");
  }

  if (tables.includes('menu_items')) {
    const menuColumns = db.prepare("PRAGMA table_info(menu_items)").all().map(c => c.name);
    if (!menuColumns.includes('isSpicy')) db.exec("ALTER TABLE menu_items ADD COLUMN isSpicy INTEGER DEFAULT 0;");
    if (!menuColumns.includes('isVegetarian')) db.exec("ALTER TABLE menu_items ADD COLUMN isVegetarian INTEGER DEFAULT 0;");
    if (!menuColumns.includes('isChefPick')) db.exec("ALTER TABLE menu_items ADD COLUMN isChefPick INTEGER DEFAULT 0;");
  }

  if (tables.includes('vouchers')) {
    const voucherColumns = db.prepare("PRAGMA table_info(vouchers)").all().map(c => c.name);
    if (!voucherColumns.includes('isFeatured')) {
      db.exec("ALTER TABLE vouchers ADD COLUMN isFeatured INTEGER NOT NULL DEFAULT 0;");
      db.exec("UPDATE vouchers SET isFeatured = 1 WHERE UPPER(code) = 'AURAVIP15';");
    }
  }

  if (tables.includes('orders')) {
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
          subtotal REAL NOT NULL DEFAULT 0.0,
          tax REAL NOT NULL DEFAULT 0.0,
          serviceFee REAL NOT NULL DEFAULT 0.0,
          discountAmount REAL NOT NULL DEFAULT 0.0,
          voucherCode TEXT,
          totalAmount REAL NOT NULL DEFAULT 0.0,
          paymentMethod TEXT DEFAULT 'cash',
          paymentStatus TEXT DEFAULT 'unpaid',
          status TEXT DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO orders_new (id, orderCode, orderType, tableNumber, customerName, customerPhone, deliveryAddress, deliveryFee, customerNotes, subtotal, tax, serviceFee, discountAmount, voucherCode, totalAmount, paymentMethod, paymentStatus, status, createdAt, updatedAt)
        SELECT id, 'ORD-' || (1000 + id), orderType, CAST(tableNumber AS TEXT), customerName, customerPhone, deliveryAddress, deliveryFee, customerNotes, totalAmount * 0.85, totalAmount * 0.10, totalAmount * 0.05, 0.0, NULL, totalAmount, paymentMethod, paymentStatus,
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
      if (!orderColumns.includes('subtotal')) db.exec("ALTER TABLE orders ADD COLUMN subtotal REAL NOT NULL DEFAULT 0.0;");
      if (!orderColumns.includes('tax')) db.exec("ALTER TABLE orders ADD COLUMN tax REAL NOT NULL DEFAULT 0.0;");
      if (!orderColumns.includes('serviceFee')) db.exec("ALTER TABLE orders ADD COLUMN serviceFee REAL NOT NULL DEFAULT 0.0;");
      if (!orderColumns.includes('discountAmount')) db.exec("ALTER TABLE orders ADD COLUMN discountAmount REAL NOT NULL DEFAULT 0.0;");
      if (!orderColumns.includes('voucherCode')) db.exec("ALTER TABLE orders ADD COLUMN voucherCode TEXT;");

      db.exec(`
        UPDATE orders 
        SET subtotal = ROUND(totalAmount * 0.85, 2),
            tax = ROUND(totalAmount * 0.10, 2),
            serviceFee = ROUND(totalAmount * 0.05, 2)
        WHERE subtotal = 0.0 AND totalAmount > 0;
      `);

      db.exec("UPDATE orders SET status = 'cooking' WHERE status = 'preparing';");
      db.exec("UPDATE orders SET status = 'served' WHERE status = 'completed' OR status = 'delivered';");
      db.exec("CREATE INDEX IF NOT EXISTS idx_orders_orderCode ON orders(orderCode);");
    }
  }
} catch (err) {
  console.warn('Pre-migration warning:', err.message);
}

// Initialize schema if tables don't exist
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
  } catch (err) {
    console.warn('Schema execution notice:', err.message);
  }
}

// Ensure restaurant_tables has default tables if empty
try {
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM restaurant_tables").get()?.count || 0;
  if (tableCount === 0) {
    db.exec(`
      INSERT OR IGNORE INTO restaurant_tables (tableNumber, zone, capacity, status) VALUES
      (1, 'Patio Terrace', 2, 'available'),
      (2, 'Window View', 4, 'available'),
      (3, 'Cozy Booth', 4, 'available'),
      (4, 'Main Dining Hall', 6, 'available'),
      (5, 'VIP Wine Lounge', 8, 'available'),
      (6, 'Main Dining Hall', 4, 'available'),
      (7, 'Patio Terrace', 2, 'available'),
      (8, 'Chef Counter', 2, 'available');
    `);
  }

  // Create Triggers for category dish count sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_menu_items_insert_count
    AFTER INSERT ON menu_items
    BEGIN
      UPDATE categories SET count = count + 1 WHERE id = NEW.categoryId;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_menu_items_delete_count
    AFTER DELETE ON menu_items
    BEGIN
      UPDATE categories SET count = MAX(0, count - 1) WHERE id = OLD.categoryId;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_menu_items_update_count
    AFTER UPDATE OF categoryId ON menu_items
    BEGIN
      UPDATE categories SET count = MAX(0, count - 1) WHERE id = OLD.categoryId;
      UPDATE categories SET count = count + 1 WHERE id = NEW.categoryId;
    END;
  `);

  // Sync existing category dish counts
  db.exec(`
    UPDATE categories 
    SET count = (SELECT COUNT(*) FROM menu_items WHERE categoryId = categories.id);
  `);
} catch (e) {}

export default db;
