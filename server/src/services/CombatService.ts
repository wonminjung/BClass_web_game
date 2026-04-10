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
import { CHARACTERS, SKILLS, MONSTERS, DUNGEONS, ITEMS } from '../../../shared/data';

// ────────────────────────────────────────────────────────────
// Battle state store (keyed by battle id)
// ────────────────────────────────────────────────────────────
const battleStore = new Map<string, BattleState>();
const skillStateStore = new Map<string, SkillState[]>();
const battleDungeonMap = new Map<string, string>();
const battleCritMap = new Map<string, { critRate: number; critDamage: number }>();
const battleWaveMap = new Map<string, { current: number; total: number; dungeonId: string; saveData: SaveData }>();

export function getBattle(id: string): BattleState | undefined {
  return battleStore.get(id);
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

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: character.baseStats.maxHp + levelBonus * 15 + equipHp,
    maxHp: character.baseStats.maxHp + levelBonus * 15 + equipHp,
    currentMp: character.baseStats.maxMp + levelBonus * 5 + equipMp,
    maxMp: character.baseStats.maxMp + levelBonus * 5 + equipMp,
    attack: character.baseStats.attack + levelBonus * 3 + equipAtk,
    defense: character.baseStats.defense + levelBonus * 2 + equipDef,
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

  battleStore.set(battleState.id, battleState);
  skillStateStore.set(battleState.id, skillStates);
  battleDungeonMap.set(battleState.id, dungeonId);
  battleCritMap.set(battleState.id, {
    critRate: character.baseStats.critRate + equipCritRate,
    critDamage: character.baseStats.critDamage + equipCritDmg,
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

  // Check stun
  if (player.statusEffects.some((e) => e.type === 'stun')) {
    player.statusEffects = player.statusEffects.filter((e) => e.type !== 'stun');
    battleState.log.push({ turn: battleState.turn, message: `${player.name}은(는) 기절 상태라 행동할 수 없다!`, type: 'system' });
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

  for (const target of targets) {
    const isCrit = Math.random() < baseCritRate;
    let damage = 0;
    let heal = 0;

    // Damage
    if (skill.damageMultiplier > 0 && target.id !== 'player') {
      damage = calculateDamage(player.attack, target.defense, skill.damageMultiplier, isCrit, baseCritDmg);
      target.currentHp = Math.max(0, target.currentHp - damage);
      target.isAlive = target.currentHp > 0;
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

  for (const enemy of battleState.enemies) {
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
    const monsterData = MONSTERS.find((m) => enemy.name.startsWith(m.name));
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

    const damage = calculateDamage(enemy.attack, player.defense, chosen.damageMultiplier, false);
    player.currentHp = Math.max(0, player.currentHp - damage);
    player.isAlive = player.currentHp > 0;

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

  // Advance turn
  battleState.turn += 1;
  battleState.status = 'player_turn';

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
  }

  // Log
  const logEntry: BattleLogEntry = {
    turn: battleState.turn,
    message: `${player.name}이(가) ${itemDef.name}을(를) 사용했다! (${type === 'heal_hp' ? 'HP' : 'MP'} +${heal})`,
    type: 'heal',
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
    const monsterData = MONSTERS.find((m) => enemy.name.startsWith(m.name));
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

    // Roll equipment drop
    if (lootTable) {
      const isBoss = BOSS_IDS.has(monsterData.id);
      const dropRate = isBoss ? BOSS_EQUIP_DROP_RATE : MOB_EQUIP_DROP_RATE;

      if (Math.random() < dropRate) {
        const rarity = isBoss
          ? rollBossRarity(lootTable.bossRarity)
          : lootTable.mobRarity;
        const equipId = rollEquipment(characterId, rarity);
        if (equipId) addDrop(equipId);
      }
    }
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
  battleWaveMap.delete(id);
  abyssFloorMap.delete(id);
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

  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: character.baseStats.maxHp + levelBonus * 15 + equipHp,
    maxHp: character.baseStats.maxHp + levelBonus * 15 + equipHp,
    currentMp: character.baseStats.maxMp + levelBonus * 5 + equipMp,
    maxMp: character.baseStats.maxMp + levelBonus * 5 + equipMp,
    attack: character.baseStats.attack + levelBonus * 3 + equipAtk,
    defense: character.baseStats.defense + levelBonus * 2 + equipDef,
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
    log: [],
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
    critRate: character.baseStats.critRate + equipCritRate,
    critDamage: character.baseStats.critDamage + equipCritDmg,
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

  // Equipment drops - legendary only
  for (const enemy of battleState.enemies) {
    const isBoss = isBossFloor; // all enemies on boss floor count as boss
    const dropRate = isBoss ? 1.0 : abyssDropRate(floor);

    if (Math.random() < dropRate) {
      const equipId = rollEquipment(characterId, 'legendary');
      if (equipId) addDrop(equipId);
    }
  }

  return { exp: totalExp, gold: totalGold, items };
}
