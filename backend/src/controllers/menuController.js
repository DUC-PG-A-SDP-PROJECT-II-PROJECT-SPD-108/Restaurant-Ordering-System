import db from '../../database/db.js';

const CATEGORY_SLUG_MAP = {
  1: 'starters',
  2: 'mains',
  3: 'steaks',
  4: 'pastas',
  5: 'desserts',
  6: 'beverages'
};

const SLUG_TO_ID_MAP = {
  'starters': 1,
  'mains': 2,
  'steaks': 3,
  'pastas': 4,
  'desserts': 5,
  'beverages': 6
};

/**
 * Helper to resolve dish ID from integer or string like 'dish-1'
 */
function resolveDishId(id) {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    if (id.startsWith('dish-')) {
      const parsed = parseInt(id.replace('dish-', ''), 10);
      if (!isNaN(parsed)) return parsed;
    }
    if (/^\d+$/.test(id)) {
      return parseInt(id, 10);
    }
  }
  return id;
}

/**
 * Helper to resolve category ID from numeric ID, slug, or name
 */
function resolveCategoryId(cat) {
  if (!cat) return 1;
  if (typeof cat === 'number') return cat;
  if (typeof cat === 'string') {
    if (/^\d+$/.test(cat)) return parseInt(cat, 10);
    const lower = cat.toLowerCase().trim();
    if (SLUG_TO_ID_MAP[lower]) return SLUG_TO_ID_MAP[lower];

    const found = db.prepare('SELECT id FROM categories WHERE LOWER(name) = ? OR LOWER(name) LIKE ?').get(lower, `%${lower}%`);
    if (found) return found.id;
  }
  return 1;
}

/**
 * Fetch all categories
 * GET /api/categories
 */
export function getCategories(req, res) {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(m.id) as dishCount
      FROM categories c
      LEFT JOIN menu_items m ON c.id = m.categoryId
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.id ASC
    `).all();

    const formatted = categories.map(c => ({
      id: CATEGORY_SLUG_MAP[c.id] || `cat-${c.id}`,
      dbId: c.id,
      name: c.name,
      icon: c.icon || 'fa-solid fa-utensils',
      description: c.description || '',
      displayOrder: c.display_order || 0,
      count: Number(c.dishCount || c.count || 0)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

/**
 * Create a new category
 * POST /api/categories
 */
export function createCategory(req, res) {
  try {
    const { name, icon = 'fa-solid fa-utensils', description = '' } = req.body;
    const displayOrder = req.body.displayOrder ?? req.body.display_order ?? 0;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO categories (name, icon, description, display_order)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), icon, description.trim(), Number(displayOrder) || 0);

    res.status(201).json({
      id: result.lastInsertRowid,
      name: name.trim(),
      icon,
      description: description.trim(),
      displayOrder: Number(displayOrder) || 0,
      count: 0
    });
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

/**
 * Update an existing category
 * PUT /api/categories/:id
 */
export function updateCategory(req, res) {
  try {
    const targetId = resolveCategoryId(req.params.id);
    const { name, icon, description } = req.body;
    const displayOrder = req.body.displayOrder ?? req.body.display_order;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(targetId);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newName = name !== undefined ? name.trim() : existing.name;
    const newIcon = icon !== undefined ? icon : existing.icon;
    const newDesc = description !== undefined ? description.trim() : existing.description;
    const newOrder = displayOrder !== undefined ? Number(displayOrder) : existing.display_order;

    db.prepare(`
      UPDATE categories
      SET name = ?, icon = ?, description = ?, display_order = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newName, newIcon, newDesc, newOrder, targetId);

    res.json({
      id: CATEGORY_SLUG_MAP[targetId] || `cat-${targetId}`,
      dbId: targetId,
      name: newName,
      icon: newIcon,
      description: newDesc,
      displayOrder: newOrder
    });
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

/**
 * Delete a category
 * DELETE /api/categories/:id
 */
export function deleteCategory(req, res) {
  try {
    const targetId = resolveCategoryId(req.params.id);
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(targetId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully', id: req.params.id, dbId: targetId });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

/**
 * Fetch all menu items (supports categoryId & search filters)
 * GET /api/menu
 */
export function getMenuItems(req, res) {
  try {
    const { categoryId, category, search } = req.query;
    let query = `
      SELECT m.*, c.name as categoryName
      FROM menu_items m
      LEFT JOIN categories c ON m.categoryId = c.id
      WHERE 1=1
    `;
    const params = [];

    const catParam = categoryId || category;
    if (catParam && catParam !== 'all') {
      const resolved = resolveCategoryId(catParam);
      query += ' AND m.categoryId = ?';
      params.push(resolved);
    }

    if (search) {
      query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY m.id ASC';
    const items = db.prepare(query).all(...params);

    const formatted = items.map(item => ({
      ...item,
      id: `dish-${item.id}`,
      dbId: item.id,
      category: CATEGORY_SLUG_MAP[item.categoryId] || (item.categoryName ? item.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'mains'),
      categoryName: item.categoryName || 'Artisan Mains',
      price: Number(item.price),
      isChefPick: Boolean(item.isChefPick),
      isVegetarian: Boolean(item.isVegetarian),
      isSpicy: Boolean(item.isSpicy),
      inStock: Boolean(item.isAvailable)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('getMenuItems error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
}

/**
 * Fetch single menu item by ID
 * GET /api/menu/:id
 */
export function getMenuItemById(req, res) {
  try {
    const targetId = resolveDishId(req.params.id);
    const item = db.prepare(`
      SELECT m.*, c.name as categoryName
      FROM menu_items m
      LEFT JOIN categories c ON m.categoryId = c.id
      WHERE m.id = ?
    `).get(targetId);

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({
      ...item,
      id: `dish-${item.id}`,
      dbId: item.id,
      category: CATEGORY_SLUG_MAP[item.categoryId] || (item.categoryName ? item.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'mains'),
      categoryName: item.categoryName || 'Artisan Mains',
      price: Number(item.price),
      isChefPick: Boolean(item.isChefPick),
      isVegetarian: Boolean(item.isVegetarian),
      isSpicy: Boolean(item.isSpicy),
      inStock: Boolean(item.isAvailable)
    });
  } catch (error) {
    console.error('getMenuItemById error:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
}

/**
 * Create a new menu item
 * POST /api/menu
 */
export function createMenuItem(req, res) {
  try {
    const {
      name,
      categoryId,
      category,
      price,
      image = '',
      description = '',
      isSpicy = 0,
      isVegetarian = 0,
      isChefPick = 0
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const resolvedCatId = resolveCategoryId(categoryId || category);
    const finalImage = (image && typeof image === 'string' && image.trim())
      ? image.trim()
      : 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80';

    const insert = db.prepare(`
      INSERT INTO menu_items (name, categoryId, price, image, description, isSpicy, isVegetarian, isChefPick, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = insert.run(
      name.trim(),
      resolvedCatId,
      Number(price),
      finalImage,
      description,
      isSpicy ? 1 : 0,
      isVegetarian ? 1 : 0,
      isChefPick ? 1 : 0
    );

    const newId = result.lastInsertRowid;

    res.status(201).json({
      message: 'Menu item created successfully',
      id: `dish-${newId}`,
      dbId: newId,
      name: name.trim(),
      price: Number(price),
      categoryId: resolvedCatId
    });
  } catch (error) {
    console.error('createMenuItem error:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
}

/**
 * Update an existing menu item
 * PUT /api/menu/:id
 */
export function updateMenuItem(req, res) {
  try {
    const targetId = resolveDishId(req.params.id);
    const {
      name,
      categoryId,
      category,
      price,
      image,
      description,
      isSpicy,
      isVegetarian,
      isChefPick,
      isAvailable,
      inStock
    } = req.body;

    const existing = db.prepare('SELECT id FROM menu_items WHERE id = ?').get(targetId);
    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const resolvedCatId = (categoryId || category) ? resolveCategoryId(categoryId || category) : null;
    const availableStatus = isAvailable !== undefined ? (isAvailable ? 1 : 0) : (inStock !== undefined ? (inStock ? 1 : 0) : null);

    const update = db.prepare(`
      UPDATE menu_items
      SET name = COALESCE(?, name),
          categoryId = COALESCE(?, categoryId),
          price = COALESCE(?, price),
          image = COALESCE(?, image),
          description = COALESCE(?, description),
          isSpicy = COALESCE(?, isSpicy),
          isVegetarian = COALESCE(?, isVegetarian),
          isChefPick = COALESCE(?, isChefPick),
          isAvailable = COALESCE(?, isAvailable)
      WHERE id = ?
    `);

    update.run(
      name !== undefined ? name.trim() : null,
      resolvedCatId,
      price !== undefined ? Number(price) : null,
      image !== undefined ? image : null,
      description !== undefined ? description : null,
      isSpicy !== undefined ? (isSpicy ? 1 : 0) : null,
      isVegetarian !== undefined ? (isVegetarian ? 1 : 0) : null,
      isChefPick !== undefined ? (isChefPick ? 1 : 0) : null,
      availableStatus,
      targetId
    );

    res.json({ message: 'Menu item updated successfully', id: `dish-${targetId}`, dbId: targetId });
  } catch (error) {
    console.error('updateMenuItem error:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
}

/**
 * Toggle stock status (in-stock / out-of-stock)
 * PATCH /api/menu/:id/toggle
 */
export function toggleMenuItemStock(req, res) {
  try {
    const targetId = resolveDishId(req.params.id);
    const item = db.prepare('SELECT id, isAvailable FROM menu_items WHERE id = ?').get(targetId);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const newStatus = item.isAvailable ? 0 : 1;
    db.prepare('UPDATE menu_items SET isAvailable = ? WHERE id = ?').run(newStatus, targetId);

    res.json({
      message: 'Stock status updated successfully',
      id: `dish-${targetId}`,
      dbId: targetId,
      isAvailable: Boolean(newStatus),
      inStock: Boolean(newStatus)
    });
  } catch (error) {
    console.error('toggleMenuItemStock error:', error);
    res.status(500).json({ error: 'Failed to toggle stock status' });
  }
}

/**
 * Delete menu item
 * DELETE /api/menu/:id
 */
export function deleteMenuItem(req, res) {
  try {
    const targetId = resolveDishId(req.params.id);
    const result = db.prepare('DELETE FROM menu_items WHERE id = ?').run(targetId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully', id: `dish-${targetId}`, dbId: targetId });
  } catch (error) {
    console.error('deleteMenuItem error:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
}
