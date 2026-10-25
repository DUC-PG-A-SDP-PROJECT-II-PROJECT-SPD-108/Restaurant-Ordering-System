/**
 * AURA BISTRO - MENU DATA & CONSTANTS
 * Rich culinary catalog with dietary tags, add-ons, promo codes, and mock seed data.
 */

const MENU_CATEGORIES = [
  { id: 'all', name: 'All Dishes', icon: 'fa-solid fa-border-all', count: 12 },
  { id: 'starters', name: 'Starters & Tapas', icon: 'fa-solid fa-plate-wheat', count: 2 },
  { id: 'mains', name: 'Artisan Mains', icon: 'fa-solid fa-utensils', count: 3 },
  { id: 'steaks', name: 'Prime Steaks & Grill', icon: 'fa-solid fa-drumstick-bite', count: 2 },
  { id: 'pastas', name: 'Handcrafted Pastas', icon: 'fa-solid fa-wheat-awn', count: 2 },
  { id: 'desserts', name: 'Decadent Desserts', icon: 'fa-solid fa-cake-candles', count: 2 },
  { id: 'beverages', name: 'Craft Drinks', icon: 'fa-solid fa-martini-glass-citrus', count: 1 }
];

const PROMO_CODES = {
  'AURAVIP15': { discountPercent: 15, description: '15% Off VIP Dining Special' },
  'WELCOME10': { discountPercent: 10, description: '10% Off First-Time Guest' },
  'CHEF25': { discountPercent: 25, description: '25% Off Chef Masterclass Promo' }
};

const MENU_ITEMS = [
  {
    id: 'dish-1',
    name: 'Truffle Glazed Wagyu Ribeye',
    category: 'steaks',
    price: 38.50,
    rating: 4.9,
    reviewCount: 142,
    prepTime: '22 mins',
    calories: '720 kcal',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
    description: 'A5 Australian Wagyu ribeye seared over cherry oak, infused with black winter truffle butter, served with roasted bone marrow and asparagus.',
    isChefPick: true,
    isVegetarian: false,
    isSpicy: false,
    spiceLevels: ['Mild', 'Black Pepper Infused', 'Fiery Peppercorn'],
    addOns: [
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
    reviewCount: 98,
    prepTime: '15 mins',
    calories: '540 kcal',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=700&q=80',
    description: 'Freshly extruded egg tagliatelle tossed in aged 24-month Parmigiano-Reggiano cream, wild chanterelles, and aromatic white truffle emulsion.',
    isChefPick: true,
    isVegetarian: true,
    isSpicy: false,
    spiceLevels: ['Original Delicate', 'Chili Flakes Touch'],
    addOns: [
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
    reviewCount: 86,
    prepTime: '18 mins',
    calories: '610 kcal',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80',
    description: 'Sustainably sourced salmon fillet pan-crisped to perfection, atop velvety saffron cauliflower purée, heirloom baby carrots, and dill lemon emulsion.',
    isChefPick: false,
    isVegetarian: false,
    isSpicy: false,
    spiceLevels: ['Classic Citrus Herb', 'Cajun Spiced Crust'],
    addOns: [
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
    reviewCount: 114,
    prepTime: '10 mins',
    calories: '420 kcal',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d69107936?auto=format&fit=crop&w=700&q=80',
    description: 'Creamy artisanal Puglia burrata, balsamic glaze reduction, honey-caramelized mission figs, pistachios, and fresh warm sourdough toast.',
    isChefPick: false,
    isVegetarian: true,
    isSpicy: false,
    spiceLevels: ['Mellow Natural'],
    addOns: [
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
    reviewCount: 205,
    prepTime: '14 mins',
    calories: '890 kcal',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    description: 'Double crushed Wagyu beef patties, melted sharp English cheddar, smoked jalapeño bacon relish, and house truffle aioli on toasted brioche.',
    isChefPick: true,
    isVegetarian: false,
    isSpicy: true,
    spiceLevels: ['Mild Tangy', 'Smoky Medium Jalapeño', 'Ghost Chili Inferno'],
    addOns: [
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
    reviewCount: 77,
    prepTime: '12 mins',
    calories: '480 kcal',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=80',
    description: 'Tender Monterey squid flash-fried with roasted scallions, crushed Szechuan peppercorns, bird’s eye chili, and tangy yuzu tartar dip.',
    isChefPick: false,
    isVegetarian: false,
    isSpicy: true,
    spiceLevels: ['Medium Zesty', 'Very Hot Spicy'],
    addOns: [
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
    reviewCount: 63,
    prepTime: '30 mins',
    calories: '1450 kcal',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=700&q=80',
    description: 'Prime 1.1kg dry-aged bone-in rib steak flamed with rosemary butter. Accompanied by roasted shallots, chimichurri, and house peppercorn jus.',
    isChefPick: true,
    isVegetarian: false,
    isSpicy: false,
    spiceLevels: ['Classic Woodfire Herbs', 'Cracked Pepper Crusted'],
    addOns: [
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
    reviewCount: 88,
    prepTime: '18 mins',
    calories: '590 kcal',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80',
    description: 'Hand-pinched pasta pillows stuffed with sweet Maine lobster & blue crab meat, drenched in shellfish bisque and micro tarragon.',
    isChefPick: true,
    isVegetarian: false,
    isSpicy: false,
    spiceLevels: ['Delicate Bisque'],
    addOns: [
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
    reviewCount: 52,
    prepTime: '15 mins',
    calories: '410 kcal',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
    description: 'Grilled Roman artichoke hearts, quinoa pilaf, sun-dried tomatoes, avocado, toasted pine nuts, and lemon-tahini herb dressing.',
    isChefPick: false,
    isVegetarian: true,
    isSpicy: false,
    spiceLevels: ['Citrus Mint Fresh'],
    addOns: [
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
    reviewCount: 167,
    prepTime: '12 mins',
    calories: '520 kcal',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80',
    description: '70% dark single-origin French chocolate cake with an erupting warm ganache center, paired with Madagascar vanilla bean gelato and gold leaf.',
    isChefPick: true,
    isVegetarian: true,
    isSpicy: false,
    spiceLevels: ['Sweet Indulgence'],
    addOns: [
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
    reviewCount: 91,
    prepTime: '10 mins',
    calories: '380 kcal',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80',
    description: 'Uji ceremonial grade Japanese matcha custard with crisp caramelized sugar glass, fresh wild blackberries, and candied citrus peel.',
    isChefPick: false,
    isVegetarian: true,
    isSpicy: false,
    spiceLevels: ['Mellow Sweet'],
    addOns: [
      { name: 'Black Sesame Wafer', price: 1.50 }
    ]
  },
  {
    id: 'dish-12',
    name: 'Smoked Rosemary Citrus Elixir',
    category: 'beverages',
    price: 9.50,
    rating: 4.8,
    reviewCount: 122,
    prepTime: '5 mins',
    calories: '110 kcal',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80',
    description: 'Sparkling botanical infusion of blood orange, cold-pressed yuzu, agave nectar, flamed fresh rosemary sprig, and elderflower mist.',
    isChefPick: false,
    isVegetarian: true,
    isSpicy: false,
    spiceLevels: ['Refreshing Sparkling'],
    addOns: [
      { name: 'Chia Seeds Boost', price: 1.00 },
      { name: 'Extra Flamed Herb Mist', price: 0.50 }
    ]
  }
];

// Initial mock orders to populate KDS and Tracker on first load
const SEED_ORDERS = [
  {
    id: 'ORD-7021',
    customerName: 'Dara Vann',
    phone: '012 889 901',
    diningMode: 'dine-in',
    tableNumber: '02',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    status: 'cooking', // pending | cooking | ready | served | cancelled
    paymentMethod: 'khqr',
    paymentStatus: 'Paid',
    items: [
      { id: 'dish-1', name: 'Truffle Glazed Wagyu Ribeye', price: 38.50, quantity: 1, spiceLevel: 'Black Pepper Infused', addOns: ['Extra Shaved Black Truffle'] },
      { id: 'dish-12', name: 'Smoked Rosemary Citrus Elixir', price: 9.50, quantity: 2, spiceLevel: 'Refreshing Sparkling', addOns: [] }
    ],
    subtotal: 57.50,
    discount: 0,
    tax: 5.75,
    serviceFee: 2.88,
    total: 66.13,
    specialNotes: 'Ribeye cooked medium-rare please.'
  },
  {
    id: 'ORD-7020',
    customerName: 'Sophal Meng',
    phone: '098 554 321',
    diningMode: 'dine-in',
    tableNumber: '05',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'ready',
    paymentMethod: 'card',
    paymentStatus: 'Paid',
    items: [
      { id: 'dish-2', name: 'Wild Forest Truffle Tagliatelle', price: 24.00, quantity: 2, spiceLevel: 'Original Delicate', addOns: ['Extra Aged Parmesan'] },
      { id: 'dish-10', name: 'Valrhona Molten Lava Sphere', price: 14.50, quantity: 1, spiceLevel: 'Sweet Indulgence', addOns: [] }
    ],
    subtotal: 62.50,
    discount: 9.38,
    tax: 5.31,
    serviceFee: 2.66,
    total: 61.09,
    specialNotes: 'Allergic to peanuts.'
  }
];
