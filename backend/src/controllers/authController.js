import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../database/db.js';
import { JWT_SECRET } from '../middlewares/authMiddleware.js';

/**
 * Handle staff & admin login
 * POST /api/auth/login
 */
export function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name || user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export function getProfile(req, res) {
  try {
    const user = db.prepare('SELECT id, username, role, name, phone, email, department, shift, duty_status FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
}
