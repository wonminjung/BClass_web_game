import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import { PETS } from '../../../shared/data';

const router = Router();

// ── GET / ── list all pets with owned status ────────────────
router.get('/', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Missing authorization' });
      return;
    }
    const token = authHeader.slice(7);
    const saveCode = AuthService.verifyToken(token);
    if (!saveCode) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const ownedPets = saveData.ownedPets ?? [];
    const activePet = saveData.activePet ?? '';

    const petsWithStatus = PETS.map((pet) => ({
      ...pet,
      owned: ownedPets.includes(pet.id),
      active: activePet === pet.id,
    }));

    res.json({ success: true, data: petsWithStatus });
  } catch (err) {
    console.error('[pets/list]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /summon ── summon (purchase) a pet with gems ───────
router.post(
  '/summon',
  validate([{ name: 'petId', type: 'string', minLength: 1 }]),
  (req: Request, res: Response): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Missing authorization' });
        return;
      }
      const token = authHeader.slice(7);
      const saveCode = AuthService.verifyToken(token);
      if (!saveCode) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { petId } = req.body;
      const pet = PETS.find((p) => p.id === petId);
      if (!pet) {
        res.status(404).json({ success: false, message: 'Pet not found' });
        return;
      }

      // Defensive init
      if (!saveData.ownedPets) saveData.ownedPets = [];

      if (saveData.ownedPets.includes(petId)) {
        res.status(400).json({ success: false, message: '이미 소유한 펫입니다' });
        return;
      }

      if (saveData.gems < pet.summonCost) {
        res.status(400).json({ success: false, message: `젬이 부족합니다 (필요: ${pet.summonCost})` });
        return;
      }

      saveData.gems -= pet.summonCost;
      saveData.ownedPets.push(petId);

      AuthService.saveProgress(saveCode, saveData);

      res.json({ success: true, message: `${pet.name}을(를) 소환했습니다!`, saveData });
    } catch (err) {
      console.error('[pets/summon]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

// ── POST /equip ── equip a pet ──────────────────────────────
router.post(
  '/equip',
  validate([{ name: 'petId', type: 'string', minLength: 0 }]),
  (req: Request, res: Response): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Missing authorization' });
        return;
      }
      const token = authHeader.slice(7);
      const saveCode = AuthService.verifyToken(token);
      if (!saveCode) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { petId } = req.body;

      // Allow unequipping by passing empty string
      if (petId === '') {
        saveData.activePet = '';
        AuthService.saveProgress(saveCode, saveData);
        res.json({ success: true, message: '펫을 해제했습니다', saveData });
        return;
      }

      // Defensive init
      if (!saveData.ownedPets) saveData.ownedPets = [];

      if (!saveData.ownedPets.includes(petId)) {
        res.status(400).json({ success: false, message: '소유하지 않은 펫입니다' });
        return;
      }

      saveData.activePet = petId;
      AuthService.saveProgress(saveCode, saveData);

      const pet = PETS.find((p) => p.id === petId);
      res.json({ success: true, message: `${pet?.name ?? petId}을(를) 장착했습니다!`, saveData });
    } catch (err) {
      console.error('[pets/equip]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
