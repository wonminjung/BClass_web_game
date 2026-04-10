import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import * as GameService from '../services/GameService';

const router = Router();

function extractSaveCode(req: Request, res: Response): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    return null;
  }
  const token = authHeader.slice(7);
  const saveCode = AuthService.verifyToken(token);
  if (!saveCode) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
  return saveCode;
}

// ── POST /use ───────────────────────────────────────────────
router.post(
  '/use',
  validate([{ name: 'itemId', type: 'string', minLength: 1 }]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = extractSaveCode(req, res);
      if (!saveCode) return;

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { itemId } = req.body;
      const result = GameService.useItem(saveData, itemId);

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, effect: result.effect, saveData });
    } catch (err) {
      console.error('[inventory/use]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /equip ─────────────────────────────────────────────
router.post(
  '/equip',
  validate([
    { name: 'itemId', type: 'string', minLength: 1 },
    { name: 'slot', type: 'string', minLength: 1 },
  ]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = extractSaveCode(req, res);
      if (!saveCode) return;

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { itemId, slot } = req.body;
      const result = GameService.equipItem(saveData, itemId, slot);

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, unequippedItemId: result.unequippedItemId, saveData });
    } catch (err) {
      console.error('[inventory/equip]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /unequip ───────────────────────────────────────────
router.post(
  '/unequip',
  validate([{ name: 'slot', type: 'string', minLength: 1 }]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = extractSaveCode(req, res);
      if (!saveCode) return;

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { slot } = req.body;
      const result = GameService.unequipItem(saveData, slot);

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, saveData });
    } catch (err) {
      console.error('[inventory/unequip]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── GET /enhance-info/:itemId ────────────────────────────────
router.get('/enhance-info/:itemId', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const info = GameService.getEnhanceInfo(saveData, req.params.itemId);
    res.json({ success: true, ...info });
  } catch (err) {
    console.error('[inventory/enhance-info]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
