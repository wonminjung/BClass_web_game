import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { SaveData } from '../../../shared/types';
import { CHARACTERS } from '../../../shared/data';

// ────────────────────────────────────────────────────────────
// In-memory save store  (simulates a database)
// ────────────────────────────────────────────────────────────
const saveStore = new Map<string, SaveData>();

// ────────────────────────────────────────────────────────────
// AuthService
// ────────────────────────────────────────────────────────────

const SAVE_CODE_REGEX = /^[A-Za-z0-9]{8,16}$/;

/**
 * Validate save-code format (alphanumeric, 8-16 chars).
 */
function isValidSaveCode(code: string): boolean {
  return SAVE_CODE_REGEX.test(code);
}

/**
 * Log in with an existing save code.
 * Returns the stored SaveData or null if not found.
 */
export function login(saveCode: string): { data: SaveData | null; error?: string } {
  if (!isValidSaveCode(saveCode)) {
    return { data: null, error: 'Invalid save code format (alphanumeric, 8-16 characters)' };
  }

  const data = saveStore.get(saveCode) ?? null;
  if (!data) {
    return { data: null, error: 'Save data not found' };
  }

  return { data };
}

/**
 * Create a brand new game save.
 */
export function createNewGame(
  playerName: string,
  characterId: string,
): { saveCode: string; data: SaveData } | { error: string } {
  // Validate character exists
  const character = CHARACTERS.find((c) => c.id === characterId);
  if (!character) {
    return { error: 'Invalid character id' };
  }

  // Validate player name length
  if (playerName.length < 1 || playerName.length > 20) {
    return { error: 'Player name must be 1-20 characters' };
  }

  // Generate a UUID-based save code (strip hyphens, take first 12 chars)
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
    equippedItems: { weapon: null, armor: null, accessory: null },
    bestiary: [],
    dungeonProgress: {},
    createdAt: now,
    lastPlayedAt: now,
  };

  saveStore.set(saveCode, data);

  return { saveCode, data };
}

/**
 * Persist save progress (updates lastPlayedAt automatically).
 */
export function saveProgress(saveCode: string, data: Partial<SaveData>): { success: boolean; error?: string } {
  if (!isValidSaveCode(saveCode)) {
    return { success: false, error: 'Invalid save code format' };
  }

  const existing = saveStore.get(saveCode);
  if (!existing) {
    return { success: false, error: 'Save data not found' };
  }

  // Merge incoming fields, but force-update lastPlayedAt
  const updated: SaveData = {
    ...existing,
    ...data,
    saveCode: existing.saveCode,       // prevent code overwrite
    createdAt: existing.createdAt,     // prevent creation date overwrite
    lastPlayedAt: new Date().toISOString(),
  };

  saveStore.set(saveCode, updated);
  return { success: true };
}

// ────────────────────────────────────────────────────────────
// Token generation / verification (HMAC-SHA256 signed)
// ────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SECRET = crypto.randomBytes(32).toString('hex'); // 서버 시작 시 자동 생성

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

    // 서명 검증
    if (hmacSign(encoded) !== signature) return null;

    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const { saveCode, iat } = JSON.parse(decoded) as { saveCode: string; iat: number };

    if (!saveCode || typeof iat !== 'number') return null;
    if (Date.now() - iat > TOKEN_TTL_MS) return null;
    if (!saveStore.has(saveCode)) return null;

    return saveCode;
  } catch {
    return null;
  }
}

/**
 * Look up save data by code (used internally after token verification).
 */
export function getSaveData(saveCode: string): SaveData | null {
  return saveStore.get(saveCode) ?? null;
}
