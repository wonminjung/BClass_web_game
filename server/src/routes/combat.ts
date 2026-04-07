import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import * as CombatService from '../services/CombatService';
import * as GameService from '../services/GameService';
import { MONSTERS } from '../../../shared/data';

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

/** 승리 시 보상을 saveData에 적용하고 저장 */
function applyVictoryRewards(saveCode: string, battleId: string) {
  const rewards = CombatService.calculateRewards(battleId);
  if (!rewards) return { rewards: null, levelUp: null };

  const saveData = AuthService.getSaveData(saveCode);
  if (!saveData) return { rewards: null, levelUp: null };

  // 경험치 & 레벨업
  const levelUp = GameService.gainExp(saveData, rewards.exp);

  // 골드
  saveData.gold += rewards.gold;

  // 아이템 드랍 → 인벤토리
  for (const drop of rewards.items) {
    GameService.addItem(saveData, drop.itemId, drop.quantity);
  }

  // 도감 업데이트 (처치한 몬스터)
  const battleState = CombatService.getBattle(battleId);
  if (battleState) {
    for (const enemy of battleState.enemies) {
      const monsterData = MONSTERS.find((m) => enemy.name.startsWith(m.name));
      if (monsterData) {
        GameService.addBestiaryEntry(saveData, monsterData.id);
      }
    }
  }

  // 서버에 저장
  AuthService.saveProgress(saveCode, saveData);

  // 전투 데이터 정리
  CombatService.removeBattle(battleId);

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
      });
    } catch (err) {
      console.error('[combat/start]', err);
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

      // 플레이어 액션 후 전투 종료 체크 (적 전멸)
      const endAfterPlayer = CombatService.checkBattleEnd(battleState);
      if (endAfterPlayer) {
        battleState.status = endAfterPlayer;

        if (endAfterPlayer === 'victory') {
          const { rewards, levelUp } = applyVictoryRewards(saveCode, battleId);
          const updatedSaveData = AuthService.getSaveData(saveCode);
          res.json({
            success: true,
            battleState,
            skillStates: CombatService.getSkillStates(battleId),
            rewards,
            levelUp,
            saveData: updatedSaveData,
          });
        } else {
          res.json({
            success: true,
            battleState,
            skillStates: CombatService.getSkillStates(battleId),
            rewards: null,
            levelUp: null,
            saveData: null,
          });
        }
        return;
      }

      // 적 턴 실행
      CombatService.executeEnemyTurn(battleState);

      // 적 턴 후 전투 종료 체크
      if (battleState.status === 'victory') {
        const { rewards, levelUp } = applyVictoryRewards(saveCode, battleId);
        const updatedSaveData = AuthService.getSaveData(saveCode);
        res.json({
          success: true,
          battleState,
          skillStates: CombatService.getSkillStates(battleId),
          rewards,
          levelUp,
          saveData: updatedSaveData,
        });
        return;
      }

      if (battleState.status === 'defeat') {
        CombatService.removeBattle(battleId);
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
      console.error('[combat/action]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
