import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth';
import gameRouter from './routes/game';
import combatRouter from './routes/combat';
import inventoryRouter from './routes/inventory';
import shopRouter from './routes/shop';

// ────────────────────────────────────────────────────────────
// App setup
// ────────────────────────────────────────────────────────────
const app = express();
const PORT = 4444;

// Security headers
app.use(helmet());

// CORS - allow the Vite dev server and common origins
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3333'],
    credentials: true,
  }),
);

// Rate limiting - 100 requests per minute per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  }),
);

// JSON body parser (limit payload size)
app.use(express.json({ limit: '1mb' }));

// ────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/game', gameRouter);
app.use('/api/combat', combatRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/shop', shopRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// ────────────────────────────────────────────────────────────
// Start
// ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Dungeon RPG API running on http://localhost:${PORT}`);
});

export default app;
