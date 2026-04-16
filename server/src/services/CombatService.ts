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
import { CHARACTERS, SKILLS, MONSTERS, DUNGEONS, ITEMS, SETS, GEMS, PETS, TALENTS, calculatePassiveTreeBonuses, TITLES } from '../../../shared/data';
import { calculateTotalStats } from '../../../shared/utils/calcStats';
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
const battlePetMap = new Map<string, { name: string; attack: number; level: number }>();
const battleEquippedMap = new Map<string, string[]>();
const battleKeystoneMap = new Map<string, { id: string; ratio: number }[]>(); // keystone specials with ratio
const battleUndyingUsed = new Map<string, boolean>(); // track undying proc per battle
const battleEquippedSkillsMap = new Map<string, string[]>(); // equipped skill IDs from saveData
const battleProcState = new Map<string, {
  cooldowns: Record<string, number>;
  activeBuffs: { type: string; value: number; remainingTurns: number }[];
}>();

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

  // Build player fighter using shared stat calculator
  const totalStats = calculateTotalStats(saveData);
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  const { statMods, actives: setActives } = calculateSetBonuses(equippedIds);
  const talentMods = calculatePassiveTreeBonuses(saveData.passiveTree?.allocatedNodes ?? []);
  const randOpts = calculateRandomOptionBonuses(saveData);

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: totalStats.hp,
    maxHp: totalStats.hp,
    currentMp: totalStats.mp,
    maxMp: totalStats.mp,
    attack: totalStats.atk,
    defense: totalStats.def,
    speed: Math.round(totalStats.spd),
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

  // Use shared crit stats from calculateTotalStats
  battleStore.set(battleState.id, battleState);
  skillStateStore.set(battleState.id, skillStates);
  battleDungeonMap.set(battleState.id, dungeonId);
  battleCritMap.set(battleState.id, {
    critRate: totalStats.crit,
    critDamage: totalStats.critDmg,
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

  // Pet combat info
  if (saveData.activePet) {
    const pet = PETS.find((p) => p.id === saveData.activePet);
    if (pet) {
      battlePetMap.set(battleState.id, {
        name: pet.name,
        attack: pet.attack,
        level: saveData.petLevels?.[saveData.activePet] ?? 0,
      });
    }
  }

  // Initialize proc state + keystone effects
  battleEquippedMap.set(battleState.id, equippedIds);
  battleProcState.set(battleState.id, { cooldowns: {}, activeBuffs: [] });
  battleKeystoneMap.set(battleState.id, totalStats.keystoneEffects.map(k => ({ id: k.id, ratio: k.ratio })));
  battleUndyingUsed.set(battleState.id, false);
  battleEquippedSkillsMap.set(battleState.id, saveData.equippedSkills ?? []);

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
  const raw = attackerAtk * multiplier;
  const reduction = defenderDef / (defenderDef + raw);
  const afterDef = raw * (1 - reduction);
  const afterCrit = afterDef * (isCrit ? critDamage : 1);
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

  // Check equipped skills (if set and non-empty, only allow equipped skills + basic attack)
  const equippedSkills = battleEquippedSkillsMap.get(battleState.id);
  if (equippedSkills && equippedSkills.length > 0) {
    if (skillId !== 'common_basic_attack' && !equippedSkills.includes(skillId)) {
      return { error: '장착되지 않은 스킬입니다' };
    }
  }

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

  // Roll proc effects from equipped items
  const procState = battleProcState.get(battleState.id);
  const equippedIds = battleEquippedMap.get(battleState.id) ?? [];
  let procCritBoost = 0;
  if (procState) {
    for (const slotItemId of equippedIds) {
      const itemDef = ITEMS.find(i => i.id === slotItemId);
      if (!itemDef?.procEffect) continue;

      const cd = procState.cooldowns[slotItemId] ?? 0;
      if (cd > 0) continue;

      if (Math.random() < itemDef.procEffect.chance) {
        const proc = itemDef.procEffect;
        procState.cooldowns[slotItemId] = proc.cooldown;

        switch (proc.type) {
          case 'atk_boost':
            player.statusEffects.push({ type: 'attack_up', remainingTurns: proc.duration, value: Math.round(player.attack * proc.value / 100) });
            battleState.log.push({ turn: battleState.turn, message: `[발동] ${itemDef.name}: ${proc.description}`, type: 'buff' });
            break;
          case 'def_boost':
            player.statusEffects.push({ type: 'defense_up', remainingTurns: proc.duration, value: Math.round(player.defense * proc.value / 100) });
            battleState.log.push({ turn: battleState.turn, message: `[발동] ${itemDef.name}: ${proc.description}`, type: 'buff' });
            break;
          case 'speed_boost':
            procState.activeBuffs.push({ type: 'speed_boost', value: proc.value, remainingTurns: proc.duration });
            battleState.log.push({ turn: battleState.turn, message: `[발동] ${itemDef.name}: ${proc.description}`, type: 'buff' });
            break;
          case 'crit_boost':
            procState.activeBuffs.push({ type: 'crit_boost', value: proc.value / 100, remainingTurns: proc.duration });
            battleState.log.push({ turn: battleState.turn, message: `[발동] ${itemDef.name}: ${proc.description}`, type: 'buff' });
            break;
          case 'heal_burst': {
            const healAmount = Math.round(player.maxHp * proc.value / 100);
            player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
            battleState.log.push({ turn: battleState.turn, message: `[발동] ${itemDef.name}: HP ${healAmount} 회복!`, type: 'heal' });
            break;
          }
          case 'extra_damage':
            procState.activeBuffs.push({ type: 'extra_damage', value: proc.value, remainingTurns: proc.duration });
            battleState.log.push({ turn: battleState.turn, message: `[발동] ${itemDef.name}: ${proc.description}`, type: 'buff' });
            break;
        }
      }
    }

    // Apply existing crit_boost buffs from previous turns
    for (const buff of procState.activeBuffs) {
      if (buff.type === 'crit_boost') procCritBoost += buff.value;
    }
  }

  // ── Special: mana_restore_50 — restore 50% of max MP instead of normal action ──
  if (skill.special === 'mana_restore_50') {
    const restored = Math.round(player.maxMp * 0.5);
    player.currentMp = Math.min(player.maxMp, player.currentMp + restored);
    battleState.log.push({ turn: battleState.turn, message: `${player.name}의 ${skill.name} → MP ${restored} 회복!`, type: 'heal' });
    results.push({
      actionType: 'skill',
      actorId: player.id,
      targetId: player.id,
      damage: 0,
      heal: 0,
      isCritical: false,
      statusApplied: null,
      targetDefeated: false,
    });
    // Apply status effect if any
    if (skill.statusEffect) {
      const activeEffect: ActiveStatusEffect = {
        type: skill.statusEffect.type,
        remainingTurns: skill.statusEffect.duration,
        value: skill.statusEffect.value,
      };
      player.statusEffects.push(activeEffect);
    }
  } else {
  // ── Normal + special damage handling ──
  const _skill = skill; // capture for nested function (TS narrowing)

  // Helper: perform one hit of damage calculation with all bonuses
  function performSingleHit(
    hitTarget: BattleFighter,
    forceCrit: boolean | null, // null = roll, true = guaranteed crit, false = no crit
  ): { hitDamage: number; hitIsCrit: boolean } {
    const hitIsCrit = forceCrit !== null ? forceCrit : Math.random() < (baseCritRate + procCritBoost);

    const keystones = battleKeystoneMap.get(battleState.id) ?? [];
    const getKR = (id: string) => keystones.find(k => k.id === id)?.ratio ?? 0;

    const skillLevel = battleSkillLevelMap.get(battleState.id)?.[skillId] ?? 0;
    const effectiveMultiplier = _skill.damageMultiplier * (1 + skillLevel * 0.05);

    let effectiveDef = getEffectiveDefense(hitTarget);
    const penRatio = getKR('masterPenetration');
    if (penRatio > 0) {
      const ignored = Math.round(effectiveDef * 0.4 * penRatio);
      effectiveDef -= ignored;
    }

    let manaBonus = 1;
    const manaRatio = getKR('manaOverload');
    if (manaRatio > 0 && player.maxMp > 0) {
      manaBonus = 1 + (player.currentMp / player.maxMp) * manaRatio;
    }

    let hitDamage = calculateDamage(getEffectiveAttack(player), effectiveDef, effectiveMultiplier * manaBonus, hitIsCrit, baseCritDmg);

    const execRatio = getKR('executioner');
    if (execRatio > 0 && hitTarget.currentHp / hitTarget.maxHp <= 0.3) {
      hitDamage = Math.round(hitDamage * (1 + execRatio));
    }

    const talentBonuses = battleTalentMap.get(battleState.id);
    if (talentBonuses && talentBonuses.totalDmgPercent > 0) {
      hitDamage = Math.round(hitDamage * (1 + talentBonuses.totalDmgPercent / 100));
    }

    const setActives = battleSetActiveMap.get(battleState.id) ?? [];
    for (const sa of setActives) {
      if (sa && sa.type === 'bonus_damage' && Math.random() < (sa.chance ?? 0)) {
        hitDamage += Math.round(hitDamage * sa.value / 100);
      }
    }

    return { hitDamage, hitIsCrit };
  }

  // Determine if this is a multi-hit special
  let multiHitCount = 0;
  let multiHitForceCrit = false;
  if (skill.special === 'multi_hit_3_5') {
    multiHitCount = 3 + Math.floor(Math.random() * 3); // 3-5 hits
  } else if (skill.special === 'multi_hit_5_crit') {
    multiHitCount = 5;
    multiHitForceCrit = true;
  }

  for (const target of targets) {
    const isCrit = Math.random() < (baseCritRate + procCritBoost);
    let damage = 0;
    let heal = 0;

    // ── Special: execute_20 — instant kill if target HP <= 20% (non-boss) ──
    if (skill.special === 'execute_20' && target.id !== 'player') {
      const isBoss = target.name.includes('보스') || (target.monsterId ?? '').includes('boss');
      if (!isBoss && target.currentHp / target.maxHp <= 0.2) {
        damage = target.currentHp;
        target.currentHp = 0;
        target.isAlive = false;
        battleState.log.push({ turn: battleState.turn, message: `[처형] ${target.name} 즉사! (HP 20% 이하)`, type: 'damage' });
        if (battleState.stats) battleState.stats.totalDamageDealt += damage;
        results.push({
          actionType: 'skill', actorId: player.id, targetId: target.id,
          damage, heal: 0, isCritical: false, statusApplied: null, targetDefeated: true,
        });
        battleState.log.push({ turn: battleState.turn, message: `${target.name} 처치!`, type: 'defeat' });
        continue; // skip normal damage for this target
      }
      // Otherwise fall through to normal damage
    }

    // ── Special: poison_burst — 3x damage if target has poison ──
    let poisonBurstMultiplier = 1;
    if (skill.special === 'poison_burst' && target.id !== 'player') {
      if (target.statusEffects.some(e => e.type === 'poison')) {
        poisonBurstMultiplier = 3;
        battleState.log.push({ turn: battleState.turn, message: `[독 폭발] ${target.name}의 독이 폭발! 피해 3배!`, type: 'buff' });
      }
    }

    // ── Multi-hit specials ──
    if (multiHitCount > 0 && skill.damageMultiplier > 0 && target.id !== 'player') {
      let totalMultiDmg = 0;
      for (let hitIdx = 0; hitIdx < multiHitCount; hitIdx++) {
        if (!target.isAlive) break;
        const { hitDamage, hitIsCrit } = performSingleHit(target, multiHitForceCrit ? true : null);
        const finalHitDmg = Math.round(hitDamage * poisonBurstMultiplier);
        target.currentHp = Math.max(0, target.currentHp - finalHitDmg);
        target.isAlive = target.currentHp > 0;
        totalMultiDmg += finalHitDmg;
        const critText = hitIsCrit ? ' (치명타!)' : '';
        battleState.log.push({
          turn: battleState.turn,
          message: `${player.name}의 ${skill.name} [${hitIdx + 1}/${multiHitCount}] → ${target.name}에게 ${finalHitDmg} 데미지${critText}`,
          type: 'damage',
        });
        if (battleState.stats) {
          battleState.stats.totalDamageDealt += finalHitDmg;
          if (hitIsCrit && finalHitDmg > battleState.stats.highestCrit) {
            battleState.stats.highestCrit = finalHitDmg;
          }
        }
      }
      damage = totalMultiDmg;

      // Lifesteal for multi-hit (special: lifesteal_30 not applicable here but keep vampire keystone)
      const keystones = battleKeystoneMap.get(battleState.id) ?? [];
      const vampRatio = (keystones.find(k => k.id === 'vampire')?.ratio ?? 0);
      if (vampRatio > 0 && damage > 0) {
        const vampHeal = Math.round(damage * 0.15 * vampRatio);
        if (vampHeal > 0) {
          player.currentHp = Math.min(player.maxHp, player.currentHp + vampHeal);
          battleState.log.push({ turn: battleState.turn, message: `[흡혈귀] HP ${vampHeal.toLocaleString()} 회복`, type: 'heal' });
        }
      }

      results.push({
        actionType: 'skill', actorId: player.id, targetId: target.id,
        damage, heal: 0, isCritical: false, statusApplied: null,
        targetDefeated: !target.isAlive,
      });
      if (!target.isAlive) {
        battleState.log.push({ turn: battleState.turn, message: `${target.name} 처치!`, type: 'defeat' });
      }
      continue; // skip normal single-hit path
    }

    // ── Normal single-hit damage ──
    // Damage (with buff effects + skill level bonus + keystone effects)
    if (skill.damageMultiplier > 0 && target.id !== 'player') {
      const keystones = battleKeystoneMap.get(battleState.id) ?? [];
      const getKR = (id: string) => keystones.find(k => k.id === id)?.ratio ?? 0;

      const skillLevel = battleSkillLevelMap.get(battleState.id)?.[skillId] ?? 0;
      const effectiveMultiplier = skill.damageMultiplier * (1 + skillLevel * 0.05);

      // Keystone: masterPenetration — 관통의 달인: 방어력 무시 (최대 40%)
      let effectiveDef = getEffectiveDefense(target);
      const penRatio = getKR('masterPenetration');
      if (penRatio > 0) {
        const ignored = Math.round(effectiveDef * 0.4 * penRatio);
        effectiveDef -= ignored;
        battleState.log.push({ turn: battleState.turn, message: `[관통의 달인] 방어력 ${ignored} 무시 (${Math.round(penRatio * 40)}%)`, type: 'buff' });
      }

      // Keystone: manaOverload — 마력폭주: 남은 MP% 만큼 스킬 데미지 증가
      let manaBonus = 1;
      const manaRatio = getKR('manaOverload');
      if (manaRatio > 0 && player.maxMp > 0) {
        manaBonus = 1 + (player.currentMp / player.maxMp) * manaRatio;
        battleState.log.push({ turn: battleState.turn, message: `[마력폭주] 스킬 데미지 +${Math.round((manaBonus - 1) * 100)}% (MP ${Math.round(player.currentMp / player.maxMp * 100)}%)`, type: 'buff' });
      }

      damage = calculateDamage(getEffectiveAttack(player), effectiveDef, effectiveMultiplier * manaBonus, isCrit, baseCritDmg);

      // Apply poison_burst multiplier
      if (poisonBurstMultiplier > 1) {
        damage = Math.round(damage * poisonBurstMultiplier);
      }

      // Keystone: executioner — 처형자: 적 HP 30% 이하일 때 데미지 증가 (최대 2배)
      const execRatio = getKR('executioner');
      if (execRatio > 0 && target.currentHp / target.maxHp <= 0.3) {
        const execBonus = 1 + execRatio;
        const beforeDmg = damage;
        damage = Math.round(damage * execBonus);
        battleState.log.push({ turn: battleState.turn, message: `[처형자] 처형 데미지! ${beforeDmg} → ${damage} (x${execBonus.toFixed(1)})`, type: 'buff' });
      }

      // Premium talent: totalDmgPercent
      const talentBonuses = battleTalentMap.get(battleState.id);
      if (talentBonuses && talentBonuses.totalDmgPercent > 0) {
        damage = Math.round(damage * (1 + talentBonuses.totalDmgPercent / 100));
      }

      // Set active: bonus_damage (추가 피해)
      const setActives = battleSetActiveMap.get(battleState.id) ?? [];
      for (const sa of setActives) {
        if (sa && sa.type === 'bonus_damage' && Math.random() < (sa.chance ?? 0)) {
          const bonusDmg = Math.round(damage * sa.value / 100);
          damage += bonusDmg;
          battleState.log.push({ turn: battleState.turn, message: `[세트 효과] 추가 피해 ${bonusDmg}!`, type: 'buff' });
        }
      }

      // Apply proc extra_damage buff
      if (procState) {
        for (const buff of procState.activeBuffs) {
          if (buff.type === 'extra_damage') {
            const extraDmg = Math.round(damage * buff.value / 100);
            damage += extraDmg;
            battleState.log.push({ turn: battleState.turn, message: `[발동 효과] 추가 피해 ${extraDmg}!`, type: 'buff' });
          }
        }
        // Consume extra_damage buffs (they are single-use)
        procState.activeBuffs = procState.activeBuffs.filter(b => b.type !== 'extra_damage');
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

      // ── Special: lifesteal_30 — heal 30% of damage dealt ──
      if (skill.special === 'lifesteal_30' && damage > 0) {
        const lsHeal = Math.round(damage * 0.3);
        player.currentHp = Math.min(player.maxHp, player.currentHp + lsHeal);
        battleState.log.push({ turn: battleState.turn, message: `[흡혈] HP ${lsHeal.toLocaleString()} 회복 (피해의 30%)`, type: 'heal' });
      }

      // Keystone: vampire — 흡혈귀: 흡혈 (최대 15%)
      const vampRatio = getKR('vampire');
      if (vampRatio > 0 && damage > 0) {
        const vampHeal = Math.round(damage * 0.15 * vampRatio);
        if (vampHeal > 0) {
          player.currentHp = Math.min(player.maxHp, player.currentHp + vampHeal);
          battleState.log.push({ turn: battleState.turn, message: `[흡혈귀] HP ${vampHeal.toLocaleString()} 회복 (${Math.round(vampRatio * 15)}%)`, type: 'heal' });
        }
      }

      // Keystone: poisonMaster — 맹독술사: 모든 공격에 독 (최대 3턴)
      const poisonRatio = getKR('poisonMaster');
      if (poisonRatio > 0 && target.isAlive) {
        const poisonTurns = Math.max(1, Math.round(3 * poisonRatio));
        const poisonDmg = Math.round(damage * 0.1);
        if (!target.statusEffects.some(e => e.type === 'poison')) {
          target.statusEffects.push({ type: 'poison', remainingTurns: poisonTurns, value: poisonDmg });
          battleState.log.push({ turn: battleState.turn, message: `[맹독술사] ${target.name}에게 독 ${poisonTurns}턴 (턴당 ${poisonDmg.toLocaleString()})`, type: 'debuff' });
        }
      }

      // Keystone: doubleStrike — 질풍연타: 2회 공격 (최대 20% 확률)
      const doubleRatio = getKR('doubleStrike');
      if (doubleRatio > 0 && target.isAlive && Math.random() < 0.2 * doubleRatio) {
        const extraDmg = calculateDamage(getEffectiveAttack(player), effectiveDef, effectiveMultiplier, false, baseCritDmg);
        target.currentHp = Math.max(0, target.currentHp - extraDmg);
        target.isAlive = target.currentHp > 0;
        if (battleState.stats) battleState.stats.totalDamageDealt += extraDmg;
        battleState.log.push({ turn: battleState.turn, message: `[질풍연타] 추가 공격! ${extraDmg.toLocaleString()} 데미지 (${Math.round(doubleRatio * 20)}% 확률)`, type: 'damage' });
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
      // ── Special: regen_percent — heal based on % of max HP ──
      if (skill.special === 'regen_percent' && skill.statusEffect) {
        heal = Math.round(player.maxHp * (skill.statusEffect.value / 100));
      } else {
        heal = Math.round(player.attack * skill.healMultiplier);
      }
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
  } // end else (non-mana_restore_50)

  // Pet auto-attack
  const petInfo = battlePetMap.get(battleState.id);
  if (petInfo) {
    const aliveEnemy = battleState.enemies.find(e => e.isAlive);
    if (aliveEnemy) {
      const petDmg = Math.max(1, Math.round(petInfo.attack * (1 + petInfo.level * 0.1)));
      aliveEnemy.currentHp = Math.max(0, aliveEnemy.currentHp - petDmg);
      aliveEnemy.isAlive = aliveEnemy.currentHp > 0;

      battleState.log.push({
        turn: battleState.turn,
        message: `[펫] ${petInfo.name}의 공격 → ${aliveEnemy.name}에게 ${petDmg} 데미지`,
        type: 'damage',
      });

      if (!aliveEnemy.isAlive) {
        battleState.log.push({
          turn: battleState.turn,
          message: `${aliveEnemy.name} 처치!`,
          type: 'defeat',
        });
      }

      if (battleState.stats) {
        battleState.stats.totalDamageDealt += petDmg;
      }
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

    let damage = calculateDamage(getEffectiveAttack(enemy), getEffectiveDefense(player), chosen.damageMultiplier, false);

    // Premium talent: dmgReductionPercent
    const enemyTurnTalentBonuses = battleTalentMap.get(battleState.id);
    if (enemyTurnTalentBonuses && enemyTurnTalentBonuses.dmgReductionPercent > 0) {
      damage = Math.round(damage * (1 - enemyTurnTalentBonuses.dmgReductionPercent / 100));
      damage = Math.max(1, damage);
    }

    // Keystone: ironWall — 철벽방어: 받는 피해 감소 (최대 30%)
    const keystones = battleKeystoneMap.get(battleState.id) ?? [];
    const getKR = (id: string) => keystones.find(k => k.id === id)?.ratio ?? 0;
    const ironWallRatio = getKR('ironWall');
    if (ironWallRatio > 0) {
      const beforeDmg = damage;
      damage = Math.max(1, Math.round(damage * (1 - 0.3 * ironWallRatio)));
      battleState.log.push({ turn: battleState.turn, message: `[철벽방어] 피해 ${Math.round(ironWallRatio * 30)}% 감소 (${beforeDmg.toLocaleString()} → ${damage.toLocaleString()})`, type: 'buff' });
    }

    player.currentHp = Math.max(0, player.currentHp - damage);
    player.isAlive = player.currentHp > 0;

    // Keystone: undying — 불사의 의지: 치명타 생존 (전투당 1회)
    if (!player.isAlive && getKR('undying') > 0 && !battleUndyingUsed.get(battleState.id)) {
      if (Math.random() < getKR('undying')) {
        player.currentHp = 1;
        player.isAlive = true;
        battleUndyingUsed.set(battleState.id, true);
        battleState.log.push({ turn: battleState.turn, message: `[불사의 의지] 죽음을 버텨냈습니다! HP 1 (발동확률 ${Math.round(getKR('undying') * 100)}%)`, type: 'system' });
      }
    }

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

  // Tick proc cooldowns and active buffs
  const procState = battleProcState.get(battleState.id);
  if (procState) {
    for (const key of Object.keys(procState.cooldowns)) {
      if (procState.cooldowns[key] > 0) procState.cooldowns[key] -= 1;
    }
    procState.activeBuffs = procState.activeBuffs
      .map(b => ({ ...b, remainingTurns: b.remainingTurns - 1 }))
      .filter(b => b.remainingTurns > 0);
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

  // Keystone: plunderer — 골드/경험치/드랍 증가 (최대 50%)
  const ksReward = battleKeystoneMap.get(battleId) ?? [];
  const plunderRatio = ksReward.find(k => k.id === 'plunderer')?.ratio ?? 0;
  if (plunderRatio > 0) {
    totalGold = Math.round(totalGold * (1 + 0.5 * plunderRatio));
    totalExp = Math.round(totalExp * (1 + 0.5 * plunderRatio));
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

  // Premium talent: fortunePercent (exp + gold + drop)
  const rewardTalentBonuses = battleTalentMap.get(battleId);
  if (rewardTalentBonuses && rewardTalentBonuses.fortunePercent > 0) {
    totalExp = Math.round(totalExp * (1 + rewardTalentBonuses.fortunePercent / 100));
    totalGold = Math.round(totalGold * (1 + rewardTalentBonuses.fortunePercent / 100));
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
  battlePetMap.delete(id);
  battleEquippedMap.delete(id);
  battleProcState.delete(id);
  battleKeystoneMap.delete(id);
  battleUndyingUsed.delete(id);
  battleWaveMap.delete(id);
  abyssFloorMap.delete(id);
  weeklyBossMap.delete(id);
  battleEquippedSkillsMap.delete(id);
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
  return Math.min(0.5, 0.001 + floor * 0.00028); // cap at 50%
}

export function getAbyssFloor(battleId: string): number | undefined {
  return abyssFloorMap.get(battleId);
}

export function initAbyssBattle(
  saveData: SaveData,
): { battleState: BattleState; skillStates: SkillState[]; floor: number; error?: never } | { error: string } {
  const floor = saveData.abyssFloor ?? 0;

  const character = CHARACTERS.find((c) => c.id === saveData.characterId);
  if (!character) return { error: 'Character data not found' };

  // Player stats using shared calculator
  const totalStatsAbyss = calculateTotalStats(saveData);
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  const { statMods, actives: setActives } = calculateSetBonuses(equippedIds);
  const talentModsAbyss = calculatePassiveTreeBonuses(saveData.passiveTree?.allocatedNodes ?? []);
  const randOptsAbyss = calculateRandomOptionBonuses(saveData);

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: totalStatsAbyss.hp,
    maxHp: totalStatsAbyss.hp,
    currentMp: totalStatsAbyss.mp,
    maxMp: totalStatsAbyss.mp,
    attack: totalStatsAbyss.atk,
    defense: totalStatsAbyss.def,
    speed: Math.round(totalStatsAbyss.spd),
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
    critRate: totalStatsAbyss.crit,
    critDamage: totalStatsAbyss.critDmg,
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

  // Pet combat info (abyss)
  if (saveData.activePet) {
    const pet = PETS.find((p) => p.id === saveData.activePet);
    if (pet) {
      battlePetMap.set(battleState.id, {
        name: pet.name,
        attack: pet.attack,
        level: saveData.petLevels?.[saveData.activePet] ?? 0,
      });
    }
  }

  // Initialize proc state + keystone effects (abyss)
  battleEquippedMap.set(battleState.id, equippedIds);
  battleProcState.set(battleState.id, { cooldowns: {}, activeBuffs: [] });
  battleKeystoneMap.set(battleState.id, totalStatsAbyss.keystoneEffects.map(k => ({ id: k.id, ratio: k.ratio })));
  battleUndyingUsed.set(battleState.id, false);
  battleEquippedSkillsMap.set(battleState.id, saveData.equippedSkills ?? []);

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
  let totalGold = Math.floor(15000 * mult * 0.05);
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

  // Premium talent: fortunePercent (exp + gold)
  const abyssTalentBonuses = battleTalentMap.get(battleId);
  if (abyssTalentBonuses && abyssTalentBonuses.fortunePercent > 0) {
    totalExp = Math.round(totalExp * (1 + abyssTalentBonuses.fortunePercent / 100));
    totalGold = Math.round(totalGold * (1 + abyssTalentBonuses.fortunePercent / 100));
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

  // Player stats using shared calculator
  const totalStatsWb = calculateTotalStats(saveData);
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  const { statMods, actives: setActives } = calculateSetBonuses(equippedIds);
  const talentModsWb = calculatePassiveTreeBonuses(saveData.passiveTree?.allocatedNodes ?? []);
  const randOptsWb = calculateRandomOptionBonuses(saveData);

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: totalStatsWb.hp,
    maxHp: totalStatsWb.hp,
    currentMp: totalStatsWb.mp,
    maxMp: totalStatsWb.mp,
    attack: totalStatsWb.atk,
    defense: totalStatsWb.def,
    speed: Math.round(totalStatsWb.spd),
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
    critRate: totalStatsWb.crit,
    critDamage: totalStatsWb.critDmg,
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

  // Pet combat info (weekly boss)
  if (saveData.activePet) {
    const pet = PETS.find((p) => p.id === saveData.activePet);
    if (pet) {
      battlePetMap.set(battleState.id, {
        name: pet.name,
        attack: pet.attack,
        level: saveData.petLevels?.[saveData.activePet] ?? 0,
      });
    }
  }

  // Initialize proc state + keystone effects (weekly boss)
  battleEquippedMap.set(battleState.id, equippedIds);
  battleProcState.set(battleState.id, { cooldowns: {}, activeBuffs: [] });
  battleKeystoneMap.set(battleState.id, totalStatsWb.keystoneEffects.map(k => ({ id: k.id, ratio: k.ratio })));
  battleUndyingUsed.set(battleState.id, false);
  battleEquippedSkillsMap.set(battleState.id, saveData.equippedSkills ?? []);

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

// ────────────────────────────────────────────────────────────
// Prestige Trial Boss
// ────────────────────────────────────────────────────────────

export function initPrestigeTrialBattle(
  saveData: SaveData,
): { battleState: BattleState; skillStates: SkillState[]; error?: never } | { error: string } {
  const character = CHARACTERS.find((c) => c.id === saveData.characterId);
  if (!character) return { error: 'Character data not found' };

  const totalStats = calculateTotalStats(saveData);
  const prestigeLv = saveData.prestigeLevel ?? 0;
  const scaleMult = 1 + prestigeLv * 0.01;

  // Trial boss stats scale with player
  const bossHp = Math.round(totalStats.atk * 50 * scaleMult);
  const bossAtk = Math.round(totalStats.def * 3 * scaleMult);
  const bossDef = Math.round(totalStats.atk * 0.3 * scaleMult);
  const bossSpd = Math.round(totalStats.spd * 0.9);

  // Boss pattern: extra abilities at higher prestige
  const bossName = prestigeLv >= 30 ? '시련의 대수호자' : prestigeLv >= 10 ? '시련의 상급 수호자' : '시련의 수호자';

  const enemies: BattleFighter[] = [{
    id: 'enemy_0',
    name: bossName,
    monsterId: 'prestige_trial_boss',
    currentHp: bossHp,
    maxHp: bossHp,
    currentMp: 0,
    maxMp: 0,
    attack: bossAtk,
    defense: bossDef,
    speed: bossSpd,
    statusEffects: [],
    isAlive: true,
  }];

  // Add minions at higher prestige
  if (prestigeLv >= 20) {
    const minionHp = Math.round(bossHp * 0.2);
    const minionAtk = Math.round(bossAtk * 0.5);
    for (let i = 0; i < Math.min(2, Math.floor(prestigeLv / 20)); i++) {
      enemies.push({
        id: `enemy_${i + 1}`,
        name: `시련의 종자 ${String.fromCharCode(65 + i)}`,
        monsterId: 'prestige_trial_minion',
        currentHp: minionHp,
        maxHp: minionHp,
        currentMp: 0,
        maxMp: 0,
        attack: minionAtk,
        defense: Math.round(bossDef * 0.5),
        speed: bossSpd,
        statusEffects: [],
        isAlive: true,
      });
    }
  }

  const skillStates: SkillState[] = SKILLS
    .filter((s) => s.characterId === saveData.characterId || s.characterId === 'common')
    .filter((s) => s.type !== 'passive')
    .map((s) => ({ skillId: s.id, currentCooldown: 0, isAvailable: true }));

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: totalStats.hp,
    maxHp: totalStats.hp,
    currentMp: totalStats.mp,
    maxMp: totalStats.mp,
    attack: totalStats.atk,
    defense: totalStats.def,
    speed: Math.round(totalStats.spd),
    statusEffects: [],
    isAlive: true,
  };

  const battleState: BattleState = {
    id: `trial_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    status: 'player_turn',
    turn: 1,
    player,
    enemies,
    actionQueue: [],
    log: [{ turn: 0, message: `시련의 수호자가 나타났습니다! (환생 Lv.${prestigeLv + 1} 시련)`, type: 'system' }],
    stats: { totalDamageDealt: 0, totalDamageTaken: 0, highestCrit: 0, turnsElapsed: 0, skillsUsed: 0 },
  };

  // Store battle state in maps
  const equippedIds = Object.values(saveData.equippedItems).filter(Boolean) as string[];
  const { statMods, actives: setActives } = calculateSetBonuses(equippedIds);
  const talentMods = calculatePassiveTreeBonuses(saveData.passiveTree?.allocatedNodes ?? []);
  const randOpts = calculateRandomOptionBonuses(saveData);

  battleStore.set(battleState.id, battleState);
  skillStateStore.set(battleState.id, skillStates);
  battleDungeonMap.set(battleState.id, '__prestige_trial__');
  battleCritMap.set(battleState.id, { critRate: totalStats.crit, critDamage: totalStats.critDmg });
  battleSetActiveMap.set(battleState.id, setActives);
  battlePrestigeMap.set(battleState.id, saveData.prestigeLevel ?? 0);
  battleArtifactMap.set(battleState.id, getArtifactBonuses(saveData.artifacts));
  battleSkillLevelMap.set(battleState.id, { ...(saveData.skillLevels ?? {}) });
  battleTalentMap.set(battleState.id, talentMods);
  battleTitleMap.set(battleState.id, saveData.equippedTitle ?? '');
  battleRandomOptionMap.set(battleState.id, {
    goldPercent: randOpts.goldPercent, expPercent: randOpts.expPercent,
    lifesteal: randOpts.lifesteal, reflect: randOpts.reflect, hpRegen: randOpts.hpRegen,
  });
  battlePetMap.set(battleState.id, (() => {
    if (!saveData.activePet) return undefined as any;
    const pet = PETS.find(p => p.id === saveData.activePet);
    if (!pet) return undefined as any;
    return { name: pet.name, attack: pet.attack, level: saveData.petLevels?.[saveData.activePet] ?? 0 };
  })());
  battleEquippedMap.set(battleState.id, equippedIds);
  battleProcState.set(battleState.id, { cooldowns: {}, activeBuffs: [] });
  battleKeystoneMap.set(battleState.id, totalStats.keystoneEffects.map(k => ({ id: k.id, ratio: k.ratio })));
  battleUndyingUsed.set(battleState.id, false);
  battleEquippedSkillsMap.set(battleState.id, saveData.equippedSkills ?? []);

  return { battleState, skillStates };
}
