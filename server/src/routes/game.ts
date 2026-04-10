import { Router, type Request, type Response } from 'express';
import { CHARACTERS, DUNGEONS, SKILLS } from '../../../shared/data';

const router = Router();

// ── GET /characters ──────────────────────────────────────────
router.get('/characters', (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, data: CHARACTERS });
  } catch (err) {
    console.error('[game/characters]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── GET /dungeons ────────────────────────────────────────────
router.get('/dungeons', (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, data: DUNGEONS });
  } catch (err) {
    console.error('[game/dungeons]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── GET /skills/:characterId ─────────────────────────────────
router.get('/skills/:characterId', (req: Request, res: Response): void => {
  try {
    const { characterId } = req.params;

    const character = CHARACTERS.find((c) => c.id === characterId);
    if (!character) {
      res.status(404).json({ success: false, message: 'Character not found' });
      return;
    }

    const characterSkills = SKILLS.filter((s) => s.characterId === characterId || s.characterId === 'common');

    res.json({ success: true, data: characterSkills });
  } catch (err) {
    console.error('[game/skills]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
