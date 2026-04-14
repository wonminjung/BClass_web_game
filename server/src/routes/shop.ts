import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import * as ShopService from '../services/ShopService';

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

// ── GET / ────────────────────────────────────────────────────
router.get('/', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const shop = ShopService.getShop(saveData);
    AuthService.saveProgress(saveCode, saveData);

    res.json({ success: true, ...shop, gold: saveData.gold, gems: saveData.gems ?? 0 });
  } catch (err) {
    console.error('[shop/get]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /buy-potion ─────────────────────────────────────────
router.post(
  '/buy-potion',
  validate([
    { name: 'itemId', type: 'string', minLength: 1 },
    { name: 'quantity', type: 'number', min: 1 },
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

      const { itemId, quantity } = req.body;
      const result = ShopService.buyPotion(saveData, itemId, quantity);

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, saveData });
    } catch (err) {
      console.error('[shop/buy-potion]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /buy-equipment ──────────────────────────────────────
router.post(
  '/buy-equipment',
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
      const result = ShopService.buyEquipment(saveData, itemId);

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, enhanced: result.enhanced, saveData });
    } catch (err) {
      console.error('[shop/buy-equipment]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /refresh ───────────────────────────────────────────
router.post('/refresh', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const REFRESH_GEM_COST = 50;
    if ((saveData.gems ?? 0) < REFRESH_GEM_COST) {
      res.status(400).json({ success: false, message: `젬이 부족합니다 (필요: ${REFRESH_GEM_COST})` });
      return;
    }

    saveData.gems -= REFRESH_GEM_COST;

    // Force refresh by setting shopRefreshAt to past
    saveData.shopRefreshAt = new Date(0).toISOString();
    const shop = ShopService.getShop(saveData);

    AuthService.saveProgress(saveCode, saveData);
    res.json({
      success: true,
      message: '장비 상점이 갱신되었습니다!',
      ...shop,
      gold: saveData.gold,
      gems: saveData.gems,
      saveData,
    });
  } catch (err) {
    console.error('[shop/refresh]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
