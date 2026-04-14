import { Router, type Request, type Response } from 'express';
import { validate } from '../middleware/validate';
import * as AuthService from '../services/AuthService';
import { RECIPES } from '../../../shared/data/recipes';
import { ITEMS } from '../../../shared/data';

const router = Router();

function extractSaveCode(req: Request, res: Response): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    return null;
  }
  const token = authHeader.slice(7);
  const saveCode = AuthService.verifyToken(token);
  if (!saveCode) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
  return saveCode;
}

// ── GET /recipes ────────────────────────────────────────────
router.get('/recipes', (req: Request, res: Response): void => {
  try {
    const saveCode = extractSaveCode(req, res);
    if (!saveCode) return;

    const saveData = AuthService.getSaveData(saveCode);
    if (!saveData) {
      res.status(404).json({ success: false, message: 'Save data not found' });
      return;
    }

    const recipes = RECIPES.map((recipe) => {
      const materialsStatus = recipe.materials.map((mat) => {
        const owned = saveData.inventory.find((s) => s.itemId === mat.itemId)?.quantity ?? 0;
        const itemDef = ITEMS.find((i) => i.id === mat.itemId);
        return {
          itemId: mat.itemId,
          itemName: itemDef?.name ?? mat.itemId,
          required: mat.quantity,
          owned,
          sufficient: owned >= mat.quantity,
        };
      });

      const canCraft = materialsStatus.every((m) => m.sufficient) && saveData.gold >= recipe.goldCost;

      return {
        ...recipe,
        materialsStatus,
        canCraft,
      };
    });

    res.json({ success: true, recipes, gold: saveData.gold, gems: saveData.gems });
  } catch (err) {
    console.error('[craft/recipes]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /make ──────────────────────────────────────────────
router.post(
  '/make',
  validate([{ name: 'recipeId', type: 'string', minLength: 1 }]),
  (req: Request, res: Response): void => {
    try {
      const saveCode = extractSaveCode(req, res);
      if (!saveCode) return;

      const saveData = AuthService.getSaveData(saveCode);
      if (!saveData) {
        res.status(404).json({ success: false, message: 'Save data not found' });
        return;
      }

      const { recipeId } = req.body;
      const recipe = RECIPES.find((r) => r.id === recipeId);
      if (!recipe) {
        res.status(400).json({ success: false, message: 'Recipe not found' });
        return;
      }

      // Check gold
      if (saveData.gold < recipe.goldCost) {
        res.status(400).json({ success: false, message: 'Gold 부족' });
        return;
      }

      // Check materials
      for (const mat of recipe.materials) {
        const slot = saveData.inventory.find((s) => s.itemId === mat.itemId);
        if (!slot || slot.quantity < mat.quantity) {
          const itemDef = ITEMS.find((i) => i.id === mat.itemId);
          res.status(400).json({ success: false, message: `재료 부족: ${itemDef?.name ?? mat.itemId}` });
          return;
        }
      }

      // Deduct gold
      saveData.gold -= recipe.goldCost;

      // Deduct materials
      for (const mat of recipe.materials) {
        const slot = saveData.inventory.find((s) => s.itemId === mat.itemId);
        if (slot) {
          slot.quantity -= mat.quantity;
          if (slot.quantity <= 0) {
            saveData.inventory = saveData.inventory.filter((s) => s.itemId !== mat.itemId);
          }
        }
      }

      // Give result
      if (recipe.resultItemId === '__gems__') {
        saveData.gems = (saveData.gems ?? 0) + recipe.resultQuantity;
      } else {
        const existing = saveData.inventory.find((s) => s.itemId === recipe.resultItemId);
        if (existing) {
          existing.quantity += recipe.resultQuantity;
        } else {
          saveData.inventory.push({ itemId: recipe.resultItemId, quantity: recipe.resultQuantity });
        }
      }

      AuthService.saveProgress(saveCode, saveData);

      const resultName = recipe.resultItemId === '__gems__'
        ? `젬 x${recipe.resultQuantity}`
        : `${ITEMS.find((i) => i.id === recipe.resultItemId)?.name ?? recipe.resultItemId} x${recipe.resultQuantity}`;

      res.json({ success: true, message: `제작 완료: ${resultName}`, saveData });
    } catch (err) {
      console.error('[craft/make]', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
