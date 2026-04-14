import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import { CHARACTERS, DUNGEONS, SKILLS, TALENTS, TITLES } from '../../../shared/data';
import type { TalentNode } from '../../../shared/data/talents';

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

// ── POST /prestige ──────────────────────────────────────────
router.post('/prestige', (req: Request, res: Response): void => {
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

    if (saveData.level < 60) {
      res.status(400).json({ success: false, message: '환생은 레벨 60 이상에서만 가능합니다' });
      return;
    }

    // Increment prestige
    saveData.prestigeLevel = (saveData.prestigeLevel ?? 0) + 1;

    // Grant gems: 50 * prestigeLevel
    saveData.gems += 50 * saveData.prestigeLevel;

    // Reset progression
    saveData.level = 1;
    saveData.exp = 0;
    saveData.skillLevels = {};
    saveData.talentPoints = {};
    saveData.abyssFloor = 0;

    // Keep: inventory, equippedItems, enhanceLevels, achievements, bestiary, dropHistory, gold, gems, abyssHighest

    AuthService.saveProgress(saveCode, saveData);

    res.json({
      success: true,
      message: `환생 완료! 환생 레벨: ${saveData.prestigeLevel}`,
      saveData,
    });
  } catch (err) {
    console.error('[game/prestige]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /appearance ────────────────────────────────────────
const VALID_COLORS = ['#8B5CF6', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#F97316'];

router.post(
  '/appearance',
  validate([{ name: 'color', type: 'string', minLength: 4, maxLength: 7 }]),
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

      const { color } = req.body;
      if (!VALID_COLORS.includes(color)) {
        res.status(400).json({ success: false, message: 'Invalid color' });
        return;
      }

      if (!saveData.appearance) saveData.appearance = { color: '#8B5CF6' };
      saveData.appearance.color = color;

      AuthService.saveProgress(saveCode, saveData);
      res.json({ success: true, saveData });
    } catch (err) {
      console.error('[game/appearance]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /talent-invest ─────────────────────────────────────
router.post(
  '/talent-invest',
  validate([{ name: 'talentId', type: 'string', minLength: 1 }]),
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

      const { talentId } = req.body;
      const talent = TALENTS.find((t: TalentNode) => t.id === talentId);
      if (!talent) {
        res.status(404).json({ success: false, message: 'Talent not found' });
        return;
      }

      const tp = saveData.talentPoints ?? {};
      const totalInvested = Object.values(tp).reduce((sum: number, v: number) => sum + v, 0);
      const availablePoints = saveData.level - totalInvested;

      if (availablePoints <= 0) {
        res.status(400).json({ success: false, message: '사용 가능한 특성 포인트가 없습니다' });
        return;
      }

      const currentLevel = tp[talentId] ?? 0;
      if (currentLevel >= talent.maxLevel) {
        res.status(400).json({ success: false, message: '이미 최대 레벨입니다' });
        return;
      }

      // Check requiredPoints in this branch
      const branchPoints = Object.entries(tp)
        .filter(([id]) => {
          const t = TALENTS.find((tt: TalentNode) => tt.id === id);
          return t && t.branch === talent.branch;
        })
        .reduce((sum: number, [, v]) => sum + (v as number), 0);

      if (branchPoints < talent.requiredPoints) {
        res.status(400).json({
          success: false,
          message: `이 특성을 해금하려면 ${talent.branch} 계열에 ${talent.requiredPoints}포인트 이상 투자해야 합니다 (현재: ${branchPoints})`,
        });
        return;
      }

      if (!saveData.talentPoints) saveData.talentPoints = {};
      saveData.talentPoints[talentId] = currentLevel + 1;
      AuthService.saveProgress(saveCode, saveData);

      res.json({
        success: true,
        talentId,
        newLevel: saveData.talentPoints[talentId],
        saveData,
      });
    } catch (err) {
      console.error('[game/talent-invest]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /talent-reset ──────────────────────────────────────
router.post('/talent-reset', (req: Request, res: Response): void => {
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

    const RESET_COST = 10000;
    if (saveData.gold < RESET_COST) {
      res.status(400).json({ success: false, message: `골드가 부족합니다 (필요: ${RESET_COST.toLocaleString()})` });
      return;
    }

    saveData.gold -= RESET_COST;
    saveData.talentPoints = {};
    AuthService.saveProgress(saveCode, saveData);

    res.json({
      success: true,
      message: '특성 포인트가 초기화되었습니다.',
      saveData,
    });
  } catch (err) {
    console.error('[game/talent-reset]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /equip-title ───────────────────────────────────────
router.post(
  '/equip-title',
  validate([{ name: 'titleId', type: 'string', minLength: 0 }]),
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

      const { titleId } = req.body;

      // Allow unequipping (empty string)
      if (titleId === '') {
        saveData.equippedTitle = '';
        AuthService.saveProgress(saveCode, saveData);
        res.json({ success: true, saveData });
        return;
      }

      const title = TITLES.find((t) => t.id === titleId);
      if (!title) {
        res.status(404).json({ success: false, message: 'Title not found' });
        return;
      }

      // Check achievement requirement
      const achievements = saveData.achievements ?? [];
      if (!achievements.includes(title.requirement)) {
        res.status(400).json({ success: false, message: '칭호 해금 조건을 달성하지 못했습니다' });
        return;
      }

      saveData.equippedTitle = titleId;
      AuthService.saveProgress(saveCode, saveData);

      res.json({ success: true, saveData });
    } catch (err) {
      console.error('[game/equip-title]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
