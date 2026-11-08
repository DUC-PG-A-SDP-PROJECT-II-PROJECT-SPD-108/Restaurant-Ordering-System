-- ============================================================================
-- AURA BISTRO - CATEGORY MANAGEMENT SQL UPDATE / MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/watdyzpxjlcmxdjiowih/sql
-- ============================================================================

-- 1. ADD NEW COLUMNS TO categories TABLE IF THEY DON'T ALREADY EXIST
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. ENABLE ROW LEVEL SECURITY (RLS) FOR FULL PUBLIC ANON OPERATIONS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Categories" ON categories;
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Categories" ON categories;
CREATE POLICY "Public Insert Categories" ON categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Categories" ON categories;
CREATE POLICY "Public Update Categories" ON categories FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Categories" ON categories;
CREATE POLICY "Public Delete Categories" ON categories FOR DELETE USING (true);

-- 3. ENABLE REALTIME BROADCASTS FOR categories TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  END IF;
END $$;

-- 4. UPDATE SEED / CORE CATEGORIES WITH ICONS & DESCRIPTIONS
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
    description = COALESCE(EXCLUDED.description, categories.description),
    display_order = COALESCE(EXCLUDED.display_order, categories.display_order);

-- 5. VERIFY CATEGORIES
SELECT id, name, icon, count, description, display_order, created_at FROM categories ORDER BY display_order ASC;

