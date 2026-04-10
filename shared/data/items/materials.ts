import type { Item } from '../../types/item';

export const MATERIALS: Item[] = [
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
];
