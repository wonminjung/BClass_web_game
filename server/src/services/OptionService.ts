import type { RandomOption } from '../../../shared/types/item';

type RarityKey = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface OptionDef {
  stat: string;
  label: string;
  ranges: Partial<Record<RarityKey, [number, number]>>;
}

const OPTION_POOL: Record<string, OptionDef[]> = {
  offensive: [
    { stat: 'atk_flat', label: '공격력', ranges: { common: [5, 50], uncommon: [10, 100], rare: [20, 200], epic: [50, 500], legendary: [100, 1000] } },
    { stat: 'atk_percent', label: '공격력%', ranges: { common: [1, 3], uncommon: [2, 5], rare: [3, 8], epic: [5, 12], legendary: [8, 20] } },
    { stat: 'crit_rate', label: '크리율%', ranges: { common: [1, 2], uncommon: [1, 3], rare: [2, 5], epic: [3, 7], legendary: [5, 10] } },
    { stat: 'crit_damage', label: '크리뎀%', ranges: { common: [2, 5], uncommon: [3, 8], rare: [5, 12], epic: [8, 20], legendary: [10, 30] } },
  ],
  defensive: [
    { stat: 'def_flat', label: '방어력', ranges: { common: [5, 50], uncommon: [10, 100], rare: [20, 200], epic: [50, 500], legendary: [100, 1000] } },
    { stat: 'hp_flat', label: 'HP', ranges: { common: [10, 100], uncommon: [20, 200], rare: [50, 500], epic: [100, 1000], legendary: [200, 2000] } },
    { stat: 'hp_percent', label: 'HP%', ranges: { common: [1, 3], uncommon: [2, 5], rare: [3, 8], epic: [5, 12], legendary: [8, 20] } },
  ],
  utility: [
    { stat: 'gold_percent', label: '골드%', ranges: { common: [1, 3], uncommon: [2, 5], rare: [3, 8], epic: [5, 10], legendary: [5, 15] } },
    { stat: 'exp_percent', label: '경험치%', ranges: { common: [1, 3], uncommon: [2, 5], rare: [3, 8], epic: [5, 10], legendary: [5, 15] } },
    { stat: 'speed', label: '속도', ranges: { common: [1, 2], uncommon: [1, 3], rare: [2, 5], epic: [3, 7], legendary: [5, 10] } },
  ],
  special: [
    { stat: 'lifesteal', label: '흡혈%', ranges: { epic: [1, 3], legendary: [2, 5] } },
    { stat: 'reflect', label: '반사%', ranges: { epic: [2, 5], legendary: [3, 8] } },
    { stat: 'hp_regen', label: '턴HP회복%', ranges: { epic: [0.5, 1], legendary: [1, 2] } },
  ],
};

function getOptionCount(rarity: string): number {
  switch (rarity) {
    case 'common': return 1 + (Math.random() < 0.5 ? 1 : 0); // 1-2
    case 'uncommon': return 2;
    case 'rare': return 2 + (Math.random() < 0.5 ? 1 : 0); // 2-3
    case 'epic': return 3;
    case 'legendary': return 3 + (Math.random() < 0.5 ? 1 : 0); // 3-4
    default: return 1;
  }
}

function rollValue(min: number, max: number): number {
  const val = min + Math.random() * (max - min);
  return Math.round(val * 10) / 10;
}

export function generateOptions(rarity: string): RandomOption[] {
  const count = getOptionCount(rarity);
  const options: RandomOption[] = [];
  const usedStats = new Set<string>();

  // Build available pool
  const allOptions: OptionDef[] = [
    ...OPTION_POOL.offensive,
    ...OPTION_POOL.defensive,
    ...OPTION_POOL.utility,
  ];

  // Special options only for epic/legendary
  if (rarity === 'epic' || rarity === 'legendary') {
    allOptions.push(...OPTION_POOL.special);
  }

  // Filter by rarity (must have range for this rarity)
  const available = allOptions.filter((o) => o.ranges[rarity as RarityKey]);

  for (let i = 0; i < count && available.length > 0; i++) {
    const candidates = available.filter((o) => !usedStats.has(o.stat));
    if (candidates.length === 0) break;

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const range = picked.ranges[rarity as RarityKey];
    if (!range) continue;

    const [min, max] = range;
    const value = rollValue(min, max);

    options.push({ stat: picked.stat, value });
    usedStats.add(picked.stat);
  }

  return options;
}

/** Reroll cost based on item rarity */
export function getRerollCost(rarity: string): number {
  const costs: Record<string, number> = {
    common: 1000,
    uncommon: 5000,
    rare: 20000,
    epic: 100000,
    legendary: 500000,
  };
  return costs[rarity] ?? 10000;
}

/** Option stat label map for client display */
export const OPTION_LABELS: Record<string, string> = {
  atk_flat: '공격력',
  atk_percent: '공격력%',
  def_flat: '방어력',
  hp_flat: 'HP',
  hp_percent: 'HP%',
  crit_rate: '크리율%',
  crit_damage: '크리뎀%',
  gold_percent: '골드%',
  exp_percent: '경험치%',
  speed: '속도',
  lifesteal: '흡혈%',
  reflect: '반사%',
  hp_regen: '턴HP회복%',
};
