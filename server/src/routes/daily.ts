import { Router, type Request, type Response } from 'express';
import * as AuthService from '../services/AuthService';

const router = Router();

function extractSaveCode(req: Request, res: Response): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing authorization' });
    return null;
  }
  const token = authHeader.slice(7);
  const saveCode = AuthService.verifyToken(token);
  if (!saveCode) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return null;
  }
  return saveCode;
}

const DAILY_REWARDS = [
  { gold: 500, description: '골드 500' },
  { gold: 1000, description: '골드 1,000' },
  { gold: 2000, description: '골드 2,000' },
  { gold: 5000, description: '골드 5,000' },
  { gold: 3000, description: '골드 3,000' },
  { gold: 4000, description: '골드 4,000' },
  { gold: 10000, description: '골드 10,000 (주간 보너스!)' },
];

router.get('/status', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;
    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) { res.status(404).json({ success: false }); return; }

    const today = new Date().toISOString().slice(0, 10);
    const lastReward = (saveData.lastDailyReward || '').slice(0, 10);
    const canClaim = lastReward !== today;

    // Day of week (0=Sun)
    const dayIndex = new Date().getDay();
    const reward = DAILY_REWARDS[dayIndex];

    res.json({ success: true, canClaim, reward, lastReward });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/claim', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;
    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) { res.status(404).json({ success: false }); return; }

    const today = new Date().toISOString().slice(0, 10);
    const lastReward = (saveData.lastDailyReward || '').slice(0, 10);
    if (lastReward === today) {
      res.status(400).json({ success: false, message: '오늘 이미 보상을 받았습니다' });
      return;
    }

    const dayIndex = new Date().getDay();
    const reward = DAILY_REWARDS[dayIndex];

    saveData.gold += reward.gold;
    saveData.lastDailyReward = new Date().toISOString();
    AuthService.saveProgress(saveCode, saveData);

    res.json({ success: true, reward, saveData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
