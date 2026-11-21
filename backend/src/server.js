import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import bakongRoutes from './routes/bakongRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';
import staffRoutes from './routes/staffRoutes.js';

const app = express();
const PORT = process.env.PORT || 5050;

// Core Middleware
app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 2. Modular RESTful API Routes
app.use('/api/auth', authRoutes);
app.use('/api', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api', statsRoutes);
app.use('/api/bakong', bakongRoutes);

// 3. 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// 4. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// 5. Start Server
app.listen(PORT, () => {
  console.log(`🚀 ROS Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});

export default app;
