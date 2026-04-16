import { Router, type Request, type Response } from 'express';
import * as AuthService from '../services/AuthService';
import * as GameService from '../services/GameService';
import { ITEMS } from '../../../shared/data';

const router = Router();

// ── Cost table ──
const COST_MAP: Record<number, number> = {
  1: 100_000,
  10: 900_000,   // 10% discount
  100: 8_000_000, // 20% discount
};

// ── Fixed pocket rewards (index 0-8) ──
interface PocketReward {
  id: string;
  name: string;
  reward: { gold?: number; gems?: number; itemId?: string; quantity?: number } | null;
}

const POCKET_REWARDS: PocketReward[] = [
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

// ── POST /play ──
router.post('/play', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const count = Number(req.body.count);
    const pockets: number[] = req.body.pockets;

    // Validate count
    if (![1, 10, 100].includes(count)) {
      res.status(400).json({ success: false, message: '유효하지 않은 횟수입니다 (1/10/100)' });
      return;
    }

    // Validate pockets array
    if (!Array.isArray(pockets) || pockets.length !== count) {
      res.status(400).json({ success: false, message: '포켓 결과 배열이 유효하지 않습니다.' });
      return;
    }

    for (const p of pockets) {
      if (typeof p !== 'number' || p < 0 || p > 8 || !Number.isInteger(p)) {
        res.status(400).json({ success: false, message: '유효하지 않은 포켓 인덱스입니다 (0-8).' });
        return;
      }
    }

    // Calculate cost
    const totalCost = COST_MAP[count];

    // Check gold
    if ((saveData.gold ?? 0) < totalCost) {
      res.status(400).json({ success: false, message: `골드가 부족합니다 (필요: ${totalCost.toLocaleString()})` });
      return;
    }

    // Deduct gold
    saveData.gold -= totalCost;

    // Process pocket results and accumulate rewards
    const results: { pocket: number; name: string }[] = [];
    let totalGold = 0;
    let totalGems = 0;
    const itemAccumulator: Record<string, number> = {};

    for (const pocketIdx of pockets) {
      const entry = POCKET_REWARDS[pocketIdx];
      results.push({ pocket: pocketIdx, name: entry.name });

      if (entry.reward) {
        if (entry.reward.gold) totalGold += entry.reward.gold;
        if (entry.reward.gems) totalGems += entry.reward.gems;
        if (entry.reward.itemId) {
          itemAccumulator[entry.reward.itemId] = (itemAccumulator[entry.reward.itemId] ?? 0) + (entry.reward.quantity ?? 1);
        }
      }
    }

    // Apply rewards
    saveData.gold += totalGold;
    saveData.gems = (saveData.gems ?? 0) + totalGems;

    for (const [itemId, quantity] of Object.entries(itemAccumulator)) {
      GameService.addItem(saveData, itemId, quantity);
    }

    // Build items array for response
    const itemsResponse = Object.entries(itemAccumulator).map(([itemId, quantity]) => {
      const itemDef = ITEMS.find(i => i.id === itemId);
      return { name: itemDef?.name ?? itemId, quantity };
    });

    AuthService.saveProgress(saveCode, saveData);

    res.json({
      success: true,
      results,
      totalRewards: {
        gold: totalGold,
        gems: totalGems,
        items: itemsResponse,
      },
      goldSpent: totalCost,
      saveData,
    });
  } catch (err) {
    console.error('[pachinko/play]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
