import type { Dungeon } from '../types/monster';

export const DUNGEONS: Dungeon[] = [
  {
    id: 'forsaken_crypt',
    name: '버려진 지하묘지',
    description: '잊혀진 망자들이 배회하는 어둠의 지하. 썩은 냄새와 신음이 가득하다.',
    requiredLevel: 1,
    imageUrl: '/assets/dungeons/forsaken_crypt.png',
    waves: [
      { monsters: [{ monsterId: 'rotting_ghoul', count: 2 }] },
      { monsters: [{ monsterId: 'rotting_ghoul', count: 1 }, { monsterId: 'shadow_spider', count: 1 }] },
      { monsters: [{ monsterId: 'shadow_spider', count: 3 }] },
    ],
    rewards: { gold: 50, exp: 80 },
  },
  {
    id: 'haunted_fortress',
    name: '유령 요새',
    description: '폐허가 된 전쟁 요새. 저주받은 병사들의 망령이 아직도 순찰하고 있다.',
    requiredLevel: 5,
    imageUrl: '/assets/dungeons/haunted_fortress.png',
    waves: [
      { monsters: [{ monsterId: 'cursed_knight', count: 1 }, { monsterId: 'rotting_ghoul', count: 2 }] },
      { monsters: [{ monsterId: 'cursed_knight', count: 2 }] },
      { monsters: [{ monsterId: 'cursed_knight', count: 1 }, { monsterId: 'shadow_spider', count: 2 }] },
    ],
    rewards: { gold: 120, exp: 180 },
  },
  {
    id: 'blood_sanctum',
    name: '핏빛 성소',
    description: '악마 숭배자들이 의식을 행하던 금단의 성소. 벽에서 피가 흐르고 있다.',
    requiredLevel: 10,
    imageUrl: '/assets/dungeons/blood_sanctum.png',
    waves: [
      { monsters: [{ monsterId: 'blood_demon', count: 1 }, { monsterId: 'shadow_spider', count: 2 }] },
      { monsters: [{ monsterId: 'blood_demon', count: 2 }] },
      { monsters: [{ monsterId: 'blood_demon', count: 1 }, { monsterId: 'cursed_knight', count: 2 }] },
    ],
    rewards: { gold: 250, exp: 350 },
  },
  {
    id: 'abyss_gate',
    name: '심연의 문',
    description: '세계의 끝자락에 위치한 심연으로 통하는 문. 이곳에서 돌아온 자는 없다.',
    requiredLevel: 15,
    imageUrl: '/assets/dungeons/abyss_gate.png',
    waves: [
      { monsters: [{ monsterId: 'blood_demon', count: 2 }, { monsterId: 'cursed_knight', count: 1 }] },
      { monsters: [{ monsterId: 'blood_demon', count: 1 }, { monsterId: 'cursed_knight', count: 2 }] },
      { monsters: [{ monsterId: 'abyss_lord', count: 1 }] },
    ],
    rewards: { gold: 500, exp: 600 },
  },
];
