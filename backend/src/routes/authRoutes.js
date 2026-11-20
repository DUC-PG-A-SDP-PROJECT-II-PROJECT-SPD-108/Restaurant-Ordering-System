import { Router } from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Public login route
router.post('/login', login);

// Protected profile route
router.get('/me', verifyToken, getProfile);

export default router;
