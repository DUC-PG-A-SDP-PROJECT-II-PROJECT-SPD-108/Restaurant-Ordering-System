import db from '../../database/db.js';

/**
 * Fetch sales & order summary metrics
 * GET /api/stats/summary
 */
export function getSummary(req, res) {
  try {
    const activeCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status IN ('pending', 'cooking', 'preparing', 'ready')
    `).get().count;

    const completedCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status IN ('served', 'completed', 'delivered')
    `).get().count;

    const totalRevenue = db.prepare(`
      SELECT SUM(totalAmount) as total
      FROM orders
      WHERE status != 'cancelled'
    `).get().total || 0;

    res.json({
      activeOrders: activeCount,
      completedOrders: completedCount,
      totalRevenue: Number(totalRevenue.toFixed(2))
    });
  } catch (error) {
    console.error('getSummary error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats summary' });
  }
}

/**
 * Fetch table layout and status list
 * GET /api/tables
 */
export function getTables(req, res) {
  try {
    const defaultTables = [
      { id: '01', tableNumber: '01', zone: 'Patio Terrace', capacity: 2, status: 'available' },
      { id: '02', tableNumber: '02', zone: 'Window View', capacity: 4, status: 'available' },
      { id: '03', tableNumber: '03', zone: 'Cozy Booth', capacity: 4, status: 'available' },
      { id: '04', tableNumber: '04', zone: 'Main Dining Hall', capacity: 6, status: 'available' },
      { id: '05', tableNumber: '05', zone: 'VIP Wine Lounge', capacity: 8, status: 'available' },
      { id: '06', tableNumber: '06', zone: 'Main Dining Hall', capacity: 4, status: 'available' },
      { id: '07', tableNumber: '07', zone: 'Patio Terrace', capacity: 2, status: 'available' },
      { id: '08', tableNumber: '08', zone: 'Chef Counter', capacity: 2, status: 'available' }
    ];
    res.json(defaultTables);
  } catch (error) {
    console.error('getTables error:', error);
    res.status(500).json({ error: 'Failed to retrieve tables' });
  }
}

/**
 * Verify promo / voucher code (queries real SQLite vouchers table with fallback)
 * POST /api/vouchers/verify
 */
export function verifyVoucher(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false, error: 'Promo code is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Query dynamic vouchers table from database
    const voucher = db.prepare(`
      SELECT code, discountPercent, description
      FROM vouchers
      WHERE UPPER(code) = ? AND isActive = 1
    `).get(cleanCode);

    if (voucher) {
      return res.json({
        valid: true,
        code: voucher.code,
        discountPercent: Number(voucher.discountPercent),
        description: voucher.description
      });
    }

    // 2. Fallback promo codes catalog
    const PROMO_CODES = {
      'AURAVIP15': { discountPercent: 15, description: '15% Off VIP Dining Special' },
      'WELCOME10': { discountPercent: 10, description: '10% Off First-Time Guest' },
      'CHEF25': { discountPercent: 25, description: '25% Off Chef Masterclass Promo' },
      'BISTRO20': { discountPercent: 20, description: '20% Weekend Celebration Discount' }
    };

    if (PROMO_CODES[cleanCode]) {
      return res.json({ valid: true, code: cleanCode, ...PROMO_CODES[cleanCode] });
    }

    res.status(404).json({ valid: false, error: 'Invalid or expired voucher code' });
  } catch (error) {
    console.error('verifyVoucher error:', error);
    res.status(500).json({ error: 'Failed to verify voucher' });
  }
}
