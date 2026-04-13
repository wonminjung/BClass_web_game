import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import { CHARACTERS, DUNGEONS, SKILLS } from '../../../shared/data';

const router = Router();

// ── GET /characters ──────────────────────────────────────────
router.get('/characters', (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, data: CHARACTERS });
  } catch (err) {
    console.error('[game/characters]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── GET /dungeons ────────────────────────────────────────────
router.get('/dungeons', (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, data: DUNGEONS });
  } catch (err) {
    console.error('[game/dungeons]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── GET /skills/:characterId ─────────────────────────────────
router.get('/skills/:characterId', (req: Request, res: Response): void => {
  try {
    const { characterId } = req.params;

    const character = CHARACTERS.find((c) => c.id === characterId);
    if (!character) {
      res.status(404).json({ success: false, message: 'Character not found' });
      return;
    }

    const characterSkills = SKILLS.filter((s) => s.characterId === characterId || s.characterId === 'common');

    res.json({ success: true, data: characterSkills });
  } catch (err) {
    console.error('[game/skills]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /skill-upgrade ─────────────────────────────────────
router.post(
  '/skill-upgrade',
  validate([{ name: 'skillId', type: 'string', minLength: 1 }]),
  (req: Request, res: Response): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Missing authorization' });
        return;
      }
      const token = authHeader.slice(7);
      const saveCode = AuthService.verifyToken(token);
      if (!saveCode) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { skillId } = req.body;
      const skill = SKILLS.find((s) => s.id === skillId);
      if (!skill) {
        res.status(404).json({ success: false, message: 'Skill not found' });
        return;
      }

      // Check skill belongs to character
      if (skill.characterId !== saveData.characterId && skill.characterId !== 'common') {
        res.status(400).json({ success: false, message: 'This skill does not belong to your character' });
        return;
      }

      if (!saveData.skillLevels) saveData.skillLevels = {};
      const currentLevel = saveData.skillLevels[skillId] ?? 0;
      const maxLevel = 20;

      if (currentLevel >= maxLevel) {
        res.status(400).json({ success: false, message: '이미 최대 레벨입니다' });
        return;
      }

      const cost = 1000 * Math.pow(currentLevel + 1, 2);
      if (saveData.gold < cost) {
        res.status(400).json({ success: false, message: `골드가 부족합니다 (필요: ${cost})` });
        return;
      }

      saveData.gold -= cost;
      saveData.skillLevels[skillId] = currentLevel + 1;
      AuthService.saveProgress(saveCode, saveData);

      res.json({
        success: true,
        skillId,
        newLevel: saveData.skillLevels[skillId],
        goldSpent: cost,
        saveData,
      });
    } catch (err) {
      console.error('[game/skill-upgrade]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
