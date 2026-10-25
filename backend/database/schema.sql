-- ===================================================
-- Restaurant Ordering System - SQLite Database Schema
-- Dual-Mode: Dine-In & Online Delivery / Takeaway
-- ===================================================

PRAGMA foreign_keys = ON;

-- 1. Table Users (Admin & Kitchen Staff)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'kitchen')) NOT NULL DEFAULT 'kitchen',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'Utensils',
    description TEXT
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
