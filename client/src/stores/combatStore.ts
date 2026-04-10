import { create } from 'zustand';
import axios from 'axios';
import type { BattleState, BattleRewards, SkillState, SaveData } from '@shared/types';
import type { LevelUpResult } from './types';

export interface CombatActionResponse {
  success: boolean;
  battleState: BattleState;
  skillStates: SkillState[];
  rewards?: BattleRewards;
  levelUp?: LevelUpResult;
  saveData?: SaveData;
  message?: string;
}

interface CombatStoreState {
  battleState: BattleState | null;
  skillStates: SkillState[];
  battleLog: { turn: number; message: string; type: string }[];
  rewards: BattleRewards | null;
  levelUp: LevelUpResult | null;
  isAnimating: boolean;
  error: string | null;
  abyssFloor: number | null;
  abyssNextFloor: number | null;
  isAbyss: boolean;

  startBattle: (dungeonId: string) => Promise<void>;
  startAbyssBattle: () => Promise<void>;
  useSkill: (skillId: string, targetId: string) => Promise<CombatActionResponse | null>;
  useAbyssSkill: (skillId: string, targetId: string) => Promise<CombatActionResponse | null>;
  useBattleItem: (itemId: string) => Promise<CombatActionResponse | null>;
  resetBattle: () => void;
}

export const useCombatStore = create<CombatStoreState>((set, get) => ({
  battleState: null,
  skillStates: [],
  battleLog: [],
  rewards: null,
  levelUp: null,
  isAnimating: false,
  error: null,
  abyssFloor: null,
  abyssNextFloor: null,
  isAbyss: false,

  startBattle: async (dungeonId: string) => {
    set({ error: null, rewards: null, levelUp: null, battleLog: [] });
    try {
      const res = await axios.post<CombatActionResponse>('/api/combat/start', { dungeonId });
      if (res.data.success) {
        set({
          battleState: res.data.battleState,
          skillStates: res.data.skillStates ?? [],
          battleLog: res.data.battleState.log ?? [],
        });
      } else {
        set({ error: res.data.message ?? '전투를 시작할 수 없습니다.' });
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '전투를 시작할 수 없습니다.';
      set({ error: message });
    }
  },

  useSkill: async (skillId: string, targetId: string) => {
    const current = get().battleState;
    if (!current) return null;

    set({ isAnimating: true, error: null });
    try {
      const res = await axios.post<CombatActionResponse>('/api/combat/action', {
        battleId: current.id,
        skillId,
        targetId,
      });

      if (res.data.success) {
        set({
          battleState: res.data.battleState,
          skillStates: res.data.skillStates ?? [],
          battleLog: res.data.battleState.log ?? [],
          rewards: res.data.rewards ?? null,
          levelUp: res.data.levelUp ?? null,
          isAnimating: false,
        });
        return res.data;
      } else {
        set({ error: res.data.message ?? '행동을 수행할 수 없습니다.', isAnimating: false });
        return null;
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '행동을 수행할 수 없습니다.';
      set({ error: message, isAnimating: false });
      return null;
    }
  },

  useBattleItem: async (itemId: string) => {
    const current = get().battleState;
    if (!current) return null;

    set({ isAnimating: true, error: null });
    try {
      const res = await axios.post<CombatActionResponse>('/api/combat/use-item', {
        battleId: current.id,
        itemId,
      });

      if (res.data.success) {
        set({
          battleState: res.data.battleState,
          skillStates: res.data.skillStates ?? [],
          battleLog: res.data.battleState.log ?? [],
          isAnimating: false,
        });
        return res.data;
      } else {
        set({ error: res.data.message ?? '아이템을 사용할 수 없습니다.', isAnimating: false });
        return null;
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '아이템을 사용할 수 없습니다.';
      set({ error: message, isAnimating: false });
      return null;
    }
  },

  startAbyssBattle: async () => {
    set({ error: null, rewards: null, levelUp: null, battleLog: [], isAbyss: true });
    try {
      const res = await axios.post<CombatActionResponse & { floor?: number }>('/api/combat/abyss/start');
      if (res.data.success) {
        set({
          battleState: res.data.battleState,
          skillStates: res.data.skillStates ?? [],
          battleLog: res.data.battleState.log ?? [],
          abyssFloor: (res.data as any).floor ?? 0,
        });
      } else {
        set({ error: res.data.message ?? '전투를 시작할 수 없습니다.' });
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '전투를 시작할 수 없습니다.';
      set({ error: message });
    }
  },

  useAbyssSkill: async (skillId: string, targetId: string) => {
    const current = get().battleState;
    if (!current) return null;

    set({ isAnimating: true, error: null });
    try {
      const res = await axios.post<CombatActionResponse & { floor?: number; nextFloor?: number }>(
        '/api/combat/abyss/action',
        { battleId: current.id, skillId, targetId },
      );

      if (res.data.success) {
        set({
          battleState: res.data.battleState,
          skillStates: res.data.skillStates ?? [],
          battleLog: res.data.battleState.log ?? [],
          rewards: res.data.rewards ?? null,
          levelUp: res.data.levelUp ?? null,
          isAnimating: false,
          abyssFloor: (res.data as any).floor ?? get().abyssFloor,
          abyssNextFloor: (res.data as any).nextFloor ?? null,
        });
        return res.data;
      } else {
        set({ error: res.data.message ?? '행동을 수행할 수 없습니다.', isAnimating: false });
        return null;
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '행동을 수행할 수 없습니다.';
      set({ error: message, isAnimating: false });
      return null;
    }
  },

  resetBattle: () => {
    set({
      battleState: null,
      skillStates: [],
      battleLog: [],
      rewards: null,
      levelUp: null,
      isAnimating: false,
      error: null,
      abyssFloor: null,
      abyssNextFloor: null,
      isAbyss: false,
    });
  },
}));
