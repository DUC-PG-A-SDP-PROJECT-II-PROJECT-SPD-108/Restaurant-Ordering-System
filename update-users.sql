-- ============================================================================
-- BISTRO RESTAURANT - USERS & ROLE AUTHENTICATION SCHEMA UPDATE
-- Roles: Admin, Manager, Staff, Kitchen
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop existing constraint if present and enforce updated 4-role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'staff', 'kitchen'));

-- 3. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Reset & Recreate RLS policies for public access
DROP POLICY IF EXISTS "Public Read Users" ON users;
DROP POLICY IF EXISTS "Public Write Users" ON users;
DROP POLICY IF EXISTS "Public Insert Users" ON users;
DROP POLICY IF EXISTS "Public Update Users" ON users;
DROP POLICY IF EXISTS "Public Delete Users" ON users;

CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
CREATE POLICY "Public Write Users" ON users FOR ALL USING (true);

-- 5. Enable Real-time WebSockets on users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
    END IF;
END $$;

-- 6. Insert / Upsert the 4 Required Role Accounts
INSERT INTO users (username, password, role, name) VALUES
('admin',   'admin123',   'admin',   'System Administrator'),
('manager', 'manager123', 'manager', 'Restaurant General Manager'),
('staff',   'staff123',   'staff',   'Floor Service & Cashier Staff'),
('kitchen', 'kitchen123', 'kitchen', 'Head Kitchen Chef'),
('chef',    'chef123',    'kitchen', 'Executive Chef')
ON CONFLICT (username) DO UPDATE SET
    password   = EXCLUDED.password,
    role       = EXCLUDED.role,
    name       = EXCLUDED.name,
    updated_at = NOW();

-- 7. Verification: View all seeded staff accounts
SELECT id, username, role, name, created_at, updated_at FROM users ORDER BY id ASC;

