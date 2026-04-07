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
import { CHARACTERS, SKILLS, MONSTERS, DUNGEONS } from '../../../shared/data';

// ────────────────────────────────────────────────────────────
// Battle state store (keyed by battle id)
// ────────────────────────────────────────────────────────────
const battleStore = new Map<string, BattleState>();
const skillStateStore = new Map<string, SkillState[]>();
const battleDungeonMap = new Map<string, string>();

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

  // Build player fighter from base stats + level scaling
  const levelBonus = saveData.level - 1;
  const player: BattleFighter = {
    id: 'player',
    name: saveData.playerName,
    currentHp: character.baseStats.maxHp + levelBonus * 15,
    maxHp: character.baseStats.maxHp + levelBonus * 15,
    currentMp: character.baseStats.maxMp + levelBonus * 5,
    maxMp: character.baseStats.maxMp + levelBonus * 5,
    attack: character.baseStats.attack + levelBonus * 3,
    defense: character.baseStats.defense + levelBonus * 2,
    speed: character.baseStats.speed + levelBonus * 1,
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
  const characterSkills = SKILLS.filter((s) => s.characterId === saveData.characterId);
  const skillStates: SkillState[] = characterSkills.map((s) => ({
    skillId: s.id,
    currentCooldown: 0,
    isAvailable: s.type === 'active',
  }));

  battleStore.set(battleState.id, battleState);
  skillStateStore.set(battleState.id, skillStates);
  battleDungeonMap.set(battleState.id, dungeonId);

  return { battleState, skillStates };
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

  // Resolve character for crit stats
  const character = CHARACTERS.find((c) => c.id === skill.characterId);
  const baseCritRate = character?.baseStats.critRate ?? 0.1;
  const baseCritDmg = character?.baseStats.critDamage ?? 1.5;

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

export function checkBattleEnd(battleState: BattleState): 'victory' | 'defeat' | null {
  if (!battleState.player.isAlive) return 'defeat';
  if (battleState.enemies.every((e) => !e.isAlive)) return 'victory';
  return null;
}

// ────────────────────────────────────────────────────────────
// calculateRewards
// ────────────────────────────────────────────────────────────

export function calculateRewards(battleId: string): BattleRewards | null {
  const battleState = battleStore.get(battleId);
  const dungeonId = battleDungeonMap.get(battleId);
  if (!battleState || !dungeonId) return null;

  const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
  if (!dungeon) return null;

  let totalExp = dungeon.rewards.exp;
  let totalGold = dungeon.rewards.gold;
  const items: { itemId: string; quantity: number }[] = [];

  // Add per-monster rewards
  for (const enemy of battleState.enemies) {
    const monsterData = MONSTERS.find((m) => enemy.name.startsWith(m.name));
    if (!monsterData) continue;

    totalExp += monsterData.expReward;
    totalGold += Math.floor(
      monsterData.goldReward.min + Math.random() * (monsterData.goldReward.max - monsterData.goldReward.min),
    );

    // Roll drops
    for (const drop of monsterData.drops) {
      if (Math.random() < drop.chance) {
        const existing = items.find((i) => i.itemId === drop.itemId);
        if (existing) {
          existing.quantity += 1;
        } else {
          items.push({ itemId: drop.itemId, quantity: 1 });
        }
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
}
