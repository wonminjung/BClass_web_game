export interface TalentNode {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  branch: 'offense' | 'defense' | 'utility';
  effects: { stat: string; valuePerLevel: number }[];
  requiredPoints: number; // total points spent in this branch to unlock
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
}

export function calculateTalentBonuses(talentPoints: Record<string, number>): TalentBonuses {
  const bonuses: TalentBonuses = {
    atkPercent: 0,
    defPercent: 0,
    hpPercent: 0,
    mpPercent: 0,
    critRateFlat: 0,
    critDmgPercent: 0,
    hpRegenPercent: 0,
    mpRegenPercent: 0,
    goldPercent: 0,
  };

  for (const talent of TALENTS) {
    const invested = talentPoints[talent.id] ?? 0;
    if (invested <= 0) continue;
    for (const effect of talent.effects) {
      const key = effect.stat as keyof TalentBonuses;
      if (key in bonuses) {
        bonuses[key] += effect.valuePerLevel * invested;
      }
    }
  }

  return bonuses;
}
