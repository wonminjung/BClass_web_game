import { Router, type Request, type Response } from 'express';
import { validate, sanitizeInput } from '../middleware/validate';
import * as AuthService from '../services/AuthService';

const router = Router();

// ── POST /login ──────────────────────────────────────────────
router.post(
  '/login',
  validate([
    { name: 'saveCode', type: 'string', minLength: 8, maxLength: 16, pattern: /^[A-Za-z0-9]+$/ },
  ]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = sanitizeInput(req.body.saveCode);
      const result = AuthService.login(saveCode);

      if (result.error || !result.data) {
        res.status(404).json({ success: false, message: result.error ?? 'Save not found' });
        return;
      }

      const token = AuthService.generateToken(saveCode);

      res.json({
        success: true,
        message: 'Login successful',
        data: result.data,
        token,
      });
    } catch (err) {
      console.error('[auth/login]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /new-game ───────────────────────────────────────────
router.post(
  '/new-game',
  validate([
    { name: 'playerName', type: 'string', minLength: 1, maxLength: 20 },
    { name: 'characterId', type: 'string', minLength: 1, maxLength: 30 },
  ]),
  (req: Request, res: Response): void => {
    try {
      const playerName = sanitizeInput(req.body.playerName);
      const characterId = sanitizeInput(req.body.characterId);

      const result = AuthService.createNewGame(playerName, characterId);

      if ('error' in result) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      const token = AuthService.generateToken(result.saveCode);

      res.status(201).json({
        success: true,
        message: 'New game created',
        saveCode: result.saveCode,
        data: result.data,
        token,
      });
    } catch (err) {
      console.error('[auth/new-game]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /save ───────────────────────────────────────────────
router.post('/save', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);
    const saveCode = AuthService.verifyToken(token);
    if (!saveCode) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const data = req.body.data;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ success: false, message: 'Save data payload is required' });
      return;
    }

    const result = AuthService.saveProgress(saveCode, data);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    res.json({ success: true, message: 'Progress saved' });
  } catch (err) {
    console.error('[auth/save]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
