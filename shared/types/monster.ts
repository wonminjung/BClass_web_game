export interface Monster {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  stats: MonsterStats;
  skills: MonsterSkill[];
  drops: Drop[];
  expReward: number;
  goldReward: { min: number; max: number };
}

export interface MonsterStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface MonsterSkill {
  id: string;
  name: string;
  damageMultiplier: number;
  targetType: 'single' | 'all';
  statusEffect: {
    type: string;
    duration: number;
    value: number;
  } | null;
  weight: number;
}

export interface Drop {
  itemId: string;
  chance: number;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  imageUrl: string;
  waves: DungeonWave[];
  rewards: { gold: number; exp: number };
}

export interface DungeonWave {
  monsters: { monsterId: string; count: number }[];
}
