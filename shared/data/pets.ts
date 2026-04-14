export interface Pet {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  bonus: { stat: string; value: number }[];
  summonCost: number; // gems
}

export const PETS: Pet[] = [
  { id: 'pet_wolf', name: '그림자 늑대', description: '어둠에서 태어난 충직한 늑대', rarity: 'common', bonus: [{ stat: 'atkPercent', value: 3 }], summonCost: 20 },
  { id: 'pet_cat', name: '마법 고양이', description: '마력을 감지하는 신비로운 고양이', rarity: 'common', bonus: [{ stat: 'mpPercent', value: 5 }], summonCost: 20 },
  { id: 'pet_turtle', name: '고대 거북', description: '천년을 살아온 현명한 거북', rarity: 'common', bonus: [{ stat: 'defPercent', value: 3 }], summonCost: 20 },
  { id: 'pet_eagle', name: '매의 눈', description: '하늘의 지배자, 날카로운 눈을 가진 독수리', rarity: 'rare', bonus: [{ stat: 'critRateFlat', value: 0.03 }], summonCost: 50 },
  { id: 'pet_phoenix', name: '불사조', description: '불꽃에서 다시 태어나는 전설의 새', rarity: 'rare', bonus: [{ stat: 'hpPercent', value: 5 }, { stat: 'atkPercent', value: 3 }], summonCost: 50 },
  { id: 'pet_dragon', name: '아기 용', description: '성장하면 무시무시한 용이 될 아기 드래곤', rarity: 'epic', bonus: [{ stat: 'atkPercent', value: 8 }, { stat: 'defPercent', value: 5 }], summonCost: 100 },
  { id: 'pet_unicorn', name: '유니콘', description: '신성한 빛을 발하는 전설의 말', rarity: 'epic', bonus: [{ stat: 'hpPercent', value: 8 }, { stat: 'mpPercent', value: 8 }], summonCost: 100 },
  { id: 'pet_demon', name: '지옥 사냥개', description: '지옥에서 소환된 맹렬한 사냥개', rarity: 'legendary', bonus: [{ stat: 'atkPercent', value: 12 }, { stat: 'critRateFlat', value: 0.05 }], summonCost: 200 },
  { id: 'pet_angel', name: '수호 천사', description: '하늘에서 내려온 수호의 천사', rarity: 'legendary', bonus: [{ stat: 'hpPercent', value: 10 }, { stat: 'defPercent', value: 10 }, { stat: 'mpPercent', value: 10 }], summonCost: 200 },
];
