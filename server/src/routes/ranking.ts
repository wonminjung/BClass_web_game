import { Router, type Request, type Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import type { SaveData } from '../../../shared/types';

const router = Router();

const DB_PATH = path.join(process.cwd(), 'data', 'game.db');

// ── GET /abyss ──────────────────────────────────────────────
router.get('/abyss', (_req: Request, res: Response): void => {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db.prepare('SELECT data FROM saves').all() as { data: string }[];
    db.close();

    const entries: {
      playerName: string;
      characterId: string;
      level: number;
      abyssHighest: number;
      prestigeLevel: number;
    }[] = [];

    for (const row of rows) {
      try {
        const save = JSON.parse(row.data) as SaveData;
        entries.push({
          playerName: save.playerName,
          characterId: save.characterId,
          level: save.level,
          abyssHighest: save.abyssHighest ?? 0,
          prestigeLevel: save.prestigeLevel ?? 0,
        });
      } catch {
        // Skip malformed entries
      }
    }

    // Sort by abyssHighest descending, then level descending
    entries.sort((a, b) => b.abyssHighest - a.abyssHighest || b.level - a.level);

    // Return top 20
    const top20 = entries.slice(0, 20);

    res.json({ success: true, data: top20 });
  } catch (err) {
    console.error('[ranking/abyss]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
