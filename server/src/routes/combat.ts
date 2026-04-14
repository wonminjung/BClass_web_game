import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import * as CombatService from '../services/CombatService';
import * as GameService from '../services/GameService';
import * as AchievementService from '../services/AchievementService';
import { MONSTERS, ITEMS, DUNGEONS } from '../../../shared/data';

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

/** 웨이브 클리어 보상 적용 (전투 데이터는 유지) */
function applyWaveRewards(saveCode: string, battleId: string, source?: string) {
  const saveData = AuthService.getSaveData(saveCode);
  if (!saveData) return { rewards: null, levelUp: null };

  const rewards = CombatService.calculateRewards(battleId, saveData.characterId);
  if (!rewards) return { rewards: null, levelUp: null };

  // Apply blessing bonuses
  const blessingNow = Date.now();
  const activeBlessings = (saveData.blessings ?? []).filter(b => new Date(b.expiresAt).getTime() > blessingNow);
  for (const b of activeBlessings) {
    if (b.type === 'exp_2x') rewards.exp = Math.round(rewards.exp * 2);
    if (b.type === 'gold_2x') rewards.gold = Math.round(rewards.gold * 2);
    if (b.type === 'drop_2x') {
      // Duplicate all item drops
      const extraItems = rewards.items.map(item => ({ ...item }));
      for (const extra of extraItems) {
        const existing = rewards.items.find(i => i.itemId === extra.itemId);
        if (existing) existing.quantity += extra.quantity;
        else rewards.items.push({ ...extra });
      }
    }
  }

  const levelUp = GameService.gainExp(saveData, rewards.exp);
  saveData.gold += rewards.gold;

  if (!saveData.dropHistory) saveData.dropHistory = [];
  for (const drop of rewards.items) {
    GameService.addItemSmart(saveData, drop.itemId, drop.quantity);
    // epic/legendary 드랍 히스토리 기록
    const itemDef = ITEMS.find((i: any) => i.id === drop.itemId);
    if (itemDef && (itemDef.rarity === 'epic' || itemDef.rarity === 'legendary')) {
      saveData.dropHistory.push({
        itemId: drop.itemId,
        source: source ?? '알 수 없음',
        date: new Date().toISOString(),
      });
    }
  }

  // Kill counting for achievements
  const battleState = CombatService.getBattle(battleId);
  if (battleState) {
    const deadEnemies = battleState.enemies.filter(e => !e.isAlive).length;
    if (!saveData.totalKills) saveData.totalKills = 0;
    saveData.totalKills += deadEnemies;
  }

  // 도감 업데이트 + 전투 로그에 보상 표시
  if (battleState) {
    for (const enemy of battleState.enemies) {
      const monsterData = MONSTERS.find((m) => m.id === enemy.monsterId);
      if (monsterData) {
        GameService.addBestiaryEntry(saveData, monsterData.id);
      }
    }

    // 보상 로그
    const logLines: string[] = [];
    if (rewards.exp > 0) logLines.push(`+${rewards.exp} EXP`);
    if (rewards.gold > 0) logLines.push(`+${rewards.gold} G`);
    for (const drop of rewards.items) {
      const itemDef = ITEMS.find((i: any) => i.id === drop.itemId);
      const name = itemDef?.name ?? drop.itemId;
      logLines.push(`획득: ${name} x${drop.quantity}`);
    }
    if (levelUp.levelsGained > 0) {
      logLines.push(`레벨 업! Lv.${levelUp.newLevel}`);
    }

    battleState.log.push({
      turn: battleState.turn,
      message: `--- 보상: ${logLines.join(' / ')} ---`,
      type: 'system',
    });
  }

  AchievementService.checkAchievements(saveData);
  AuthService.saveProgress(saveCode, saveData);
  return { rewards, levelUp };
}

// ── POST /start ──────────────────────────────────────────────
router.post(
  '/start',
  validate([
    { name: 'dungeonId', type: 'string', minLength: 1 },
    { name: 'waveIndex', type: 'number', min: 0, required: false },
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

      const dungeonId: string = req.body.dungeonId;
      const waveIndex: number = req.body.waveIndex ?? 0;

      const result = CombatService.initBattle(saveData, dungeonId, waveIndex);
      if ('error' in result) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      res.json({
        success: true,
        battleState: result.battleState,
        skillStates: result.skillStates,
        waveInfo: { current: result.waveIndex, total: result.totalWaves },
      });
    } catch (err) {
      console.error('[combat/start]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /use-item ──────────────────────────────────────────
router.post(
  '/use-item',
  validate([
    { name: 'battleId', type: 'string', minLength: 1 },
    { name: 'itemId', type: 'string', minLength: 1 },
  ]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = extractSaveCode(req, res);
      if (!saveCode) return;

      const { battleId, itemId } = req.body;

      const battleState = CombatService.getBattle(battleId);
      if (!battleState) {
        res.status(404).json({ success: false, message: 'Battle not found' });
        return;
      }

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const result = CombatService.useItemInBattle(battleState, itemId, saveData);
      if ('error' in result) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      // Enemy turn after item use
      CombatService.executeEnemyTurn(battleState);

      // Check defeat after enemy turn
      if (battleState.status === 'defeat') {
        CombatService.removeBattle(battleId);
      }

      // Save inventory change
      AuthService.saveProgress(saveCode, saveData);

      res.json({
        success: true,
        battleState,
        skillStates: CombatService.getSkillStates(battleId),
        rewards: null,
        levelUp: null,
        saveData,
      });
    } catch (err) {
      console.error('[combat/use-item]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /action ─────────────────────────────────────────────
router.post(
  '/action',
  validate([
    { name: 'battleId', type: 'string', minLength: 1 },
    { name: 'skillId', type: 'string', minLength: 1 },
    { name: 'targetId', type: 'string', minLength: 1 },
  ]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = extractSaveCode(req, res);
      if (!saveCode) return;

      const { battleId, skillId, targetId } = req.body;

      const battleState = CombatService.getBattle(battleId);
      if (!battleState) {
        res.status(404).json({ success: false, message: 'Battle not found' });
        return;
      }

      // 플레이어 액션 실행
      const playerResult = CombatService.executePlayerAction(battleState, skillId, targetId);
      if ('error' in playerResult) {
        res.status(400).json({ success: false, message: playerResult.error });
        return;
      }

      // 웨이브 클리어 공통 처리: 보상 지급 + 다음 웨이브 or 던전 클리어
      function handleWaveClear() {
        try {
          const isLast = CombatService.isLastWave(battleId);
          const battleDungeonId = CombatService.getBattleDungeonId(battleId) ?? '';
          const dungeonName = DUNGEONS.find((d) => d.id === battleDungeonId)?.name ?? battleDungeonId;
          const { rewards, levelUp } = applyWaveRewards(saveCode, battleId, dungeonName);

          if (!isLast) {
            CombatService.advanceWave(battleId);
          } else {
            // First clear bonus
            const sd = AuthService.getSaveData(saveCode);
            if (sd && !sd.clearedDungeons?.includes(battleDungeonId)) {
              if (!sd.clearedDungeons) sd.clearedDungeons = [];
              sd.clearedDungeons.push(battleDungeonId);
              const dungeonDef = DUNGEONS.find(d => d.id === battleDungeonId);
              const gemReward = dungeonDef ? Math.floor(dungeonDef.requiredLevel * 2) : 10;
              sd.gems += gemReward;
              if (battleState) {
                battleState.log.push({ turn: battleState.turn, message: `[첫 클리어 보너스] 젬 +${gemReward}!`, type: 'system' });
              }
              AuthService.saveProgress(saveCode, sd);
            }
            battleState.status = 'victory';
            CombatService.removeBattle(battleId);
          }

          const updatedSaveData = AuthService.getSaveData(saveCode);
          res.json({
            success: true,
            battleState,
            skillStates: CombatService.getSkillStates(battleId),
            rewards,
            levelUp,
            saveData: updatedSaveData,
            waveInfo: CombatService.getWaveInfo(battleId),
          });
        } catch (waveErr) {
          console.error('[combat/action] handleWaveClear error:', waveErr);
          // 에러 발생 시에도 battleState를 player_turn으로 복구
          battleState.status = 'player_turn';
          CombatService.advanceWave(battleId);
          res.json({
            success: true,
            battleState,
            skillStates: CombatService.getSkillStates(battleId),
            rewards: null, levelUp: null, saveData: null,
            waveInfo: CombatService.getWaveInfo(battleId),
          });
        }
      }

      // 플레이어 액션 후 전투 종료 체크 (적 전멸)
      const endAfterPlayer = CombatService.checkBattleEnd(battleState);
      if (endAfterPlayer) {
        if (endAfterPlayer === 'victory') {
          handleWaveClear();
        } else {
          battleState.status = endAfterPlayer;
          CombatService.removeBattle(battleId);
          res.json({
            success: true, battleState,
            skillStates: CombatService.getSkillStates(battleId),
            rewards: null, levelUp: null, saveData: null,
          });
        }
        return;
      }

      // 적 턴 실행
      CombatService.executeEnemyTurn(battleState);

      // 적 턴 후 전투 종료 체크
      const endAfterEnemy = CombatService.checkBattleEnd(battleState);
      if (endAfterEnemy === 'victory') {
        handleWaveClear();
        return;
      }

      if (endAfterEnemy === 'defeat') {
        battleState.status = 'defeat';
        CombatService.removeBattle(battleId);
      }

      res.json({
        success: true,
        battleState,
        skillStates: CombatService.getSkillStates(battleId),
        rewards: null,
        levelUp: null,
        saveData: null,
        waveInfo: CombatService.getWaveInfo(battleId),
      });
    } catch (err) {
      console.error('[combat/action]', err);
      // 에러 발생 시 battleState를 player_turn으로 복구 시도
      try {
        const bs = CombatService.getBattle(battleId);
        if (bs && bs.status === 'enemy_turn') {
          bs.status = 'player_turn';
        }
      } catch { /* ignore */ }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /abyss/start ────────────────────────────────────────
router.post('/abyss/start', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const result = CombatService.initAbyssBattle(saveData);
    if ('error' in result) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    res.json({
      success: true,
      battleState: result.battleState,
      skillStates: result.skillStates,
      floor: result.floor,
    });
  } catch (err) {
    console.error('[combat/abyss/start]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /abyss/action ──────────────────────────────────────
router.post(
  '/abyss/action',
  validate([
    { name: 'battleId', type: 'string', minLength: 1 },
    { name: 'skillId', type: 'string', minLength: 1 },
    { name: 'targetId', type: 'string', minLength: 1 },
  ]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = extractSaveCode(req, res);
      if (!saveCode) return;

      const { battleId, skillId, targetId } = req.body;

      const battleState = CombatService.getBattle(battleId);
      if (!battleState) {
        res.status(404).json({ success: false, message: 'Battle not found' });
        return;
      }

      // Player action
      const playerResult = CombatService.executePlayerAction(battleState, skillId, targetId);
      if ('error' in playerResult) {
        res.status(400).json({ success: false, message: playerResult.error });
        return;
      }

      const floor = CombatService.getAbyssFloor(battleId) ?? 0;

      // Check victory after player action
      const endAfterPlayer = CombatService.checkBattleEnd(battleState);
      if (endAfterPlayer) {
        battleState.status = endAfterPlayer;

        if (endAfterPlayer === 'victory') {
          const saveData = AuthService.getSaveData(saveCode)!;
          // Count abyss kills
          const abyssDeadEnemies = battleState.enemies.filter(e => !e.isAlive).length;
          if (!saveData.totalKills) saveData.totalKills = 0;
          saveData.totalKills += abyssDeadEnemies;

          const rewards = CombatService.calculateAbyssRewards(battleId, saveData.characterId);

          // Apply blessing bonuses
          if (rewards) {
            const abyssNow = Date.now();
            const abyssActiveBlessings = (saveData.blessings ?? []).filter(b => new Date(b.expiresAt).getTime() > abyssNow);
            for (const b of abyssActiveBlessings) {
              if (b.type === 'exp_2x') rewards.exp = Math.round(rewards.exp * 2);
              if (b.type === 'gold_2x') rewards.gold = Math.round(rewards.gold * 2);
            }
          }

          // Advance floor
          saveData.abyssFloor = floor + 1;
          if (saveData.abyssFloor > saveData.abyssHighest) {
            saveData.abyssHighest = saveData.abyssFloor;
          }

          // Abyss milestone bonus (every 50 floors)
          if (saveData.abyssFloor > 0 && saveData.abyssFloor % 50 === 0) {
            saveData.gems += 20;
            battleState.log.push({ turn: battleState.turn, message: `[심연 ${saveData.abyssFloor}층 돌파 보너스] 젬 +20!`, type: 'system' });
          }

          // Apply rewards
          if (rewards) {
            const levelUp = GameService.gainExp(saveData, rewards.exp);
            saveData.gold += rewards.gold;
            if (!saveData.dropHistory) saveData.dropHistory = [];
            const abyssSource = `심연의 나락 ${floor}층`;
            for (const drop of rewards.items) {
              GameService.addItemSmart(saveData, drop.itemId, drop.quantity);
              const itemDef = ITEMS.find((i: any) => i.id === drop.itemId);
              if (itemDef && (itemDef.rarity === 'epic' || itemDef.rarity === 'legendary')) {
                saveData.dropHistory.push({ itemId: drop.itemId, source: abyssSource, date: new Date().toISOString() });
              }
            }
            AchievementService.checkAchievements(saveData);
            AuthService.saveProgress(saveCode, saveData);
            CombatService.removeBattle(battleId);

            res.json({
              success: true,
              battleState,
              skillStates: [],
              rewards,
              levelUp,
              saveData,
              floor,
              nextFloor: saveData.abyssFloor,
            });
            return;
          }
        } else {
          // Defeat — set back 10 floors
          const saveData = AuthService.getSaveData(saveCode)!;
          saveData.abyssFloor = Math.max(0, floor - 10);
          AuthService.saveProgress(saveCode, saveData);
          CombatService.removeBattle(battleId);

          res.json({
            success: true,
            battleState,
            skillStates: [],
            rewards: null,
            levelUp: null,
            saveData,
            floor,
            nextFloor: saveData.abyssFloor,
          });
          return;
        }
      }

      // Enemy turn
      CombatService.executeEnemyTurn(battleState);

      // Check after enemy turn
      if (battleState.status === 'victory') {
        const saveData = AuthService.getSaveData(saveCode)!;
        // Count abyss kills (after enemy turn victory)
        const deadEnemies2 = battleState.enemies.filter(e => !e.isAlive).length;
        if (!saveData.totalKills) saveData.totalKills = 0;
        saveData.totalKills += deadEnemies2;

        const rewards = CombatService.calculateAbyssRewards(battleId, saveData.characterId);

        // Apply blessing bonuses
        if (rewards) {
          const abyssNow2 = Date.now();
          const abyssActiveBlessings2 = (saveData.blessings ?? []).filter(b => new Date(b.expiresAt).getTime() > abyssNow2);
          for (const b of abyssActiveBlessings2) {
            if (b.type === 'exp_2x') rewards.exp = Math.round(rewards.exp * 2);
            if (b.type === 'gold_2x') rewards.gold = Math.round(rewards.gold * 2);
          }
        }

        saveData.abyssFloor = floor + 1;
        if (saveData.abyssFloor > saveData.abyssHighest) {
          saveData.abyssHighest = saveData.abyssFloor;
        }

        // Abyss milestone bonus (every 50 floors)
        if (saveData.abyssFloor > 0 && saveData.abyssFloor % 50 === 0) {
          saveData.gems += 20;
          battleState.log.push({ turn: battleState.turn, message: `[심연 ${saveData.abyssFloor}층 돌파 보너스] 젬 +20!`, type: 'system' });
        }

        if (rewards) {
          const levelUp = GameService.gainExp(saveData, rewards.exp);
          saveData.gold += rewards.gold;
          for (const drop of rewards.items) {
            GameService.addItemSmart(saveData, drop.itemId, drop.quantity);
          }
          AchievementService.checkAchievements(saveData);
          AuthService.saveProgress(saveCode, saveData);
          CombatService.removeBattle(battleId);

          res.json({
            success: true, battleState,
            skillStates: [], rewards, levelUp, saveData,
            floor, nextFloor: saveData.abyssFloor,
          });
          return;
        }
      }

      if (battleState.status === 'defeat') {
        const saveData = AuthService.getSaveData(saveCode)!;
        saveData.abyssFloor = Math.max(0, floor - 10);
        AuthService.saveProgress(saveCode, saveData);
        CombatService.removeBattle(battleId);

        res.json({
          success: true, battleState,
          skillStates: [], rewards: null, levelUp: null, saveData,
          floor, nextFloor: saveData.abyssFloor,
        });
        return;
      }

      res.json({
        success: true,
        battleState,
        skillStates: CombatService.getSkillStates(battleId),
        rewards: null,
        levelUp: null,
        saveData: null,
        floor,
      });
    } catch (err) {
      console.error('[combat/abyss/action]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /weekly-boss/start ──────────────────────────────────
router.post('/weekly-boss/start', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const result = CombatService.initWeeklyBossBattle(saveData);
    if ('error' in result) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    // Mark attempt time
    saveData.lastWeeklyBoss = new Date().toISOString();
    AuthService.saveProgress(saveCode, saveData);

    res.json({
      success: true,
      battleState: result.battleState,
      skillStates: result.skillStates,
    });
  } catch (err) {
    console.error('[combat/weekly-boss/start]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /weekly-boss/action ────────────────────────────────
router.post(
  '/weekly-boss/action',
  validate([
    { name: 'battleId', type: 'string', minLength: 1 },
    { name: 'skillId', type: 'string', minLength: 1 },
    { name: 'targetId', type: 'string', minLength: 1 },
  ]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = extractSaveCode(req, res);
      if (!saveCode) return;

      const { battleId, skillId, targetId } = req.body;

      const battleState = CombatService.getBattle(battleId);
      if (!battleState) {
        res.status(404).json({ success: false, message: 'Battle not found' });
        return;
      }

      // Player action
      const playerResult = CombatService.executePlayerAction(battleState, skillId, targetId);
      if ('error' in playerResult) {
        res.status(400).json({ success: false, message: playerResult.error });
        return;
      }

      // Check victory after player action
      const endAfterPlayer = CombatService.checkBattleEnd(battleState);
      if (endAfterPlayer) {
        battleState.status = endAfterPlayer;

        if (endAfterPlayer === 'victory') {
          const saveData = AuthService.getSaveData(saveCode)!;

          // Count kills
          const deadEnemies = battleState.enemies.filter(e => !e.isAlive).length;
          if (!saveData.totalKills) saveData.totalKills = 0;
          saveData.totalKills += deadEnemies;

          const rewards = CombatService.calculateWeeklyBossRewards(battleId, saveData.characterId);

          if (rewards) {
            const levelUp = GameService.gainExp(saveData, rewards.exp);
            saveData.gold += rewards.gold;
            saveData.gems += 10; // Bonus gems

            if (!saveData.dropHistory) saveData.dropHistory = [];
            for (const drop of rewards.items) {
              GameService.addItemSmart(saveData, drop.itemId, drop.quantity);
              const itemDef = ITEMS.find((i: any) => i.id === drop.itemId);
              if (itemDef && (itemDef.rarity === 'epic' || itemDef.rarity === 'legendary')) {
                saveData.dropHistory.push({ itemId: drop.itemId, source: '주간 보스', date: new Date().toISOString() });
              }
            }

            // Bestiary update
            for (const enemy of battleState.enemies) {
              const monsterData = MONSTERS.find((m) => m.id === enemy.monsterId);
              if (monsterData) {
                GameService.addBestiaryEntry(saveData, monsterData.id);
              }
            }

            AchievementService.checkAchievements(saveData);
            AuthService.saveProgress(saveCode, saveData);
            CombatService.removeBattle(battleId);

            res.json({
              success: true,
              battleState,
              skillStates: [],
              rewards: { ...rewards, gems: 10 },
              levelUp,
              saveData,
            });
            return;
          }
        } else {
          // Defeat
          CombatService.removeBattle(battleId);
          res.json({
            success: true,
            battleState,
            skillStates: [],
            rewards: null,
            levelUp: null,
            saveData: null,
          });
          return;
        }
      }

      // Enemy turn
      CombatService.executeEnemyTurn(battleState);

      // Check after enemy turn
      const endAfterEnemy = CombatService.checkBattleEnd(battleState);
      if (endAfterEnemy === 'victory') {
        battleState.status = 'victory';
        const saveData = AuthService.getSaveData(saveCode)!;

        const deadEnemies2 = battleState.enemies.filter(e => !e.isAlive).length;
        if (!saveData.totalKills) saveData.totalKills = 0;
        saveData.totalKills += deadEnemies2;

        const rewards = CombatService.calculateWeeklyBossRewards(battleId, saveData.characterId);

        if (rewards) {
          const levelUp = GameService.gainExp(saveData, rewards.exp);
          saveData.gold += rewards.gold;
          saveData.gems += 10;

          for (const drop of rewards.items) {
            GameService.addItemSmart(saveData, drop.itemId, drop.quantity);
          }
          AchievementService.checkAchievements(saveData);
          AuthService.saveProgress(saveCode, saveData);
          CombatService.removeBattle(battleId);

          res.json({
            success: true,
            battleState,
            skillStates: [],
            rewards: { ...rewards, gems: 10 },
            levelUp,
            saveData,
          });
          return;
        }
      }

      if (endAfterEnemy === 'defeat') {
        battleState.status = 'defeat';
        CombatService.removeBattle(battleId);

        res.json({
          success: true,
          battleState,
          skillStates: [],
          rewards: null,
          levelUp: null,
          saveData: null,
        });
        return;
      }

      res.json({
        success: true,
        battleState,
        skillStates: CombatService.getSkillStates(battleId),
        rewards: null,
        levelUp: null,
        saveData: null,
      });
    } catch (err) {
      console.error('[combat/weekly-boss/action]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
