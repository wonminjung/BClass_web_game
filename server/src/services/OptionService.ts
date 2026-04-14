import type { RandomOption } from '../../../shared/types/item';

type RarityKey = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface OptionDef {
  stat: string;
  label: string;
  ranges: Partial<Record<RarityKey, [number, number]>>;
}

const OPTION_POOL: Record<string, OptionDef[]> = {
  offensive: [
    { stat: 'atk_flat', label: '공격력', ranges: { common: [5, 50], uncommon: [10, 100], rare: [20, 200], epic: [50, 500], legendary: [100, 1000], mythic: [150, 1500] } },
    { stat: 'atk_percent', label: '공격력%', ranges: { common: [1, 3], uncommon: [2, 5], rare: [3, 8], epic: [5, 12], legendary: [8, 20], mythic: [10, 30] } },
    { stat: 'crit_rate', label: '크리율%', ranges: { common: [1, 2], uncommon: [1, 3], rare: [2, 5], epic: [3, 7], legendary: [5, 10], mythic: [7, 15] } },
    { stat: 'crit_damage', label: '크리뎀%', ranges: { common: [2, 5], uncommon: [3, 8], rare: [5, 12], epic: [8, 20], legendary: [10, 30], mythic: [15, 40] } },
  ],
  defensive: [
    { stat: 'def_flat', label: '방어력', ranges: { common: [5, 50], uncommon: [10, 100], rare: [20, 200], epic: [50, 500], legendary: [100, 1000], mythic: [150, 1500] } },
    { stat: 'hp_flat', label: 'HP', ranges: { common: [10, 100], uncommon: [20, 200], rare: [50, 500], epic: [100, 1000], legendary: [200, 2000], mythic: [300, 3000] } },
    { stat: 'hp_percent', label: 'HP%', ranges: { common: [1, 3], uncommon: [2, 5], rare: [3, 8], epic: [5, 12], legendary: [8, 20], mythic: [10, 30] } },
  ],
  utility: [
    { stat: 'gold_percent', label: '골드%', ranges: { common: [1, 3], uncommon: [2, 5], rare: [3, 8], epic: [5, 10], legendary: [5, 15], mythic: [8, 20] } },
    { stat: 'exp_percent', label: '경험치%', ranges: { common: [1, 3], uncommon: [2, 5], rare: [3, 8], epic: [5, 10], legendary: [5, 15], mythic: [8, 20] } },
    { stat: 'speed', label: '속도', ranges: { common: [1, 2], uncommon: [1, 3], rare: [2, 5], epic: [3, 7], legendary: [5, 10], mythic: [7, 15] } },
  ],
  special: [
    { stat: 'lifesteal', label: '흡혈%', ranges: { epic: [1, 3], legendary: [2, 5], mythic: [3, 8] } },
    { stat: 'reflect', label: '반사%', ranges: { epic: [2, 5], legendary: [3, 8], mythic: [5, 12] } },
    { stat: 'hp_regen', label: '턴HP회복%', ranges: { epic: [0.5, 1], legendary: [1, 2], mythic: [2, 4] } },
  ],
};

function getOptionCount(rarity: string): number {
  switch (rarity) {
    case 'common': return 1 + (Math.random() < 0.5 ? 1 : 0); // 1-2
    case 'uncommon': return 2;
    case 'rare': return 2 + (Math.random() < 0.5 ? 1 : 0); // 2-3
    case 'epic': return 3;
    case 'legendary': return 4;
    case 'mythic': return 5;
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

  // Special options only for epic/legendary/mythic
  if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') {
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
    mythic: 2000000,
  };
  return costs[rarity] ?? 10000;
}

/** Reroll with locked indices — locked options stay at their position, rest get rerolled */
export function rerollWithLocks(rarity: string, currentOptions: RandomOption[], lockedIndices: number[]): RandomOption[] {
  const lockedSet = new Set(lockedIndices);
  const usedStats = new Set<string>();

  // Collect locked stats
  for (const idx of lockedIndices) {
    if (idx >= 0 && idx < currentOptions.length) {
      usedStats.add(currentOptions[idx].stat);
    }
  }

  // Determine total option count
  const count = getOptionCount(rarity);

  // Build pool for new options
  const allOptions: OptionDef[] = [...OPTION_POOL.offensive, ...OPTION_POOL.defensive, ...OPTION_POOL.utility];
  if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') allOptions.push(...OPTION_POOL.special);

  // Generate new options for unlocked slots
  const newRolls: RandomOption[] = [];
  const needed = count - lockedSet.size;
  for (let i = 0; i < needed; i++) {
    const candidates = allOptions.filter((o) => o.ranges[rarity as RarityKey] && !usedStats.has(o.stat));
    if (candidates.length === 0) break;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const range = picked.ranges[rarity as RarityKey];
    if (!range) continue;
    newRolls.push({ stat: picked.stat, value: rollValue(range[0], range[1]) });
    usedStats.add(picked.stat);
  }

  // Build result: locked options keep position, unlocked get new values
  const result: RandomOption[] = [];
  let newIdx = 0;
  for (let i = 0; i < count; i++) {
    if (lockedSet.has(i) && i < currentOptions.length) {
      result.push(currentOptions[i]);
    } else if (newIdx < newRolls.length) {
      result.push(newRolls[newIdx++]);
    }
  }

  return result;
}

/** Get range [min, max] for a stat at given rarity */
export function getOptionRange(stat: string, rarity: string): [number, number] | null {
  const allOptions = [...OPTION_POOL.offensive, ...OPTION_POOL.defensive, ...OPTION_POOL.utility, ...OPTION_POOL.special];
  const def = allOptions.find((o) => o.stat === stat);
  if (!def) return null;
  return def.ranges[rarity as RarityKey] ?? null;
}

/** Get quality tier (0~100%) of a value within its range */
export function getOptionQuality(stat: string, rarity: string, value: number): number {
  const range = getOptionRange(stat, rarity);
  if (!range) return 50;
  const [min, max] = range;
  if (max === min) return 100;
  return Math.round(((value - min) / (max - min)) * 100);
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
