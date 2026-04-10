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
];
