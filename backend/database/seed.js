import bcrypt from 'bcryptjs';
import db from './db.js';

console.log('🌱 Seeding database...');

// 1. Seed Users (admin, chef)
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, role)
  VALUES (@username, @password, @role)
`);

const adminHash = bcrypt.hashSync('admin123', 10);
const chefHash = bcrypt.hashSync('chef123', 10);

insertUser.run({ username: 'admin', password: adminHash, role: 'admin' });
insertUser.run({ username: 'chef', password: chefHash, role: 'kitchen' });
console.log('✅ Users seeded (admin/admin123, chef/chef123)');

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

// 3. Seed Menu Items
const insertItem = db.prepare(`
  INSERT OR IGNORE INTO menu_items (name, description, price, image, isAvailable, categoryId)
  VALUES (@name, @description, @price, @image, @isAvailable, @categoryId)
`);

const menuItems = [
  {
    name: 'Truffle Glazed Wagyu Ribeye',
    categoryId: getCatId('Steaks'),
    price: 38.50,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
    description: 'A5 Australian Wagyu ribeye seared over cherry oak, infused with black winter truffle butter.',
    isAvailable: 1
  },
  {
    name: 'Wild Forest Truffle Tagliatelle',
    categoryId: getCatId('Pastas'),
    price: 24.00,
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=700&q=80',
    description: 'Freshly extruded egg tagliatelle tossed in aged 24-month Parmigiano-Reggiano cream and wild chanterelles.',
    isAvailable: 1
  },
  {
    name: 'Smoked Jalapeño Wagyu Smash Burger',
    categoryId: getCatId('Mains'),
    price: 21.00,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    description: 'Double Wagyu smash patties with aged white cheddar, fire-roasted jalapeño relish, and bacon aioli.',
    isAvailable: 1
  },
  {
    name: 'Pan-Seared Hokkaido Scallops',
    categoryId: getCatId('Starters'),
    price: 19.50,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=700&q=80',
    description: 'Jumbo diver scallops seared golden, served atop silky cauliflower purée and pancetta crisps.',
    isAvailable: 1
  },
  {
    name: 'Valrhona Molten Lava Sphere',
    categoryId: getCatId('Desserts'),
    price: 14.50,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80',
    description: '70% dark French chocolate cake with warm ganache center, paired with vanilla bean gelato.',
    isAvailable: 1
  },
  {
    name: 'Smoked Rosemary Citrus Elixir',
    categoryId: getCatId('Drinks'),
    price: 9.50,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80',
    description: 'Sparkling botanical infusion of blood orange, cold-pressed yuzu, and flamed fresh rosemary sprig.',
    isAvailable: 1
  }
];

for (const item of menuItems) {
  insertItem.run(item);
}
console.log('✅ Menu items seeded');

console.log('🚀 Database seeding complete! Ready for use.');
