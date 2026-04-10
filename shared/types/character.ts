export interface CharacterStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  classType: CharacterClass;
  description: string;
  baseStats: CharacterStats;
  skillIds: string[];
  portraitUrl: string;
}

export type CharacterClass =
  | 'dark_knight'
  | 'shadow_mage'
  | 'hunter'
  | 'priest'
  | 'assassin';

export interface PlayerCharacter extends Character {
  level: number;
  exp: number;
  expToNext: number;
  currentStats: CharacterStats;
  equippedItems: Record<EquipSlot, string | null>;
}

export type EquipSlot = 'weapon' | 'shield' | 'helm' | 'shoulders' | 'chest' | 'gloves' | 'belt' | 'legs' | 'boots' | 'accessory';
