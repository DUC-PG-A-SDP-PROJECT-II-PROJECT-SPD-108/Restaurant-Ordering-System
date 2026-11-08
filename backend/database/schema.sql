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
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
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
    categoryId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
);

-- 4. Table Orders (Supports Dine-In & Online Delivery)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderType TEXT CHECK(orderType IN ('dine_in', 'delivery', 'takeaway')) NOT NULL DEFAULT 'dine_in',
    tableNumber INTEGER,                                  -- Required for dine_in
    customerName TEXT,                                    -- Required for delivery/takeaway
    customerPhone TEXT,                                   -- Required for delivery/takeaway
    deliveryAddress TEXT,                                 -- Required for delivery
    deliveryFee REAL NOT NULL DEFAULT 0.0,
    customerNotes TEXT,
    totalAmount REAL NOT NULL DEFAULT 0.0,
    paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'khqr', 'cod')) NOT NULL DEFAULT 'cash',
    paymentStatus TEXT CHECK(paymentStatus IN ('unpaid', 'paid')) NOT NULL DEFAULT 'unpaid',
    status TEXT CHECK(status IN ('pending', 'preparing', 'ready', 'delivered', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
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
CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);

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
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Vouchers
INSERT OR IGNORE INTO vouchers (code, discountPercent, description, isActive) VALUES
('AURAVIP15', 15.0, '15% Off VIP Dining Special', 1),
('WELCOME10', 10.0, '10% Off First-Time Guest', 1),
('CHEF25', 25.0, '25% Off Chef Masterclass Promo', 1),
('BISTRO20', 20.0, '20% Weekend Celebration Discount', 1);


