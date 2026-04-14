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
];
