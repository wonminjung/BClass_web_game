import { Router, type Request, type Response } from 'express';
import * as AuthService from '../services/AuthService';
import * as GameService from '../services/GameService';
import { ITEMS } from '../../../shared/data';

const router = Router();

// ── Cost table ──
const COST_MAP: Record<number, number> = {
  1: 10_000,
  10: 90_000,   // 10% discount
  100: 800_000, // 20% discount
};

// ── Reward table (base probabilities for 'center') ──
interface RewardEntry {
  id: string;
  name: string;
  chance: number;
  reward: { gold?: number; gems?: number; itemId?: string; quantity?: number } | null;
}

const BASE_REWARDS: RewardEntry[] = [
  { id: 'miss', name: '꽝', chance: 0.25, reward: null },
  { id: 'gold_s', name: '소량 골드', chance: 0.20, reward: { gold: 3000 } },
  { id: 'gold_m', name: '중량 골드', chance: 0.15, reward: { gold: 8000 } },
  { id: 'gold_l', name: '대량 골드', chance: 0.08, reward: { gold: 25000 } },
  { id: 'stone_common', name: '일반 강화석', chance: 0.12, reward: { itemId: 'enhance_stone_common', quantity: 3 } },
  { id: 'stone_rare', name: '희귀 강화석', chance: 0.08, reward: { itemId: 'enhance_stone_rare', quantity: 2 } },
  { id: 'stone_epic', name: '영웅 강화석', chance: 0.05, reward: { itemId: 'enhance_stone_epic', quantity: 1 } },
  { id: 'gems', name: '젬', chance: 0.05, reward: { gems: 50 } },
  { id: 'jackpot', name: '잭팟', chance: 0.02, reward: { gems: 500, itemId: 'enhance_stone_legendary', quantity: 5 } },
];

// ── Position modifiers ──
type Position = 'left' | 'center' | 'right';

const POSITION_MODIFIERS: Record<Position, Record<string, number>> = {
  left: {
    stone_common: +0.03,
    stone_rare: +0.03,
    stone_epic: +0.03,
    gold_s: -0.03,
    gold_m: -0.03,
  },
  center: {},
  right: {
    gold_m: +0.03,
    gems: +0.03,
    stone_common: -0.03,
    stone_rare: -0.03,
  },
};

function getModifiedTable(position: Position): RewardEntry[] {
  const mods = POSITION_MODIFIERS[position];
  return BASE_REWARDS.map(entry => ({
    ...entry,
    chance: Math.max(0, entry.chance + (mods[entry.id] ?? 0)),
  }));
}

function rollReward(table: RewardEntry[]): RewardEntry {
  const totalWeight = table.reduce((sum, e) => sum + e.chance, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of table) {
    roll -= entry.chance;
    if (roll <= 0) return entry;
  }
  // Fallback to last entry (should not happen)
  return table[table.length - 1];
}

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

    const { position } = req.body;
    const count = Number(req.body.count);

    // Validate position
    if (!position || !['left', 'center', 'right'].includes(position)) {
      res.status(400).json({ success: false, message: '유효하지 않은 위치입니다 (left/center/right)' });
      return;
    }

    // Validate count
    if (![1, 10, 100].includes(count)) {
      res.status(400).json({ success: false, message: '유효하지 않은 횟수입니다 (1/10/100)' });
      return;
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

    // Build modified table for this position
    const table = getModifiedTable(position as Position);

    // Roll results and accumulate rewards
    const results: { id: string; name: string }[] = [];
    let totalGold = 0;
    let totalGems = 0;
    const itemAccumulator: Record<string, number> = {};

    for (let i = 0; i < count; i++) {
      const entry = rollReward(table);
      results.push({ id: entry.id, name: entry.name });

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
