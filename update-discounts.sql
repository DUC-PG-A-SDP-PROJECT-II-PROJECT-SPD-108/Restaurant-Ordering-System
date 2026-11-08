-- ============================================================================
-- BISTRO RESTAURANT - DISCOUNT VOUCHERS SCHEMA & REALTIME UPDATE
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/watdyzpxjlcmxdjiowih/sql/new
-- ============================================================================

-- 1. Create table vouchers if it doesn't already exist
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_percent NUMERIC(5, 2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure is_featured column exists if table was already created
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- 3. Reset policies to prevent duplicate policy errors
DROP POLICY IF EXISTS "Public Read Vouchers" ON vouchers;
DROP POLICY IF EXISTS "Public Write Vouchers" ON vouchers;
DROP POLICY IF EXISTS "Public Insert Vouchers" ON vouchers;
DROP POLICY IF EXISTS "Public Update Vouchers" ON vouchers;
DROP POLICY IF EXISTS "Public Delete Vouchers" ON vouchers;

-- 4. Create RLS policies for public access
CREATE POLICY "Public Read Vouchers" ON vouchers FOR SELECT USING (true);
CREATE POLICY "Public Write Vouchers" ON vouchers FOR ALL USING (true);

-- 5. Enable Real-time WebSockets on vouchers table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'vouchers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE vouchers;
    END IF;
END $$;

-- 6. Insert initial promotional discount codes / vouchers
INSERT INTO vouchers (code, discount_percent, description, is_active, is_featured) VALUES
('AURAVIP15', 15.00, '15% Off VIP Dining Special', true, true),
('WELCOME10', 10.00, '10% Off First-Time Guest', true, false),
('CHEF25', 25.00, '25% Off Chef Masterclass Promo', true, false),
('BISTRO20', 20.00, '20% Weekend Celebration Discount', true, false)
ON CONFLICT (code) DO UPDATE SET
    discount_percent = EXCLUDED.discount_percent,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    is_featured = EXCLUDED.is_featured;

-- 7. Verify vouchers
SELECT id, code, discount_percent, description, is_active, created_at FROM vouchers ORDER BY id ASC;

