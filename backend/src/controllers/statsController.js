import db from '../../database/db.js';
import { verifyVoucher as verifyVoucherFromController } from './voucherController.js';

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

    // Realized revenue from completed/served or paid orders
    const totalRevenue = db.prepare(`
      SELECT SUM(totalAmount) as total
      FROM orders
      WHERE (paymentStatus IN ('paid', 'Paid') OR status IN ('served', 'completed', 'delivered'))
        AND status != 'cancelled'
    `).get().total || 0;

    res.json({
      activeOrders: activeCount,
      completedOrders: completedCount,
      totalRevenue: Number(Number(totalRevenue).toFixed(2))
    });
  } catch (error) {
    console.error('getSummary error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats summary' });
  }
}

/**
 * Fetch table layout and status list from SQLite database
 * GET /api/tables
 */
export function getTables(req, res) {
  try {
    const tables = db.prepare('SELECT id, tableNumber, zone, capacity, status FROM restaurant_tables ORDER BY tableNumber ASC').all();
    if (tables && tables.length > 0) {
      const formatted = tables.map(t => {
        const numStr = String(t.tableNumber).padStart(2, '0');
        return {
          id: numStr,
          tableNumber: numStr,
          zone: t.zone || 'Main Dining',
          capacity: Number(t.capacity || 4),
          status: t.status || 'available'
        };
      });
      return res.json(formatted);
    }

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
 * Update table status or details
 * PATCH /api/tables/:id/status or PUT /api/tables/:id
 */
export function updateTable(req, res) {
  try {
    const { id } = req.params;
    const { status, zone, capacity } = req.body;
    const parsed = parseInt(id, 10);
    const tblNum = !isNaN(parsed) ? parsed : -1;

    const existing = db.prepare('SELECT * FROM restaurant_tables WHERE tableNumber = ? OR id = ?').get(tblNum, id);
    if (!existing) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const newStatus = status || existing.status;
    const newZone = zone || existing.zone;
    const newCapacity = capacity !== undefined ? Number(capacity) : existing.capacity;

    db.prepare(`
      UPDATE restaurant_tables
      SET status = ?, zone = ?, capacity = ?
      WHERE id = ?
    `).run(newStatus, newZone, newCapacity, existing.id);

    const numStr = String(existing.tableNumber).padStart(2, '0');
    res.json({
      message: 'Table updated successfully',
      id: numStr,
      tableNumber: numStr,
      status: newStatus,
      zone: newZone,
      capacity: newCapacity
    });
  } catch (error) {
    console.error('updateTable error:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
}

/**
 * Re-export verifyVoucher from voucherController for route backward compatibility
 */
export const verifyVoucher = verifyVoucherFromController;
