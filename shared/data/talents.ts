export interface TalentNode {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  branch: 'offense' | 'defense' | 'utility';
  effects: { stat: string; valuePerLevel: number }[];
  requiredPoints: number; // total points spent in this branch to unlock
  premium?: boolean; // gem-only talent
}

export const TALENTS: TalentNode[] = [
  // Offense branch
  { id: 'off_atk', name: '무력 강화', description: '공격력 +3% per level', maxLevel: 10, branch: 'offense', effects: [{ stat: 'atkPercent', valuePerLevel: 3 }], requiredPoints: 0 },
  { id: 'off_crit', name: '급소 공략', description: '치명타율 +1% per level', maxLevel: 10, branch: 'offense', effects: [{ stat: 'critRateFlat', valuePerLevel: 0.01 }], requiredPoints: 5 },
  { id: 'off_critdmg', name: '치명 강화', description: '치명타 피해 +5% per level', maxLevel: 5, branch: 'offense', effects: [{ stat: 'critDmgPercent', valuePerLevel: 5 }], requiredPoints: 10 },
  // Defense branch
  { id: 'def_hp', name: '체력 강화', description: 'HP +5% per level', maxLevel: 10, branch: 'defense', effects: [{ stat: 'hpPercent', valuePerLevel: 5 }], requiredPoints: 0 },
  { id: 'def_def', name: '방어 강화', description: '방어력 +3% per level', maxLevel: 10, branch: 'defense', effects: [{ stat: 'defPercent', valuePerLevel: 3 }], requiredPoints: 5 },
  { id: 'def_regen', name: '재생력', description: '턴당 HP 1% 회복 per level', maxLevel: 3, branch: 'defense', effects: [{ stat: 'hpRegenPercent', valuePerLevel: 1 }], requiredPoints: 10 },
  // Utility branch
  { id: 'util_mp', name: '마나 강화', description: 'MP +5% per level', maxLevel: 10, branch: 'utility', effects: [{ stat: 'mpPercent', valuePerLevel: 5 }], requiredPoints: 0 },
  { id: 'util_mpregen', name: '마나 재생', description: '턴당 MP +1% 추가 회복 per level', maxLevel: 5, branch: 'utility', effects: [{ stat: 'mpRegenPercent', valuePerLevel: 1 }], requiredPoints: 5 },
  { id: 'util_gold', name: '재물운', description: '골드 획득 +5% per level', maxLevel: 5, branch: 'utility', effects: [{ stat: 'goldPercent', valuePerLevel: 5 }], requiredPoints: 10 },
  // Premium talents (gem-only)
  { id: 'prem_damage', name: '파멸의 의지', description: '전체 데미지 +5% per level (젬 전용)', maxLevel: 20, branch: 'offense', effects: [{ stat: 'totalDmgPercent', valuePerLevel: 5 }], requiredPoints: 0, premium: true },
  { id: 'prem_reduction', name: '불멸의 육체', description: '전체 피해감소 +3% per level (젬 전용)', maxLevel: 20, branch: 'defense', effects: [{ stat: 'dmgReductionPercent', valuePerLevel: 3 }], requiredPoints: 0, premium: true },
  { id: 'prem_fortune', name: '운명의 축복', description: '경험치+골드+드랍 각 +2% per level (젬 전용)', maxLevel: 20, branch: 'utility', effects: [{ stat: 'fortunePercent', valuePerLevel: 2 }], requiredPoints: 0, premium: true },
];

export interface TalentBonuses {
  atkPercent: number;
  defPercent: number;
  hpPercent: number;
  mpPercent: number;
  critRateFlat: number;
  critDmgPercent: number;
  hpRegenPercent: number;
  mpRegenPercent: number;
  goldPercent: number;
  totalDmgPercent: number;
  dmgReductionPercent: number;
  fortunePercent: number;
}

/** @deprecated Use calculatePassiveTreeBonuses instead */
export function calculateTalentBonuses(_talentPoints: Record<string, number>): TalentBonuses {
  // Old talent system disabled — returns zeros
  return {
    atkPercent: 0, defPercent: 0, hpPercent: 0, mpPercent: 0,
    critRateFlat: 0, critDmgPercent: 0, hpRegenPercent: 0, mpRegenPercent: 0,
    goldPercent: 0, totalDmgPercent: 0, dmgReductionPercent: 0, fortunePercent: 0,
  };
}

import { PASSIVE_TREE } from './passiveTree';

/** Calculate bonuses from the new passive tree */
export function calculatePassiveTreeBonuses(allocatedNodes: string[]): TalentBonuses {

  const bonuses: TalentBonuses = {
    atkPercent: 0, defPercent: 0, hpPercent: 0, mpPercent: 0,
    critRateFlat: 0, critDmgPercent: 0, hpRegenPercent: 0, mpRegenPercent: 0,
    goldPercent: 0, totalDmgPercent: 0, dmgReductionPercent: 0, fortunePercent: 0,
  };

  const STAT_MAP: Record<string, keyof TalentBonuses> = {
    atkPercent: 'atkPercent',
    defPercent: 'defPercent',
    hpPercent: 'hpPercent',
    mpPercent: 'mpPercent',
    critRate: 'critRateFlat',
    critDamage: 'critDmgPercent',
    hpRegen: 'hpRegenPercent',
    manaRegen: 'mpRegenPercent',
    goldPercent: 'goldPercent',
    expPercent: 'fortunePercent',
    dropPercent: 'fortunePercent',
    skillDamage: 'totalDmgPercent',
    aoeDamage: 'totalDmgPercent',
    dotDamage: 'totalDmgPercent',
    spdFlat: 'atkPercent', // speed doesn't map perfectly, stored separately
    penetration: 'atkPercent',
    defIgnore: 'atkPercent',
    lifesteal: 'hpRegenPercent',
    reflect: 'dmgReductionPercent',
    cooldownReduce: 'mpRegenPercent',
  };

  // Build lookup
  const nodeMap = new Map<string, any>();
  for (const node of PASSIVE_TREE) nodeMap.set(node.id, node);

  // Stats that are stored as decimals (0.02 = 2%) but TalentBonuses uses integers (2 = 2%)
  const PERCENT_STATS = new Set(['atkPercent', 'defPercent', 'hpPercent', 'mpPercent', 'critDamage', 'hpRegen', 'manaRegen', 'goldPercent', 'expPercent', 'dropPercent', 'skillDamage', 'aoeDamage', 'dotDamage', 'lifesteal', 'reflect', 'penetration', 'defIgnore', 'cooldownReduce']);

  for (const nId of allocatedNodes) {
    const node = nodeMap.get(nId);
    if (!node?.effect?.stat || !node.effect.value) continue;
    const bonusKey = STAT_MAP[node.effect.stat];
    if (bonusKey) {
      // Convert decimal (0.02) to percent integer (2) for percent-based stats
      const val = PERCENT_STATS.has(node.effect.stat)
        ? node.effect.value * 100
        : node.effect.value;
      bonuses[bonusKey] += val;
    }
  }

  return bonuses;
}
