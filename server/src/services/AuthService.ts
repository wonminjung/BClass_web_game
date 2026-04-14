import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import path from 'path';
import type { SaveData } from '../../../shared/types';
import { CHARACTERS } from '../../../shared/data';

// ────────────────────────────────────────────────────────────
// SQLite database
// ────────────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), 'data', 'game.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS saves (
    save_code TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_played_at TEXT NOT NULL
  )
`);

// Prepared statements
const stmtGet = db.prepare('SELECT data FROM saves WHERE save_code = ?');
const stmtUpsert = db.prepare(`
  INSERT INTO saves (save_code, data, created_at, last_played_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(save_code) DO UPDATE SET
    data = excluded.data,
    last_played_at = excluded.last_played_at
`);
const stmtExists = db.prepare('SELECT 1 FROM saves WHERE save_code = ?');

function dbGet(saveCode: string): SaveData | null {
  const row = stmtGet.get(saveCode) as { data: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.data) as SaveData;
}

function dbSet(saveData: SaveData): void {
  stmtUpsert.run(
    saveData.saveCode,
    JSON.stringify(saveData),
    saveData.createdAt,
    saveData.lastPlayedAt,
  );
}

function dbHas(saveCode: string): boolean {
  return stmtExists.get(saveCode) !== undefined;
}

// ────────────────────────────────────────────────────────────
// AuthService
// ────────────────────────────────────────────────────────────

const SAVE_CODE_REGEX = /^[A-Za-z0-9]{8,16}$/;

function isValidSaveCode(code: string): boolean {
  return SAVE_CODE_REGEX.test(code);
}

export function login(saveCode: string): { data: SaveData | null; error?: string } {
  if (!isValidSaveCode(saveCode)) {
    return { data: null, error: 'Invalid save code format (alphanumeric, 8-16 characters)' };
  }

  const data = dbGet(saveCode);
  if (!data) {
    return { data: null, error: 'Save data not found' };
  }

  return { data };
}

export function createNewGame(
  playerName: string,
  characterId: string,
): { saveCode: string; data: SaveData } | { error: string } {
  const character = CHARACTERS.find((c) => c.id === characterId);
  if (!character) {
    return { error: 'Invalid character id' };
  }

  if (playerName.length < 1 || playerName.length > 20) {
    return { error: 'Player name must be 1-20 characters' };
  }

  const saveCode = uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
  const now = new Date().toISOString();

  const data: SaveData = {
    saveCode,
    playerName,
    characterId,
    level: 1,
    exp: 0,
    gold: 100,
    gems: 0,
    inventory: [
      { itemId: 'hp_potion_small', quantity: 3 },
      { itemId: 'mp_potion_small', quantity: 1 },
    ],
    equippedItems: { weapon: null, offhand: null, helm: null, shoulders: null, chest: null, gloves: null, belt: null, legs: null, boots: null, accessory: null },
    enhanceLevels: {},
    bestiary: [],
    dungeonProgress: {},
    clearedDungeons: [],
    abyssFloor: 0,
    abyssHighest: 0,
    shopStock: [],
    shopRefreshAt: now,
    dropHistory: [],
    achievements: [],
    totalKills: 0,
    lastDailyReward: '',
    socketedGems: {},
    skillLevels: {},
    prestigeLevel: 0,
    lastWeeklyBoss: '',
    talentPoints: {},
    equippedTitle: '',
    artifacts: {},
    ownedPets: [],
    activePet: '',
    itemOptions: {},
    gachaPity: 0,
    blessings: [],
    appearance: { color: '#8B5CF6' },
    createdAt: now,
    lastPlayedAt: now,
  };

  dbSet(data);

  return { saveCode, data };
}

export function saveProgress(saveCode: string, data: Partial<SaveData>): { success: boolean; error?: string } {
  if (!isValidSaveCode(saveCode)) {
    return { success: false, error: 'Invalid save code format' };
  }

  const existing = dbGet(saveCode);
  if (!existing) {
    return { success: false, error: 'Save data not found' };
  }

  const updated: SaveData = {
    ...existing,
    ...data,
    saveCode: existing.saveCode,
    createdAt: existing.createdAt,
    lastPlayedAt: new Date().toISOString(),
  };

  dbSet(updated);
  return { success: true };
}

// ────────────────────────────────────────────────────────────
// Token generation / verification (HMAC-SHA256 signed)
// ────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// SECRET: load from env or generate + persist to db
function getOrCreateSecret(): string {
  db.exec(`CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get('token_secret') as { value: string } | undefined;
  if (row) return row.value;

  const secret = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('token_secret', secret);
  return secret;
}

const SECRET = getOrCreateSecret();

function hmacSign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

export function generateToken(saveCode: string): string {
  const payload = JSON.stringify({ saveCode, iat: Date.now() });
  const encoded = Buffer.from(payload).toString('base64');
  const signature = hmacSign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): string | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;

    if (hmacSign(encoded) !== signature) return null;

    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const { saveCode, iat } = JSON.parse(decoded) as { saveCode: string; iat: number };

    if (!saveCode || typeof iat !== 'number') return null;
    if (Date.now() - iat > TOKEN_TTL_MS) return null;
    if (!dbHas(saveCode)) return null;

    return saveCode;
  } catch {
    return null;
  }
}

export function getSaveData(saveCode: string): SaveData | null {
  return dbGet(saveCode);
}
