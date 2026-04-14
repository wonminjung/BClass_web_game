import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import * as GameService from '../services/GameService';
import { ITEMS, GEMS } from '../../../shared/data';
import type { ItemRarity } from '../../../shared/types/item';

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

// ── POST /sell ───────────────────────────────────────────────
router.post(
  '/sell',
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
      const itemDef = ITEMS.find((i) => i.id === itemId);
      if (!itemDef) {
        res.status(400).json({ success: false, message: 'Item not found' });
        return;
      }

      const result = GameService.removeItem(saveData, itemId, quantity);
      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      saveData.gold += itemDef.sellPrice * quantity;
      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, goldEarned: itemDef.sellPrice * quantity, saveData });
    } catch (err) {
      console.error('[inventory/sell]', err);
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

// ── POST /enhance-gold ───────────────────────────────────────
router.post(
  '/enhance-gold',
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
      const result = GameService.enhanceWithGold(saveData, itemId);

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      AuthService.saveProgress(saveCode, saveData);
      res.json({
        success: true,
        enhanced: result.enhanced,
        goldSpent: result.goldSpent,
        successRate: result.successRate,
        saveData,
      });
    } catch (err) {
      console.error('[inventory/enhance-gold]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /socket-gem ────────────────────────────────────────
function getSocketCount(rarity: ItemRarity): number {
  switch (rarity) {
    case 'common':
    case 'uncommon':
      return 1;
    case 'rare':
      return 2;
    case 'epic':
    case 'legendary':
      return 3;
    default:
      return 1;
  }
}

router.post(
  '/socket-gem',
  validate([
    { name: 'itemId', type: 'string', minLength: 1 },
    { name: 'gemId', type: 'string', minLength: 1 },
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

      const { itemId, gemId } = req.body;

      // Check gem exists
      const gem = GEMS.find((g) => g.id === gemId);
      if (!gem) {
        res.status(400).json({ success: false, message: 'Gem not found' });
        return;
      }

      // Check player owns item (inventory or equipped)
      const itemDef = ITEMS.find((i) => i.id === itemId);
      if (!itemDef) {
        res.status(400).json({ success: false, message: 'Item not found' });
        return;
      }

      const ownsInInventory = saveData.inventory.some((s) => s.itemId === itemId);
      const ownsEquipped = Object.values(saveData.equippedItems).some((id) => id === itemId);
      if (!ownsInInventory && !ownsEquipped) {
        res.status(400).json({ success: false, message: '해당 아이템을 보유하고 있지 않습니다' });
        return;
      }

      // Check gems currency
      if ((saveData.gems ?? 0) < gem.cost) {
        res.status(400).json({ success: false, message: '젬이 부족합니다' });
        return;
      }

      // Check socket slots
      if (!saveData.socketedGems) {
        saveData.socketedGems = {};
      }
      const currentSockets = saveData.socketedGems[itemId] ?? [];
      const maxSockets = getSocketCount(itemDef.rarity);
      if (currentSockets.length >= maxSockets) {
        res.status(400).json({ success: false, message: '소켓이 모두 사용되었습니다' });
        return;
      }

      // Deduct gems and add socket
      saveData.gems -= gem.cost;
      saveData.socketedGems[itemId] = [...currentSockets, gemId];

      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, message: `${gem.name} 장착 완료`, saveData });
    } catch (err) {
      console.error('[inventory/socket-gem]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /unsocket-gem ──────────────────────────────────────
router.post(
  '/unsocket-gem',
  validate([
    { name: 'itemId', type: 'string', minLength: 1 },
    { name: 'socketIndex', type: 'number', min: 0 },
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

      const { itemId, socketIndex } = req.body;

      if (!saveData.socketedGems) {
        saveData.socketedGems = {};
      }
      const currentSockets = saveData.socketedGems[itemId] ?? [];
      if (socketIndex < 0 || socketIndex >= currentSockets.length) {
        res.status(400).json({ success: false, message: '잘못된 소켓 인덱스입니다' });
        return;
      }

      // Remove gem (no refund)
      currentSockets.splice(socketIndex, 1);
      saveData.socketedGems[itemId] = currentSockets;

      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, message: '보석이 제거되었습니다', saveData });
    } catch (err) {
      console.error('[inventory/unsocket-gem]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
