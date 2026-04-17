import { Router, type Request, type Response } from 'express';
import * as AuthService from '../services/AuthService';
import * as GameService from '../services/GameService';
import { ITEMS } from '../../../shared/data';

const router = Router();

// ── Cost table ──
const COST_MAP: Record<number, number> = {
  1: 100_000,
  10: 900_000,
  100: 8_000_000,
};

// ── Fixed pocket rewards (index 0-8) ──
const POCKET_REWARDS = [
  { id: 'jackpot', name: '잭팟', reward: { gems: 500, itemId: 'enhance_stone_legendary', quantity: 5 } },
  { id: 'miss', name: '꽝', reward: null },
  { id: 'gems', name: '젬', reward: { gems: 50 } },
  { id: 'stone_epic', name: '영웅 강화석', reward: { itemId: 'enhance_stone_epic', quantity: 1 } },
  { id: 'gold_s', name: '소량 골드', reward: { gold: 30000 } },
  { id: 'stone_rare', name: '희귀 강화석', reward: { itemId: 'enhance_stone_rare', quantity: 2 } },
  { id: 'gold_m', name: '중량 골드', reward: { gold: 80000 } },
  { id: 'miss2', name: '꽝', reward: null },
  { id: 'gold_l', name: '대량 골드', reward: { gold: 250000 } },
];

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

// ── POST /deduct — 골드 선차감 (플레이 시작 시) ──
router.post('/deduct', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) { res.status(404).json({ success: false, message: 'Save data not found' }); return; }

    const count = Number(req.body.count);
    if (![1, 10, 100].includes(count)) {
      res.status(400).json({ success: false, message: '유효하지 않은 횟수입니다' });
      return;
    }

    const cost = COST_MAP[count];
    if ((saveData.gold ?? 0) < cost) {
      res.status(400).json({ success: false, message: `골드가 부족합니다 (필요: ${cost.toLocaleString()})` });
      return;
    }

    saveData.gold -= cost;
    AuthService.saveProgress(saveCode, saveData);

    res.json({ success: true, goldSpent: cost, saveData });
  } catch (err) {
    console.error('[pachinko/deduct]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /pocket — 개별 포켓 보상 즉시 지급 ──
router.post('/pocket', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) { res.status(404).json({ success: false, message: 'Save data not found' }); return; }

    const pocket = Number(req.body.pocket);
    if (!Number.isInteger(pocket) || pocket < 0 || pocket > 8) {
      res.status(400).json({ success: false, message: '유효하지 않은 포켓' });
      return;
    }

    const entry = POCKET_REWARDS[pocket];
    let rewardGold = 0, rewardGems = 0;
    const rewardItems: { name: string; quantity: number }[] = [];

    if (entry.reward) {
      if (entry.reward.gold) { rewardGold = entry.reward.gold; saveData.gold += rewardGold; }
      if (entry.reward.gems) { rewardGems = entry.reward.gems; saveData.gems = (saveData.gems ?? 0) + rewardGems; }
      if (entry.reward.itemId) {
        const qty = entry.reward.quantity ?? 1;
        GameService.addItem(saveData, entry.reward.itemId, qty);
        const itemDef = ITEMS.find(i => i.id === entry.reward!.itemId);
        rewardItems.push({ name: itemDef?.name ?? entry.reward.itemId, quantity: qty });
      }
    }

    AuthService.saveProgress(saveCode, saveData);

    res.json({
      success: true,
      pocket,
      name: entry.name,
      reward: { gold: rewardGold, gems: rewardGems, items: rewardItems },
      saveData,
    });
  } catch (err) {
    console.error('[pachinko/pocket]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
