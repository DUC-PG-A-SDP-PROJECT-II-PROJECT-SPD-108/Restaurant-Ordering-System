-- ============================================================================
-- BISTRO RESTAURANT - USERS & STAFF HR SCHEMA & SEED DATA UPDATE
-- Roles: Admin, Manager, Staff, Kitchen
-- Workstation: Staff & HR Management (/admin-panel-bistro)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/watdyzpxjlcmxdjiowih/sql/new
-- ============================================================================

-- 1. Create table users if it does not exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
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

-- 2. Add HR columns if the table already existed with older schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Front of House & Service';
ALTER TABLE users ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT 'Morning Shift (07:00 - 15:00)';
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2) DEFAULT 4.50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS duty_status TEXT DEFAULT 'on_duty';
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;

-- 3. Enforce 4-role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'staff', 'kitchen'));

-- 4. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Reset & Recreate RLS policies for public access
DROP POLICY IF EXISTS "Public Read Users" ON users;
DROP POLICY IF EXISTS "Public Write Users" ON users;
DROP POLICY IF EXISTS "Public Insert Users" ON users;
DROP POLICY IF EXISTS "Public Update Users" ON users;
DROP POLICY IF EXISTS "Public Delete Users" ON users;

CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
CREATE POLICY "Public Write Users" ON users FOR ALL USING (true);

-- 6. Enable Real-time WebSockets on users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
    END IF;
END $$;

-- 7. Seed Complete Bistro Staff Roster
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
    hire_date   = EXCLUDED.hire_date,
    updated_at  = NOW();

-- 8. Verification: Query all active staff accounts with HR information
SELECT id, username, role, name, department, shift, hourly_rate, duty_status, phone, email, hire_date
FROM users
ORDER BY id ASC;
