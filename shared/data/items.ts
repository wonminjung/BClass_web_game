import type { Item } from '../types/item';

export const ITEMS: Item[] = [
  // ── 소비 아이템 ──
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

  // ── 재료 아이템 ──
  {
    id: 'ghoul_fang', name: '구울의 송곳니', description: '부패한 구울에게서 뽑아낸 이빨.',
    type: 'material', rarity: 'common', iconUrl: '/assets/items/ghoul_fang.svg',
    stackable: true, maxStack: 99, sellPrice: 5,
  },
  {
    id: 'spider_silk', name: '그림자 거미줄', description: '강철보다 질긴 거미의 실.',
    type: 'material', rarity: 'common', iconUrl: '/assets/items/spider_silk.svg',
    stackable: true, maxStack: 99, sellPrice: 8,
  },
  {
    id: 'venom_sac', name: '독주머니', description: '치명적인 독이 담긴 주머니.',
    type: 'material', rarity: 'uncommon', iconUrl: '/assets/items/venom_sac.svg',
    stackable: true, maxStack: 99, sellPrice: 20,
  },
  {
    id: 'cursed_steel', name: '저주받은 강철', description: '저주의 기운이 서린 검은 강철 조각.',
    type: 'material', rarity: 'rare', iconUrl: '/assets/items/cursed_steel.svg',
    stackable: true, maxStack: 99, sellPrice: 50,
  },
  {
    id: 'knight_emblem', name: '기사의 문장', description: '한때 고귀했던 기사단의 잊혀진 문장.',
    type: 'material', rarity: 'rare', iconUrl: '/assets/items/knight_emblem.svg',
    stackable: true, maxStack: 99, sellPrice: 80,
  },
  {
    id: 'demon_blood', name: '악마의 피', description: '검붉게 빛나는 악마의 혈액. 사악한 힘이 느껴진다.',
    type: 'material', rarity: 'rare', iconUrl: '/assets/items/demon_blood.svg',
    stackable: true, maxStack: 99, sellPrice: 70,
  },
  {
    id: 'abyss_core', name: '심연의 핵', description: '심연의 군주에게서 떨어진 순수한 어둠의 결정.',
    type: 'material', rarity: 'epic', iconUrl: '/assets/items/abyss_core.svg',
    stackable: true, maxStack: 99, sellPrice: 200,
  },
  {
    id: 'legendary_shard', name: '전설의 파편', description: '전설 속 무기의 파편. 강렬한 힘의 파동이 느껴진다.',
    type: 'material', rarity: 'legendary', iconUrl: '/assets/items/legendary_shard.svg',
    stackable: true, maxStack: 99, sellPrice: 500,
  },

  // ── 장비 아이템 ──
  {
    id: 'iron_sword', name: '무쇠 검', description: '기본적인 철제 검.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/iron_sword.svg',
    stackable: false, maxStack: 1, sellPrice: 30,
    stats: { attack: 10 },
  },
  {
    id: 'shadow_blade', name: '그림자 단검', description: '어둠의 기운이 서린 날카로운 단검.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/shadow_blade.svg',
    stackable: false, maxStack: 1, sellPrice: 150,
    stats: { attack: 25, critRate: 0.05 },
  },
  {
    id: 'leather_armor', name: '가죽 갑옷', description: '가볍고 튼튼한 가죽 갑옷.',
    type: 'armor', rarity: 'common', iconUrl: '/assets/items/leather_armor.svg',
    stackable: false, maxStack: 1, sellPrice: 40,
    stats: { defense: 8, hp: 20 },
  },
  {
    id: 'bone_ring', name: '뼈의 반지', description: '망자의 뼈로 만든 저주받은 반지.',
    type: 'accessory', rarity: 'uncommon', iconUrl: '/assets/items/bone_ring.svg',
    stackable: false, maxStack: 1, sellPrice: 60,
    stats: { attack: 5, critDamage: 0.1 },
  },
];
