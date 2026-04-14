import type { SaveData, BestiaryEntry } from '../../../shared/types';
import { ITEMS } from '../../../shared/data';
import { generateOptions } from './OptionService';

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
  shield: ['offhand'],
  offhand: ['offhand'],
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

const EQUIP_TYPES = new Set(['weapon', 'shield', 'offhand', 'helm', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'accessory']);
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

  // Equipment: check if already owned → auto-dismantle into enhancement stones
  if (ownsEquipment(saveData, itemId)) {
    const DISMANTLE_STONES: Record<string, string> = {
      common: 'enhance_stone_common',
      uncommon: 'enhance_stone_uncommon',
      rare: 'enhance_stone_rare',
      epic: 'enhance_stone_epic',
      legendary: 'enhance_stone_legendary',
      mythic: 'enhance_stone_legendary',
    };
    const stoneId = DISMANTLE_STONES[itemDef.rarity] ?? 'enhance_stone_common';
    addItem(saveData, stoneId, quantity);
    return { success: true, enhanced: false, dismantled: true };
  }

  // Equipment, first copy: add to inventory normally and generate random options
  const addResult = addItem(saveData, itemId, quantity);
  if (addResult.success) {
    if (!saveData.itemOptions) saveData.itemOptions = {};
    if (!saveData.itemOptions[itemId]) {
      saveData.itemOptions[itemId] = generateOptions(itemDef.rarity);
    }
  }
  return addResult;
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
// Gold Enhancement
// ────────────────────────────────────────────────────────────

const RARITY_BASE_GOLD: Record<string, number> = {
  common: 100,
  uncommon: 500,
  rare: 2000,
  epic: 10000,
  legendary: 50000,
  mythic: 100000,
};

/** Gold cost for enhancing to targetLevel */
export function goldEnhanceCost(rarity: string, targetLevel: number): number {
  const base = RARITY_BASE_GOLD[rarity] ?? 1000;
  return base * targetLevel * targetLevel;
}

/** Success rate for gold enhancement: max(5, 50 - (level-5)*1.5) */
export function goldEnhanceSuccessRate(targetLevel: number): number {
  if (targetLevel <= 5) return 50;
  return Math.max(5, 50 - (targetLevel - 5) * 1.5);
}

export interface GoldEnhanceResult {
  success: boolean;
  enhanced: boolean;
  goldSpent: number;
  successRate: number;
  error?: string;
}

export function enhanceWithGold(saveData: SaveData, itemId: string): GoldEnhanceResult {
  const itemDef = ITEMS.find((i) => i.id === itemId);
  if (!itemDef) return { success: false, enhanced: false, goldSpent: 0, successRate: 0, error: 'Item not found' };

  if (!EQUIP_TYPES.has(itemDef.type)) {
    return { success: false, enhanced: false, goldSpent: 0, successRate: 0, error: 'Equipment only' };
  }

  // Check ownership
  if (!ownsEquipment(saveData, itemId)) {
    return { success: false, enhanced: false, goldSpent: 0, successRate: 0, error: 'Item not owned' };
  }

  const entry = saveData.enhanceLevels[itemId] ?? { level: 0, exp: 0 };
  if (entry.level >= MAX_ENHANCE_LEVEL) {
    return { success: false, enhanced: false, goldSpent: 0, successRate: 0, error: 'Already max level' };
  }

  const targetLevel = entry.level + 1;
  const cost = goldEnhanceCost(itemDef.rarity, targetLevel);
  const rate = goldEnhanceSuccessRate(targetLevel);

  if (saveData.gold < cost) {
    return { success: false, enhanced: false, goldSpent: 0, successRate: rate, error: `Gold 부족 (필요: ${cost.toLocaleString()}G)` };
  }

  // Deduct gold
  saveData.gold -= cost;

  // Roll success
  const roll = Math.random() * 100;
  if (roll < rate) {
    entry.level = targetLevel;
    saveData.enhanceLevels[itemId] = entry;
    return { success: true, enhanced: true, goldSpent: cost, successRate: rate };
  }

  // Failed — gold lost, level stays
  saveData.enhanceLevels[itemId] = entry;
  return { success: true, enhanced: false, goldSpent: cost, successRate: rate };
}

/** Get gold enhance info for UI */
export function getGoldEnhanceInfo(saveData: SaveData, itemId: string): { cost: number; rate: number; currentLevel: number } | null {
  const itemDef = ITEMS.find((i) => i.id === itemId);
  if (!itemDef || !EQUIP_TYPES.has(itemDef.type)) return null;

  const entry = saveData.enhanceLevels[itemId] ?? { level: 0, exp: 0 };
  if (entry.level >= MAX_ENHANCE_LEVEL) return null;

  const targetLevel = entry.level + 1;
  return {
    cost: goldEnhanceCost(itemDef.rarity, targetLevel),
    rate: goldEnhanceSuccessRate(targetLevel),
    currentLevel: entry.level,
  };
}

// ────────────────────────────────────────────────────────────
// Enhancement Stone Usage
// ────────────────────────────────────────────────────────────

const ENHANCE_STONE_EXP: Record<string, number> = {
  'enhance_stone_common': 1,
  'enhance_stone_uncommon': 3,
  'enhance_stone_rare': 10,
  'enhance_stone_epic': 30,
  'enhance_stone_legendary': 100,
};

export function useEnhanceStone(saveData: SaveData, stoneId: string, targetItemId: string, quantity: number): { success: boolean; error?: string; beforeLevel?: number; afterLevel?: number; expAdded?: number; currentExp?: number; nextCost?: number } {
  const expPerStone = ENHANCE_STONE_EXP[stoneId];
  if (!expPerStone) return { success: false, error: 'Invalid enhancement stone' };

  if (quantity <= 0) return { success: false, error: 'Quantity must be positive' };

  const stoneSlot = saveData.inventory.find(s => s.itemId === stoneId);
  if (!stoneSlot || stoneSlot.quantity < quantity) return { success: false, error: 'Not enough enhancement stones' };

  if (!ownsEquipment(saveData, targetItemId)) return { success: false, error: 'Target item not owned' };

  const removed = removeItem(saveData, stoneId, quantity);
  if (!removed.success) return { success: false, error: removed.error };

  if (!saveData.enhanceLevels) saveData.enhanceLevels = {};
  const entry = saveData.enhanceLevels[targetItemId] ?? { level: 0, exp: 0 };
  const beforeLevel = entry.level;
  entry.exp += expPerStone * quantity;

  while (entry.level < MAX_ENHANCE_LEVEL) {
    const cost = enhanceCost(entry.level + 1);
    if (entry.exp < cost) break;
    entry.exp -= cost;
    entry.level += 1;
  }
  if (entry.level >= MAX_ENHANCE_LEVEL) { entry.level = MAX_ENHANCE_LEVEL; entry.exp = 0; }

  saveData.enhanceLevels[targetItemId] = entry;
  return {
    success: true,
    beforeLevel,
    afterLevel: entry.level,
    expAdded: expPerStone * quantity,
    currentExp: entry.exp,
    nextCost: entry.level < MAX_ENHANCE_LEVEL ? enhanceCost(entry.level + 1) : undefined,
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
