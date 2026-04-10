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
// Use consumable item
// ────────────────────────────────────────────────────────────

export interface UseItemResult {
  success: boolean;
  error?: string;
  effect?: { type: string; value: number };
}

export function useItem(saveData: SaveData, itemId: string): UseItemResult {
  const itemDef = ITEMS.find((i) => i.id === itemId);
  if (!itemDef) return { success: false, error: 'Item not found' };
  if (itemDef.type !== 'consumable') return { success: false, error: 'Item is not consumable' };
  if (!itemDef.useEffect) return { success: false, error: 'Item has no use effect' };

  // Check inventory
  const slot = saveData.inventory.find((s) => s.itemId === itemId);
  if (!slot || slot.quantity <= 0) return { success: false, error: 'Item not in inventory' };

  // Apply effect (out-of-combat usage: heal_hp / heal_mp only)
  const { type, value } = itemDef.useEffect;
  if (type !== 'heal_hp' && type !== 'heal_mp') {
    return { success: false, error: 'This item can only be used in combat' };
  }

  // Consume 1 item
  const removed = removeItem(saveData, itemId, 1);
  if (!removed.success) return { success: false, error: removed.error };

  return { success: true, effect: { type, value } };
}

// ────────────────────────────────────────────────────────────
// Equip / Unequip item
// ────────────────────────────────────────────────────────────

const EQUIP_SLOT_MAP: Record<string, string[]> = {
  weapon: ['weapon'],
  shield: ['shield'],
  helm: ['helm'],
  shoulders: ['shoulders'],
  chest: ['chest'],
  gloves: ['gloves'],
  belt: ['belt'],
  legs: ['legs'],
  boots: ['boots'],
  accessory: ['accessory'],
};

export interface EquipItemResult {
  success: boolean;
  error?: string;
  unequippedItemId?: string | null;
}

export function equipItem(
  saveData: SaveData,
  itemId: string,
  slot: string,
): EquipItemResult {
  const itemDef = ITEMS.find((i) => i.id === itemId);
  if (!itemDef) return { success: false, error: 'Item not found' };

  // Validate class restriction
  if (itemDef.requiredClass && itemDef.requiredClass !== saveData.characterId) {
    return { success: false, error: 'This item cannot be equipped by your class' };
  }

  // Validate item type matches slot
  const validSlots = EQUIP_SLOT_MAP[itemDef.type];
  if (!validSlots || !validSlots.includes(slot)) {
    return { success: false, error: `Cannot equip ${itemDef.type} in ${slot} slot` };
  }

  // Check inventory
  const invSlot = saveData.inventory.find((s) => s.itemId === itemId);
  if (!invSlot || invSlot.quantity <= 0) return { success: false, error: 'Item not in inventory' };

  // Unequip current item in that slot (return to inventory)
  const currentEquipped = saveData.equippedItems[slot];
  if (currentEquipped) {
    addItem(saveData, currentEquipped, 1);
  }

  // Remove new item from inventory and equip
  removeItem(saveData, itemId, 1);
  saveData.equippedItems[slot] = itemId;

  return { success: true, unequippedItemId: currentEquipped };
}

export function unequipItem(
  saveData: SaveData,
  slot: string,
): { success: boolean; error?: string } {
  const currentEquipped = saveData.equippedItems[slot];
  if (!currentEquipped) return { success: false, error: 'No item equipped in that slot' };

  // Return to inventory
  const added = addItem(saveData, currentEquipped, 1);
  if (!added.success) return { success: false, error: added.error };

  saveData.equippedItems[slot] = null;
  return { success: true };
}

// ────────────────────────────────────────────────────────────
// Equipment Enhancement
// ────────────────────────────────────────────────────────────

const EQUIP_TYPES = new Set(['weapon', 'shield', 'helm', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'accessory']);
const MAX_ENHANCE_LEVEL = 99;

/**
 * Cost to go from (level) to (level+1).
 * +1: 2, +2: 2, +3: 4, +4: 8, +5: 16, ...
 * Formula: level <= 1 ? 2 : 2^level
 */
export function enhanceCost(targetLevel: number): number {
  return targetLevel <= 2 ? 2 : Math.pow(2, targetLevel - 1);
}

/** Stat multiplier at a given enhance level: 1 + level (so +1 = 2x, +2 = 3x, ...) */
export function enhanceMultiplier(level: number): number {
  return 1 + level;
}

/** Check if player already owns this equipment (inventory or equipped) */
function ownsEquipment(saveData: SaveData, itemId: string): boolean {
  const inInventory = saveData.inventory.some((s) => s.itemId === itemId);
  if (inInventory) return true;
  return Object.values(saveData.equippedItems).some((id) => id === itemId);
}

/**
 * Add an item intelligently: if it's equipment and already owned,
 * convert to enhance exp instead. Returns what happened.
 */
export function addItemSmart(
  saveData: SaveData,
  itemId: string,
  quantity: number,
): { success: boolean; enhanced?: boolean; error?: string } {
  const itemDef = ITEMS.find((i) => i.id === itemId);
  if (!itemDef) return { success: false, error: 'Item not found' };

  // Non-equipment: normal add
  if (!EQUIP_TYPES.has(itemDef.type)) {
    return addItem(saveData, itemId, quantity);
  }

  // Equipment: check if already owned
  if (ownsEquipment(saveData, itemId)) {
    // Feed into enhancement
    const entry = saveData.enhanceLevels[itemId] ?? { level: 0, exp: 0 };
    entry.exp += quantity;

    // Process level-ups
    while (entry.level < MAX_ENHANCE_LEVEL) {
      const cost = enhanceCost(entry.level + 1);
      if (entry.exp < cost) break;
      entry.exp -= cost;
      entry.level += 1;
    }

    // Cap at max level
    if (entry.level >= MAX_ENHANCE_LEVEL) {
      entry.level = MAX_ENHANCE_LEVEL;
      entry.exp = 0;
    }

    saveData.enhanceLevels[itemId] = entry;
    return { success: true, enhanced: true };
  }

  // Equipment, first copy: add to inventory normally
  return addItem(saveData, itemId, quantity);
}

export interface EnhanceInfo {
  level: number;
  exp: number;
  nextCost: number | null;
  multiplier: number;
}

/** Get enhancement info for an item */
export function getEnhanceInfo(saveData: SaveData, itemId: string): EnhanceInfo {
  const entry = saveData.enhanceLevels[itemId] ?? { level: 0, exp: 0 };
  return {
    level: entry.level,
    exp: entry.exp,
    nextCost: entry.level < MAX_ENHANCE_LEVEL ? enhanceCost(entry.level + 1) : null,
    multiplier: enhanceMultiplier(entry.level),
  };
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
