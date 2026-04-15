import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import { CHARACTERS, DUNGEONS, SKILLS, TALENTS, TITLES, ARTIFACTS } from '../../../shared/data';
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
      const maxLevel = saveData.level;
      const amount = Math.min(
        Math.max(1, Math.floor(Number(req.body.amount) || 1)),
        maxLevel - currentLevel,
      );

      if (amount <= 0) {
        res.status(400).json({ success: false, message: '이미 최대 레벨입니다' });
        return;
      }

      // Cost per level: 500 + level × 50 + level² × 0.5
      let totalCost = 0;
      for (let i = 0; i < amount; i++) {
        const lv = currentLevel + i;
        totalCost += 500 + lv * 50 + Math.floor(lv * lv * 0.5);
      }

      if (saveData.gold < totalCost) {
        // Calculate how many we CAN afford
        let affordable = 0;
        let partialCost = 0;
        for (let i = 0; i < amount; i++) {
          const c = 100 + (currentLevel + i) * 10;
          if (partialCost + c > saveData.gold) break;
          partialCost += c;
          affordable++;
        }
        if (affordable === 0) {
          res.status(400).json({ success: false, message: `골드가 부족합니다 (필요: ${(100 + currentLevel * 10).toLocaleString()})` });
          return;
        }
        // Apply what we can afford
        saveData.gold -= partialCost;
        saveData.skillLevels[skillId] = currentLevel + affordable;
        AuthService.saveProgress(saveCode, saveData);
        res.json({
          success: true,
          skillId,
          newLevel: saveData.skillLevels[skillId],
          goldSpent: partialCost,
          levelsGained: affordable,
          saveData,
        });
        return;
      }

      saveData.gold -= totalCost;
      saveData.skillLevels[skillId] = currentLevel + amount;
      AuthService.saveProgress(saveCode, saveData);

      res.json({
        success: true,
        skillId,
        newLevel: saveData.skillLevels[skillId],
        goldSpent: totalCost,
        levelsGained: amount,
        saveData,
      });
    } catch (err) {
      console.error('[game/skill-upgrade]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /prestige ──────────────────────────────────────────
const VALID_BLESSING_TYPES = ['warrior', 'sage', 'plunderer', 'guardian'] as const;
type BlessingType = typeof VALID_BLESSING_TYPES[number];

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

    // Validate blessing type
    const { blessingType } = req.body as { blessingType?: string };
    if (!blessingType || !VALID_BLESSING_TYPES.includes(blessingType as BlessingType)) {
      res.status(400).json({ success: false, message: '축복 유형을 선택해야 합니다' });
      return;
    }

    // Guardian blessing requires prestige >= 25
    if (blessingType === 'guardian' && (saveData.prestigeLevel ?? 0) < 25) {
      res.status(400).json({ success: false, message: '수호자의 축복은 환생 25회 이상에서 해금됩니다' });
      return;
    }

    // Check max level condition: 300 + prestigeLevel
    const maxLevel = 300 + (saveData.prestigeLevel ?? 0);
    if (saveData.level < maxLevel) {
      res.status(400).json({ success: false, message: `환생은 최대 레벨(${maxLevel})에 도달해야 합니다 (현재: ${saveData.level})` });
      return;
    }

    // Check trial boss cleared (skip if prestige >= 10 milestone)
    if ((saveData.prestigeLevel ?? 0) < 10 && !saveData.prestigeTrialCleared) {
      res.status(400).json({ success: false, message: '시련 보스를 먼저 처치해야 합니다' });
      return;
    }

    // Calculate artifact bonuses for prestige
    const arts = saveData.artifacts ?? {};
    const gemBoostPercent = (arts['art_gem'] ?? 0) * 10;       // 10% per level
    const levelKeepPercent = Math.min(50, (arts['art_level_keep'] ?? 0) * 2.5); // 2.5% per level, cap 50%
    const abyssKeepPercent = Math.min(50, (arts['art_abyss_keep'] ?? 0) * 2.5); // 2.5% per level, cap 50%
    const goldKeepPercent = Math.min(50, (arts['art_gold_keep'] ?? 0) * 2.5); // 2.5% per level, cap 50%

    // Calculate gem reward BEFORE resetting
    const currentLevel = saveData.level;
    const currentAbyssFloor = saveData.abyssFloor ?? 0;
    const abyssHighest = saveData.abyssHighest ?? 0;
    const newPrestige = (saveData.prestigeLevel ?? 0) + 1;

    const baseGems = 50 * newPrestige;
    const levelBonus = Math.max(0, currentLevel - 60) * 2;
    const abyssBonus = Math.floor(abyssHighest * 0.5);
    const rawGems = baseGems + levelBonus + abyssBonus;
    const totalGems = Math.round(rawGems * (1 + gemBoostPercent / 100));

    // Increment prestige
    saveData.prestigeLevel = newPrestige;
    saveData.gems += totalGems;

    // Apply blessing
    saveData.prestigeBlessingType = blessingType as BlessingType;
    saveData.prestigeTrialCleared = false;

    // Reset progression (with artifact keep bonuses)
    const keptLevel = Math.max(1, Math.floor(currentLevel * levelKeepPercent / 100));
    const keptAbyssFloor = Math.floor(currentAbyssFloor * abyssKeepPercent / 100);

    saveData.level = keptLevel;
    saveData.exp = 0;

    // Skill levels: warrior blessing keeps 20%
    if (blessingType === 'warrior' && saveData.skillLevels) {
      const keptSkills: Record<string, number> = {};
      for (const [skillId, level] of Object.entries(saveData.skillLevels)) {
        const kept = Math.floor(level * 0.2);
        if (kept > 0) keptSkills[skillId] = kept;
      }
      saveData.skillLevels = keptSkills;
    } else {
      saveData.skillLevels = {};
    }

    // Reset passive tree on prestige
    saveData.passiveTree = { allocatedNodes: [] };
    // Legacy talent reset (keep premium for backwards compat)
    const premTalentIds = new Set(TALENTS.filter((t: TalentNode) => t.premium).map((t: TalentNode) => t.id));
    const keptPremiumTalents: Record<string, number> = {};
    for (const [id, level] of Object.entries(saveData.talentPoints ?? {})) {
      if (premTalentIds.has(id)) keptPremiumTalents[id] = level;
    }
    saveData.talentPoints = keptPremiumTalents;
    saveData.abyssFloor = keptAbyssFloor;
    // Gold reset with keep percentage
    const currentGold = saveData.gold;
    saveData.gold = Math.floor(currentGold * goldKeepPercent / 100);

    // Apply milestone unlocks (once set, never unset)
    if (newPrestige >= 50) saveData.dualPetUnlocked = true;
    if (newPrestige >= 100) saveData.extraSkillSlot = true;
    if (newPrestige >= 200) saveData.critOverflow = true;

    // Keep: inventory, equippedItems, enhanceLevels, achievements, bestiary, dropHistory, gems, abyssHighest, artifacts

    AuthService.saveProgress(saveCode, saveData);

    const blessingLabels: Record<string, string> = {
      warrior: '전사의 유산',
      sage: '현자의 지혜',
      plunderer: '약탈자의 행운',
      guardian: '수호자의 축복',
    };

    const extraInfo = [];
    extraInfo.push(`축복: ${blessingLabels[blessingType]}`);
    if (gemBoostPercent > 0) extraInfo.push(`젬 부스트 +${gemBoostPercent}%`);
    if (keptLevel > 1) extraInfo.push(`레벨 유지 Lv.${keptLevel}`);
    if (keptAbyssFloor > 0) extraInfo.push(`심연 유지 ${keptAbyssFloor}층`);
    if (saveData.gold > 0) extraInfo.push(`골드 유지 ${saveData.gold.toLocaleString()}G (${goldKeepPercent}%)`);

    res.json({
      success: true,
      message: `환생 완료! 환생 Lv.${newPrestige} | 젬 +${totalGems} | ${extraInfo.join(', ')}`,
      saveData,
      gemBreakdown: { base: baseGems, level: levelBonus, abyss: abyssBonus, gemBoost: gemBoostPercent, total: totalGems },
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
      const currentLevel = tp[talentId] ?? 0;
      if (currentLevel >= talent.maxLevel) {
        res.status(400).json({ success: false, message: '이미 최대 레벨입니다' });
        return;
      }

      // Premium talents use gems instead of talent points
      if (talent.premium) {
        const PREMIUM_TALENT_GEM_COST = 50;
        if ((saveData.gems ?? 0) < PREMIUM_TALENT_GEM_COST) {
          res.status(400).json({ success: false, message: `젬이 부족합니다 (필요: ${PREMIUM_TALENT_GEM_COST})` });
          return;
        }
        saveData.gems -= PREMIUM_TALENT_GEM_COST;
      } else {
        const totalInvested = Object.values(tp)
          .reduce((sum: number, v: number) => sum + v, 0)
          - Object.entries(tp)
              .filter(([id]) => { const t2 = TALENTS.find((tt: TalentNode) => tt.id === id); return t2?.premium; })
              .reduce((sum: number, [, v]) => sum + (v as number), 0);
        const availablePoints = saveData.level - totalInvested;

        if (availablePoints <= 0) {
          res.status(400).json({ success: false, message: '사용 가능한 특성 포인트가 없습니다' });
          return;
        }

        // Check requiredPoints in this branch
        const branchPoints = Object.entries(tp)
          .filter(([id]) => {
            const t = TALENTS.find((tt: TalentNode) => tt.id === id);
            return t && t.branch === talent.branch && !t.premium;
          })
          .reduce((sum: number, [, v]) => sum + (v as number), 0);

        if (branchPoints < talent.requiredPoints) {
          res.status(400).json({
            success: false,
            message: `이 특성을 해금하려면 ${talent.branch} 계열에 ${talent.requiredPoints}포인트 이상 투자해야 합니다 (현재: ${branchPoints})`,
          });
          return;
        }
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
    // Preserve premium talent investments (paid with gems)
    const premiumTalentIds = new Set(TALENTS.filter((t: TalentNode) => t.premium).map((t: TalentNode) => t.id));
    const preservedPremium: Record<string, number> = {};
    for (const [id, level] of Object.entries(saveData.talentPoints ?? {})) {
      if (premiumTalentIds.has(id)) preservedPremium[id] = level;
    }
    saveData.talentPoints = preservedPremium;
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

// ── POST /artifact-upgrade ──────────────────────────────────
router.post(
  '/artifact-upgrade',
  validate([{ name: 'artifactId', type: 'string', minLength: 1 }]),
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
        res.status(401).json({ success: false, message: 'Invalid token' });
        return;
      }

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { artifactId } = req.body;
      const artifact = ARTIFACTS.find((a) => a.id === artifactId);
      if (!artifact) {
        res.status(400).json({ success: false, message: 'Artifact not found' });
        return;
      }

      if (!saveData.artifacts) saveData.artifacts = {};
      const currentLevel = saveData.artifacts[artifactId] ?? 0;

      if (currentLevel >= artifact.maxLevel) {
        res.status(400).json({ success: false, message: '이미 최대 레벨입니다' });
        return;
      }

      const cost = artifact.costPerLevel(currentLevel + 1);
      if ((saveData.gems ?? 0) < cost) {
        res.status(400).json({ success: false, message: `젬이 부족합니다 (필요: ${cost})` });
        return;
      }

      saveData.gems -= cost;
      saveData.artifacts[artifactId] = currentLevel + 1;

      AuthService.saveProgress(saveCode, saveData);
      res.json({
        success: true,
        artifactId,
        newLevel: currentLevel + 1,
        gemSpent: cost,
        saveData,
      });
    } catch (err) {
      console.error('[game/artifact-upgrade]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /buy-blessing ──────────────────────────────────────
const BLESSING_CONFIG: Record<string, { cost: number; durationMs: number; label: string }> = {
  exp_2x: { cost: 100, durationMs: 30 * 60 * 1000, label: '경험치 2배' },
  gold_2x: { cost: 100, durationMs: 30 * 60 * 1000, label: '골드 2배' },
  drop_2x: { cost: 100, durationMs: 30 * 60 * 1000, label: '드랍률 2배' },
};

router.post(
  '/buy-blessing',
  validate([{ name: 'blessingType', type: 'string', minLength: 1 }]),
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

      const { blessingType } = req.body;
      const config = BLESSING_CONFIG[blessingType];
      if (!config) {
        res.status(400).json({ success: false, message: 'Invalid blessing type' });
        return;
      }

      // Initialize blessings array if missing
      if (!saveData.blessings) saveData.blessings = [];

      // Check if already active
      const now = Date.now();
      const existing = saveData.blessings.find(
        (b) => b.type === blessingType && new Date(b.expiresAt).getTime() > now,
      );
      if (existing) {
        res.status(400).json({ success: false, message: `${config.label} 축복이 이미 활성 중입니다` });
        return;
      }

      if ((saveData.gems ?? 0) < config.cost) {
        res.status(400).json({ success: false, message: `젬이 부족합니다 (필요: ${config.cost})` });
        return;
      }

      saveData.gems -= config.cost;

      // Remove expired blessings of same type, then add new one
      saveData.blessings = saveData.blessings.filter(
        (b) => b.type !== blessingType || new Date(b.expiresAt).getTime() > now,
      );
      saveData.blessings.push({
        type: blessingType,
        expiresAt: new Date(now + config.durationMs).toISOString(),
      });

      AuthService.saveProgress(saveCode, saveData);
      res.json({
        success: true,
        message: `${config.label} 축복 활성화! (30분)`,
        saveData,
      });
    } catch (err) {
      console.error('[game/buy-blessing]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /equip-skills ─────────────────────────────────────
router.post(
  '/equip-skills',
  validate([{ name: 'skillIds', type: 'object' }]),
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

      const { skillIds } = req.body;
      if (!Array.isArray(skillIds)) {
        res.status(400).json({ success: false, message: 'skillIds must be an array' });
        return;
      }

      // Max slots: 5 normally, 6 if extraSkillSlot milestone unlocked
      const maxSlots = saveData.extraSkillSlot ? 6 : 5;
      if (skillIds.length > maxSlots) {
        res.status(400).json({ success: false, message: `최대 ${maxSlots}개의 스킬만 장착할 수 있습니다` });
        return;
      }

      // Validate each skill
      for (const sid of skillIds) {
        if (typeof sid !== 'string') {
          res.status(400).json({ success: false, message: 'Invalid skill ID' });
          return;
        }

        const skill = SKILLS.find((s) => s.id === sid);
        if (!skill) {
          res.status(400).json({ success: false, message: `스킬을 찾을 수 없습니다: ${sid}` });
          return;
        }

        // Must belong to character's class or be common
        if (skill.characterId !== saveData.characterId && skill.characterId !== 'common') {
          res.status(400).json({ success: false, message: `이 스킬은 현재 캐릭터의 스킬이 아닙니다: ${skill.name}` });
          return;
        }

        // Must be active type (passives auto-apply)
        if (skill.type !== 'active') {
          res.status(400).json({ success: false, message: `패시브 스킬은 장착할 수 없습니다: ${skill.name}` });
          return;
        }

        // Must be unlocked (unlockLevel <= saveData.level)
        const unlockLevel = skill.unlockLevel ?? 1;
        if (saveData.level < unlockLevel) {
          res.status(400).json({ success: false, message: `스킬이 아직 해금되지 않았습니다: ${skill.name} (Lv.${unlockLevel} 필요)` });
          return;
        }
      }

      // Check for duplicates
      const uniqueIds = new Set(skillIds);
      if (uniqueIds.size !== skillIds.length) {
        res.status(400).json({ success: false, message: '같은 스킬을 중복 장착할 수 없습니다' });
        return;
      }

      saveData.equippedSkills = skillIds;
      AuthService.saveProgress(saveCode, saveData);

      res.json({ success: true, saveData });
    } catch (err) {
      console.error('[game/equip-skills]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
