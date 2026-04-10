export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  iconUrl: string;
  stackable: boolean;
  maxStack: number;
  sellPrice: number;
  stats?: Partial<ItemStats>;
  useEffect?: UseEffect;
  requiredClass?: CharacterClass;
}

import type { CharacterClass } from './character';

export type ItemType = 'weapon' | 'shield' | 'helm' | 'shoulders' | 'chest' | 'gloves' | 'belt' | 'legs' | 'boots' | 'accessory' | 'consumable' | 'material';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemStats {
  attack: number;
  defense: number;
  hp: number;
  mp: number;
  speed: number;
  critRate: number;
  critDamage: number;
}

export interface UseEffect {
  type: 'heal_hp' | 'heal_mp' | 'buff_attack' | 'buff_defense';
  value: number;
  duration?: number;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
}
