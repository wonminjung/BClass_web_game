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
  setId?: string;
}

import type { CharacterClass } from './character';

export type ItemType = 'weapon' | 'shield' | 'offhand' | 'helm' | 'shoulders' | 'chest' | 'gloves' | 'belt' | 'legs' | 'boots' | 'accessory' | 'consumable' | 'material';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

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

export interface Gem {
  id: string;
  name: string;
  description: string;
  stat: keyof ItemStats;
  value: number;
  cost: number; // gems currency
}

export interface RandomOption {
  stat: string;    // 'atk_flat' | 'atk_percent' | 'def_flat' | 'hp_flat' | 'hp_percent' | 'crit_rate' | 'crit_damage' | 'gold_percent' | 'exp_percent' | 'speed' | 'lifesteal' | 'reflect' | 'hp_regen'
  value: number;
}
