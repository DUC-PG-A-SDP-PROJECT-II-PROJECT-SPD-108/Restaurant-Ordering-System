-- ===================================================
-- Restaurant Ordering System - SQLite Database Schema
-- Dual-Mode: Dine-In & Online Delivery / Takeaway
-- ===================================================

PRAGMA foreign_keys = ON;

-- 1. Table Users (Admin, Manager, Staff, Kitchen)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manager', 'staff', 'kitchen')) NOT NULL DEFAULT 'staff',
    name TEXT,
    phone TEXT,
    email TEXT,
    department TEXT DEFAULT 'Front of House & Service',
    shift TEXT DEFAULT 'Morning Shift (07:00 - 15:00)',
    hourly_rate REAL DEFAULT 4.50,
    duty_status TEXT DEFAULT 'on_duty',
    hire_date DATE DEFAULT CURRENT_DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'fa-solid fa-utensils',
    description TEXT,
    display_order INTEGER DEFAULT 0,
    count INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table MenuItems
CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL CHECK(price >= 0),
    image TEXT,
    isAvailable INTEGER NOT NULL DEFAULT 1,
    isSpicy INTEGER DEFAULT 0,
    isVegetarian INTEGER DEFAULT 0,
    isChefPick INTEGER DEFAULT 0,
    categoryId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
);

-- 4. Table Orders (Supports Dine-In, Online Delivery & Takeaway)
CREATE TABLE IF NOT EXISTS orders (
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

-- 5. Table OrderItems
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    menuItemId INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unitPrice REAL NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE RESTRICT
);

-- Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(categoryId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_orderType ON orders(orderType);
CREATE INDEX IF NOT EXISTS idx_orders_orderCode ON orders(orderCode);
CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);

-- Triggers for Automatic Category Count Synchronization
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

-- 6. Table RestaurantTables (Floor Plan & Table QR Codes)
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tableNumber INTEGER NOT NULL UNIQUE,
    zone TEXT DEFAULT 'Main Dining',
    capacity INTEGER DEFAULT 4,
    status TEXT CHECK(status IN ('available', 'occupied', 'reserved', 'cleaning')) DEFAULT 'available',
    qrCodeUrl TEXT
);

-- 7. Table Vouchers (Promotions & Loyalty Discounts)
CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    discountPercent REAL NOT NULL CHECK(discountPercent > 0 AND discountPercent <= 100),
    description TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    isFeatured INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Tables (If Empty)
INSERT OR IGNORE INTO restaurant_tables (tableNumber, zone, capacity, status) VALUES
(1, 'Patio Terrace', 2, 'available'),
(2, 'Window View', 4, 'available'),
(3, 'Cozy Booth', 4, 'available'),
(4, 'Main Dining Hall', 6, 'available'),
(5, 'VIP Wine Lounge', 8, 'available'),
(6, 'Main Dining Hall', 4, 'available'),
(7, 'Patio Terrace', 2, 'available'),
(8, 'Chef Counter', 2, 'available');

-- Seed Initial Vouchers
INSERT OR IGNORE INTO vouchers (code, discountPercent, description, isActive, isFeatured) VALUES
('AURAVIP15', 15.0, '15% Off VIP Dining Special', 1, 1),
('WELCOME10', 10.0, '10% Off First-Time Guest', 1, 0),
('CHEF25', 25.0, '25% Off Chef Masterclass Promo', 1, 0),
('BISTRO20', 20.0, '20% Weekend Celebration Discount', 1, 0);


