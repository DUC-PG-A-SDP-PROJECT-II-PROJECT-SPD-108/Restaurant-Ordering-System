import { Router } from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Rate limiter for login: 30 requests/minute per IP
const loginRateLimiter = createRateLimiter(30, 60000, 'Too many login attempts. Please wait 1 minute before retrying.');

// Public login route (Protected by Rate Limiter)
router.post('/login', loginRateLimiter, login);

// Protected profile route
router.get('/me', verifyToken, getProfile);

export default router;
