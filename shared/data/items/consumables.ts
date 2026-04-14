import type { Item } from '../../types/item';

export const CONSUMABLES: Item[] = [
  {
    id: 'hp_potion_small', name: '소형 체력 포션', description: 'HP를 50 회복한다.',
    type: 'consumable', rarity: 'common', iconUrl: '/assets/items/hp_potion_small.svg',
    stackable: true, maxStack: 99, sellPrice: 10,
    useEffect: { type: 'heal_hp', value: 50 },
  },
  {
    id: 'hp_potion_medium', name: '중형 체력 포션', description: 'HP를 120 회복한다.',
    type: 'consumable', rarity: 'uncommon', iconUrl: '/assets/items/hp_potion_medium.svg',
    stackable: true, maxStack: 99, sellPrice: 30,
    useEffect: { type: 'heal_hp', value: 120 },
  },
  {
    id: 'mp_potion_small', name: '소형 마나 포션', description: 'MP를 30 회복한다.',
    type: 'consumable', rarity: 'common', iconUrl: '/assets/items/mp_potion_small.svg',
    stackable: true, maxStack: 99, sellPrice: 15,
    useEffect: { type: 'heal_mp', value: 30 },
  },
  {
    id: 'hp_potion_large', name: '대형 체력 포션', description: 'HP를 300 회복한다.',
    type: 'consumable', rarity: 'rare', iconUrl: '/assets/items/hp_potion_large.svg',
    stackable: true, maxStack: 99, sellPrice: 100,
    useEffect: { type: 'heal_hp', value: 300 },
  },
  {
    id: 'buff_potion_atk', name: '힘의 물약', description: '3턴간 공격력 20 증가.',
    type: 'consumable', rarity: 'uncommon', iconUrl: '/assets/items/buff_potion_atk.svg',
    stackable: true, maxStack: 99, sellPrice: 80,
    useEffect: { type: 'buff_attack', value: 20, duration: 3 },
  },
  {
    id: 'buff_potion_def', name: '강철의 물약', description: '3턴간 방어력 20 증가.',
    type: 'consumable', rarity: 'uncommon', iconUrl: '/assets/items/buff_potion_def.svg',
    stackable: true, maxStack: 99, sellPrice: 80,
    useEffect: { type: 'buff_defense', value: 20, duration: 3 },
  },

  // Enhancement stones
  {
    id: 'enhance_stone_common', name: '일반 강화석', description: '장비 강화 경험치 1을 제공한다.',
    type: 'material', rarity: 'common', iconUrl: '/assets/items/enhance_stone_common.svg',
    stackable: true, maxStack: 999, sellPrice: 50,
  },
  {
    id: 'enhance_stone_uncommon', name: '고급 강화석', description: '장비 강화 경험치 3을 제공한다.',
    type: 'material', rarity: 'uncommon', iconUrl: '/assets/items/enhance_stone_uncommon.svg',
    stackable: true, maxStack: 999, sellPrice: 200,
  },
  {
    id: 'enhance_stone_rare', name: '희귀 강화석', description: '장비 강화 경험치 10을 제공한다.',
    type: 'material', rarity: 'rare', iconUrl: '/assets/items/enhance_stone_rare.svg',
    stackable: true, maxStack: 999, sellPrice: 1000,
  },
  {
    id: 'enhance_stone_epic', name: '영웅 강화석', description: '장비 강화 경험치 30을 제공한다.',
    type: 'material', rarity: 'epic', iconUrl: '/assets/items/enhance_stone_epic.svg',
    stackable: true, maxStack: 999, sellPrice: 5000,
  },
  {
    id: 'enhance_stone_legendary', name: '전설 강화석', description: '장비 강화 경험치 100을 제공한다.',
    type: 'material', rarity: 'legendary', iconUrl: '/assets/items/enhance_stone_legendary.svg',
    stackable: true, maxStack: 999, sellPrice: 20000,
  },
];
