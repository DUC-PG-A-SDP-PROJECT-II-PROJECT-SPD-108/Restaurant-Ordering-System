import bcrypt from 'bcryptjs';
import db from './db.js';

console.log('🌱 Seeding database...');

// 1. Seed Users (admin, manager, staff, kitchen)
const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (username, password, role, name, phone, email, department, shift, hourly_rate, duty_status)
  VALUES (@username, @password, @role, @name, @phone, @email, @department, @shift, @hourly_rate, @duty_status)
`);

const adminHash = bcrypt.hashSync('admin123', 10);
const managerHash = bcrypt.hashSync('manager123', 10);
const staffHash = bcrypt.hashSync('staff123', 10);
const kitchenHash = bcrypt.hashSync('kitchen123', 10);
const chefHash = bcrypt.hashSync('chef123', 10);
const alexHash = bcrypt.hashSync('alex123', 10);

insertUser.run({
  username: 'admin',
  password: adminHash,
  role: 'admin',
  name: 'Sokha Vathna',
  phone: '+855 12 888 999',
  email: 'admin@bistro.com',
  department: 'Management & Operations',
  shift: 'Full-Time Day (08:00 - 17:00)',
  hourly_rate: 12.00,
  duty_status: 'on_duty'
});
insertUser.run({
  username: 'manager',
  password: managerHash,
  role: 'manager',
  name: 'Chanthou Rithy',
  phone: '+855 77 123 456',
  email: 'manager@bistro.com',
  department: 'Management & Operations',
  shift: 'Morning Shift (07:00 - 15:00)',
  hourly_rate: 8.50,
  duty_status: 'on_duty'
});
insertUser.run({
  username: 'staff',
  password: staffHash,
  role: 'staff',
  name: 'Sophea Nita',
  phone: '+855 86 654 321',
  email: 'sophea.nita@bistro.com',
  department: 'Front of House & Service',
  shift: 'Morning Shift (07:00 - 15:00)',
  hourly_rate: 4.50,
  duty_status: 'on_duty'
});
insertUser.run({
  username: 'kitchen',
  password: kitchenHash,
  role: 'kitchen',
  name: 'Chef Phalla Kiri',
  phone: '+855 98 456 789',
  email: 'chef.kiri@bistro.com',
  department: 'Kitchen & Culinary',
  shift: 'Evening Shift (15:00 - 23:00)',
  hourly_rate: 7.00,
  duty_status: 'on_duty'
});
insertUser.run({
  username: 'chef',
  password: chefHash,
  role: 'kitchen',
  name: 'Chenda Borin',
  phone: '+855 10 999 000',
  email: 'borin.chef@bistro.com',
  department: 'Kitchen & Culinary',
  shift: 'Evening Shift (15:00 - 23:00)',
  hourly_rate: 6.50,
  duty_status: 'off_duty'
});
insertUser.run({
  username: 'alex_bar',
  password: alexHash,
  role: 'staff',
  name: 'David Alex',
  phone: '+855 15 222 333',
  email: 'alex.bar@bistro.com',
  department: 'Bar & Beverage',
  shift: 'Evening Shift (15:00 - 23:00)',
  hourly_rate: 5.50,
  duty_status: 'on_duty'
});
console.log('✅ Users & Staff HR seeded (admin, manager, staff, kitchen, chef, alex_bar)');

// 2. Seed Categories
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, icon, description)
  VALUES (@name, @icon, @description)
`);

const categories = [
  { name: 'Starters & Tapas', icon: 'fa-solid fa-plate-wheat', description: 'Small bites & artisan appetizers' },
  { name: 'Artisan Mains', icon: 'fa-solid fa-utensils', description: 'Signature main courses' },
  { name: 'Prime Steaks & Grill', icon: 'fa-solid fa-drumstick-bite', description: 'Wood-fired prime cuts' },
  { name: 'Handcrafted Pastas', icon: 'fa-solid fa-wheat-awn', description: 'Freshly extruded pastas' },
  { name: 'Decadent Desserts', icon: 'fa-solid fa-cake-candles', description: 'Sweet gourmet finales' },
  { name: 'Craft Drinks', icon: 'fa-solid fa-martini-glass-citrus', description: 'Botanical mocktails & drinks' }
];

for (const cat of categories) {
  insertCategory.run(cat);
}
console.log('✅ Categories seeded');

// Get category IDs
const catRows = db.prepare('SELECT id, name FROM categories').all();
const getCatId = (name) => {
  const row = catRows.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
  return row ? row.id : catRows[0].id;
};

// 3. Seed Menu Items (Full 12 Signature Dishes - 2 Per Category)
const insertItem = db.prepare(`
  INSERT OR IGNORE INTO menu_items (name, description, price, image, isAvailable, isSpicy, isVegetarian, isChefPick, categoryId)
  VALUES (@name, @description, @price, @image, @isAvailable, @isSpicy, @isVegetarian, @isChefPick, @categoryId)
`);

const menuItems = [
  // 1. Starters & Tapas (2 Dishes)
  {
    name: 'Pan-Seared Hokkaido Scallops',
    categoryId: getCatId('Starters'),
    price: 19.50,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=700&q=80',
    description: 'Jumbo diver scallops seared golden, served atop silky cauliflower purée and pancetta crisps.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 0,
    isChefPick: 1
  },
  {
    name: 'Wood-Fired Burrata & Heirloom Fig',
    categoryId: getCatId('Starters'),
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d69107936?auto=format&fit=crop&w=700&q=80',
    description: 'Artisanal Puglia burrata with balsamic reduction, honey-caramelized figs, pistachios, and warm sourdough toast.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 1,
    isChefPick: 0
  },

  // 2. Artisan Mains (2 Dishes)
  {
    name: 'Smoked Jalapeño Wagyu Smash Burger',
    categoryId: getCatId('Mains'),
    price: 21.00,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    description: 'Double Wagyu smash patties with aged white cheddar, fire-roasted jalapeño relish, and bacon aioli.',
    isAvailable: 1,
    isSpicy: 1,
    isVegetarian: 0,
    isChefPick: 1
  },
  {
    name: 'Crispy Skin Norwegian Salmon',
    categoryId: getCatId('Mains'),
    price: 27.50,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80',
    description: 'Sustainably sourced salmon fillet pan-crisped to perfection, atop velvety saffron cauliflower purée and dill lemon emulsion.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 0,
    isChefPick: 0
  },

  // 3. Prime Steaks & Grill (2 Dishes)
  {
    name: 'Truffle Glazed Wagyu Ribeye',
    categoryId: getCatId('Steaks'),
    price: 38.50,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
    description: 'A5 Australian Wagyu ribeye seared over cherry oak, infused with black winter truffle butter.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 0,
    isChefPick: 1
  },
  {
    name: 'Charred Tomahawk Steak (For Two)',
    categoryId: getCatId('Steaks'),
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=700&q=80',
    description: 'Prime 1.1kg dry-aged bone-in rib steak flamed with rosemary butter, chimichurri, and house peppercorn jus.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 0,
    isChefPick: 1
  },

  // 4. Handcrafted Pastas (2 Dishes)
  {
    name: 'Wild Forest Truffle Tagliatelle',
    categoryId: getCatId('Pastas'),
    price: 24.00,
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=700&q=80',
    description: 'Freshly extruded egg tagliatelle tossed in aged 24-month Parmigiano-Reggiano cream and wild chanterelles.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 1,
    isChefPick: 1
  },
  {
    name: 'Lobster & Crab Saffron Ravioli',
    categoryId: getCatId('Pastas'),
    price: 29.50,
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80',
    description: 'Hand-pinched pasta pillows stuffed with sweet Maine lobster & blue crab meat, drenched in shellfish bisque and micro tarragon.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 0,
    isChefPick: 0
  },

  // 5. Decadent Desserts (2 Dishes)
  {
    name: 'Valrhona Molten Lava Sphere',
    categoryId: getCatId('Desserts'),
    price: 14.50,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80',
    description: '70% dark French chocolate cake with warm ganache center, paired with vanilla bean gelato.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 1,
    isChefPick: 1
  },
  {
    name: 'Matcha Crème Brûlée with Berries',
    categoryId: getCatId('Desserts'),
    price: 13.00,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80',
    description: 'Uji ceremonial grade Japanese matcha custard with crisp caramelized sugar glass, fresh wild blackberries, and candied citrus peel.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 1,
    isChefPick: 0
  },

  // 6. Craft Drinks (2 Dishes)
  {
    name: 'Smoked Rosemary Citrus Elixir',
    categoryId: getCatId('Drinks'),
    price: 9.50,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80',
    description: 'Sparkling botanical infusion of blood orange, cold-pressed yuzu, and flamed fresh rosemary sprig.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 1,
    isChefPick: 0
  },
  {
    name: 'Smoked Hibiscus Botanical Fizz',
    categoryId: getCatId('Drinks'),
    price: 8.50,
    image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=700&q=80',
    description: 'Cold-brewed organic wild hibiscus, sparkling yuzu essence, crushed mint, and sparkling botanical tonic.',
    isAvailable: 1,
    isSpicy: 0,
    isVegetarian: 1,
    isChefPick: 0
  }
];

const upsertItem = db.prepare(`
  INSERT INTO menu_items (name, description, price, image, isAvailable, isSpicy, isVegetarian, isChefPick, categoryId)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateExistingItem = db.prepare(`
  UPDATE menu_items 
  SET name = ?, description = ?, price = ?, image = ?, isAvailable = ?, isSpicy = ?, isVegetarian = ?, isChefPick = ?, categoryId = ?
  WHERE id = ?
`);

for (const item of menuItems) {
  const existing = db.prepare('SELECT id FROM menu_items WHERE LOWER(name) = LOWER(?)').get(item.name);
  if (existing) {
    updateExistingItem.run(
      item.name,
      item.description,
      item.price,
      item.image,
      item.isAvailable,
      item.isSpicy,
      item.isVegetarian,
      item.isChefPick,
      item.categoryId,
      existing.id
    );
  } else {
    upsertItem.run(
      item.name,
      item.description,
      item.price,
      item.image,
      item.isAvailable,
      item.isSpicy,
      item.isVegetarian,
      item.isChefPick,
      item.categoryId
    );
  }
}

// Resync categories count
db.prepare('UPDATE categories SET count = (SELECT COUNT(*) FROM menu_items WHERE menu_items.categoryId = categories.id)').run();
console.log('✅ Menu items seeded (12 dishes across 6 categories)');

// 4. Seed Restaurant Tables (Floor Plan 01 - 08)
const insertTable = db.prepare(`
  INSERT OR REPLACE INTO restaurant_tables (tableNumber, zone, capacity, status)
  VALUES (@tableNumber, @zone, @capacity, @status)
`);

const initialTables = [
  { tableNumber: 1, zone: 'Patio Terrace', capacity: 2, status: 'available' },
  { tableNumber: 2, zone: 'Window View', capacity: 4, status: 'available' },
  { tableNumber: 3, zone: 'Cozy Booth', capacity: 4, status: 'available' },
  { tableNumber: 4, zone: 'Main Dining Hall', capacity: 6, status: 'available' },
  { tableNumber: 5, zone: 'VIP Wine Lounge', capacity: 8, status: 'available' },
  { tableNumber: 6, zone: 'Main Dining Hall', capacity: 4, status: 'available' },
  { tableNumber: 7, zone: 'Patio Terrace', capacity: 2, status: 'available' },
  { tableNumber: 8, zone: 'Chef Counter', capacity: 2, status: 'available' }
];

for (const tbl of initialTables) {
  insertTable.run(tbl);
}
console.log('✅ Restaurant tables seeded (Tables 01 - 08)');

// 5. Seed Promotional Vouchers
const insertVoucher = db.prepare(`
  INSERT OR REPLACE INTO vouchers (code, discountPercent, description, isActive, isFeatured)
  VALUES (@code, @discountPercent, @description, @isActive, @isFeatured)
`);

const initialVouchers = [
  { code: 'AURAVIP15', discountPercent: 15.0, description: '15% Off VIP Dining Special', isActive: 1, isFeatured: 1 },
  { code: 'WELCOME10', discountPercent: 10.0, description: '10% Off First-Time Guest', isActive: 1, isFeatured: 0 },
  { code: 'CHEF25', discountPercent: 25.0, description: '25% Off Chef Masterclass Promo', isActive: 1, isFeatured: 0 },
  { code: 'BISTRO20', discountPercent: 20.0, description: '20% Weekend Celebration Discount', isActive: 1, isFeatured: 0 }
];

for (const v of initialVouchers) {
  insertVoucher.run(v);
}
console.log('✅ Promo vouchers seeded (AURAVIP15, WELCOME10, CHEF25, BISTRO20)');

console.log('🚀 Database seeding complete! Ready for use.');
