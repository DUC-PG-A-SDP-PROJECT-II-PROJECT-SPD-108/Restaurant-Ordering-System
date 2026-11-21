import db from '../../database/db.js';

/**
 * Get all vouchers
 * GET /api/vouchers
 */
export function getVouchers(req, res) {
  try {
    const vouchers = db.prepare('SELECT * FROM vouchers ORDER BY id ASC').all();
    const formatted = vouchers.map(v => ({
      id: v.id,
      code: (v.code || '').toUpperCase(),
      discountPercent: Number(v.discountPercent || v.discount_percent || 0),
      description: v.description || '',
      isActive: Boolean(v.isActive !== undefined ? v.isActive : v.is_active),
      isFeatured: Boolean(v.isFeatured || v.is_featured),
      createdAt: v.createdAt || v.created_at
    }));
    res.json(formatted);
  } catch (error) {
    console.error('getVouchers error:', error);
    res.status(500).json({ error: 'Failed to fetch vouchers' });
  }
}

/**
 * Create a new voucher
 * POST /api/vouchers
 */
export function createVoucher(req, res) {
  try {
    const { code, discountPercent, description = '', isActive = 1, isFeatured = 0 } = req.body;
    if (!code || !discountPercent) {
      return res.status(400).json({ error: 'Voucher code and discountPercent required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const stmt = db.prepare(`
      INSERT INTO vouchers (code, discountPercent, description, isActive, isFeatured)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(cleanCode, Number(discountPercent), description, isActive ? 1 : 0, isFeatured ? 1 : 0);

    res.status(201).json({
      id: result.lastInsertRowid,
      code: cleanCode,
      discountPercent: Number(discountPercent),
      description,
      isActive: Boolean(isActive),
      isFeatured: Boolean(isFeatured)
    });
  } catch (error) {
    console.error('createVoucher error:', error);
    res.status(500).json({ error: 'Failed to create voucher' });
  }
}

/**
 * Update an existing voucher
 * PUT /api/vouchers/:id
 */
export function updateVoucher(req, res) {
  try {
    const { id } = req.params;
    const { code, discountPercent, description, isActive, isFeatured } = req.body;

    const existing = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const newCode = code !== undefined ? code.trim().toUpperCase() : existing.code;
    const newDiscount = discountPercent !== undefined ? Number(discountPercent) : existing.discountPercent;
    const newDesc = description !== undefined ? description : existing.description;
    const newActive = isActive !== undefined ? (isActive ? 1 : 0) : existing.isActive;
    const newFeatured = isFeatured !== undefined ? (isFeatured ? 1 : 0) : (existing.isFeatured || 0);

    db.prepare(`
      UPDATE vouchers
      SET code = ?, discountPercent = ?, description = ?, isActive = ?, isFeatured = ?
      WHERE id = ?
    `).run(newCode, newDiscount, newDesc, newActive, newFeatured, id);

    res.json({
      id: Number(id),
      code: newCode,
      discountPercent: newDiscount,
      description: newDesc,
      isActive: Boolean(newActive),
      isFeatured: Boolean(newFeatured)
    });
  } catch (error) {
    console.error('updateVoucher error:', error);
    res.status(500).json({ error: 'Failed to update voucher' });
  }
}

/**
 * Verify promo / voucher code against live SQLite vouchers table
 * POST /api/vouchers/verify
 */
export function verifyVoucher(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false, error: 'Promo code is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Query active voucher from SQLite vouchers table
    const voucher = db.prepare(`
      SELECT code, discountPercent, description, isActive
      FROM vouchers
      WHERE UPPER(code) = ?
    `).get(cleanCode);

    if (voucher && voucher.isActive) {
      return res.json({
        valid: true,
        code: voucher.code,
        discountPercent: Number(voucher.discountPercent),
        description: voucher.description
      });
    }

    res.status(404).json({ valid: false, error: 'Invalid or expired voucher code' });
  } catch (error) {
    console.error('verifyVoucher error:', error);
    res.status(500).json({ error: 'Failed to verify voucher' });
  }
}

/**
 * Delete a voucher
 * DELETE /api/vouchers/:id
 */
export function deleteVoucher(req, res) {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM vouchers WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }
    res.json({ message: 'Voucher deleted successfully', id });
  } catch (error) {
    console.error('deleteVoucher error:', error);
    res.status(500).json({ error: 'Failed to delete voucher' });
  }
}
