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
  abyssFloor: number;
  abyssHighest: number;
  shopStock: ShopItem[];
  shopRefreshAt: string;
  dropHistory: DropRecord[];
  achievements: string[];  // completed achievement IDs
  totalKills: number;
  lastDailyReward: string;
  skillLevels: Record<string, number>;  // skillId → level
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
