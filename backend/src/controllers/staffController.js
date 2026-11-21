import bcrypt from 'bcryptjs';
import db from '../../database/db.js';

/**
 * Helper to resolve staff ID from integer, 'staff-1', or username
 */
function resolveStaffId(rawId) {
  if (typeof rawId === 'number') return rawId;
  if (typeof rawId === 'string') {
    if (rawId.startsWith('staff-')) {
      const parsed = parseInt(rawId.replace('staff-', ''), 10);
      if (!isNaN(parsed)) return parsed;
    }
    if (/^\d+$/.test(rawId)) {
      return parseInt(rawId, 10);
    }
  }
  return rawId;
}

/**
 * Fetch all staff & user roster
 * GET /api/staff
 */
export function getStaff(req, res) {
  try {
    const users = db.prepare(`
      SELECT id, username, role, name, phone, email, department, shift, hourly_rate, duty_status, hire_date
      FROM users
      ORDER BY id ASC
    `).all();

    const formatted = users.map(u => ({
      id: `staff-${u.id}`,
      dbId: u.id,
      name: u.name || u.username,
      username: u.username,
      role: u.role,
      phone: u.phone || '+855 12 000 000',
      email: u.email || `${u.username}@bistro.com`,
      department: u.department || 'Front of House & Service',
      shift: u.shift || 'Morning Shift (07:00 - 15:00)',
      hourlyRate: Number(u.hourly_rate || 4.50),
      dutyStatus: u.duty_status || 'on_duty',
      hireDate: u.hire_date || new Date().toISOString().split('T')[0]
    }));

    res.json(formatted);
  } catch (error) {
    console.error('getStaff error:', error);
    res.status(500).json({ error: 'Failed to retrieve staff roster' });
  }
}

/**
 * Create a new staff account
 * POST /api/staff
 */
export function createStaff(req, res) {
  try {
    const {
      username,
      password = 'staff123',
      role = 'staff',
      name,
      phone = '+855 12 000 000',
      email,
      department = 'Front of House & Service',
      shift = 'Morning Shift (07:00 - 15:00)',
      hourlyRate = 4.50,
      dutyStatus = 'on_duty'
    } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: `Username "${cleanUsername}" already exists` });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, name, phone, email, department, shift, hourly_rate, duty_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      cleanUsername,
      hashedPassword,
      role,
      name || username,
      phone,
      email || `${cleanUsername}@bistro.com`,
      department,
      shift,
      Number(hourlyRate),
      dutyStatus
    );

    const newId = result.lastInsertRowid;

    res.status(201).json({
      id: `staff-${newId}`,
      dbId: newId,
      username: cleanUsername,
      role,
      name: name || username,
      phone,
      email: email || `${cleanUsername}@bistro.com`,
      department,
      shift,
      hourlyRate: Number(hourlyRate),
      dutyStatus
    });
  } catch (error) {
    console.error('createStaff error:', error);
    res.status(500).json({ error: 'Failed to create staff user', details: error.message });
  }
}

/**
 * Update staff details
 * PUT /api/staff/:id
 */
export function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const { name, role, phone, email, department, shift, hourlyRate, dutyStatus, password } = req.body;

    const targetId = resolveStaffId(id);
    const existing = db.prepare('SELECT * FROM users WHERE id = ? OR username = ?').get(targetId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Staff user not found' });
    }

    let updateQuery = `
      UPDATE users
      SET name = COALESCE(?, name),
          role = COALESCE(?, role),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          department = COALESCE(?, department),
          shift = COALESCE(?, shift),
          hourly_rate = COALESCE(?, hourly_rate),
          duty_status = COALESCE(?, duty_status)
    `;
    const params = [
      name !== undefined ? name : null,
      role !== undefined ? role : null,
      phone !== undefined ? phone : null,
      email !== undefined ? email : null,
      department !== undefined ? department : null,
      shift !== undefined ? shift : null,
      hourlyRate !== undefined ? Number(hourlyRate) : null,
      dutyStatus !== undefined ? dutyStatus : null
    ];

    if (password) {
      updateQuery += `, password = ?`;
      params.push(bcrypt.hashSync(password, 10));
    }

    updateQuery += ` WHERE id = ?`;
    params.push(existing.id);

    db.prepare(updateQuery).run(...params);

    res.json({
      message: 'Staff member updated successfully',
      id: `staff-${existing.id}`,
      dbId: existing.id
    });
  } catch (error) {
    console.error('updateStaff error:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
}

/**
 * Delete a staff user
 * DELETE /api/staff/:id
 */
export function deleteStaff(req, res) {
  try {
    const { id } = req.params;
    const targetId = resolveStaffId(id);
    const existing = db.prepare('SELECT id, role, username FROM users WHERE id = ? OR username = ?').get(targetId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Protect the last remaining admin account from deletion
    if (existing.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only remaining admin account' });
      }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(existing.id);
    res.json({ message: 'Staff member deleted successfully', id: `staff-${existing.id}`, dbId: existing.id });
  } catch (error) {
    console.error('deleteStaff error:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
}
