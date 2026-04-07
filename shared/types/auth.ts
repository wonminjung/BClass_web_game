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
  bestiary: BestiaryEntry[];
  dungeonProgress: Record<string, DungeonRecord>;
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

export interface NewGameRequest {
  playerName: string;
  characterId: string;
}
