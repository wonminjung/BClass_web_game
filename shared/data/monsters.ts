import type { Monster } from '../types/monster';

export const MONSTERS: Monster[] = [
  {
    id: 'rotting_ghoul',
    name: '부패한 구울',
    description: '썩어가는 살점 사이로 독기를 내뿜는 언데드.',
    imageUrl: '/assets/monsters/rotting_ghoul.png',
    stats: { hp: 120, maxHp: 120, attack: 25, defense: 10, speed: 20 },
    skills: [
      { id: 'mg_bite', name: '썩은 이빨', damageMultiplier: 1.0, targetType: 'single', statusEffect: { type: 'poison', duration: 2, value: 5 }, weight: 60 },
      { id: 'mg_scratch', name: '할퀴기', damageMultiplier: 1.3, targetType: 'single', statusEffect: null, weight: 40 },
    ],
    drops: [{ itemId: 'ghoul_fang', chance: 0.4 }, { itemId: 'hp_potion_small', chance: 0.3 }],
    expReward: 30, goldReward: { min: 10, max: 25 },
  },
  {
    id: 'shadow_spider',
    name: '그림자 거미',
    description: '어둠 속에서 거대한 그물을 치고 기다리는 독거미.',
    imageUrl: '/assets/monsters/shadow_spider.png',
    stats: { hp: 90, maxHp: 90, attack: 35, defense: 8, speed: 45 },
    skills: [
      { id: 'ms_venom_spit', name: '독액 분사', damageMultiplier: 1.2, targetType: 'single', statusEffect: { type: 'poison', duration: 3, value: 8 }, weight: 50 },
      { id: 'ms_web', name: '거미줄 포박', damageMultiplier: 0.5, targetType: 'single', statusEffect: { type: 'stun', duration: 1, value: 0 }, weight: 30 },
      { id: 'ms_fang', name: '맹독 송곳니', damageMultiplier: 1.8, targetType: 'single', statusEffect: null, weight: 20 },
    ],
    drops: [{ itemId: 'spider_silk', chance: 0.5 }, { itemId: 'venom_sac', chance: 0.2 }],
    expReward: 35, goldReward: { min: 12, max: 30 },
  },
  {
    id: 'cursed_knight',
    name: '저주받은 기사',
    description: '죽어서도 맹세를 지키는 저주받은 망령 기사.',
    imageUrl: '/assets/monsters/cursed_knight.png',
    stats: { hp: 200, maxHp: 200, attack: 40, defense: 30, speed: 25 },
    skills: [
      { id: 'mk_slash', name: '저주의 검격', damageMultiplier: 1.5, targetType: 'single', statusEffect: null, weight: 50 },
      { id: 'mk_shield', name: '유령 방패', damageMultiplier: 0, targetType: 'single', statusEffect: { type: 'defense_up', duration: 2, value: 20 }, weight: 30 },
      { id: 'mk_cleave', name: '원혼 강타', damageMultiplier: 1.1, targetType: 'all', statusEffect: null, weight: 20 },
    ],
    drops: [{ itemId: 'cursed_steel', chance: 0.3 }, { itemId: 'knight_emblem', chance: 0.1 }],
    expReward: 60, goldReward: { min: 25, max: 50 },
  },
  {
    id: 'blood_demon',
    name: '피의 악마',
    description: '생명의 피를 탐하는 하급 악마. 흡혈로 자신을 치유한다.',
    imageUrl: '/assets/monsters/blood_demon.png',
    stats: { hp: 280, maxHp: 280, attack: 50, defense: 25, speed: 35 },
    skills: [
      { id: 'md_blood_claw', name: '피의 발톱', damageMultiplier: 1.6, targetType: 'single', statusEffect: { type: 'bleed', duration: 2, value: 10 }, weight: 40 },
      { id: 'md_drain', name: '생명 흡수', damageMultiplier: 1.2, targetType: 'single', statusEffect: null, weight: 35 },
      { id: 'md_howl', name: '공포의 포효', damageMultiplier: 0.8, targetType: 'all', statusEffect: { type: 'attack_up', duration: 2, value: 15 }, weight: 25 },
    ],
    drops: [{ itemId: 'demon_blood', chance: 0.35 }, { itemId: 'hp_potion_medium', chance: 0.25 }],
    expReward: 90, goldReward: { min: 40, max: 80 },
  },
  {
    id: 'abyss_lord',
    name: '심연의 군주',
    description: '던전 최심부를 지배하는 고대의 공포. 수많은 모험가의 무덤이 그를 둘러싸고 있다.',
    imageUrl: '/assets/monsters/abyss_lord.png',
    stats: { hp: 500, maxHp: 500, attack: 70, defense: 40, speed: 30 },
    skills: [
      { id: 'mb_void_strike', name: '공허 강타', damageMultiplier: 2.0, targetType: 'single', statusEffect: null, weight: 30 },
      { id: 'mb_dark_wave', name: '암흑파', damageMultiplier: 1.3, targetType: 'all', statusEffect: { type: 'defense_down', duration: 2, value: 15 }, weight: 30 },
      { id: 'mb_devour', name: '포식', damageMultiplier: 1.5, targetType: 'single', statusEffect: { type: 'stun', duration: 1, value: 0 }, weight: 20 },
      { id: 'mb_regen', name: '암흑 재생', damageMultiplier: 0, targetType: 'single', statusEffect: { type: 'regen', duration: 3, value: 5 }, weight: 20 },
    ],
    drops: [{ itemId: 'abyss_core', chance: 0.15 }, { itemId: 'legendary_shard', chance: 0.05 }],
    expReward: 200, goldReward: { min: 100, max: 200 },
  },
];
