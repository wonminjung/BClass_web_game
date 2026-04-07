import type { SaveData, BestiaryEntry } from '../../../shared/types';
import { ITEMS } from '../../../shared/data';

// ────────────────────────────────────────────────────────────
// Experience & Level-Up
// ────────────────────────────────────────────────────────────

/**
 * Exp-to-next formula: level * 100.
 */
function expToNextLevel(level: number): number {
  return level * 100;
}

export interface LevelUpResult {
  levelsGained: number;
  newLevel: number;
  totalExp: number;
}

/**
 * Add experience to the save data and process level-ups.
 * Stat increases per level: +15 HP, +5 MP, +3 ATK, +2 DEF, +1 SPD.
 * (Stats are calculated at runtime from level, not stored, but we
 *  track level/exp here.)
 */
export function gainExp(saveData: SaveData, amount: number): LevelUpResult {
  if (amount <= 0) return { levelsGained: 0, newLevel: saveData.level, totalExp: saveData.exp };

  let levelsGained = 0;
  saveData.exp += amount;

  let threshold = expToNextLevel(saveData.level);
  while (saveData.exp >= threshold) {
    saveData.exp -= threshold;
    saveData.level += 1;
    levelsGained += 1;
    threshold = expToNextLevel(saveData.level);
  }

  return {
    levelsGained,
    newLevel: saveData.level,
    totalExp: saveData.exp,
  };
}

// ────────────────────────────────────────────────────────────
// Inventory management
// ────────────────────────────────────────────────────────────

export function addItem(
  saveData: SaveData,
  itemId: string,
  quantity: number,
): { success: boolean; error?: string } {
  if (quantity <= 0) return { success: false, error: 'Quantity must be positive' };

  const itemDef = ITEMS.find((i) => i.id === itemId);
  if (!itemDef) return { success: false, error: 'Item not found' };

  const existing = saveData.inventory.find((s) => s.itemId === itemId);

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > itemDef.maxStack) {
      return { success: false, error: `Cannot exceed max stack of ${itemDef.maxStack}` };
    }
    existing.quantity = newQty;
  } else {
    if (quantity > itemDef.maxStack) {
      return { success: false, error: `Cannot exceed max stack of ${itemDef.maxStack}` };
    }
    saveData.inventory.push({ itemId, quantity });
  }

  return { success: true };
}

export function removeItem(
  saveData: SaveData,
  itemId: string,
  quantity: number,
): { success: boolean; error?: string } {
  if (quantity <= 0) return { success: false, error: 'Quantity must be positive' };

  const slotIndex = saveData.inventory.findIndex((s) => s.itemId === itemId);
  if (slotIndex === -1) return { success: false, error: 'Item not in inventory' };

  const slot = saveData.inventory[slotIndex];
  if (slot.quantity < quantity) {
    return { success: false, error: 'Not enough items' };
  }

  slot.quantity -= quantity;
  if (slot.quantity === 0) {
    saveData.inventory.splice(slotIndex, 1);
  }

  return { success: true };
}

// ────────────────────────────────────────────────────────────
// Bestiary
// ────────────────────────────────────────────────────────────

export function addBestiaryEntry(saveData: SaveData, monsterId: string): void {
  const entry = saveData.bestiary.find((b) => b.monsterId === monsterId);
  if (entry) {
    entry.killCount += 1;
  } else {
    const newEntry: BestiaryEntry = {
      monsterId,
      killCount: 1,
      firstKilledAt: new Date().toISOString(),
    };
    saveData.bestiary.push(newEntry);
  }
}
