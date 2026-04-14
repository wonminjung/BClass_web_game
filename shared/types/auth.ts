import type { RandomOption } from './item';

export interface SaveData {
  saveCode: string;
  playerName: string;
  characterId: string;
  level: number;
  exp: number;
  gold: number;
  gems: number;
  inventory: { itemId: string; quantity: number }[];
  equippedItems: Record<string, string | null>;
  enhanceLevels: Record<string, { level: number; exp: number }>;
  bestiary: BestiaryEntry[];
  dungeonProgress: Record<string, DungeonRecord>;
  clearedDungeons: string[];
  abyssFloor: number;
  abyssHighest: number;
  shopStock: ShopItem[];
  shopRefreshAt: string;
  dropHistory: DropRecord[];
  achievements: string[];  // completed achievement IDs
  totalKills: number;
  lastDailyReward: string;
  socketedGems: Record<string, string[]>;  // itemId → gem IDs array
  skillLevels: Record<string, number>;  // skillId → level
  prestigeLevel: number;
  lastWeeklyBoss: string;  // ISO date of last weekly boss attempt
  talentPoints: Record<string, number>;  // talentId → invested levels
  equippedTitle: string;  // title ID
  artifacts: Record<string, number>;  // artifactId → level
  ownedPets: string[];     // owned pet IDs
  activePet: string;       // equipped pet ID
  itemOptions: Record<string, RandomOption[]>;  // itemId -> random options
  gachaPity: number;  // pulls since last mythic drop
  blessings: { type: string; expiresAt: string }[];
  appearance: { color: string };
  createdAt: string;
  lastPlayedAt: string;
}

export interface BestiaryEntry {
  monsterId: string;
  killCount: number;
  firstKilledAt: string;
}

export interface DungeonRecord {
  dungeonId: string;
  cleared: boolean;
  bestTime: number;
  clearCount: number;
}

export interface AuthRequest {
  saveCode: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: SaveData;
  token?: string;
}

export interface DropRecord {
  itemId: string;
  source: string;
  date: string;
}

export interface ShopItem {
  itemId: string;
  price: number;
  sold: boolean;
}

export interface NewGameRequest {
  playerName: string;
  characterId: string;
}
