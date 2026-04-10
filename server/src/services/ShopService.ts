import type { SaveData, ShopItem } from '../../../shared/types';
import { ITEMS } from '../../../shared/data';
import * as GameService from './GameService';

// ── Constants ──

const SHOP_REFRESH_MS = 2 * 60 * 60 * 1000; // 2 hours
const EQUIP_SLOT_COUNT = 6;

const EQUIP_TYPES = new Set(['weapon', 'shield', 'helm', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'accessory']);

const RARITY_WEIGHTS = [
  { rarity: 'common', weight: 40, price: 200 },
  { rarity: 'uncommon', weight: 30, price: 1000 },
  { rarity: 'rare', weight: 20, price: 5000 },
  { rarity: 'epic', weight: 8, price: 25000 },
  { rarity: 'legendary', weight: 2, price: 100000 },
];

const POTION_SHOP: { itemId: string; price: number }[] = [
  { itemId: 'hp_potion_small', price: 25 },
  { itemId: 'hp_potion_medium', price: 80 },
  { itemId: 'mp_potion_small', price: 40 },
];

// ── Helpers ──

function rollRarity(): { rarity: string; price: number } {
  const totalWeight = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const r of RARITY_WEIGHTS) {
    roll -= r.weight;
    if (roll <= 0) return { rarity: r.rarity, price: r.price };
  }
  return RARITY_WEIGHTS[0];
}

function generateEquipStock(characterId: string): ShopItem[] {
  const stock: ShopItem[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < EQUIP_SLOT_COUNT; i++) {
    const { rarity, price } = rollRarity();
    const pool = ITEMS.filter(
      (item) => item.requiredClass === characterId && item.rarity === rarity && EQUIP_TYPES.has(item.type) && !usedIds.has(item.id),
    );
    if (pool.length === 0) continue;

    const item = pool[Math.floor(Math.random() * pool.length)];
    usedIds.add(item.id);
    stock.push({ itemId: item.id, price, sold: false });
  }

  return stock;
}

// ── Public API ──

/** Get or refresh shop stock. Returns updated saveData fields. */
export function getShop(saveData: SaveData): { potions: typeof POTION_SHOP; equipment: ShopItem[]; refreshAt: string } {
  const now = Date.now();
  const refreshAt = new Date(saveData.shopRefreshAt || 0).getTime();

  // Refresh if expired or empty
  if (now >= refreshAt || saveData.shopStock.length === 0) {
    saveData.shopStock = generateEquipStock(saveData.characterId);
    saveData.shopRefreshAt = new Date(now + SHOP_REFRESH_MS).toISOString();
  }

  return {
    potions: POTION_SHOP,
    equipment: saveData.shopStock,
    refreshAt: saveData.shopRefreshAt,
  };
}

/** Buy a potion (unlimited) */
export function buyPotion(saveData: SaveData, itemId: string, quantity: number): { success: boolean; error?: string } {
  const potion = POTION_SHOP.find((p) => p.itemId === itemId);
  if (!potion) return { success: false, error: 'Invalid potion' };
  if (quantity <= 0) return { success: false, error: 'Invalid quantity' };

  const totalCost = potion.price * quantity;
  if (saveData.gold < totalCost) return { success: false, error: 'Gold가 부족합니다' };

  saveData.gold -= totalCost;
  GameService.addItem(saveData, itemId, quantity);

  return { success: true };
}

/** Buy an equipment from shop stock */
export function buyEquipment(saveData: SaveData, itemId: string): { success: boolean; enhanced?: boolean; error?: string } {
  // Refresh if needed
  getShop(saveData);

  const shopItem = saveData.shopStock.find((s) => s.itemId === itemId && !s.sold);
  if (!shopItem) return { success: false, error: '해당 상품이 없거나 이미 판매됨' };

  if (saveData.gold < shopItem.price) return { success: false, error: 'Gold가 부족합니다' };

  saveData.gold -= shopItem.price;
  shopItem.sold = true;

  // addItemSmart handles auto-enhancement
  const result = GameService.addItemSmart(saveData, itemId, 1);
  return { success: result.success, enhanced: result.enhanced, error: result.error };
}
