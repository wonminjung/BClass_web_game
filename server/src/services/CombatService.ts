import { v4 as uuidv4 } from 'uuid';
import type {
  BattleState,
  BattleFighter,
  BattleAction,
  BattleResult,
  BattleLogEntry,
  BattleRewards,
  ActiveStatusEffect,
  SkillState,
  SaveData,
} from '../../../shared/types';
import { CHARACTERS, SKILLS, MONSTERS, DUNGEONS, ITEMS, SETS, GEMS, PETS, TALENTS, calculateTalentBonuses, TITLES } from '../../../shared/data';
import type { SetBonus } from '../../../shared/data/sets';
import type { TalentBonuses } from '../../../shared/data/talents';
import { ARTIFACTS } from '../../../shared/data';

/** Calculate artifact bonuses from saveData */
function getArtifactBonuses(artifacts: Record<string, number> | undefined): Record<string, number> {
  const bonuses: Record<string, number> = {};
  if (!artifacts) return bonuses;
  for (const art of ARTIFACTS) {
    const level = artifacts[art.id] ?? 0;
    if (level > 0) {
      bonuses[art.effectType] = (bonuses[art.effectType] ?? 0) + art.effectPerLevel * level;
    }
  }
  return bonuses;
}

// ────────────────────────────────────────────────────────────
// Battle state store (keyed by battle id)
// ────────────────────────────────────────────────────────────
const battleStore = new Map<string, BattleState>();
const skillStateStore = new Map<string, SkillState[]>();
const battleDungeonMap = new Map<string, string>();
const battleCritMap = new Map<string, { critRate: number; critDamage: number }>();
const battleSetActiveMap = new Map<string, SetBonus['active'][]>();
const battlePrestigeMap = new Map<string, number>();
const battleArtifactMap = new Map<string, Record<string, number>>();
const battleSkillLevelMap = new Map<string, Record<string, number>>();
const battleTalentMap = new Map<string, TalentBonuses>();
const battleTitleMap = new Map<string, string>(); // battleId → equipped title ID
const battleRandomOptionMap = new Map<string, { goldPercent: number; expPercent: number; lifesteal: number; reflect: number; hpRegen: number }>();

/** Calculate random option stat bonuses from equipped items */
function calculateRandomOptionBonuses(saveData: SaveData): {
  atkFlat: number; atkPercent: number; defFlat: number; hpFlat: number; hpPercent: number;
  critRate: number; critDamage: number; speedFlat: number;
  goldPercent: number; expPercent: number; lifesteal: number; reflect: number; hpRegen: number;
} {
  const result = {
    atkFlat: 0, atkPercent: 0, defFlat: 0, hpFlat: 0, hpPercent: 0,
    critRate: 0, critDamage: 0, speedFlat: 0,
    goldPercent: 0, expPercent: 0, lifesteal: 0, reflect: 0, hpRegen: 0,
  };
  if (!saveData.itemOptions) return result;
  for (const slotItemId of Object.values(saveData.equippedItems)) {
    if (!slotItemId) continue;
    const opts = saveData.itemOptions[slotItemId] ?? [];
    for (const opt of opts) {
      switch (opt.stat) {
        case 'atk_flat': result.atkFlat += opt.value; break;
        case 'atk_percent': result.atkPercent += opt.value; break;
        case 'def_flat': result.defFlat += opt.value; break;
        case 'hp_flat': result.hpFlat += opt.value; break;
        case 'hp_percent': result.hpPercent += opt.value; break;
        case 'crit_rate': result.critRate += opt.value; break;
        case 'crit_damage': result.critDamage += opt.value; break;
        case 'speed': result.speedFlat += opt.value; break;
        case 'gold_percent': result.goldPercent += opt.value; break;
        case 'exp_percent': result.expPercent += opt.value; break;
        case 'lifesteal': result.lifesteal += opt.value; break;
        case 'reflect': result.reflect += opt.value; break;
        case 'hp_regen': result.hpRegen += opt.value; break;
      }
    }
  }
  return result;
}

/** Calculate active set bonuses from equipped items */
function calculateSetBonuses(equippedItemIds: string[]): { statMods: { atkPercent: number; defPercent: number; hpPercent: number; mpPercent: number; critRateFlat: number; critDmgPercent: number }; actives: SetBonus['active'][] } {
  const statMods = { atkPercent: 0, defPercent: 0, hpPercent: 0, mpPercent: 0, critRateFlat: 0, critDmgPercent: 0 };
  const actives: SetBonus['active'][] = [];

  for (const set of SETS) {
    const count = set.pieces.filter((p) => equippedItemIds.includes(p)).length;
    for (const bonus of set.bonuses) {
      if (count >= bonus.requiredCount) {
        if (bonus.stats) {
          statMods.atkPercent += bonus.stats.atkPercent ?? 0;
          statMods.defPercent += bonus.stats.defPercent ?? 0;
          statMods.hpPercent += bonus.stats.hpPercent ?? 0;
          statMods.mpPercent += bonus.stats.mpPercent ?? 0;
          statMods.critRateFlat += bonus.stats.critRateFlat ?? 0;
          statMods.critDmgPercent += bonus.stats.critDmgPercent ?? 0;
        }
        if (bonus.active) actives.push(bonus.active);
      }
    }
  }
  return { statMods, actives };
}
const battleWaveMap = new Map<string, { current: number; total: number; dungeonId: string; saveData: SaveData }>();

export function getBattle(id: string): BattleState | undefined {
  return battleStore.get(id);
}

export function getBattleDungeonId(battleId: string): string | undefined {
  return battleDungeonMap.get(battleId);
}

export function getSkillStates(battleId: string): SkillState[] {
  return skillStateStore.get(battleId) ?? [];
}

// ────────────────────────────────────────────────────────────
// initBattle
// ────────────────────────────────────────────────────────────

export function initBattle(
  saveData: SaveData,
  dungeonId: string,
  waveIndex: number,
): { battleState: BattleState; skillStates: SkillState[]; error?: never } | { error: string; battleState?: never; skillStates?: never } {
  const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
  if (!dungeon) return { error: 'Dungeon not found' };

  if (saveData.level < dungeon.requiredLevel) {
    return { error: `Required level: ${dungeon.requiredLevel}` };
  }

  if (waveIndex < 0 || waveIndex >= dungeon.waves.length) {
    return { error: 'Invalid wave index' };
  }

  const character = CHARACTERS.find((c) => c.id === saveData.characterId);
  if (!character) return { error: 'Character data not found' };

  // Build player fighter from base stats + level scaling + equipment
  const levelBonus = saveData.level - 1;
  let equipHp = 0, equipMp = 0, equipAtk = 0, equipDef = 0, equipSpd = 0;

  // Sum up equipped item stats with enhancement multiplier
  for (const slotItemId of Object.values(saveData.equippedItems)) {
    if (!slotItemId) continue;
    const itemDef = ITEMS.find((i) => i.id === slotItemId);
    if (!itemDef?.stats) continue;
    const enh = saveData.enhanceLevels?.[slotItemId];
    const mult = 1 + (enh?.level ?? 0);
    equipHp += (itemDef.stats.hp ?? 0) * mult;
    equipMp += (itemDef.stats.mp ?? 0) * mult;
    equipAtk += (itemDef.stats.attack ?? 0) * mult;
    equipDef += (itemDef.stats.defense ?? 0) * mult;
    equipSpd += (itemDef.stats.speed ?? 0) * mult;
  }

  // Add socketed gem stats
  for (const slotItemId of Object.values(saveData.equippedItems)) {
    if (!slotItemId) continue;
    const sockets = saveData.socketedGems?.[slotItemId] ?? [];
    for (const gemId of sockets) {
      const gem = GEMS.find((g) => g.id === gemId);
      if (!gem) continue;
      if (gem.stat === 'attack') equipAtk += gem.value;
      else if (gem.stat === 'defense') equipDef += gem.value;
      else if (gem.stat === 'hp') equipHp += gem.value;
      else if (gem.stat === 'mp') equipMp += gem.value;
      else if (gem.stat === 'speed') equipSpd += gem.value;
    }
  }

  // Random option bonuses (flat)
  const randOpts = calculateRandomOptionBonuses(saveData);
  equipAtk += randOpts.atkFlat;
  equipDef += randOpts.defFlat;
  equipHp += randOpts.hpFlat;
  equipSpd += randOpts.speedFlat;

  // Set bonuses (% based)
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  const { statMods, actives: setActives } = calculateSetBonuses(equippedIds);

  let baseHp = character.baseStats.maxHp + levelBonus * 15 + equipHp;
  let baseMp = character.baseStats.maxMp + levelBonus * 5 + equipMp;
  let baseAtk = character.baseStats.attack + levelBonus * 3 + equipAtk;
  let baseDef = character.baseStats.defense + levelBonus * 2 + equipDef;

  baseHp = Math.round(baseHp * (1 + statMods.hpPercent / 100));
  baseMp = Math.round(baseMp * (1 + statMods.mpPercent / 100));
  baseAtk = Math.round(baseAtk * (1 + statMods.atkPercent / 100));
  baseDef = Math.round(baseDef * (1 + statMods.defPercent / 100));

  // Prestige bonus
  const prestigeBonus = 1 + (saveData.prestigeLevel ?? 0) * 0.02;
  baseHp = Math.round(baseHp * prestigeBonus);
  baseMp = Math.round(baseMp * prestigeBonus);
  baseAtk = Math.round(baseAtk * prestigeBonus);
  baseDef = Math.round(baseDef * prestigeBonus);

  // Talent bonuses
  const talentMods = calculateTalentBonuses(saveData.talentPoints ?? {});
  baseHp = Math.round(baseHp * (1 + talentMods.hpPercent / 100));
  baseMp = Math.round(baseMp * (1 + talentMods.mpPercent / 100));
  baseAtk = Math.round(baseAtk * (1 + talentMods.atkPercent / 100));
  baseDef = Math.round(baseDef * (1 + talentMods.defPercent / 100));

  // Title bonus
  const equippedTitleId = saveData.equippedTitle ?? '';
  if (equippedTitleId) {
    const titleDef = TITLES.find((t) => t.id === equippedTitleId);
    if (titleDef?.bonus) {
      if (titleDef.bonus.stat === 'atkPercent') baseAtk = Math.round(baseAtk * (1 + titleDef.bonus.value / 100));
      if (titleDef.bonus.stat === 'defPercent') baseDef = Math.round(baseDef * (1 + titleDef.bonus.value / 100));
      if (titleDef.bonus.stat === 'hpPercent') baseHp = Math.round(baseHp * (1 + titleDef.bonus.value / 100));
      if (titleDef.bonus.stat === 'mpPercent') baseMp = Math.round(baseMp * (1 + titleDef.bonus.value / 100));
    }
  }

  // Pet bonus
  let petCritRateBonus = 0;
  if (saveData.activePet) {
    const pet = PETS.find((p) => p.id === saveData.activePet);
    if (pet) {
      for (const b of pet.bonus) {
        if (b.stat === 'atkPercent') baseAtk = Math.round(baseAtk * (1 + b.value / 100));
        if (b.stat === 'defPercent') baseDef = Math.round(baseDef * (1 + b.value / 100));
        if (b.stat === 'hpPercent') baseHp = Math.round(baseHp * (1 + b.value / 100));
        if (b.stat === 'mpPercent') baseMp = Math.round(baseMp * (1 + b.value / 100));
        if (b.stat === 'critRateFlat') petCritRateBonus += b.value;
      }
    }
  }

  // Artifact bonus
  const artBonuses = getArtifactBonuses(saveData.artifacts);
  baseHp = Math.round(baseHp * (1 + (artBonuses.hpPercent ?? 0) / 100));
  baseMp = Math.round(baseMp * (1 + (artBonuses.mpPercent ?? 0) / 100));
  baseAtk = Math.round(baseAtk * (1 + (artBonuses.atkPercent ?? 0) / 100));
  baseDef = Math.round(baseDef * (1 + (artBonuses.defPercent ?? 0) / 100));

  // Random option percent bonuses
  if (randOpts.atkPercent > 0) baseAtk = Math.round(baseAtk * (1 + randOpts.atkPercent / 100));
  if (randOpts.hpPercent > 0) baseHp = Math.round(baseHp * (1 + randOpts.hpPercent / 100));

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: baseHp,
    maxHp: baseHp,
    currentMp: baseMp,
    maxMp: baseMp,
    attack: baseAtk,
    defense: baseDef,
    speed: character.baseStats.speed + levelBonus * 1 + equipSpd,
    statusEffects: [],
    isAlive: true,
  };

  // Build enemy fighters from the wave definition
  const wave = dungeon.waves[waveIndex];
  const enemies: BattleFighter[] = [];
  let idx = 0;

  for (const entry of wave.monsters) {
    const monsterData = MONSTERS.find((m) => m.id === entry.monsterId);
    if (!monsterData) continue;

    for (let i = 0; i < entry.count; i++) {
      enemies.push({
        id: `enemy_${idx}`,
        name: `${monsterData.name}${entry.count > 1 ? ` ${String.fromCharCode(65 + i)}` : ''}`,
        monsterId: monsterData.id,
        currentHp: monsterData.stats.maxHp,
        maxHp: monsterData.stats.maxHp,
        currentMp: 0,
        maxMp: 0,
        attack: monsterData.stats.attack,
        defense: monsterData.stats.defense,
        speed: monsterData.stats.speed,
        statusEffects: [],
        isAlive: true,
      });
      idx++;
    }
  }

  const battleState: BattleState = {
    id: uuidv4(),
    status: 'player_turn',
    turn: 1,
    player,
    enemies,
    actionQueue: [],
    log: [{ turn: 1, message: `${dungeon.name} - Wave ${waveIndex + 1} 전투 시작!`, type: 'system' }],
    stats: { totalDamageDealt: 0, totalDamageTaken: 0, highestCrit: 0, turnsElapsed: 0, skillsUsed: 0 },
  };

  // Initialize skill states (all cooldowns at 0)
  const characterSkills = SKILLS.filter((s) => s.characterId === saveData.characterId || s.characterId === 'common');
  const skillStates: SkillState[] = characterSkills.map((s) => ({
    skillId: s.id,
    currentCooldown: 0,
    isAvailable: s.type === 'active',
  }));

  // Calculate crit stats including equipment bonuses
  let equipCritRate = 0, equipCritDmg = 0;
  for (const slotItemId of Object.values(saveData.equippedItems)) {
    if (!slotItemId) continue;
    const itemDef = ITEMS.find((i) => i.id === slotItemId);
    if (!itemDef?.stats) continue;
    const enh = saveData.enhanceLevels?.[slotItemId];
    const mult = 1 + (enh?.level ?? 0);
    equipCritRate += (itemDef.stats.critRate ?? 0) * mult;
    equipCritDmg += (itemDef.stats.critDamage ?? 0) * mult;
  }
  // Add socketed gem crit stats
  for (const slotItemId of Object.values(saveData.equippedItems)) {
    if (!slotItemId) continue;
    const sockets = saveData.socketedGems?.[slotItemId] ?? [];
    for (const gemId of sockets) {
      const gem = GEMS.find((g) => g.id === gemId);
      if (!gem) continue;
      if (gem.stat === 'critRate') equipCritRate += gem.value;
      else if (gem.stat === 'critDamage') equipCritDmg += gem.value;
    }
  }

  battleStore.set(battleState.id, battleState);
  skillStateStore.set(battleState.id, skillStates);
  battleDungeonMap.set(battleState.id, dungeonId);
  // Add random option crit bonuses
  equipCritRate += randOpts.critRate / 100;
  equipCritDmg += randOpts.critDamage / 100;

  battleStore.set(battleState.id, battleState);
  skillStateStore.set(battleState.id, skillStates);
  battleDungeonMap.set(battleState.id, dungeonId);
  battleCritMap.set(battleState.id, {
    critRate: character.baseStats.critRate + equipCritRate + statMods.critRateFlat + petCritRateBonus + talentMods.critRateFlat,
    critDamage: (character.baseStats.critDamage + equipCritDmg) * (1 + statMods.critDmgPercent / 100) * (1 + talentMods.critDmgPercent / 100),
  });
  battleSetActiveMap.set(battleState.id, setActives);
  battlePrestigeMap.set(battleState.id, saveData.prestigeLevel ?? 0);
  battleArtifactMap.set(battleState.id, getArtifactBonuses(saveData.artifacts));
  battleSkillLevelMap.set(battleState.id, { ...(saveData.skillLevels ?? {}) });
  battleTalentMap.set(battleState.id, talentMods);
  battleTitleMap.set(battleState.id, saveData.equippedTitle ?? '');
  battleRandomOptionMap.set(battleState.id, {
    goldPercent: randOpts.goldPercent,
    expPercent: randOpts.expPercent,
    lifesteal: randOpts.lifesteal,
    reflect: randOpts.reflect,
    hpRegen: randOpts.hpRegen,
  });
  battleWaveMap.set(battleState.id, {
    current: waveIndex,
    total: dungeon.waves.length,
    dungeonId,
    saveData: { ...saveData },
  });

  return { battleState, skillStates, waveIndex, totalWaves: dungeon.waves.length };
}

// ────────────────────────────────────────────────────────────
// calculateDamage
// ────────────────────────────────────────────────────────────

/** Get effective attack considering attack_up buffs */
function getEffectiveAttack(fighter: BattleFighter): number {
  let atk = fighter.attack;
  for (const eff of fighter.statusEffects) {
    if (eff.type === 'attack_up') atk += eff.value;
  }
  return atk;
}

/** Get effective defense considering defense_up buffs and shield */
function getEffectiveDefense(fighter: BattleFighter): number {
  let def = fighter.defense;
  for (const eff of fighter.statusEffects) {
    if (eff.type === 'defense_up') def += eff.value;
    if (eff.type === 'shield') def += eff.value;
  }
  return def;
}

export function calculateDamage(
  attackerAtk: number,
  defenderDef: number,
  multiplier: number,
  isCrit: boolean,
  critDamage: number = 1.5,
): number {
  const raw = attackerAtk * multiplier - defenderDef * 0.5;
  const afterCrit = raw * (isCrit ? critDamage : 1);
  return Math.max(1, Math.round(afterCrit));
}

// ────────────────────────────────────────────────────────────
// processStatusEffects
// ────────────────────────────────────────────────────────────

export function processStatusEffects(fighter: BattleFighter): BattleResult[] {
  const results: BattleResult[] = [];
  const remaining: ActiveStatusEffect[] = [];

  for (const effect of fighter.statusEffects) {
    let damage = 0;
    let heal = 0;

    switch (effect.type) {
      case 'poison':
      case 'burn':
      case 'bleed':
        damage = effect.value;
        fighter.currentHp = Math.max(0, fighter.currentHp - damage);
        break;
      case 'regen':
        heal = Math.round(fighter.maxHp * (effect.value / 100));
        fighter.currentHp = Math.min(fighter.maxHp, fighter.currentHp + heal);
        break;
      default:
        break;
    }

    if (damage > 0 || heal > 0) {
      results.push({
        actionType: 'status_tick',
        actorId: fighter.id,
        targetId: fighter.id,
        damage,
        heal,
        isCritical: false,
        statusApplied: effect.type,
        targetDefeated: fighter.currentHp <= 0,
      });
    }

    effect.remainingTurns -= 1;
    if (effect.remainingTurns > 0) {
      remaining.push(effect);
    }
  }

  fighter.statusEffects = remaining;
  fighter.isAlive = fighter.currentHp > 0;

  return results;
}

// ────────────────────────────────────────────────────────────
// executePlayerAction  (accepts flat skillId + targetId)
// ────────────────────────────────────────────────────────────

export function executePlayerAction(
  battleState: BattleState,
  skillId: string,
  targetId: string,
): { results: BattleResult[]; error?: never } | { error: string; results?: never } {
  if (battleState.status !== 'player_turn') {
    return { error: 'Not player turn' };
  }

  const { player } = battleState;
  if (!player.isAlive) return { error: 'Player is defeated' };

  // Check stun — skip turn but return as success so client knows
  if (player.statusEffects.some((e) => e.type === 'stun')) {
    player.statusEffects = player.statusEffects.filter((e) => e.type !== 'stun');
    battleState.log.push({ turn: battleState.turn, message: `[기절] ${player.name}은(는) 기절에서 벗어났다! (이번 턴 행동 불가)`, type: 'debuff' });
    battleState.status = 'enemy_turn';
    return { results: [] };
  }

  const skill = SKILLS.find((s) => s.id === skillId);
  if (!skill) return { error: 'Skill not found' };

  // Mana check
  if (player.currentMp < skill.manaCost) {
    return { error: 'MP가 부족합니다' };
  }

  // Cooldown check
  const ssArr = skillStateStore.get(battleState.id);
  const skillState = ssArr?.find((ss) => ss.skillId === skillId);
  if (skillState && skillState.currentCooldown > 0) {
    return { error: `쿨타임 ${skillState.currentCooldown}턴 남음` };
  }

  // Deduct mana
  player.currentMp -= skill.manaCost;

  // Set cooldown for used skill
  if (skillState && skill.cooldown > 0) {
    skillState.currentCooldown = skill.cooldown;
  }

  // Resolve crit stats (base + equipment, stored at battle init)
  const critStats = battleCritMap.get(battleState.id);
  const baseCritRate = critStats?.critRate ?? 0.1;
  const baseCritDmg = critStats?.critDamage ?? 1.5;

  // Determine targets
  let targets: BattleFighter[] = [];
  if (skill.targetType === 'single_enemy') {
    const target = battleState.enemies.find((e) => e.id === targetId && e.isAlive);
    if (!target) return { error: '대상을 찾을 수 없습니다' };
    targets = [target];
  } else if (skill.targetType === 'all_enemies') {
    targets = battleState.enemies.filter((e) => e.isAlive);
  } else {
    targets = [player];
  }

  const results: BattleResult[] = [];

  // Track skill usage
  if (battleState.stats) {
    battleState.stats.skillsUsed += 1;
  }

  for (const target of targets) {
    const isCrit = Math.random() < baseCritRate;
    let damage = 0;
    let heal = 0;

    // Damage (with buff effects + skill level bonus)
    if (skill.damageMultiplier > 0 && target.id !== 'player') {
      const skillLevel = battleSkillLevelMap.get(battleState.id)?.[skillId] ?? 0;
      const effectiveMultiplier = skill.damageMultiplier * (1 + skillLevel * 0.05);
      damage = calculateDamage(getEffectiveAttack(player), getEffectiveDefense(target), effectiveMultiplier, isCrit, baseCritDmg);

      // Set active: bonus_damage (추가 피해)
      const setActives = battleSetActiveMap.get(battleState.id) ?? [];
      for (const sa of setActives) {
        if (sa && sa.type === 'bonus_damage' && Math.random() < (sa.chance ?? 0)) {
          const bonusDmg = Math.round(damage * sa.value / 100);
          damage += bonusDmg;
          battleState.log.push({ turn: battleState.turn, message: `[세트 효과] 추가 피해 ${bonusDmg}!`, type: 'buff' });
        }
      }

      target.currentHp = Math.max(0, target.currentHp - damage);
      target.isAlive = target.currentHp > 0;

      // Track battle stats
      if (battleState.stats && damage > 0) {
        battleState.stats.totalDamageDealt += damage;
        if (isCrit && damage > battleState.stats.highestCrit) {
          battleState.stats.highestCrit = damage;
        }
      }

      // Set active: lifesteal_on_crit (크리 흡혈)
      if (isCrit) {
        for (const sa of setActives) {
          if (sa && sa.type === 'lifesteal_on_crit') {
            const stolen = Math.round(damage * sa.value / 100);
            player.currentHp = Math.min(player.maxHp, player.currentHp + stolen);
            battleState.log.push({ turn: battleState.turn, message: `[세트 효과] 생명력 ${stolen} 흡수!`, type: 'heal' });
          }
        }
      }
    }

    // Heal
    if (skill.healMultiplier > 0) {
      heal = Math.round(player.attack * skill.healMultiplier);
      player.currentHp = Math.min(player.maxHp, player.currentHp + heal);
    }

    // Status effect
    let statusApplied: string | null = null;
    if (skill.statusEffect) {
      const activeEffect: ActiveStatusEffect = {
        type: skill.statusEffect.type,
        remainingTurns: skill.statusEffect.duration,
        value: skill.statusEffect.value,
      };
      const buffTypes = ['attack_up', 'defense_up', 'regen', 'shield'];
      if (buffTypes.includes(skill.statusEffect.type)) {
        player.statusEffects.push(activeEffect);
      } else if (target.id !== 'player') {
        target.statusEffects.push(activeEffect);
      }
      statusApplied = skill.statusEffect.type;
    }

    results.push({
      actionType: 'skill',
      actorId: player.id,
      targetId: target.id,
      damage,
      heal,
      isCritical: isCrit,
      statusApplied,
      targetDefeated: !target.isAlive,
    });

    // Log
    if (damage > 0) {
      const critText = isCrit ? ' (치명타!)' : '';
      battleState.log.push({
        turn: battleState.turn,
        message: `${player.name}의 ${skill.name} → ${target.name}에게 ${damage} 데미지${critText}`,
        type: 'damage',
      });
    }
    if (heal > 0) {
      battleState.log.push({
        turn: battleState.turn,
        message: `${player.name}이(가) HP ${heal} 회복`,
        type: 'heal',
      });
    }
    if (statusApplied) {
      battleState.log.push({
        turn: battleState.turn,
        message: `${statusApplied} 효과 적용!`,
        type: statusApplied.includes('up') || statusApplied === 'regen' || statusApplied === 'shield' ? 'buff' : 'debuff',
      });
    }
    if (!target.isAlive) {
      battleState.log.push({
        turn: battleState.turn,
        message: `${target.name} 처치!`,
        type: 'defeat',
      });
    }
  }

  // Advance to enemy turn
  battleState.status = 'enemy_turn';
  return { results };
}

// ────────────────────────────────────────────────────────────
// executeEnemyTurn
// ────────────────────────────────────────────────────────────

export function executeEnemyTurn(battleState: BattleState): BattleResult[] {
  if (battleState.status !== 'enemy_turn') return [];

  const results: BattleResult[] = [];
  const { player } = battleState;

  // Sort enemies by speed (fastest acts first)
  const sortedEnemies = [...battleState.enemies].sort((a, b) => b.speed - a.speed);

  for (const enemy of sortedEnemies) {
    if (!enemy.isAlive) continue;
    if (!player.isAlive) break;

    // Status ticks for this enemy
    const tickResults = processStatusEffects(enemy);
    results.push(...tickResults);
    if (!enemy.isAlive) {
      battleState.log.push({
        turn: battleState.turn,
        message: `${enemy.name}이(가) 상태이상으로 쓰러졌다!`,
        type: 'defeat',
      });
      continue;
    }

    // Stun check
    if (enemy.statusEffects.some((e) => e.type === 'stun')) {
      enemy.statusEffects = enemy.statusEffects.filter((e) => e.type !== 'stun');
      battleState.log.push({
        turn: battleState.turn,
        message: `${enemy.name}은(는) 기절 상태!`,
        type: 'system',
      });
      continue;
    }

    // Find monster data
    const monsterData = MONSTERS.find((m) => m.id === enemy.monsterId);
    if (!monsterData || monsterData.skills.length === 0) continue;

    // Weighted random skill
    const totalWeight = monsterData.skills.reduce((s, sk) => s + sk.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = monsterData.skills[0];
    for (const sk of monsterData.skills) {
      roll -= sk.weight;
      if (roll <= 0) {
        chosen = sk;
        break;
      }
    }

    const damage = calculateDamage(getEffectiveAttack(enemy), getEffectiveDefense(player), chosen.damageMultiplier, false);
    player.currentHp = Math.max(0, player.currentHp - damage);
    player.isAlive = player.currentHp > 0;

    // Track damage taken
    if (battleState.stats && damage > 0) {
      battleState.stats.totalDamageTaken += damage;
    }

    // Set active: reflect (피해 반사)
    if (damage > 0 && player.isAlive) {
      const setActives = battleSetActiveMap.get(battleState.id) ?? [];
      for (const sa of setActives) {
        if (sa && sa.type === 'reflect' && Math.random() < (sa.chance ?? 0)) {
          const reflected = Math.round(damage * sa.value / 100);
          enemy.currentHp = Math.max(0, enemy.currentHp - reflected);
          enemy.isAlive = enemy.currentHp > 0;
          battleState.log.push({ turn: battleState.turn, message: `[세트 효과] 피해 ${reflected} 반사!`, type: 'buff' });
        }
      }
    }

    let statusApplied: string | null = null;
    if (chosen.statusEffect) {
      player.statusEffects.push({
        type: chosen.statusEffect.type,
        remainingTurns: chosen.statusEffect.duration,
        value: chosen.statusEffect.value,
      });
      statusApplied = chosen.statusEffect.type;
    }

    results.push({
      actionType: 'skill',
      actorId: enemy.id,
      targetId: player.id,
      damage,
      heal: 0,
      isCritical: false,
      statusApplied,
      targetDefeated: !player.isAlive,
    });

    battleState.log.push({
      turn: battleState.turn,
      message: `${enemy.name}의 ${chosen.name} → ${player.name}에게 ${damage} 데미지`,
      type: 'damage',
    });

    if (!player.isAlive) {
      battleState.log.push({
        turn: battleState.turn,
        message: `${player.name}이(가) 쓰러졌다...`,
        type: 'defeat',
      });
    }
  }

  // Player status ticks
  if (player.isAlive) {
    const playerTicks = processStatusEffects(player);
    results.push(...playerTicks);
  }

  // Decrement skill cooldowns at end of full turn
  const ssArr = skillStateStore.get(battleState.id);
  if (ssArr) {
    for (const ss of ssArr) {
      if (ss.currentCooldown > 0) ss.currentCooldown -= 1;
    }
  }

  // MP natural recovery (3% of max per turn) + set active bonuses + talent bonuses
  if (player.isAlive) {
    const setActives = battleSetActiveMap.get(battleState.id) ?? [];
    const talentBonuses = battleTalentMap.get(battleState.id);
    let bonusHpRegen = 0;
    let bonusMpRegen = 0;
    for (const sa of setActives) {
      if (sa?.type === 'hp_regen_per_turn') bonusHpRegen += sa.value;
      if (sa?.type === 'mp_regen_per_turn') bonusMpRegen += sa.value;
    }
    // Add talent regen bonuses
    if (talentBonuses) {
      bonusHpRegen += talentBonuses.hpRegenPercent;
      bonusMpRegen += talentBonuses.mpRegenPercent;
    }

    // HP regen from set + talents
    if (bonusHpRegen > 0) {
      const hpHeal = Math.max(1, Math.floor(player.maxHp * bonusHpRegen / 100));
      const hpBefore = player.currentHp;
      player.currentHp = Math.min(player.maxHp, player.currentHp + hpHeal);
      if (player.currentHp > hpBefore) {
        battleState.log.push({ turn: battleState.turn, message: `[세트 효과] HP ${player.currentHp - hpBefore} 회복`, type: 'heal' });
      }
    }

    // MP recovery (base 3% + set bonus)
    const mpPercent = 3 + bonusMpRegen;
    const mpRecovery = Math.max(1, Math.floor(player.maxMp * mpPercent / 100));
    const before = player.currentMp;
    player.currentMp = Math.min(player.maxMp, player.currentMp + mpRecovery);
    if (player.currentMp > before) {
      battleState.log.push({
        turn: battleState.turn,
        message: `MP가 ${player.currentMp - before} 회복되었다. (${player.currentMp}/${player.maxMp})`,
        type: 'heal',
      });
    }
  }

  // Advance turn
  battleState.turn += 1;
  battleState.status = 'player_turn';

  // Track turns elapsed
  if (battleState.stats) {
    battleState.stats.turnsElapsed += 1;
  }

  // Check battle end
  const endStatus = checkBattleEnd(battleState);
  if (endStatus) {
    battleState.status = endStatus;
  }

  battleStore.set(battleState.id, battleState);
  return results;
}

// ────────────────────────────────────────────────────────────
// checkBattleEnd
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// useItemInBattle — 전투 중 소비 아이템 사용 (턴 소모)
// ────────────────────────────────────────────────────────────

export function useItemInBattle(
  battleState: BattleState,
  itemId: string,
  saveData: SaveData,
): { results: BattleResult[]; error?: never } | { error: string } {
  const player = battleState.player;
  if (!player.isAlive) return { error: '이미 쓰러진 상태입니다' };
  if (battleState.status !== 'player_turn') return { error: '당신의 턴이 아닙니다' };

  const itemDef = ITEMS.find((i) => i.id === itemId);
  if (!itemDef) return { error: '아이템을 찾을 수 없습니다' };
  if (itemDef.type !== 'consumable') return { error: '소비 아이템만 사용할 수 있습니다' };
  if (!itemDef.useEffect) return { error: '사용 효과가 없는 아이템입니다' };

  // Check inventory
  const slot = saveData.inventory.find((s) => s.itemId === itemId);
  if (!slot || slot.quantity <= 0) return { error: '아이템이 부족합니다' };

  // Consume item
  slot.quantity -= 1;
  if (slot.quantity <= 0) {
    const idx = saveData.inventory.indexOf(slot);
    if (idx >= 0) saveData.inventory.splice(idx, 1);
  }

  // Apply effect
  const { type, value } = itemDef.useEffect;
  let heal = 0;

  if (type === 'heal_hp') {
    const before = player.currentHp;
    player.currentHp = Math.min(player.maxHp, player.currentHp + value);
    heal = player.currentHp - before;
  } else if (type === 'heal_mp') {
    const before = player.currentMp;
    player.currentMp = Math.min(player.maxMp, player.currentMp + value);
    heal = player.currentMp - before;
  } else if (type === 'buff_attack') {
    player.statusEffects.push({ type: 'attack_up', remainingTurns: itemDef.useEffect.duration ?? 3, value });
  } else if (type === 'buff_defense') {
    player.statusEffects.push({ type: 'defense_up', remainingTurns: itemDef.useEffect.duration ?? 3, value });
  }

  // Log
  const logMsg = type === 'heal_hp' ? `HP +${heal}`
    : type === 'heal_mp' ? `MP +${heal}`
    : type === 'buff_attack' ? `공격력 +${value} (${itemDef.useEffect.duration ?? 3}턴)`
    : type === 'buff_defense' ? `방어력 +${value} (${itemDef.useEffect.duration ?? 3}턴)`
    : '';
  const logEntry: BattleLogEntry = {
    turn: battleState.turn,
    message: `${player.name}이(가) ${itemDef.name}을(를) 사용했다! (${logMsg})`,
    type: type.startsWith('buff_') ? 'buff' : 'heal',
  };
  battleState.log.push(logEntry);

  // Advance turn
  battleState.status = 'enemy_turn';

  return {
    results: [{
      actionType: 'heal' as BattleAction,
      actorId: player.id,
      targetId: player.id,
      damage: 0,
      heal,
      isCritical: false,
      statusApplied: null,
      targetDefeated: false,
    }],
  };
}

export function checkBattleEnd(battleState: BattleState): 'victory' | 'defeat' | null {
  if (!battleState.player.isAlive) return 'defeat';
  if (battleState.enemies.every((e) => !e.isAlive)) return 'victory';
  return null;
}

/** Check if current wave is the last one */
export function isLastWave(battleId: string): boolean {
  const wave = battleWaveMap.get(battleId);
  if (!wave) return true;
  return wave.current >= wave.total - 1;
}

/** Get wave info */
export function getWaveInfo(battleId: string): { current: number; total: number } | null {
  const wave = battleWaveMap.get(battleId);
  if (!wave) return null;
  return { current: wave.current, total: wave.total };
}

/** Advance to next wave — spawn new enemies, keep player HP/MP/status */
export function advanceWave(battleId: string): boolean {
  const battleState = battleStore.get(battleId);
  const wave = battleWaveMap.get(battleId);
  if (!battleState || !wave) return false;

  const nextWaveIndex = wave.current + 1;
  const dungeon = DUNGEONS.find((d) => d.id === wave.dungeonId);
  if (!dungeon || nextWaveIndex >= dungeon.waves.length) return false;

  const waveData = dungeon.waves[nextWaveIndex];
  const enemies: BattleFighter[] = [];
  let idx = 0;

  for (const entry of waveData.monsters) {
    const monsterData = MONSTERS.find((m) => m.id === entry.monsterId);
    if (!monsterData) continue;

    for (let i = 0; i < entry.count; i++) {
      enemies.push({
        id: `enemy_${idx}`,
        name: `${monsterData.name}${entry.count > 1 ? ` ${String.fromCharCode(65 + i)}` : ''}`,
        monsterId: monsterData.id,
        currentHp: monsterData.stats.maxHp,
        maxHp: monsterData.stats.maxHp,
        currentMp: 0,
        maxMp: 0,
        attack: monsterData.stats.attack,
        defense: monsterData.stats.defense,
        speed: monsterData.stats.speed,
        statusEffects: [],
        isAlive: true,
      });
      idx++;
    }
  }

  battleState.enemies = enemies;
  battleState.status = 'player_turn';
  battleState.turn += 1;
  battleState.log.push({
    turn: battleState.turn,
    message: `--- 웨이브 ${nextWaveIndex + 1}/${dungeon.waves.length} ---`,
    type: 'system',
  });

  wave.current = nextWaveIndex;

  return true;
}

// ────────────────────────────────────────────────────────────
// calculateRewards
// ────────────────────────────────────────────────────────────

// ── Equipment drop tables ──

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

/** Dungeon → mob equipment rarity, boss equipment rarity */
const DUNGEON_LOOT_TABLE: Record<string, { mobRarity: string; bossRarity: string }> = {
  forsaken_crypt:    { mobRarity: 'common',    bossRarity: 'common' },
  haunted_fortress:  { mobRarity: 'common',    bossRarity: 'common' },
  blood_sanctum:     { mobRarity: 'common',    bossRarity: 'uncommon' },
  abyss_gate:        { mobRarity: 'uncommon',  bossRarity: 'rare' },
  burning_mine:      { mobRarity: 'uncommon',  bossRarity: 'rare' },
  venom_swamp:       { mobRarity: 'uncommon',  bossRarity: 'rare' },
  forgotten_temple:  { mobRarity: 'rare',      bossRarity: 'epic' },
  frozen_throne:     { mobRarity: 'rare',      bossRarity: 'epic' },
  blackrock_abyss:   { mobRarity: 'rare',      bossRarity: 'epic' },
  twilight_bastion:  { mobRarity: 'epic',      bossRarity: 'legendary' },
  gates_of_hell:     { mobRarity: 'epic',      bossRarity: 'legendary' },
  icecrown_citadel:  { mobRarity: 'epic',      bossRarity: 'legendary' },
  tomb_of_sargeras:  { mobRarity: 'legendary', bossRarity: 'legendary' },
};

/** Boss monster IDs (last-wave solo or named bosses) */
const BOSS_IDS = new Set([
  'abyss_lord', 'molten_overseer', 'swamp_hydra', 'fallen_high_priest',
  'frost_lich_king', 'black_dragon', 'chogall', 'archimonde',
  'lich_king_arthas', 'sargeras_avatar',
]);

const MOB_EQUIP_DROP_RATE = 0.08;
const BOSS_EQUIP_DROP_RATE = 0.40;

function clampRarity(index: number): number {
  return Math.max(0, Math.min(index, RARITY_ORDER.length - 1));
}

/** Roll boss rarity: 20% current-2, 60% current-1, 20% current */
function rollBossRarity(baseRarity: string): string {
  const idx = RARITY_ORDER.indexOf(baseRarity as typeof RARITY_ORDER[number]);
  const roll = Math.random();
  if (roll < 0.20) return RARITY_ORDER[clampRarity(idx - 2)];
  if (roll < 0.80) return RARITY_ORDER[clampRarity(idx - 1)];
  return RARITY_ORDER[clampRarity(idx)];
}

/** Pick a random equipment from the player's class pool at given rarity */
function rollEquipment(characterId: string, rarity: string): string | null {
  const pool = ITEMS.filter(
    (i) => i.requiredClass === characterId && i.rarity === rarity,
  );
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function calculateRewards(battleId: string, characterId: string): BattleRewards | null {
  const battleState = battleStore.get(battleId);
  const dungeonId = battleDungeonMap.get(battleId);
  if (!battleState || !dungeonId) return null;

  const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
  if (!dungeon) return null;

  const lootTable = DUNGEON_LOOT_TABLE[dungeonId];
  const waveData = battleWaveMap.get(battleId);

  let totalExp = dungeon.rewards.exp;
  let totalGold = dungeon.rewards.gold;
  const items: { itemId: string; quantity: number }[] = [];

  function addDrop(itemId: string) {
    const existing = items.find((i) => i.itemId === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ itemId, quantity: 1 });
    }
  }

  // Add per-monster rewards
  for (const enemy of battleState.enemies) {
    const monsterData = MONSTERS.find((m) => m.id === enemy.monsterId);
    if (!monsterData) continue;

    totalExp += monsterData.expReward;
    totalGold += Math.floor(
      monsterData.goldReward.min + Math.random() * (monsterData.goldReward.max - monsterData.goldReward.min),
    );

    // Roll material drops
    for (const drop of monsterData.drops) {
      if (Math.random() < drop.chance) {
        addDrop(drop.itemId);
      }
    }

    // Roll equipment drop (with prestige + artifact drop bonus)
    if (lootTable) {
      const isBoss = BOSS_IDS.has(monsterData.id);
      const pLvl = waveData?.saveData?.prestigeLevel ?? 0;
      const artDrop = (getArtifactBonuses(waveData?.saveData?.artifacts).dropRatePercent ?? 0) / 100;
      const dropBonus = 1 + pLvl * 0.01 + artDrop;
      const dropRate = isBoss ? BOSS_EQUIP_DROP_RATE : MOB_EQUIP_DROP_RATE * dropBonus;

      if (Math.random() < dropRate) {
        const rarity = isBoss
          ? rollBossRarity(lootTable.bossRarity)
          : lootTable.mobRarity;
        const equipId = rollEquipment(characterId, rarity);
        if (equipId) addDrop(equipId);
      }
    }
  }

  // Apply talent gold bonus
  const talentGoldBonus = battleTalentMap.get(battleId);
  if (talentGoldBonus && talentGoldBonus.goldPercent > 0) {
    totalGold = Math.round(totalGold * (1 + talentGoldBonus.goldPercent / 100));
  }

  // Apply title gold bonus
  if (waveData?.saveData) {
    const titleId = waveData.saveData.equippedTitle ?? '';
    if (titleId) {
      const titleDef = TITLES.find((t) => t.id === titleId);
      if (titleDef?.bonus?.stat === 'goldPercent') {
        totalGold = Math.round(totalGold * (1 + titleDef.bonus.value / 100));
      }
    }
  }

  // Prestige bonuses: exp +10%, gold +5% per prestige
  const pLevel = waveData?.saveData?.prestigeLevel ?? 0;
  if (pLevel > 0) {
    totalExp = Math.round(totalExp * (1 + pLevel * 0.10));
    totalGold = Math.round(totalGold * (1 + pLevel * 0.05));
  }

  // Artifact exp/gold bonus
  const artBonuses = getArtifactBonuses(waveData?.saveData?.artifacts);
  if (artBonuses.expPercent) totalExp = Math.round(totalExp * (1 + artBonuses.expPercent / 100));
  if (artBonuses.goldPercent) totalGold = Math.round(totalGold * (1 + artBonuses.goldPercent / 100));

  // Random option exp/gold bonus
  const randOptBonus = battleRandomOptionMap.get(battleId);
  if (randOptBonus) {
    if (randOptBonus.expPercent > 0) totalExp = Math.round(totalExp * (1 + randOptBonus.expPercent / 100));
    if (randOptBonus.goldPercent > 0) totalGold = Math.round(totalGold * (1 + randOptBonus.goldPercent / 100));
  }

  return { exp: totalExp, gold: totalGold, items };
}

/**
 * Clean up a finished battle from all stores.
 */
export function removeBattle(id: string): void {
  battleStore.delete(id);
  skillStateStore.delete(id);
  battleDungeonMap.delete(id);
  battleCritMap.delete(id);
  battleSetActiveMap.delete(id);
  battlePrestigeMap.delete(id);
  battleArtifactMap.delete(id);
  battleSkillLevelMap.delete(id);
  battleTalentMap.delete(id);
  battleTitleMap.delete(id);
  battleRandomOptionMap.delete(id);
  battleWaveMap.delete(id);
  abyssFloorMap.delete(id);
  weeklyBossMap.delete(id);
}

// ────────────────────────────────────────────────────────────
// Abyss (무한 던전)
// ────────────────────────────────────────────────────────────

const abyssFloorMap = new Map<string, number>();

/** All regular (non-boss) monster IDs */
const REGULAR_MONSTER_IDS = MONSTERS.filter((m) => !BOSS_IDS.has(m.id)).map((m) => m.id);
/** All boss monster IDs */
const BOSS_MONSTER_IDS = MONSTERS.filter((m) => BOSS_IDS.has(m.id)).map((m) => m.id);

/** Abyss stat multiplier: 1 + floor * 0.5 */
function abyssMultiplier(floor: number): number {
  return 1 + floor * 0.5;
}

/** Abyss legendary drop rate: 0.1% + floor * 0.028% */
function abyssDropRate(floor: number): number {
  return 0.001 + floor * 0.00028;
}

export function getAbyssFloor(battleId: string): number | undefined {
  return abyssFloorMap.get(battleId);
}

export function initAbyssBattle(
  saveData: SaveData,
): { battleState: BattleState; skillStates: SkillState[]; floor: number; error?: never } | { error: string } {
  const floor = saveData.abyssFloor ?? 0;
  if (floor > 999) return { error: 'Maximum floor reached' };

  const character = CHARACTERS.find((c) => c.id === saveData.characterId);
  if (!character) return { error: 'Character data not found' };

  // Player stats (same as initBattle)
  const levelBonus = saveData.level - 1;
  let equipHp = 0, equipMp = 0, equipAtk = 0, equipDef = 0, equipSpd = 0;
  let equipCritRate = 0, equipCritDmg = 0;

  for (const slotItemId of Object.values(saveData.equippedItems)) {
    if (!slotItemId) continue;
    const itemDef = ITEMS.find((i) => i.id === slotItemId);
    if (!itemDef?.stats) continue;
    const enh = saveData.enhanceLevels?.[slotItemId];
    const mult = 1 + (enh?.level ?? 0);
    equipHp += (itemDef.stats.hp ?? 0) * mult;
    equipMp += (itemDef.stats.mp ?? 0) * mult;
    equipAtk += (itemDef.stats.attack ?? 0) * mult;
    equipDef += (itemDef.stats.defense ?? 0) * mult;
    equipSpd += (itemDef.stats.speed ?? 0) * mult;
    equipCritRate += (itemDef.stats.critRate ?? 0) * mult;
    equipCritDmg += (itemDef.stats.critDamage ?? 0) * mult;
  }

  // Add socketed gem stats
  for (const slotGemId0 of Object.values(saveData.equippedItems)) {
    if (!slotGemId0) continue;
    const gemSockets0 = saveData.socketedGems?.[slotGemId0] ?? [];
    for (const gid0 of gemSockets0) {
      const gemData0 = GEMS.find((x) => x.id === gid0);
      if (!gemData0) continue;
      if (gemData0.stat === 'attack') equipAtk += gemData0.value;
      else if (gemData0.stat === 'defense') equipDef += gemData0.value;
      else if (gemData0.stat === 'hp') equipHp += gemData0.value;
      else if (gemData0.stat === 'mp') equipMp += gemData0.value;
      else if (gemData0.stat === 'speed') equipSpd += gemData0.value;
      else if (gemData0.stat === 'critRate') equipCritRate += gemData0.value;
      else if (gemData0.stat === 'critDamage') equipCritDmg += gemData0.value;
    }
  }

  // Random option bonuses (flat) for abyss
  const randOptsAbyss = calculateRandomOptionBonuses(saveData);
  equipAtk += randOptsAbyss.atkFlat;
  equipDef += randOptsAbyss.defFlat;
  equipHp += randOptsAbyss.hpFlat;
  equipSpd += randOptsAbyss.speedFlat;
  equipCritRate += randOptsAbyss.critRate / 100;
  equipCritDmg += randOptsAbyss.critDamage / 100;

  // Set bonuses
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  const { statMods, actives: setActives } = calculateSetBonuses(equippedIds);

  let baseHp = character.baseStats.maxHp + levelBonus * 15 + equipHp;
  let baseMp = character.baseStats.maxMp + levelBonus * 5 + equipMp;
  let baseAtk = character.baseStats.attack + levelBonus * 3 + equipAtk;
  let baseDef = character.baseStats.defense + levelBonus * 2 + equipDef;

  baseHp = Math.round(baseHp * (1 + statMods.hpPercent / 100));
  baseMp = Math.round(baseMp * (1 + statMods.mpPercent / 100));
  baseAtk = Math.round(baseAtk * (1 + statMods.atkPercent / 100));
  baseDef = Math.round(baseDef * (1 + statMods.defPercent / 100));

  // Prestige bonus
  const prestigeBonusAbyss = 1 + (saveData.prestigeLevel ?? 0) * 0.02;
  baseHp = Math.round(baseHp * prestigeBonusAbyss);
  baseMp = Math.round(baseMp * prestigeBonusAbyss);
  baseAtk = Math.round(baseAtk * prestigeBonusAbyss);
  baseDef = Math.round(baseDef * prestigeBonusAbyss);

  // Talent bonuses (abyss)
  const talentModsAbyss = calculateTalentBonuses(saveData.talentPoints ?? {});
  baseHp = Math.round(baseHp * (1 + talentModsAbyss.hpPercent / 100));
  baseMp = Math.round(baseMp * (1 + talentModsAbyss.mpPercent / 100));
  baseAtk = Math.round(baseAtk * (1 + talentModsAbyss.atkPercent / 100));
  baseDef = Math.round(baseDef * (1 + talentModsAbyss.defPercent / 100));

  // Title bonus (abyss)
  const equippedTitleIdAbyss = saveData.equippedTitle ?? '';
  if (equippedTitleIdAbyss) {
    const titleDefAbyss = TITLES.find((t) => t.id === equippedTitleIdAbyss);
    if (titleDefAbyss?.bonus) {
      if (titleDefAbyss.bonus.stat === 'atkPercent') baseAtk = Math.round(baseAtk * (1 + titleDefAbyss.bonus.value / 100));
      if (titleDefAbyss.bonus.stat === 'defPercent') baseDef = Math.round(baseDef * (1 + titleDefAbyss.bonus.value / 100));
      if (titleDefAbyss.bonus.stat === 'hpPercent') baseHp = Math.round(baseHp * (1 + titleDefAbyss.bonus.value / 100));
      if (titleDefAbyss.bonus.stat === 'mpPercent') baseMp = Math.round(baseMp * (1 + titleDefAbyss.bonus.value / 100));
    }
  }

  // Pet bonus (abyss)
  let petCritRateBonusAbyss = 0;
  if (saveData.activePet) {
    const pet = PETS.find((p) => p.id === saveData.activePet);
    if (pet) {
      for (const b of pet.bonus) {
        if (b.stat === 'atkPercent') baseAtk = Math.round(baseAtk * (1 + b.value / 100));
        if (b.stat === 'defPercent') baseDef = Math.round(baseDef * (1 + b.value / 100));
        if (b.stat === 'hpPercent') baseHp = Math.round(baseHp * (1 + b.value / 100));
        if (b.stat === 'mpPercent') baseMp = Math.round(baseMp * (1 + b.value / 100));
        if (b.stat === 'critRateFlat') petCritRateBonusAbyss += b.value;
      }
    }
  }

  // Random option percent bonuses (abyss)
  if (randOptsAbyss.atkPercent > 0) baseAtk = Math.round(baseAtk * (1 + randOptsAbyss.atkPercent / 100));
  if (randOptsAbyss.hpPercent > 0) baseHp = Math.round(baseHp * (1 + randOptsAbyss.hpPercent / 100));

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: baseHp,
    maxHp: baseHp,
    currentMp: baseMp,
    maxMp: baseMp,
    attack: baseAtk,
    defense: baseDef,
    speed: character.baseStats.speed + levelBonus * 1 + equipSpd,
    statusEffects: [],
    isAlive: true,
  };

  // Determine enemies
  const isBossFloor = floor > 0 && floor % 10 === 0;
  const mult = abyssMultiplier(floor);

  const enemies: BattleFighter[] = [];
  if (isBossFloor) {
    // Boss floor: 1 random boss
    const bossId = BOSS_MONSTER_IDS[Math.floor(Math.random() * BOSS_MONSTER_IDS.length)];
    const bossData = MONSTERS.find((m) => m.id === bossId)!;
    enemies.push({
      id: 'enemy_0',
      name: `${bossData.name}`,
      monsterId: bossData.id,
      currentHp: Math.floor(bossData.stats.maxHp * mult),
      maxHp: Math.floor(bossData.stats.maxHp * mult),
      currentMp: 0,
      maxMp: 0,
      attack: Math.floor(bossData.stats.attack * mult),
      defense: Math.floor(bossData.stats.defense * mult),
      speed: Math.floor(bossData.stats.speed * mult),
      statusEffects: [],
      isAlive: true,
    });
  } else {
    // Regular floor: 2-5 random mobs
    const mobCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < mobCount; i++) {
      const mobId = REGULAR_MONSTER_IDS[Math.floor(Math.random() * REGULAR_MONSTER_IDS.length)];
      const mobData = MONSTERS.find((m) => m.id === mobId)!;
      enemies.push({
        id: `enemy_${i}`,
        name: `${mobData.name}${mobCount > 1 ? ` ${String.fromCharCode(65 + i)}` : ''}`,
        monsterId: mobData.id,
        currentHp: Math.floor(mobData.stats.maxHp * mult),
        maxHp: Math.floor(mobData.stats.maxHp * mult),
        currentMp: 0,
        maxMp: 0,
        attack: Math.floor(mobData.stats.attack * mult),
        defense: Math.floor(mobData.stats.defense * mult),
        speed: Math.floor(mobData.stats.speed * mult),
        statusEffects: [],
        isAlive: true,
      });
    }
  }

  const battleState: BattleState = {
    id: uuidv4(),
    status: 'player_turn',
    turn: 1,
    player,
    enemies,
    actionQueue: [],
    log: [],
    stats: { totalDamageDealt: 0, totalDamageTaken: 0, highestCrit: 0, turnsElapsed: 0, skillsUsed: 0 },
  };

  const characterSkills = SKILLS.filter((s) => s.characterId === saveData.characterId || s.characterId === 'common');
  const skillStates: SkillState[] = characterSkills.map((s) => ({
    skillId: s.id,
    currentCooldown: 0,
    isAvailable: s.type === 'active',
  }));

  battleStore.set(battleState.id, battleState);
  skillStateStore.set(battleState.id, skillStates);
  battleDungeonMap.set(battleState.id, '__abyss__');
  battleCritMap.set(battleState.id, {
    critRate: character.baseStats.critRate + equipCritRate + statMods.critRateFlat + petCritRateBonusAbyss + talentModsAbyss.critRateFlat,
    critDamage: (character.baseStats.critDamage + equipCritDmg) * (1 + statMods.critDmgPercent / 100) * (1 + talentModsAbyss.critDmgPercent / 100),
  });
  battleSetActiveMap.set(battleState.id, setActives);
  battlePrestigeMap.set(battleState.id, saveData.prestigeLevel ?? 0);
  battleArtifactMap.set(battleState.id, getArtifactBonuses(saveData.artifacts));
  battleSkillLevelMap.set(battleState.id, { ...(saveData.skillLevels ?? {}) });
  battleTalentMap.set(battleState.id, talentModsAbyss);
  battleTitleMap.set(battleState.id, saveData.equippedTitle ?? '');
  battleRandomOptionMap.set(battleState.id, {
    goldPercent: randOptsAbyss.goldPercent,
    expPercent: randOptsAbyss.expPercent,
    lifesteal: randOptsAbyss.lifesteal,
    reflect: randOptsAbyss.reflect,
    hpRegen: randOptsAbyss.hpRegen,
  });
  abyssFloorMap.set(battleState.id, floor);

  return { battleState, skillStates, floor };
}

export function calculateAbyssRewards(battleId: string, characterId: string): BattleRewards | null {
  const battleState = battleStore.get(battleId);
  const floor = abyssFloorMap.get(battleId);
  if (!battleState || floor === undefined) return null;

  const isBossFloor = floor > 0 && floor % 10 === 0;
  const mult = abyssMultiplier(floor);

  // Base rewards scale with floor
  let totalExp = Math.floor(15000 * mult * 0.1);
  let totalGold = Math.floor(15000 * mult * 0.1);
  const items: { itemId: string; quantity: number }[] = [];

  function addDrop(itemId: string) {
    const existing = items.find((i) => i.itemId === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ itemId, quantity: 1 });
    }
  }

  // Equipment drops
  for (const enemy of battleState.enemies) {
    if (isBossFloor) {
      // Boss: 100% legendary
      const equipId = rollEquipment(characterId, 'legendary');
      if (equipId) addDrop(equipId);
      continue;
    }

    // Roll 1: common~epic (60% flat, rarity by floor-based weights)
    if (Math.random() < 0.60) {
      const rarity = rollAbyssNormalRarity(floor);
      if (rarity) {
        const equipId = rollEquipment(characterId, rarity);
        if (equipId) addDrop(equipId);
      }
    }

    // Roll 2: legendary (independent)
    if (Math.random() < abyssDropRate(floor)) {
      const equipId = rollEquipment(characterId, 'legendary');
      if (equipId) addDrop(equipId);
    }
  }

  // Enhancement stone drops (floor-based)
  for (const enemy of battleState.enemies) {
    if (!enemy.isAlive) continue; // skip alive enemies (shouldn't happen but safety)
    let stoneId: string | null = null;
    let stoneChance = 0;
    if (floor < 100) { stoneId = 'enhance_stone_common'; stoneChance = 0.4; }
    else if (floor < 200) { stoneId = 'enhance_stone_uncommon'; stoneChance = 0.35; }
    else if (floor < 350) { stoneId = 'enhance_stone_rare'; stoneChance = 0.3; }
    else if (floor < 500) { stoneId = 'enhance_stone_epic'; stoneChance = 0.25; }
    else { stoneId = 'enhance_stone_legendary'; stoneChance = 0.2; }
    // Bosses get guaranteed stone
    if (isBossFloor) {
      if (stoneId) addDrop(stoneId);
    } else if (stoneId && Math.random() < stoneChance) {
      addDrop(stoneId);
    }
  }

  // Apply talent gold bonus
  const talentGoldBonusAbyss = battleTalentMap.get(battleId);
  if (talentGoldBonusAbyss && talentGoldBonusAbyss.goldPercent > 0) {
    totalGold = Math.round(totalGold * (1 + talentGoldBonusAbyss.goldPercent / 100));
  }

  // Apply title gold bonus
  const abyssTitleId = battleTitleMap.get(battleId) ?? '';
  if (abyssTitleId) {
    const abyssTitleDef = TITLES.find((t) => t.id === abyssTitleId);
    if (abyssTitleDef?.bonus?.stat === 'goldPercent') {
      totalGold = Math.round(totalGold * (1 + abyssTitleDef.bonus.value / 100));
    }
  }

  // Prestige bonuses for abyss
  const abyssSaveData = battleStore.get(battleId)?.player ? undefined : undefined; // need saveData
  // Use abyssFloorMap to find prestige from the init data stored elsewhere
  // Simpler: store prestige in a map at init. For now use a safe fallback.
  const abyssPrestigeMap = battlePrestigeMap.get(battleId) ?? 0;
  if (abyssPrestigeMap > 0) {
    totalExp = Math.round(totalExp * (1 + abyssPrestigeMap * 0.10));
    totalGold = Math.round(totalGold * (1 + abyssPrestigeMap * 0.05));
  }

  // Artifact exp/gold for abyss
  const abyssArtBonuses = battleArtifactMap.get(battleId);
  if (abyssArtBonuses) {
    if (abyssArtBonuses.expPercent) totalExp = Math.round(totalExp * (1 + abyssArtBonuses.expPercent / 100));
    if (abyssArtBonuses.goldPercent) totalGold = Math.round(totalGold * (1 + abyssArtBonuses.goldPercent / 100));
  }

  // Random option exp/gold bonus for abyss
  const randOptBonusAbyss = battleRandomOptionMap.get(battleId);
  if (randOptBonusAbyss) {
    if (randOptBonusAbyss.expPercent > 0) totalExp = Math.round(totalExp * (1 + randOptBonusAbyss.expPercent / 100));
    if (randOptBonusAbyss.goldPercent > 0) totalGold = Math.round(totalGold * (1 + randOptBonusAbyss.goldPercent / 100));
  }

  return { exp: totalExp, gold: totalGold, items };
}

/** Roll rarity for abyss normal drop (common~epic, floor-dependent) */
function rollAbyssNormalRarity(floor: number): string | null {
  type WeightEntry = { rarity: string; weight: number };
  const weights: WeightEntry[] = [];

  if (floor < 100) weights.push({ rarity: 'common', weight: 50 });
  if (floor < 200) weights.push({ rarity: 'uncommon', weight: floor < 100 ? 30 : 45 });
  if (floor < 300) {
    if (floor < 100) weights.push({ rarity: 'rare', weight: 15 });
    else if (floor < 200) weights.push({ rarity: 'rare', weight: 40 });
    else weights.push({ rarity: 'rare', weight: 55 });
  }
  // epic always available
  if (floor < 100) weights.push({ rarity: 'epic', weight: 5 });
  else if (floor < 200) weights.push({ rarity: 'epic', weight: 15 });
  else if (floor < 300) weights.push({ rarity: 'epic', weight: 45 });
  else weights.push({ rarity: 'epic', weight: 100 });

  const total = weights.reduce((s, w) => s + w.weight, 0);
  if (total === 0) return null;

  let roll = Math.random() * total;
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.rarity;
  }
  return weights[weights.length - 1].rarity;
}

// ────────────────────────────────────────────────────────────
// Weekly Boss
// ────────────────────────────────────────────────────────────

const weeklyBossMap = new Map<string, boolean>(); // battleId → isWeeklyBoss

export function isWeeklyBoss(battleId: string): boolean {
  return weeklyBossMap.get(battleId) === true;
}

export function initWeeklyBossBattle(
  saveData: SaveData,
): { battleState: BattleState; skillStates: SkillState[]; error?: never } | { error: string } {
  // Check weekly cooldown
  const lastAttempt = saveData.lastWeeklyBoss ?? '';
  if (lastAttempt) {
    const lastDate = new Date(lastAttempt);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 7) {
      const remaining = Math.ceil(7 - diffDays);
      return { error: `주간 보스는 일주일에 한 번만 도전할 수 있습니다. ${remaining}일 후 재도전 가능` };
    }
  }

  const character = CHARACTERS.find((c) => c.id === saveData.characterId);
  if (!character) return { error: 'Character data not found' };

  // Player stats (same as initBattle)
  const levelBonus = saveData.level - 1;
  let equipHp = 0, equipMp = 0, equipAtk = 0, equipDef = 0, equipSpd = 0;
  let equipCritRate = 0, equipCritDmg = 0;

  for (const slotItemId of Object.values(saveData.equippedItems)) {
    if (!slotItemId) continue;
    const itemDef = ITEMS.find((i) => i.id === slotItemId);
    if (!itemDef?.stats) continue;
    const enh = saveData.enhanceLevels?.[slotItemId];
    const mult = 1 + (enh?.level ?? 0);
    equipHp += (itemDef.stats.hp ?? 0) * mult;
    equipMp += (itemDef.stats.mp ?? 0) * mult;
    equipAtk += (itemDef.stats.attack ?? 0) * mult;
    equipDef += (itemDef.stats.defense ?? 0) * mult;
    equipSpd += (itemDef.stats.speed ?? 0) * mult;
    equipCritRate += (itemDef.stats.critRate ?? 0) * mult;
    equipCritDmg += (itemDef.stats.critDamage ?? 0) * mult;
  }

  // Add socketed gem stats
  for (const slotGemId1 of Object.values(saveData.equippedItems)) {
    if (!slotGemId1) continue;
    const gemSockets1 = saveData.socketedGems?.[slotGemId1] ?? [];
    for (const gid1 of gemSockets1) {
      const gemData1 = GEMS.find((x) => x.id === gid1);
      if (!gemData1) continue;
      if (gemData1.stat === 'attack') equipAtk += gemData1.value;
      else if (gemData1.stat === 'defense') equipDef += gemData1.value;
      else if (gemData1.stat === 'hp') equipHp += gemData1.value;
      else if (gemData1.stat === 'mp') equipMp += gemData1.value;
      else if (gemData1.stat === 'speed') equipSpd += gemData1.value;
      else if (gemData1.stat === 'critRate') equipCritRate += gemData1.value;
      else if (gemData1.stat === 'critDamage') equipCritDmg += gemData1.value;
    }
  }

  // Random option bonuses (flat) for weekly boss
  const randOptsWb = calculateRandomOptionBonuses(saveData);
  equipAtk += randOptsWb.atkFlat;
  equipDef += randOptsWb.defFlat;
  equipHp += randOptsWb.hpFlat;
  equipSpd += randOptsWb.speedFlat;
  equipCritRate += randOptsWb.critRate / 100;
  equipCritDmg += randOptsWb.critDamage / 100;

  // Set bonuses
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  const { statMods, actives: setActives } = calculateSetBonuses(equippedIds);

  let baseHp = character.baseStats.maxHp + levelBonus * 15 + equipHp;
  let baseMp = character.baseStats.maxMp + levelBonus * 5 + equipMp;
  let baseAtk = character.baseStats.attack + levelBonus * 3 + equipAtk;
  let baseDef = character.baseStats.defense + levelBonus * 2 + equipDef;

  baseHp = Math.round(baseHp * (1 + statMods.hpPercent / 100));
  baseMp = Math.round(baseMp * (1 + statMods.mpPercent / 100));
  baseAtk = Math.round(baseAtk * (1 + statMods.atkPercent / 100));
  baseDef = Math.round(baseDef * (1 + statMods.defPercent / 100));

  // Prestige bonus
  const prestigeBonusWb = 1 + (saveData.prestigeLevel ?? 0) * 0.02;
  baseHp = Math.round(baseHp * prestigeBonusWb);
  baseMp = Math.round(baseMp * prestigeBonusWb);
  baseAtk = Math.round(baseAtk * prestigeBonusWb);
  baseDef = Math.round(baseDef * prestigeBonusWb);

  // Pet bonus (weekly boss)
  let petCritRateBonusWb = 0;
  if (saveData.activePet) {
    const pet = PETS.find((p) => p.id === saveData.activePet);
    if (pet) {
      for (const b of pet.bonus) {
        if (b.stat === 'atkPercent') baseAtk = Math.round(baseAtk * (1 + b.value / 100));
        if (b.stat === 'defPercent') baseDef = Math.round(baseDef * (1 + b.value / 100));
        if (b.stat === 'hpPercent') baseHp = Math.round(baseHp * (1 + b.value / 100));
        if (b.stat === 'mpPercent') baseMp = Math.round(baseMp * (1 + b.value / 100));
        if (b.stat === 'critRateFlat') petCritRateBonusWb += b.value;
      }
    }
  }

  // Random option percent bonuses (weekly boss)
  if (randOptsWb.atkPercent > 0) baseAtk = Math.round(baseAtk * (1 + randOptsWb.atkPercent / 100));
  if (randOptsWb.hpPercent > 0) baseHp = Math.round(baseHp * (1 + randOptsWb.hpPercent / 100));

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: baseHp,
    maxHp: baseHp,
    currentMp: baseMp,
    maxMp: baseMp,
    attack: baseAtk,
    defense: baseDef,
    speed: character.baseStats.speed + levelBonus * 1 + equipSpd,
    statusEffects: [],
    isAlive: true,
  };

  // Pick a random boss and give it 3x stats
  const bossId = BOSS_MONSTER_IDS[Math.floor(Math.random() * BOSS_MONSTER_IDS.length)];
  const bossData = MONSTERS.find((m) => m.id === bossId)!;
  const weeklyMult = 3;

  const enemies: BattleFighter[] = [{
    id: 'enemy_0',
    name: `[주간] ${bossData.name}`,
    monsterId: bossData.id,
    currentHp: Math.floor(bossData.stats.maxHp * weeklyMult),
    maxHp: Math.floor(bossData.stats.maxHp * weeklyMult),
    currentMp: 0,
    maxMp: 0,
    attack: Math.floor(bossData.stats.attack * weeklyMult),
    defense: Math.floor(bossData.stats.defense * weeklyMult),
    speed: Math.floor(bossData.stats.speed * weeklyMult),
    statusEffects: [],
    isAlive: true,
  }];

  const battleState: BattleState = {
    id: uuidv4(),
    status: 'player_turn',
    turn: 1,
    player,
    enemies,
    actionQueue: [],
    log: [{ turn: 1, message: `주간 보스 - ${bossData.name} 전투 시작!`, type: 'system' }],
    stats: { totalDamageDealt: 0, totalDamageTaken: 0, highestCrit: 0, turnsElapsed: 0, skillsUsed: 0 },
  };

  const characterSkills = SKILLS.filter((s) => s.characterId === saveData.characterId || s.characterId === 'common');
  const skillStates: SkillState[] = characterSkills.map((s) => ({
    skillId: s.id,
    currentCooldown: 0,
    isAvailable: s.type === 'active',
  }));

  battleStore.set(battleState.id, battleState);
  skillStateStore.set(battleState.id, skillStates);
  battleDungeonMap.set(battleState.id, '__weekly_boss__');
  battleCritMap.set(battleState.id, {
    critRate: character.baseStats.critRate + equipCritRate + statMods.critRateFlat + petCritRateBonusWb,
    critDamage: (character.baseStats.critDamage + equipCritDmg) * (1 + statMods.critDmgPercent / 100),
  });
  battleSetActiveMap.set(battleState.id, setActives);
  battlePrestigeMap.set(battleState.id, saveData.prestigeLevel ?? 0);
  battleArtifactMap.set(battleState.id, getArtifactBonuses(saveData.artifacts));
  battleSkillLevelMap.set(battleState.id, { ...(saveData.skillLevels ?? {}) });
  weeklyBossMap.set(battleState.id, true);
  battleRandomOptionMap.set(battleState.id, {
    goldPercent: randOptsWb.goldPercent,
    expPercent: randOptsWb.expPercent,
    lifesteal: randOptsWb.lifesteal,
    reflect: randOptsWb.reflect,
    hpRegen: randOptsWb.hpRegen,
  });

  return { battleState, skillStates };
}

export function calculateWeeklyBossRewards(battleId: string, characterId: string): BattleRewards | null {
  const battleState = battleStore.get(battleId);
  if (!battleState) return null;

  const items: { itemId: string; quantity: number }[] = [];

  // Guaranteed legendary drop
  const equipId = rollEquipment(characterId, 'legendary');
  if (equipId) {
    items.push({ itemId: equipId, quantity: 1 });
  }

  return { exp: 30000, gold: 50000, items };
}
