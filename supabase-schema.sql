-- ============================================================================
-- AURA BISTRO - RESTAURANT ORDERING SYSTEM (ROS)
-- Complete Supabase PostgreSQL Schema & Seed Data Script
-- Project: https://watdyzpxjlcmxdjiowih.supabase.co
-- ============================================================================

-- 1. CLEANUP (Drop tables if they already exist)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE TABLE: categories
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'fa-solid fa-utensils',
    description TEXT,
    display_order INTEGER DEFAULT 0,
    count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE TABLE: menu_items
CREATE TABLE menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    rating NUMERIC(3, 1) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    prep_time TEXT DEFAULT '15 mins',
    calories TEXT DEFAULT '500 kcal',
    image TEXT,
    description TEXT,
    is_chef_pick BOOLEAN DEFAULT FALSE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_spicy BOOLEAN DEFAULT FALSE,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_count INTEGER DEFAULT 15,
    spice_levels JSONB DEFAULT '[]'::jsonb,
    add_ons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE TABLE: restaurant_tables
CREATE TABLE restaurant_tables (
    id TEXT PRIMARY KEY,
    table_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    capacity INTEGER DEFAULT 4,
    status TEXT CHECK (status IN ('available', 'pending', 'cooking', 'ready', 'occupied', 'cleaning')) DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE TABLE: vouchers
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_percent NUMERIC(5, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE TABLE: orders
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    dining_mode TEXT CHECK (dining_mode IN ('dine-in', 'takeout', 'delivery')) DEFAULT 'dine-in',
    table_number TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('pending', 'cooking', 'ready', 'served', 'completed', 'cancelled')) DEFAULT 'pending',
    payment_method TEXT CHECK (payment_method IN ('cash', 'khqr', 'card', 'cod')) DEFAULT 'khqr',
    payment_status TEXT DEFAULT 'Paid',
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    promo_code TEXT,
    tax NUMERIC(10, 2) DEFAULT 0.00,
    service_fee NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) DEFAULT 0.00,
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE TABLE: users (Staff / Admin authentication & HR)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'manager', 'staff', 'kitchen')) DEFAULT 'staff',
    name TEXT,
    phone TEXT,
    email TEXT,
    department TEXT DEFAULT 'Front of House & Service',
    shift TEXT DEFAULT 'Morning Shift (07:00 - 15:00)',
    hourly_rate NUMERIC(10, 2) DEFAULT 4.50,
    duty_status TEXT DEFAULT 'on_duty',
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Grant full read/write access to public anon client for web app operations
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Insert Categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Public Delete Categories" ON categories FOR DELETE USING (true);

-- Menu Items RLS
CREATE POLICY "Public Read Menu Items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public Write Menu Items" ON menu_items FOR ALL USING (true);

-- Restaurant Tables RLS
CREATE POLICY "Public Read Tables" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Public Write Tables" ON restaurant_tables FOR ALL USING (true);

-- Vouchers RLS
CREATE POLICY "Public Read Vouchers" ON vouchers FOR SELECT USING (true);
CREATE POLICY "Public Write Vouchers" ON vouchers FOR ALL USING (true);

-- Orders RLS
CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Public Delete Orders" ON orders FOR DELETE USING (true);

-- Users RLS
CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
CREATE POLICY "Public Write Users" ON users FOR ALL USING (true);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable real-time websocket broadcasts on table changes
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE vouchers;

-- ============================================================================
-- SEED DATA INSERTION
-- ============================================================================

-- A. Insert Categories
INSERT INTO categories (id, name, icon, description, display_order, count) VALUES
('all', 'All Dishes', 'fa-solid fa-border-all', 'Complete culinary showcase across all menu categories', 0, 12),
('starters', 'Starters & Tapas', 'fa-solid fa-plate-wheat', 'Light gourmet bites, salads and seasonal shared appetizers', 1, 2),
('mains', 'Artisan Mains', 'fa-solid fa-utensils', 'Signature chef masterpieces and hearty seasonal dishes', 2, 3),
('steaks', 'Prime Steaks & Grill', 'fa-solid fa-drumstick-bite', 'A5 Wagyu cuts, cherry wood smoked prime steaks & chops', 3, 2),
('pastas', 'Handcrafted Pastas', 'fa-solid fa-wheat-awn', 'Daily house-made fresh tagliatelle, ravioli & Italian risotto', 4, 2),
('desserts', 'Decadent Desserts', 'fa-solid fa-cake-candles', 'Fine Belgian chocolate creations, gelato & pastries', 5, 2),
('beverages', 'Craft Drinks', 'fa-solid fa-martini-glass-citrus', 'Artisan cocktails, fine vintage wines and craft beverages', 6, 1)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- B. Insert Promo Codes / Vouchers
INSERT INTO vouchers (code, discount_percent, description, is_active) VALUES
('AURAVIP15', 15.00, '15% Off VIP Dining Special', true),
('WELCOME10', 10.00, '10% Off First-Time Guest', true),
('CHEF25', 25.00, '25% Off Chef Masterclass Promo', true)
ON CONFLICT (code) DO NOTHING;

-- C. Insert Restaurant Tables
INSERT INTO restaurant_tables (id, table_number, name, zone, capacity, status) VALUES
('01', '01', 'Table 01', 'Patio Terrace', 2, 'available'),
('02', '02', 'Table 02', 'Window View', 4, 'cooking'),
('03', '03', 'Table 03', 'Cozy Booth', 4, 'available'),
('04', '04', 'Table 04', 'Main Dining Hall', 6, 'available'),
('05', '05', 'Table 05', 'VIP Wine Lounge', 8, 'ready'),
('06', '06', 'Table 06', 'Main Dining Hall', 4, 'available'),
('07', '07', 'Table 07', 'Patio Terrace', 2, 'available'),
('08', '08', 'Table 08', 'Chef Counter', 2, 'available')
ON CONFLICT (id) DO NOTHING;

-- D. Insert Menu Items (Full 12 Dishes)
INSERT INTO menu_items (
    id, name, category, price, rating, review_count, prep_time, calories,
    image, description, is_chef_pick, is_vegetarian, is_spicy, in_stock, stock_count,
    spice_levels, add_ons
) VALUES
(
    'dish-1',
    'Truffle Glazed Wagyu Ribeye',
    'steaks',
    38.50,
    4.9,
    142,
    '22 mins',
    '720 kcal',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
    'A5 Australian Wagyu ribeye seared over cherry oak, infused with black winter truffle butter, served with roasted bone marrow and asparagus.',
    true,
    false,
    false,
    true,
    15,
    '["Mild", "Black Pepper Infused", "Fiery Peppercorn"]'::jsonb,
    '[{"name": "Extra Shaved Black Truffle", "price": 4.50}, {"name": "Pan-Seared Foie Gras", "price": 8.00}, {"name": "Creamed Garlic Spinach", "price": 3.50}]'::jsonb
),
(
    'dish-2',
    'Wild Forest Truffle Tagliatelle',
    'pastas',
    24.00,
    4.8,
    98,
    '15 mins',
    '540 kcal',
    'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=700&q=80',
    'Freshly extruded egg tagliatelle tossed in aged 24-month Parmigiano-Reggiano cream, wild chanterelles, and aromatic white truffle emulsion.',
    true,
    true,
    false,
    true,
    15,
    '["Original Delicate", "Chili Flakes Touch"]'::jsonb,
    '[{"name": "Crispy Guanciale Bits", "price": 3.00}, {"name": "Extra Aged Parmesan", "price": 2.00}, {"name": "Poached Organic Egg", "price": 1.50}]'::jsonb
),
(
    'dish-3',
    'Crispy Skin Norwegian Salmon',
    'mains',
    27.50,
    4.7,
    86,
    '18 mins',
    '610 kcal',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80',
    'Sustainably sourced salmon fillet pan-crisped to perfection, atop velvety saffron cauliflower purée, heirloom baby carrots, and dill lemon emulsion.',
    false,
    false,
    false,
    true,
    15,
    '["Classic Citrus Herb", "Cajun Spiced Crust"]'::jsonb,
    '[{"name": "Jumbo Tiger Prawns (2x)", "price": 6.50}, {"name": "Grilled Asparagus", "price": 3.00}]'::jsonb
),
(
    'dish-4',
    'Wood-Fired Burrata & Heirloom Fig',
    'starters',
    18.00,
    4.9,
    114,
    '10 mins',
    '420 kcal',
    'https://images.unsplash.com/photo-1592417817098-8f3d69107936?auto=format&fit=crop&w=700&q=80',
    'Creamy artisanal Puglia burrata, balsamic glaze reduction, honey-caramelized mission figs, pistachios, and fresh warm sourdough toast.',
    false,
    true,
    false,
    true,
    15,
    '["Mellow Natural"]'::jsonb,
    '[{"name": "Prosciutto di Parma 24mo", "price": 4.50}, {"name": "Warm Artisan Sourdough", "price": 2.50}]'::jsonb
),
(
    'dish-5',
    'Smoked Jalapeño Wagyu Smash Burger',
    'mains',
    21.00,
    4.8,
    205,
    '14 mins',
    '890 kcal',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    'Double crushed Wagyu beef patties, melted sharp English cheddar, smoked jalapeño bacon relish, and house truffle aioli on toasted brioche.',
    true,
    false,
    true,
    true,
    15,
    '["Mild Tangy", "Smoky Medium Jalapeño", "Ghost Chili Inferno"]'::jsonb,
    '[{"name": "Applewood Smoked Bacon", "price": 2.50}, {"name": "Fried Cage-Free Egg", "price": 1.50}, {"name": "Truffle Parmesan Fries Upgrade", "price": 3.50}]'::jsonb
),
(
    'dish-6',
    'Spicy Firecracker Calamari',
    'starters',
    16.50,
    4.6,
    77,
    '12 mins',
    '480 kcal',
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=80',
    'Tender Monterey squid flash-fried with roasted scallions, crushed Szechuan peppercorns, bird’s eye chili, and tangy yuzu tartar dip.',
    false,
    false,
    true,
    true,
    15,
    '["Medium Zesty", "Very Hot Spicy"]'::jsonb,
    '[{"name": "Extra Yuzu Tartar Dip", "price": 1.50}, {"name": "Spicy Siracha Glaze", "price": 1.00}]'::jsonb
),
(
    'dish-7',
    'Charred Tomahawk Steak (For Two)',
    'steaks',
    85.00,
    5.0,
    63,
    '30 mins',
    '1450 kcal',
    'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=700&q=80',
    'Prime 1.1kg dry-aged bone-in rib steak flamed with rosemary butter. Accompanied by roasted shallots, chimichurri, and house peppercorn jus.',
    true,
    false,
    false,
    true,
    15,
    '["Classic Woodfire Herbs", "Cracked Pepper Crusted"]'::jsonb,
    '[{"name": "Charred Bone Marrow Butter", "price": 5.00}, {"name": "Grilled King Oyster Mushrooms", "price": 4.00}]'::jsonb
),
(
    'dish-8',
    'Lobster & Crab Saffron Ravioli',
    'pastas',
    29.50,
    4.9,
    88,
    '18 mins',
    '590 kcal',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80',
    'Hand-pinched pasta pillows stuffed with sweet Maine lobster & blue crab meat, drenched in shellfish bisque and micro tarragon.',
    true,
    false,
    false,
    true,
    15,
    '["Delicate Bisque"]'::jsonb,
    '[{"name": "Caviar Pearl Topping", "price": 9.00}, {"name": "Extra Garlic Toast Points", "price": 2.00}]'::jsonb
),
(
    'dish-9',
    'Charred Roman Artichoke & Truffle Bowl',
    'mains',
    22.00,
    4.7,
    52,
    '15 mins',
    '410 kcal',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
    'Grilled Roman artichoke hearts, quinoa pilaf, sun-dried tomatoes, avocado, toasted pine nuts, and lemon-tahini herb dressing.',
    false,
    true,
    false,
    true,
    15,
    '["Citrus Mint Fresh"]'::jsonb,
    '[{"name": "Grilled Halloumi Cheese", "price": 3.50}, {"name": "Avocado Slices", "price": 2.00}]'::jsonb
),
(
    'dish-10',
    'Valrhona Molten Lava Sphere',
    'desserts',
    14.50,
    4.9,
    167,
    '12 mins',
    '520 kcal',
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80',
    '70% dark single-origin French chocolate cake with an erupting warm ganache center, paired with Madagascar vanilla bean gelato and gold leaf.',
    true,
    true,
    false,
    true,
    15,
    '["Sweet Indulgence"]'::jsonb,
    '[{"name": "Extra Scoop Bourbon Vanilla Gelato", "price": 3.00}, {"name": "Fresh Raspberry Coulis", "price": 1.50}]'::jsonb
),
(
    'dish-11',
    'Matcha Crème Brûlée with Berries',
    'desserts',
    13.00,
    4.7,
    91,
    '10 mins',
    '380 kcal',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80',
    'Uji ceremonial grade Japanese matcha custard with crisp caramelized sugar glass, fresh wild blackberries, and candied citrus peel.',
    false,
    true,
    false,
    true,
    15,
    '["Mellow Sweet"]'::jsonb,
    '[{"name": "Black Sesame Wafer", "price": 1.50}]'::jsonb
),
(
    'dish-12',
    'Smoked Rosemary Citrus Elixir',
    'beverages',
    9.50,
    4.8,
    122,
    '5 mins',
    '110 kcal',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80',
    'Sparkling botanical infusion of blood orange, cold-pressed yuzu, agave nectar, flamed fresh rosemary sprig, and elderflower mist.',
    false,
    true,
    false,
    true,
    15,
    '["Refreshing Sparkling"]'::jsonb,
    '[{"name": "Chia Seeds Boost", "price": 1.00}, {"name": "Extra Flamed Herb Mist", "price": 0.50}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    rating = EXCLUDED.rating,
    image = EXCLUDED.image,
    description = EXCLUDED.description,
    is_chef_pick = EXCLUDED.is_chef_pick,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_spicy = EXCLUDED.is_spicy,
    in_stock = EXCLUDED.in_stock,
    spice_levels = EXCLUDED.spice_levels,
    add_ons = EXCLUDED.add_ons;

-- E. Insert Initial Seed Orders
INSERT INTO orders (
    id, customer_name, phone, dining_mode, table_number, timestamp,
    status, payment_method, payment_status, items, subtotal, discount,
    tax, service_fee, total, special_notes
) VALUES
(
    'ORD-7021',
    'Dara Vann',
    '012 889 901',
    'dine-in',
    '02',
    NOW() - INTERVAL '14 minutes',
    'cooking',
    'khqr',
    'Paid',
    '[{"id": "dish-1", "name": "Truffle Glazed Wagyu Ribeye", "price": 38.50, "quantity": 1, "spiceLevel": "Black Pepper Infused", "addOns": ["Extra Shaved Black Truffle"]}, {"id": "dish-12", "name": "Smoked Rosemary Citrus Elixir", "price": 9.50, "quantity": 2, "spiceLevel": "Refreshing Sparkling", "addOns": []}]'::jsonb,
    57.50,
    0.00,
    5.75,
    2.88,
    66.13,
    'Ribeye cooked medium-rare please.'
),
(
    'ORD-7020',
    'Sophal Meng',
    '098 554 321',
    'dine-in',
    '05',
    NOW() - INTERVAL '25 minutes',
    'ready',
    'card',
    'Paid',
    '[{"id": "dish-2", "name": "Wild Forest Truffle Tagliatelle", "price": 24.00, "quantity": 2, "spiceLevel": "Original Delicate", "addOns": ["Extra Aged Parmesan"]}, {"id": "dish-10", "name": "Valrhona Molten Lava Sphere", "price": 14.50, "quantity": 1, "spiceLevel": "Sweet Indulgence", "addOns": []}]'::jsonb,
    62.50,
    9.38,
    5.31,
    2.66,
    61.09,
    'Allergic to peanuts.'
)
ON CONFLICT (id) DO NOTHING;

-- F. Insert Staff & Admin Role Users
INSERT INTO users (username, password, role, name, phone, email, department, shift, hourly_rate, duty_status, hire_date) VALUES
('admin',     'admin123',   'admin',   'Sokha Vathna',     '+855 12 888 999', 'admin@bistro.com',       'Management & Operations',    'Full-Time Day (08:00 - 17:00)', 12.00, 'on_duty',  '2025-01-15'),
('manager',   'manager123', 'manager', 'Chanthou Rithy',   '+855 77 123 456', 'manager@bistro.com',     'Management & Operations',    'Morning Shift (07:00 - 15:00)',  8.50, 'on_duty',  '2025-03-01'),
('kitchen',   'kitchen123', 'kitchen', 'Chef Phalla Kiri', '+855 98 456 789', 'chef.kiri@bistro.com',   'Kitchen & Culinary',         'Evening Shift (15:00 - 23:00)',  7.00, 'on_duty',  '2025-04-10'),
('staff',     'staff123',   'staff',   'Sophea Nita',      '+855 86 654 321', 'sophea.nita@bistro.com', 'Front of House & Service',   'Morning Shift (07:00 - 15:00)',  4.50, 'on_duty',  '2025-06-20'),
('chef',      'chef123',    'kitchen', 'Chenda Borin',     '+855 10 999 000', 'borin.chef@bistro.com',  'Kitchen & Culinary',         'Evening Shift (15:00 - 23:00)',  6.50, 'off_duty', '2025-07-05'),
('alex_bar',  'alex123',    'staff',   'David Alex',       '+855 15 222 333', 'alex.bar@bistro.com',    'Bar & Beverage',             'Evening Shift (15:00 - 23:00)',  5.50, 'on_duty',  '2025-08-12')
ON CONFLICT (username) DO UPDATE SET
    password    = EXCLUDED.password,
    role        = EXCLUDED.role,
    name        = EXCLUDED.name,
    phone       = EXCLUDED.phone,
    email       = EXCLUDED.email,
    department  = EXCLUDED.department,
    shift       = EXCLUDED.shift,
    hourly_rate = EXCLUDED.hourly_rate,
    duty_status = EXCLUDED.duty_status,
    hire_date   = EXCLUDED.hire_date;

