import { useCallback, useMemo } from 'react';
import { useCombatStore } from '@/stores/combatStore';
import { SKILLS } from '@shared/data';
import type { SkillState } from '@shared/types';

export function useCombat() {
  const battleState = useCombatStore((s) => s.battleState);
  const skillStates = useCombatStore((s) => s.skillStates);
  const battleLog = useCombatStore((s) => s.battleLog);
  const rewards = useCombatStore((s) => s.rewards);
  const levelUp = useCombatStore((s) => s.levelUp);
  const isAnimating = useCombatStore((s) => s.isAnimating);
  const error = useCombatStore((s) => s.error);
  const startBattleAction = useCombatStore((s) => s.startBattle);
  const startAbyssBattleAction = useCombatStore((s) => s.startAbyssBattle);
  const startWeeklyBossBattleAction = useCombatStore((s) => s.startWeeklyBossBattle);
  const useSkillAction = useCombatStore((s) => s.useSkill);
  const useAbyssSkillAction = useCombatStore((s) => s.useAbyssSkill);
  const useWeeklyBossSkillAction = useCombatStore((s) => s.useWeeklyBossSkill);
  const useBattleItemAction = useCombatStore((s) => s.useBattleItem);
  const resetBattleAction = useCombatStore((s) => s.resetBattle);
  const abyssFloor = useCombatStore((s) => s.abyssFloor);
  const abyssNextFloor = useCombatStore((s) => s.abyssNextFloor);
  const isAbyss = useCombatStore((s) => s.isAbyss);

  const startBattle = useCallback(
    (dungeonId: string) => startBattleAction(dungeonId),
    [startBattleAction],
  );

  const useSkill = useCallback(
    (skillId: string, targetId: string) => useSkillAction(skillId, targetId),
    [useSkillAction],
  );

  const resetBattle = useCallback(() => resetBattleAction(), [resetBattleAction]);

  const canUseSkill = useCallback(
    (skillId: string): boolean => {
      if (!battleState || battleState.status !== 'player_turn') return false;
      const skillData = SKILLS.find((s) => s.id === skillId);
      if (!skillData || skillData.type === 'passive') return false;

      const state = skillStates.find((ss) => ss.skillId === skillId);
      if (state && state.currentCooldown > 0) return false;

      if (battleState.player.currentMp < skillData.manaCost) return false;

      return true;
    },
    [battleState, skillStates],
  );

  const getSkillStates = useCallback((): SkillState[] => skillStates, [skillStates]);

  const isPlayerTurn = useMemo(
    () => battleState?.status === 'player_turn',
    [battleState],
  );

  const isVictory = useMemo(
    () => battleState?.status === 'victory',
    [battleState],
  );

  const isDefeat = useMemo(
    () => battleState?.status === 'defeat',
    [battleState],
  );

  const startAbyssBattle = useCallback(() => startAbyssBattleAction(), [startAbyssBattleAction]);
  const startWeeklyBossBattle = useCallback(() => startWeeklyBossBattleAction(), [startWeeklyBossBattleAction]);
  const startPrestigeTrialAction = useCombatStore((s) => s.startPrestigeTrialBattle);
  const usePrestigeTrialSkillAction = useCombatStore((s) => s.usePrestigeTrialSkill);
  const startPrestigeTrialBattle = useCallback(() => startPrestigeTrialAction(), [startPrestigeTrialAction]);
  const usePrestigeTrialSkill = useCallback((skillId: string, targetId: string) => usePrestigeTrialSkillAction(skillId, targetId), [usePrestigeTrialSkillAction]);
  const useBattleItem = useCallback(
    (itemId: string) => useBattleItemAction(itemId),
    [useBattleItemAction],
  );
  const useAbyssSkill = useCallback(
    (skillId: string, targetId: string) => useAbyssSkillAction(skillId, targetId),
    [useAbyssSkillAction],
  );
  const useWeeklyBossSkill = useCallback(
    (skillId: string, targetId: string) => useWeeklyBossSkillAction(skillId, targetId),
    [useWeeklyBossSkillAction],
  );

  return {
    battleState,
    battleLog,
    rewards,
    levelUp,
    isAnimating,
    error,
    isPlayerTurn,
    isVictory,
    isDefeat,
    startBattle,
    startAbyssBattle,
    startWeeklyBossBattle,
    startPrestigeTrialBattle,
    useSkill,
    useAbyssSkill,
    useWeeklyBossSkill,
    usePrestigeTrialSkill,
    useBattleItem,
    resetBattle,
    canUseSkill,
    getSkillStates,
    abyssFloor,
    abyssNextFloor,
    isAbyss,
  };
}
