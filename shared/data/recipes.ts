export interface Recipe {
  id: string;
  name: string;
  description: string;
  resultItemId: string;
  resultQuantity: number;
  materials: { itemId: string; quantity: number }[];
  goldCost: number;
}

export const RECIPES: Recipe[] = [
  // Potions
  {
    id: 'craft_hp_medium', name: '중형 체력 포션 제작', description: '재료를 사용하여 중형 체력 포션을 만듭니다.',
    resultItemId: 'hp_potion_medium', resultQuantity: 3,
    materials: [{ itemId: 'ghoul_fang', quantity: 5 }, { itemId: 'demon_blood', quantity: 2 }], goldCost: 500,
  },
  {
    id: 'craft_mp_small', name: '소형 마나 포션 제작', description: '재료를 사용하여 소형 마나 포션을 만듭니다.',
    resultItemId: 'mp_potion_small', resultQuantity: 5,
    materials: [{ itemId: 'spider_silk', quantity: 3 }, { itemId: 'venom_sac', quantity: 2 }], goldCost: 300,
  },
  // Special crafting materials -> gems
  {
    id: 'craft_gems_1', name: '젬 정제', description: '희귀 재료에서 젬을 추출합니다.',
    resultItemId: '__gems__', resultQuantity: 5,
    materials: [{ itemId: 'abyss_core', quantity: 3 }], goldCost: 10000,
  },
  {
    id: 'craft_gems_2', name: '전설 젬 정제', description: '전설 재료에서 대량의 젬을 추출합니다.',
    resultItemId: '__gems__', resultQuantity: 20,
    materials: [{ itemId: 'legendary_shard', quantity: 2 }], goldCost: 50000,
  },

  // Enhancement stone crafting
  {
    id: 'craft_stone_common', name: '일반 강화석 제작', description: '기본 재료로 강화석을 만듭니다.',
    resultItemId: 'enhance_stone_common', resultQuantity: 5,
    materials: [{ itemId: 'ghoul_fang', quantity: 10 }], goldCost: 100,
  },
  {
    id: 'craft_stone_common_2', name: '일반 강화석 제작 II', description: '거미줄로 강화석을 만듭니다.',
    resultItemId: 'enhance_stone_common', resultQuantity: 5,
    materials: [{ itemId: 'spider_silk', quantity: 8 }], goldCost: 100,
  },
  {
    id: 'craft_stone_uncommon', name: '고급 강화석 제작', description: '독과 강철로 고급 강화석을 만듭니다.',
    resultItemId: 'enhance_stone_uncommon', resultQuantity: 3,
    materials: [{ itemId: 'venom_sac', quantity: 5 }, { itemId: 'cursed_steel', quantity: 3 }], goldCost: 500,
  },
  {
    id: 'craft_stone_rare', name: '희귀 강화석 제작', description: '악마의 피로 희귀 강화석을 만듭니다.',
    resultItemId: 'enhance_stone_rare', resultQuantity: 2,
    materials: [{ itemId: 'demon_blood', quantity: 5 }, { itemId: 'knight_emblem', quantity: 3 }], goldCost: 2000,
  },
  {
    id: 'craft_stone_epic', name: '영웅 강화석 제작', description: '심연의 핵으로 영웅 강화석을 만듭니다.',
    resultItemId: 'enhance_stone_epic', resultQuantity: 1,
    materials: [{ itemId: 'abyss_core', quantity: 5 }], goldCost: 10000,
  },
  {
    id: 'craft_stone_legendary', name: '전설 강화석 제작', description: '전설의 파편으로 전설 강화석을 만듭니다.',
    resultItemId: 'enhance_stone_legendary', resultQuantity: 1,
    materials: [{ itemId: 'legendary_shard', quantity: 3 }], goldCost: 30000,
  },

  // Stone tier-up
  {
    id: 'craft_stone_up_1', name: '강화석 승급 (일반→고급)', description: '일반 강화석 3개를 고급 1개로.',
    resultItemId: 'enhance_stone_uncommon', resultQuantity: 1,
    materials: [{ itemId: 'enhance_stone_common', quantity: 3 }], goldCost: 200,
  },
  {
    id: 'craft_stone_up_2', name: '강화석 승급 (고급→희귀)', description: '고급 강화석 3개를 희귀 1개로.',
    resultItemId: 'enhance_stone_rare', resultQuantity: 1,
    materials: [{ itemId: 'enhance_stone_uncommon', quantity: 3 }], goldCost: 1000,
  },
  {
    id: 'craft_stone_up_3', name: '강화석 승급 (희귀→영웅)', description: '희귀 강화석 3개를 영웅 1개로.',
    resultItemId: 'enhance_stone_epic', resultQuantity: 1,
    materials: [{ itemId: 'enhance_stone_rare', quantity: 3 }], goldCost: 5000,
  },
  {
    id: 'craft_stone_up_4', name: '강화석 승급 (영웅→전설)', description: '영웅 강화석 3개를 전설 1개로.',
    resultItemId: 'enhance_stone_legendary', resultQuantity: 1,
    materials: [{ itemId: 'enhance_stone_epic', quantity: 3 }], goldCost: 20000,
  },
];
