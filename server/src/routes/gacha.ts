import { Router, type Request, type Response } from 'express';
import * as AuthService from '../services/AuthService';
import * as GameService from '../services/GameService';
import { ITEMS } from '../../../shared/data';
import { generateOptions } from '../services/OptionService';
import type { SaveData } from '../../../shared/types';

const router = Router();

const SINGLE_COST = 100;
const MULTI_COST = 900; // 10-pull
const MYTHIC_RATE = 0.02; // 2%
const PITY_THRESHOLD = 50;

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

interface PullResult {
  itemId: string;
  isNew: boolean;
  name?: string;
  rarity?: string;
}

function doPull(saveData: SaveData, characterId: string): PullResult {
  if (!saveData.gachaPity) saveData.gachaPity = 0;
  saveData.gachaPity += 1;

  let gotMythic = false;
  if (saveData.gachaPity >= PITY_THRESHOLD) {
    gotMythic = true;
  } else if (Math.random() < MYTHIC_RATE) {
    gotMythic = true;
  }

  if (gotMythic) {
    saveData.gachaPity = 0;
    const mythicPool = ITEMS.filter(i => i.rarity === 'mythic' && i.requiredClass === characterId);
    if (mythicPool.length > 0) {
      const item = mythicPool[Math.floor(Math.random() * mythicPool.length)];
      GameService.addItemSmart(saveData, item.id, 1);
      if (!saveData.itemOptions) saveData.itemOptions = {};
      if (!saveData.itemOptions[item.id]) {
        saveData.itemOptions[item.id] = generateOptions('mythic');
      }
      return { itemId: item.id, isNew: true, name: item.name, rarity: item.rarity };
    }
  }

  // Not mythic: give consolation prize (enhancement stones)
  const consolation = ['enhance_stone_rare', 'enhance_stone_epic', 'enhance_stone_legendary'];
  const stoneId = consolation[Math.floor(Math.random() * consolation.length)];
  GameService.addItem(saveData, stoneId, 1);
  const stoneItem = ITEMS.find(i => i.id === stoneId);
  return { itemId: stoneId, isNew: false, name: stoneItem?.name, rarity: stoneItem?.rarity };
}

// POST /single - 1 pull (100 gems)
router.post('/single', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    if ((saveData.gems ?? 0) < SINGLE_COST) {
      res.status(400).json({ success: false, message: '젬이 부족합니다' });
      return;
    }

    saveData.gems -= SINGLE_COST;
    const result = doPull(saveData, saveData.characterId);
    AuthService.saveProgress(saveCode, saveData);

    res.json({
      success: true,
      pulls: [result],
      pity: saveData.gachaPity,
      saveData,
    });
  } catch (err) {
    console.error('[gacha/single]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /multi - 10 pull (900 gems)
router.post('/multi', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    if ((saveData.gems ?? 0) < MULTI_COST) {
      res.status(400).json({ success: false, message: '젬이 부족합니다' });
      return;
    }

    saveData.gems -= MULTI_COST;
    const pulls: PullResult[] = [];
    for (let i = 0; i < 10; i++) {
      pulls.push(doPull(saveData, saveData.characterId));
    }
    AuthService.saveProgress(saveCode, saveData);

    res.json({
      success: true,
      pulls,
      pity: saveData.gachaPity,
      saveData,
    });
  } catch (err) {
    console.error('[gacha/multi]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
