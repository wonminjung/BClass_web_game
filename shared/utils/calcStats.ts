import type { SaveData } from '../types/auth';
import { CHARACTERS, ITEMS, SETS, GEMS, PETS, ARTIFACTS, TITLES, calculatePassiveTreeBonuses, PASSIVE_TREE } from '../data';

export interface KeystoneEffect {
  id: string;
  name: string;
  description: string;
  level: number;    // current investment count
  maxLevel: number; // max investment
  ratio: number;    // level / maxLevel (0~1)
}

export interface TotalStats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;       // 0~1 scale
  critDmg: number;    // multiplier (1.5 = 150%)
  bonusExp: number;   // percent
  bonusGold: number;  // percent
  bonusDrop: number;  // percent
  lifesteal: number;
  reflect: number;
  hpRegen: number;
  passiveSpecials: string[];
  keystoneEffects: KeystoneEffect[];  // active keystone/notable specials with ratio
}

/**
 * Calculate total combat stats from SaveData.
 *
 * Bonus application order:
 *   base+level → equipment+enhancement → gems → random options (flat)
 *   → set bonuses → prestige → passive tree → title → pet → artifact
 *   → random options (%) → proc effects
 *
 * critRate and critDamage from equipment are NOT multiplied by enhancement level.
 */
export function calculateTotalStats(saveData: SaveData): TotalStats {
  const character = CHARACTERS.find((c) => c.id === saveData.characterId);
  if (!character) {
    return {
      hp: 0, mp: 0, atk: 0, def: 0, spd: 0,
      crit: 0, critDmg: 1.5,
      bonusExp: 0, bonusGold: 0, bonusDrop: 0,
      lifesteal: 0, reflect: 0, hpRegen: 0,
      passiveSpecials: [], keystoneEffects: [],
    };
  }

  // ── 1. Base stats + level scaling ──
  const levelBonus = saveData.level - 1;
  let hp = character.baseStats.maxHp + levelBonus * 15;
  let mp = character.baseStats.maxMp + levelBonus * 5;
  let atk = character.baseStats.attack + levelBonus * 3;
  let def = character.baseStats.defense + levelBonus * 2;
  let spd = character.baseStats.speed + levelBonus * 1;
  let crit = character.baseStats.critRate;
  let critDmg = character.baseStats.critDamage;

  // ── 2. Equipment + enhancement ──
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  for (const id of equippedIds) {
    const item = ITEMS.find((i) => i.id === id);
    if (!item?.stats) continue;
    const mult = 1 + (saveData.enhanceLevels?.[id]?.level ?? 0);
    hp += (item.stats.hp ?? 0) * mult;
    mp += (item.stats.mp ?? 0) * mult;
    atk += (item.stats.attack ?? 0) * mult;
    def += (item.stats.defense ?? 0) * mult;
    spd += (item.stats.speed ?? 0) * mult;
    // critRate/critDamage NOT multiplied by enhancement
    crit += (item.stats.critRate ?? 0);
    critDmg += (item.stats.critDamage ?? 0);
  }

  // ── 3. Socketed gems ──
  for (const id of equippedIds) {
    for (const gemId of (saveData.socketedGems?.[id] ?? [])) {
      const gem = GEMS.find((g) => g.id === gemId);
      if (!gem) continue;
      if (gem.stat === 'attack') atk += gem.value;
      else if (gem.stat === 'defense') def += gem.value;
      else if (gem.stat === 'hp') hp += gem.value;
      else if (gem.stat === 'mp') mp += gem.value;
      else if (gem.stat === 'speed') spd += gem.value;
      else if (gem.stat === 'critRate') crit += gem.value;
      else if (gem.stat === 'critDamage') critDmg += gem.value;
    }
  }

  // ── 4. Random options (flat values collected now, % applied later) ──
  let randOptAtkPct = 0;
  let randOptHpPct = 0;
  let randOptGoldPct = 0;
  let randOptExpPct = 0;
  let lifesteal = 0;
  let reflect = 0;
  let hpRegen = 0;

  for (const id of equippedIds) {
    const opts = saveData.itemOptions?.[id] ?? [];
    for (const opt of opts) {
      switch (opt.stat) {
        case 'atk_flat': atk += opt.value; break;
        case 'atk_percent': randOptAtkPct += opt.value; break;
        case 'def_flat': def += opt.value; break;
        case 'hp_flat': hp += opt.value; break;
        case 'hp_percent': randOptHpPct += opt.value; break;
        case 'speed': spd += opt.value; break;
        case 'crit_rate': crit += opt.value / 100; break;
        case 'crit_damage': critDmg += opt.value / 100; break;
        case 'gold_percent': randOptGoldPct += opt.value; break;
        case 'exp_percent': randOptExpPct += opt.value; break;
        case 'lifesteal': lifesteal += opt.value; break;
        case 'reflect': reflect += opt.value; break;
        case 'hp_regen': hpRegen += opt.value; break;
      }
    }
  }

  // ── 5. Set bonuses ──
  for (const set of SETS) {
    const count = set.pieces.filter((p) => equippedIds.includes(p)).length;
    for (const b of set.bonuses) {
      if (count >= b.requiredCount && b.stats) {
        atk = Math.round(atk * (1 + (b.stats.atkPercent ?? 0) / 100));
        def = Math.round(def * (1 + (b.stats.defPercent ?? 0) / 100));
        hp = Math.round(hp * (1 + (b.stats.hpPercent ?? 0) / 100));
        mp = Math.round(mp * (1 + (b.stats.mpPercent ?? 0) / 100));
        crit += b.stats.critRateFlat ?? 0;
        critDmg *= (1 + (b.stats.critDmgPercent ?? 0) / 100);
      }
    }
  }

  // ── 6. Prestige ──
  const pBonus = 1 + (saveData.prestigeLevel ?? 0) * 0.02;
  hp = Math.round(hp * pBonus);
  mp = Math.round(mp * pBonus);
  atk = Math.round(atk * pBonus);
  def = Math.round(def * pBonus);

  // ── 6b. Prestige Blessing ──
  if (saveData.prestigeBlessingType === 'warrior') {
    atk = Math.round(atk * 1.05);
    def = Math.round(def * 1.05);
  }

  // ── 7. Passive Tree ──
  const passiveBonuses = calculatePassiveTreeBonuses(saveData.passiveTree?.allocatedNodes ?? []);
  atk = Math.round(atk * (1 + passiveBonuses.atkPercent / 100));
  def = Math.round(def * (1 + passiveBonuses.defPercent / 100));
  hp = Math.round(hp * (1 + passiveBonuses.hpPercent / 100));
  mp = Math.round(mp * (1 + passiveBonuses.mpPercent / 100));
  crit += passiveBonuses.critRateFlat;
  critDmg *= (1 + passiveBonuses.critDmgPercent / 100);

  // ── 8. Title ──
  if (saveData.equippedTitle) {
    const title = TITLES.find((t) => t.id === saveData.equippedTitle);
    if (title?.bonus) {
      if (title.bonus.stat === 'atkPercent') atk = Math.round(atk * (1 + title.bonus.value / 100));
      if (title.bonus.stat === 'defPercent') def = Math.round(def * (1 + title.bonus.value / 100));
      if (title.bonus.stat === 'hpPercent') hp = Math.round(hp * (1 + title.bonus.value / 100));
    }
  }

  // ── 9. Pet (with enhancement level scaling) ──
  if (saveData.activePet) {
    const pet = PETS.find((p) => p.id === saveData.activePet);
    if (pet) {
      const petLevel = saveData.petLevels?.[saveData.activePet] ?? 0;
      let petMult = 1 + petLevel * 0.1;
      // Guardian blessing doubles pet bonus
      if (saveData.prestigeBlessingType === 'guardian') petMult *= 2;
      for (const b of pet.bonus) {
        if (b.stat === 'atkPercent') atk = Math.round(atk * (1 + b.value * petMult / 100));
        if (b.stat === 'defPercent') def = Math.round(def * (1 + b.value * petMult / 100));
        if (b.stat === 'hpPercent') hp = Math.round(hp * (1 + b.value * petMult / 100));
        if (b.stat === 'mpPercent') mp = Math.round(mp * (1 + b.value * petMult / 100));
        if (b.stat === 'critRateFlat') crit += b.value * petMult;
      }
    }
  }

  // ── 10. Artifacts (sum first, apply once — matches server) ──
  const artBonuses: Record<string, number> = {};
  for (const art of ARTIFACTS) {
    const lv = (saveData.artifacts ?? {})[art.id] ?? 0;
    if (lv > 0) artBonuses[art.effectType] = (artBonuses[art.effectType] ?? 0) + art.effectPerLevel * lv;
  }
  const artAll = artBonuses['allPercent'] ?? 0;
  hp = Math.round(hp * (1 + (artAll + (artBonuses['hpPercent'] ?? 0)) / 100));
  mp = Math.round(mp * (1 + (artAll + (artBonuses['mpPercent'] ?? 0)) / 100));
  atk = Math.round(atk * (1 + (artAll + (artBonuses['atkPercent'] ?? 0)) / 100));
  def = Math.round(def * (1 + (artAll + (artBonuses['defPercent'] ?? 0)) / 100));

  // ── 11. Random option percent bonuses (applied last for combat stats) ──
  if (randOptAtkPct > 0) atk = Math.round(atk * (1 + randOptAtkPct / 100));
  if (randOptHpPct > 0) hp = Math.round(hp * (1 + randOptHpPct / 100));

  // ── 12. Bonus percentages (exp / gold / drop) ──
  const pLvl = saveData.prestigeLevel ?? 0;
  let bonusExp = pLvl * 10 + randOptExpPct;
  let bonusGold = pLvl * 5 + passiveBonuses.goldPercent + randOptGoldPct;
  let bonusDrop = pLvl * 1;

  // Prestige blessing bonuses
  if (saveData.prestigeBlessingType === 'sage') {
    bonusExp += 30;
  }
  if (saveData.prestigeBlessingType === 'plunderer') {
    bonusGold += 25;
    bonusDrop += 25;
  }

  bonusExp += artBonuses['expPercent'] ?? 0;
  bonusGold += artBonuses['goldPercent'] ?? 0;
  bonusDrop += artBonuses['dropRatePercent'] ?? 0;

  // ── 13. Passive tree special effects (with investment ratio) ──
  const MAX_BY_TYPE: Record<string, number> = { start: 1, minor: 3, notable: 10, keystone: 5 };
  const allocNodes = saveData.passiveTree?.allocatedNodes ?? [];
  const nodeCounts = new Map<string, number>();
  for (const nId of allocNodes) nodeCounts.set(nId, (nodeCounts.get(nId) ?? 0) + 1);

  const passiveSpecials: string[] = [];
  const keystoneEffects: KeystoneEffect[] = [];
  const seenIds = new Set<string>();
  for (const nId of allocNodes) {
    if (seenIds.has(nId)) continue;
    const node = PASSIVE_TREE.find((n: any) => n.id === nId);
    if (node?.effect?.special) {
      seenIds.add(nId);
      const count = nodeCounts.get(nId) ?? 0;
      const maxLv = MAX_BY_TYPE[node.type] ?? 1;
      const ratio = count / maxLv;
      passiveSpecials.push(`${node.name}: ${node.effect.description}`);
      keystoneEffects.push({
        id: node.effect.special,
        name: node.name,
        description: node.effect.description,
        level: count,
        maxLevel: maxLv,
        ratio,
      });
    }
  }

  return {
    hp, mp, atk, def, spd,
    crit, critDmg,
    bonusExp, bonusGold, bonusDrop,
    lifesteal, reflect, hpRegen,
    passiveSpecials, keystoneEffects,
  };
}

/**
 * Get active set bonus display info (for UI display in InventoryScreen).
 * Separated from calculateTotalStats because the UI needs set names/descriptions.
 */
export function getActiveSets(saveData: SaveData) {
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  const activeSets: { name: string; count: number; total: number; bonuses: { desc: string; active: boolean }[] }[] = [];
  for (const set of SETS) {
    const count = set.pieces.filter((p) => equippedIds.includes(p)).length;
    if (count === 0) continue;
    const bonuses = set.bonuses.map((b) => ({
      desc: `(${b.requiredCount}세트) ${b.description}`,
      active: count >= b.requiredCount,
    }));
    activeSets.push({ name: set.name, count, total: set.pieces.length, bonuses });
  }
  return activeSets;
}
