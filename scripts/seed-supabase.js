/**
 * AURA BISTRO - SUPABASE SEEDER SCRIPT
 * Usage: node scripts/seed-supabase.js
 */

import { createClient } from '../frontend/node_modules/@supabase/supabase-js/dist/index.cjs';

const SUPABASE_URL = 'https://watdyzpxjlcmxdjiowih.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iq8ZjOrUgAjVcfnyCHj7Fw_9Zkpf5nW';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIES = [
  { id: 'all', name: 'All Dishes', icon: 'fa-solid fa-border-all', count: 12 },
  { id: 'starters', name: 'Starters & Tapas', icon: 'fa-solid fa-plate-wheat', count: 2 },
  { id: 'mains', name: 'Artisan Mains', icon: 'fa-solid fa-utensils', count: 3 },
  { id: 'steaks', name: 'Prime Steaks & Grill', icon: 'fa-solid fa-drumstick-bite', count: 2 },
  { id: 'pastas', name: 'Handcrafted Pastas', icon: 'fa-solid fa-wheat-awn', count: 2 },
  { id: 'desserts', name: 'Decadent Desserts', icon: 'fa-solid fa-cake-candles', count: 2 },
  { id: 'beverages', name: 'Craft Drinks', icon: 'fa-solid fa-martini-glass-citrus', count: 1 }
];

const VOUCHERS = [
  { code: 'AURAVIP15', discount_percent: 15.00, description: '15% Off VIP Dining Special', is_active: true },
  { code: 'WELCOME10', discount_percent: 10.00, description: '10% Off First-Time Guest', is_active: true },
  { code: 'CHEF25', discount_percent: 25.00, description: '25% Off Chef Masterclass Promo', is_active: true }
];

const TABLES = [
  { id: '01', table_number: '01', name: 'Table 01', zone: 'Patio Terrace', capacity: 2, status: 'available' },
  { id: '02', table_number: '02', name: 'Table 02', zone: 'Window View', capacity: 4, status: 'cooking' },
  { id: '03', table_number: '03', name: 'Table 03', zone: 'Cozy Booth', capacity: 4, status: 'available' },
  { id: '04', table_number: '04', name: 'Table 04', zone: 'Main Dining Hall', capacity: 6, status: 'available' },
  { id: '05', table_number: '05', name: 'Table 05', zone: 'VIP Wine Lounge', capacity: 8, status: 'ready' },
  { id: '06', table_number: '06', name: 'Table 06', zone: 'Main Dining Hall', capacity: 4, status: 'available' },
  { id: '07', table_number: '07', name: 'Table 07', zone: 'Patio Terrace', capacity: 2, status: 'available' },
  { id: '08', table_number: '08', name: 'Table 08', zone: 'Chef Counter', capacity: 2, status: 'available' }
];

const MENU_ITEMS = [
  {
    id: 'dish-1',
    name: 'Truffle Glazed Wagyu Ribeye',
    category: 'steaks',
    price: 38.50,
    rating: 4.9,
    review_count: 142,
    prep_time: '22 mins',
    calories: '720 kcal',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
    description: 'A5 Australian Wagyu ribeye seared over cherry oak, infused with black winter truffle butter, served with roasted bone marrow and asparagus.',
    is_chef_pick: true,
    is_vegetarian: false,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Mild', 'Black Pepper Infused', 'Fiery Peppercorn'],
    add_ons: [
      { name: 'Extra Shaved Black Truffle', price: 4.50 },
      { name: 'Pan-Seared Foie Gras', price: 8.00 },
      { name: 'Creamed Garlic Spinach', price: 3.50 }
    ]
  },
  {
    id: 'dish-2',
    name: 'Wild Forest Truffle Tagliatelle',
    category: 'pastas',
    price: 24.00,
    rating: 4.8,
    review_count: 98,
    prep_time: '15 mins',
    calories: '540 kcal',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=700&q=80',
    description: 'Freshly extruded egg tagliatelle tossed in aged 24-month Parmigiano-Reggiano cream, wild chanterelles, and aromatic white truffle emulsion.',
    is_chef_pick: true,
    is_vegetarian: true,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Original Delicate', 'Chili Flakes Touch'],
    add_ons: [
      { name: 'Crispy Guanciale Bits', price: 3.00 },
      { name: 'Extra Aged Parmesan', price: 2.00 },
      { name: 'Poached Organic Egg', price: 1.50 }
    ]
  },
  {
    id: 'dish-3',
    name: 'Crispy Skin Norwegian Salmon',
    category: 'mains',
    price: 27.50,
    rating: 4.7,
    review_count: 86,
    prep_time: '18 mins',
    calories: '610 kcal',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80',
    description: 'Sustainably sourced salmon fillet pan-crisped to perfection, atop velvety saffron cauliflower purée, heirloom baby carrots, and dill lemon emulsion.',
    is_chef_pick: false,
    is_vegetarian: false,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Classic Citrus Herb', 'Cajun Spiced Crust'],
    add_ons: [
      { name: 'Jumbo Tiger Prawns (2x)', price: 6.50 },
      { name: 'Grilled Asparagus', price: 3.00 }
    ]
  },
  {
    id: 'dish-4',
    name: 'Wood-Fired Burrata & Heirloom Fig',
    category: 'starters',
    price: 18.00,
    rating: 4.9,
    review_count: 114,
    prep_time: '10 mins',
    calories: '420 kcal',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d69107936?auto=format&fit=crop&w=700&q=80',
    description: 'Creamy artisanal Puglia burrata, balsamic glaze reduction, honey-caramelized mission figs, pistachios, and fresh warm sourdough toast.',
    is_chef_pick: false,
    is_vegetarian: true,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Mellow Natural'],
    add_ons: [
      { name: 'Prosciutto di Parma 24mo', price: 4.50 },
      { name: 'Warm Artisan Sourdough', price: 2.50 }
    ]
  },
  {
    id: 'dish-5',
    name: 'Smoked Jalapeño Wagyu Smash Burger',
    category: 'mains',
    price: 21.00,
    rating: 4.8,
    review_count: 205,
    prep_time: '14 mins',
    calories: '890 kcal',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    description: 'Double crushed Wagyu beef patties, melted sharp English cheddar, smoked jalapeño bacon relish, and house truffle aioli on toasted brioche.',
    is_chef_pick: true,
    is_vegetarian: false,
    is_spicy: true,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Mild Tangy', 'Smoky Medium Jalapeño', 'Ghost Chili Inferno'],
    add_ons: [
      { name: 'Applewood Smoked Bacon', price: 2.50 },
      { name: 'Fried Cage-Free Egg', price: 1.50 },
      { name: 'Truffle Parmesan Fries Upgrade', price: 3.50 }
    ]
  },
  {
    id: 'dish-6',
    name: 'Spicy Firecracker Calamari',
    category: 'starters',
    price: 16.50,
    rating: 4.6,
    review_count: 77,
    prep_time: '12 mins',
    calories: '480 kcal',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=80',
    description: 'Tender Monterey squid flash-fried with roasted scallions, crushed Szechuan peppercorns, bird’s eye chili, and tangy yuzu tartar dip.',
    is_chef_pick: false,
    is_vegetarian: false,
    is_spicy: true,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Medium Zesty', 'Very Hot Spicy'],
    add_ons: [
      { name: 'Extra Yuzu Tartar Dip', price: 1.50 },
      { name: 'Spicy Siracha Glaze', price: 1.00 }
    ]
  },
  {
    id: 'dish-7',
    name: 'Charred Tomahawk Steak (For Two)',
    category: 'steaks',
    price: 85.00,
    rating: 5.0,
    review_count: 63,
    prep_time: '30 mins',
    calories: '1450 kcal',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=700&q=80',
    description: 'Prime 1.1kg dry-aged bone-in rib steak flamed with rosemary butter. Accompanied by roasted shallots, chimichurri, and house peppercorn jus.',
    is_chef_pick: true,
    is_vegetarian: false,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Classic Woodfire Herbs', 'Cracked Pepper Crusted'],
    add_ons: [
      { name: 'Charred Bone Marrow Butter', price: 5.00 },
      { name: 'Grilled King Oyster Mushrooms', price: 4.00 }
    ]
  },
  {
    id: 'dish-8',
    name: 'Lobster & Crab Saffron Ravioli',
    category: 'pastas',
    price: 29.50,
    rating: 4.9,
    review_count: 88,
    prep_time: '18 mins',
    calories: '590 kcal',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80',
    description: 'Hand-pinched pasta pillows stuffed with sweet Maine lobster & blue crab meat, drenched in shellfish bisque and micro tarragon.',
    is_chef_pick: true,
    is_vegetarian: false,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Delicate Bisque'],
    add_ons: [
      { name: 'Caviar Pearl Topping', price: 9.00 },
      { name: 'Extra Garlic Toast Points', price: 2.00 }
    ]
  },
  {
    id: 'dish-9',
    name: 'Charred Roman Artichoke & Truffle Bowl',
    category: 'mains',
    price: 22.00,
    rating: 4.7,
    review_count: 52,
    prep_time: '15 mins',
    calories: '410 kcal',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
    description: 'Grilled Roman artichoke hearts, quinoa pilaf, sun-dried tomatoes, avocado, toasted pine nuts, and lemon-tahini herb dressing.',
    is_chef_pick: false,
    is_vegetarian: true,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Citrus Mint Fresh'],
    add_ons: [
      { name: 'Grilled Halloumi Cheese', price: 3.50 },
      { name: 'Avocado Slices', price: 2.00 }
    ]
  },
  {
    id: 'dish-10',
    name: 'Valrhona Molten Lava Sphere',
    category: 'desserts',
    price: 14.50,
    rating: 4.9,
    review_count: 167,
    prep_time: '12 mins',
    calories: '520 kcal',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80',
    description: '70% dark single-origin French chocolate cake with an erupting warm ganache center, paired with Madagascar vanilla bean gelato and gold leaf.',
    is_chef_pick: true,
    is_vegetarian: true,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Sweet Indulgence'],
    add_ons: [
      { name: 'Extra Scoop Bourbon Vanilla Gelato', price: 3.00 },
      { name: 'Fresh Raspberry Coulis', price: 1.50 }
    ]
  },
  {
    id: 'dish-11',
    name: 'Matcha Crème Brûlée with Berries',
    category: 'desserts',
    price: 13.00,
    rating: 4.7,
    review_count: 91,
    prep_time: '10 mins',
    calories: '380 kcal',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80',
    description: 'Uji ceremonial grade Japanese matcha custard with crisp caramelized sugar glass, fresh wild blackberries, and candied citrus peel.',
    is_chef_pick: false,
    is_vegetarian: true,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Mellow Sweet'],
    add_ons: [
      { name: 'Black Sesame Wafer', price: 1.50 }
    ]
  },
  {
    id: 'dish-12',
    name: 'Smoked Rosemary Citrus Elixir',
    category: 'beverages',
    price: 9.50,
    rating: 4.8,
    review_count: 122,
    prep_time: '5 mins',
    calories: '110 kcal',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80',
    description: 'Sparkling botanical infusion of blood orange, cold-pressed yuzu, agave nectar, flamed fresh rosemary sprig, and elderflower mist.',
    is_chef_pick: false,
    is_vegetarian: true,
    is_spicy: false,
    in_stock: true,
    stock_count: 15,
    spice_levels: ['Refreshing Sparkling'],
    add_ons: [
      { name: 'Chia Seeds Boost', price: 1.00 },
      { name: 'Extra Flamed Herb Mist', price: 0.50 }
    ]
  }
];

async function seed() {
  console.log('🚀 Starting Supabase Database Seeding...');
  console.log('Connecting to:', SUPABASE_URL);

  // 1. Categories
  console.log('Seeding categories...');
  const { error: catErr } = await supabase.from('categories').upsert(CATEGORIES);
  if (catErr) {
    console.error('❌ Categories error:', catErr.message);
    console.log('💡 Note: Please run supabase-schema.sql first in the Supabase SQL Editor!');
    return;
  }
  console.log('✅ Categories seeded successfully.');

  // 2. Vouchers
  console.log('Seeding vouchers...');
  const { error: vouchErr } = await supabase.from('vouchers').upsert(VOUCHERS, { onConflict: 'code' });
  if (vouchErr) console.warn('Vouchers note:', vouchErr.message);
  else console.log('✅ Vouchers seeded.');

  // 3. Tables
  console.log('Seeding restaurant tables...');
  const { error: tblErr } = await supabase.from('restaurant_tables').upsert(TABLES);
  if (tblErr) console.warn('Tables note:', tblErr.message);
  else console.log('✅ Restaurant tables seeded.');

  // 4. Menu Items
  console.log('Seeding menu items...');
  const { error: menuErr } = await supabase.from('menu_items').upsert(MENU_ITEMS);
  if (menuErr) console.error('❌ Menu items error:', menuErr.message);
  else console.log('✅ All 12 menu items seeded successfully.');

  console.log('🎉 Seeding completed!');
}

seed().catch(err => {
  console.error('Fatal error during seeding:', err);
});

