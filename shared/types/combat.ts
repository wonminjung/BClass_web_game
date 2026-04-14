export interface BattleStats {
  totalDamageDealt: number;
  totalDamageTaken: number;
  highestCrit: number;
  turnsElapsed: number;
  skillsUsed: number;
}

export interface BattleState {
  id: string;
  status: 'waiting' | 'player_turn' | 'enemy_turn' | 'animating' | 'victory' | 'defeat';
  turn: number;
  player: BattleFighter;
  enemies: BattleFighter[];
  actionQueue: BattleAction[];
  log: BattleLogEntry[];
  stats?: BattleStats;
}

export interface BattleFighter {
  id: string;
  name: string;
  monsterId?: string;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  statusEffects: ActiveStatusEffect[];
  isAlive: boolean;
}

export interface ActiveStatusEffect {
  type: string;
  remainingTurns: number;
  value: number;
}

export interface BattleAction {
  type: 'skill' | 'item' | 'status_tick';
  actorId: string;
  targetIds: string[];
  skillId?: string;
  itemId?: string;
}

export interface BattleResult {
  actionType: string;
  actorId: string;
  targetId: string;
  damage: number;
  heal: number;
  isCritical: boolean;
  statusApplied: string | null;
  targetDefeated: boolean;
}

export interface BattleLogEntry {
  turn: number;
  message: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'defeat' | 'system';
}

export interface BattleRewards {
  exp: number;
  gold: number;
  items: { itemId: string; quantity: number }[];
}
