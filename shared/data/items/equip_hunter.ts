import type { Item } from '../../types/item';

/** 사냥꾼 전용 장비 */
export const EQUIP_HUNTER: Item[] = [
  // --- Legendary (전설) ---
  {
    id: 'leg_thoridal', name: '토리달 - 별의 분노', description: '태양샘 고원에서 드랍되는 전설적인 활입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_bow_07.svg',
    stackable: false, maxStack: 1, sellPrice: 60000, requiredClass: 'hunter',
    stats: { attack: 260, critRate: 0.12, critDamage: 0.25 },
  },
  // --- Common (일반) ---
  {
    id: 'cmn_bow_01', name: '사냥꾼의 나무 활', description: '기본적인 사냥용 나무 활입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_weapon_bow_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'hunter',
    stats: { attack: 14 }
  },
  {
    id: 'cmn_gun_01', name: '조잡한 나팔총', description: '소리만 요란하고 위력은 그저 그런 화승총입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_weapon_rifle_01.svg',
    stackable: false, maxStack: 1, sellPrice: 6, requiredClass: 'hunter',
    stats: { attack: 16 }
  },
  {
    id: 'cmn_chest_01', name: '사냥꾼의 낡은 사슬 흉갑', description: '초보 사냥꾼에게 지급되는 가벼운 사슬 갑옷입니다.',
    type: 'chest', rarity: 'common', iconUrl: '/assets/items/inv_chest_chain_01.svg',
    stackable: false, maxStack: 1, sellPrice: 8, requiredClass: 'hunter',
    stats: { defense: 22, hp: 15 }
  },
  {
    id: 'cmn_legs_01', name: '징집병의 사슬 다리보호구', description: '활동성을 고려해 만들어진 다리보호구입니다.',
    type: 'legs', rarity: 'common', iconUrl: '/assets/items/inv_pants_chain_01.svg',
    stackable: false, maxStack: 1, sellPrice: 7, requiredClass: 'hunter',
    stats: { defense: 20, hp: 12 }
  },
  {
    id: 'cmn_helm_01', name: '야영지 사슬 두건', description: '바람을 막아주는 얇은 사슬 두건입니다.',
    type: 'helm', rarity: 'common', iconUrl: '/assets/items/inv_helmet_05.svg',
    stackable: false, maxStack: 1, sellPrice: 6, requiredClass: 'hunter',
    stats: { defense: 18, hp: 10 }
  },
  {
    id: 'cmn_boots_01', name: '튼튼한 사냥 장화', description: '장거리 추적에 적합하게 밑창을 보강했습니다.',
    type: 'boots', rarity: 'common', iconUrl: '/assets/items/inv_boots_chain_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'hunter',
    stats: { defense: 15, hp: 8 }
  },
  {
    id: 'cmn_gloves_01', name: '궁수의 가죽장갑', description: '활시위를 당길 때 손가락을 보호해 줍니다.',
    type: 'gloves', rarity: 'common', iconUrl: '/assets/items/inv_gauntlets_02.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'hunter',
    stats: { defense: 12, hp: 5 }
  },
  {
    id: 'cmn_shoulders_01', name: '녹슨 사슬 어깨보호대', description: '관리가 덜 되어 녹이 슨 방어구입니다.',
    type: 'shoulders', rarity: 'common', iconUrl: '/assets/items/inv_shoulder_05.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'hunter',
    stats: { defense: 16, hp: 8 }
  },
  {
    id: 'cmn_belt_01', name: '사냥꾼의 탄띠', description: '총알이나 화살을 꽂아둘 수 있는 허리띠입니다.',
    type: 'belt', rarity: 'common', iconUrl: '/assets/items/inv_belt_05.svg',
    stackable: false, maxStack: 1, sellPrice: 3, requiredClass: 'hunter',
    stats: { defense: 10, hp: 5 }
  },
  {
    id: 'cmn_axe_01', name: '벌목용 손도끼', description: '근접전이 벌어졌을 때 호신용으로 쓰는 작은 도끼입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_axe_05.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'hunter',
    stats: { attack: 12 }
  },

  // --- Uncommon (고급) ---
  {
    id: 'unc_bow_01', name: '테로카르 굽은활', description: '테로카르 숲의 질긴 나무로 만든 굽은활입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_weapon_bow_02.svg',
    stackable: false, maxStack: 1, sellPrice: 150, requiredClass: 'hunter',
    stats: { attack: 38, critRate: 0.02 }
  },
  {
    id: 'unc_gun_01', name: '지옥무쇠 머스킷총', description: '지옥무쇠로 총열을 강화한 튼튼한 총입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_weapon_rifle_02.svg',
    stackable: false, maxStack: 1, sellPrice: 160, requiredClass: 'hunter',
    stats: { attack: 42, critDamage: 0.05 }
  },
  {
    id: 'unc_chest_01', name: '장가르비늘 흉갑', description: '늪지대 생물의 비늘을 엮어 만든 사슬 갑옷입니다.',
    type: 'chest', rarity: 'uncommon', iconUrl: '/assets/items/inv_chest_chain_02.svg',
    stackable: false, maxStack: 1, sellPrice: 180, requiredClass: 'hunter',
    stats: { defense: 45, hp: 40 }
  },
  {
    id: 'unc_legs_01', name: '지옥무쇠 사슬 다리보호구', description: '아웃랜드 초반 사냥꾼들의 든든한 다리 방어구입니다.',
    type: 'legs', rarity: 'uncommon', iconUrl: '/assets/items/inv_pants_chain_02.svg',
    stackable: false, maxStack: 1, sellPrice: 160, requiredClass: 'hunter',
    stats: { defense: 40, hp: 35 }
  },
  {
    id: 'unc_helm_01', name: '추적자의 사슬 두건', description: '사냥감을 추적할 때 주변 환경과 동화되도록 돕습니다.',
    type: 'helm', rarity: 'uncommon', iconUrl: '/assets/items/inv_helmet_06.svg',
    stackable: false, maxStack: 1, sellPrice: 140, requiredClass: 'hunter',
    stats: { defense: 35, hp: 30 }
  },
  {
    id: 'unc_boots_01', name: '나그란드 배회자의 장화', description: '발소리를 죽여주는 특수 사슬 장화입니다.',
    type: 'boots', rarity: 'uncommon', iconUrl: '/assets/items/inv_boots_chain_02.svg',
    stackable: false, maxStack: 1, sellPrice: 100, requiredClass: 'hunter',
    stats: { defense: 25, hp: 20 }
  },
  {
    id: 'unc_shoulders_01', name: '칼날산맥 순찰자의 어깨보호대', description: '날카로운 바위로부터 어깨를 보호합니다.',
    type: 'shoulders', rarity: 'uncommon', iconUrl: '/assets/items/inv_shoulder_06.svg',
    stackable: false, maxStack: 1, sellPrice: 120, requiredClass: 'hunter',
    stats: { defense: 30, hp: 25 }
  },
  {
    id: 'unc_belt_01', name: '매의 눈 요대', description: '멀리 볼 수 있는 집중력을 기르는데 도움을 줍니다.',
    type: 'belt', rarity: 'uncommon', iconUrl: '/assets/items/inv_belt_06.svg',
    stackable: false, maxStack: 1, sellPrice: 90, requiredClass: 'hunter',
    stats: { defense: 20, hp: 15, critRate: 0.01 }
  },
  {
    id: 'unc_polearm_01', name: '갈가마귀 창', description: '야수들이 접근했을 때 거리를 벌리기 좋은 미늘창입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_spear_01.svg',
    stackable: false, maxStack: 1, sellPrice: 130, requiredClass: 'hunter',
    stats: { attack: 35, critRate: 0.02 }
  },
  {
    id: 'unc_accessory_01', name: '사냥꾼의 부적', description: '야수의 영혼이 깃든 작은 뼈 부적입니다.',
    type: 'accessory', rarity: 'uncommon', iconUrl: '/assets/items/inv_misc_bone_02.svg',
    stackable: false, maxStack: 1, sellPrice: 100, requiredClass: 'hunter',
    stats: { attack: 15, critRate: 0.02 }
  },

  // --- Rare (희귀) ---
  {
    id: 'rar_bow_01', name: '발라노스의 장궁', description: '아웃랜드 희귀몹 발라노스가 떨어뜨리는 훌륭한 장궁입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_weapon_bow_03.svg',
    stackable: false, maxStack: 1, sellPrice: 850, requiredClass: 'hunter',
    stats: { attack: 68, critRate: 0.04, critDamage: 0.05 }
  },
  {
    id: 'rar_gun_01', name: '군단의 파멸', description: '어둠의 미궁에서 악마들을 꿰뚫던 강력한 총입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_weapon_rifle_03.svg',
    stackable: false, maxStack: 1, sellPrice: 880, requiredClass: 'hunter',
    stats: { attack: 72, critDamage: 0.1 }
  },
  {
    id: 'rar_polearm_01', name: '음속의 창', description: '어둠의 미궁 무르무르가 드랍하는 사냥꾼의 국민 미늘창입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_spear_02.svg',
    stackable: false, maxStack: 1, sellPrice: 800, requiredClass: 'hunter',
    stats: { attack: 65, critRate: 0.05, critDamage: 0.1 }
  },
  {
    id: 'rar_chest_01', name: '야수왕의 흉갑', description: '사냥꾼 전용 영웅 던전 세트인 야수왕 세트의 흉갑입니다.',
    type: 'chest', rarity: 'rare', iconUrl: '/assets/items/inv_chest_chain_03.svg',
    stackable: false, maxStack: 1, sellPrice: 900, requiredClass: 'hunter',
    stats: { defense: 80, hp: 75, attack: 30 }
  },
  {
    id: 'rar_legs_01', name: '야수왕의 다리갑옷', description: '착용 시 야수와의 교감이 깊어집니다.',
    type: 'legs', rarity: 'rare', iconUrl: '/assets/items/inv_pants_chain_03.svg',
    stackable: false, maxStack: 1, sellPrice: 880, requiredClass: 'hunter',
    stats: { defense: 75, hp: 70, critRate: 0.03 }
  },
  {
    id: 'rar_helm_01', name: '야수왕의 가면', description: '늑대의 머리뼈로 장식된 위협적인 가면입니다.',
    type: 'helm', rarity: 'rare', iconUrl: '/assets/items/inv_helmet_07.svg',
    stackable: false, maxStack: 1, sellPrice: 820, requiredClass: 'hunter',
    stats: { defense: 65, hp: 60, critRate: 0.04 }
  },
  {
    id: 'rar_shoulders_01', name: '황무지 방랑자의 견갑', description: '버섯구름 봉우리를 떠돌던 방랑자의 유품입니다.',
    type: 'shoulders', rarity: 'rare', iconUrl: '/assets/items/inv_shoulder_07.svg',
    stackable: false, maxStack: 1, sellPrice: 780, requiredClass: 'hunter',
    stats: { defense: 60, hp: 55, attack: 25 }
  },
  {
    id: 'rar_gloves_01', name: '정밀한 조준의 장갑', description: '원거리 무기의 적중률을 크게 높여주는 장갑입니다.',
    type: 'gloves', rarity: 'rare', iconUrl: '/assets/items/inv_gauntlets_03.svg',
    stackable: false, maxStack: 1, sellPrice: 700, requiredClass: 'hunter',
    stats: { defense: 50, hp: 45, critRate: 0.03 }
  },
  {
    id: 'rar_sword_01', name: '별빛 단검', description: '쌍수 사냥꾼들이 주로 사용하는 날카로운 단검입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_weapon_shortblade_01.svg',
    stackable: false, maxStack: 1, sellPrice: 650, requiredClass: 'hunter',
    stats: { attack: 40, critRate: 0.04 }
  },
  {
    id: 'rar_accessory_01', name: '피의 욕망 브로치', description: '카라잔 입장 전 필수 장신구 중 하나입니다.',
    type: 'accessory', rarity: 'rare', iconUrl: '/assets/items/inv_jewelry_talisman_01.svg',
    stackable: false, maxStack: 1, sellPrice: 500, requiredClass: 'hunter',
    stats: { attack: 72, critDamage: 0.05 }
  },

  // --- Epic (영웅) ---
  {
    id: 'epc_bow_01', name: '태양격노 불사조의 활', description: '카라잔 공작 말체자르가 드랍하는 아름다운 명궁입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_weapon_bow_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3500, requiredClass: 'hunter',
    stats: { attack: 130, critRate: 0.08, critDamage: 0.15 }
  },
  {
    id: 'epc_gun_01', name: '늑대잡이 저격총', description: '카라잔 오페라 극장에서 드랍되는 외형이 멋진 저격총입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_weapon_rifle_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3600, requiredClass: 'hunter',
    stats: { attack: 135, critRate: 0.07, critDamage: 0.18 }
  },
  {
    id: 'epc_chest_01', name: '악마추적자 흉갑', description: '사냥꾼 티어 4 세트의 가슴 방어구입니다.',
    type: 'chest', rarity: 'epic', iconUrl: '/assets/items/inv_chest_chain_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4500, requiredClass: 'hunter',
    stats: { defense: 140, hp: 150, attack: 50, critRate: 0.04 }
  },
  {
    id: 'epc_legs_01', name: '균열추적자 다리보호대', description: '사냥꾼 티어 5 세트의 다리 방어구입니다.',
    type: 'legs', rarity: 'epic', iconUrl: '/assets/items/inv_pants_chain_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4800, requiredClass: 'hunter',
    stats: { defense: 155, hp: 180, attack: 60, critRate: 0.05 }
  },
  {
    id: 'epc_helm_01', name: '그론추적자 투구', description: '눈에서 안광이 뿜어져 나오는 사냥꾼 티어 6 투구입니다.',
    type: 'helm', rarity: 'epic', iconUrl: '/assets/items/inv_helmet_08.svg',
    stackable: false, maxStack: 1, sellPrice: 5000, requiredClass: 'hunter',
    stats: { defense: 145, hp: 170, attack: 65, critDamage: 0.15 }
  },
  {
    id: 'epc_shoulders_01', name: '그론추적자 어깨갑옷', description: '사냥꾼 티어 6 세트의 눈알 장식 어깨 방어구입니다.',
    type: 'shoulders', rarity: 'epic', iconUrl: '/assets/items/inv_shoulder_08.svg',
    stackable: false, maxStack: 1, sellPrice: 4900, requiredClass: 'hunter',
    stats: { defense: 130, hp: 150, attack: 55, critRate: 0.06 }
  },
  {
    id: 'epc_polearm_01', name: '지옥무장 창', description: '폭풍우 요새에서 획득하는 근접 전투용 에픽 창입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_spear_03.svg',
    stackable: false, maxStack: 1, sellPrice: 3800, requiredClass: 'hunter',
    stats: { attack: 120, critRate: 0.09, critDamage: 0.2 }
  },
  {
    id: 'epc_sword_01', name: '황천의 파멸', description: '폭풍우 요새 알라르가 드랍하며, 쌍수 사냥꾼에게 매우 좋습니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_sword_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3700, requiredClass: 'hunter',
    stats: { attack: 85, critRate: 0.05, critDamage: 0.1 }
  },
  {
    id: 'epc_crossbow_01', name: '배반자의 검은활', description: '검은 사원의 일리단이 드랍하는 최고급 활(석궁 판정)입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_weapon_crossbow_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5500, requiredClass: 'hunter',
    stats: { attack: 155, hp: 100, critRate: 0.09, critDamage: 0.2 }
  },
  {
    id: 'epc_accessory_01', name: '용의 뼈 전리품', description: '그룰이 드랍하는, 공격 속도를 비약적으로 높여주는 장신구입니다.',
    type: 'accessory', rarity: 'epic', iconUrl: '/assets/items/inv_misc_bone_01.svg',
    stackable: false, maxStack: 1, sellPrice: 3000, requiredClass: 'hunter',
    stats: { attack: 80, critRate: 0.1, critDamage: 0.2 }
  },

  // --- Legendary (전설) ---
  {
    id: 'leg_thoridal', name: '토리달 - 별의 분노', description: '태양샘 고원에서 드랍되는 전설적인 활입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_bow_07.svg',
    stackable: false, maxStack: 1, sellPrice: 60000, requiredClass: 'hunter',
    stats: { attack: 260, critRate: 0.12, critDamage: 0.25 }
  },
  {
    id: 'leg_windrunner_bow', name: '알레리아의 유산', description: '실종된 알레리아 윈드러너가 사용하던 전설의 굽은활입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_bow_08.svg',
    stackable: false, maxStack: 1, sellPrice: 55000, requiredClass: 'hunter',
    stats: { attack: 245, defense: 50, critRate: 0.15, critDamage: 0.3 }
  },
  {
    id: 'leg_nessingwary_gun', name: '헤멧의 위대한 걸작', description: '전설적인 사냥꾼 헤멧 네싱워리가 최후의 사냥을 위해 맞춤 제작한 총입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_rifle_05.svg',
    stackable: false, maxStack: 1, sellPrice: 58000, requiredClass: 'hunter',
    stats: { attack: 270, critRate: 0.1, critDamage: 0.4 }
  },
  {
    id: 'leg_rexar_axes_mh', name: '렉사르의 거친 도끼 (주장비)', description: '호드의 영웅 렉사르가 수많은 짐승을 벤 도끼입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_axe_06.svg',
    stackable: false, maxStack: 1, sellPrice: 45000, requiredClass: 'hunter',
    stats: { attack: 180, hp: 200, critRate: 0.1, critDamage: 0.2 }
  },
  {
    id: 'leg_rexar_axes_oh', name: '렉사르의 거친 도끼 (보조장비)', description: '미샤와 함께 전투에 나설 때 렉사르가 쥐는 보조 도끼입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_axe_07.svg',
    stackable: false, maxStack: 1, sellPrice: 45000, requiredClass: 'hunter',
    stats: { attack: 170, defense: 80, critRate: 0.08, critDamage: 0.15 }
  },
  {
    id: 'leg_sylvanas_bow', name: '밴시 여왕의 통곡', description: '실바나스 윈드러너의 원한이 서려 있는 검은 뼈의 활입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_bow_09.svg',
    stackable: false, maxStack: 1, sellPrice: 65000, requiredClass: 'hunter',
    stats: { attack: 255, hp: 150, critRate: 0.14, critDamage: 0.28 }
  },
  {
    id: 'leg_rhokdelar_ascended', name: '승천한 라크델라 - 고대 수호자의 장궁', description: '악마를 처치하고 얻은 고대의 잎사귀가 만개하여 전설로 거듭난 장궁입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_bow_06.svg',
    stackable: false, maxStack: 1, sellPrice: 50000, requiredClass: 'hunter',
    stats: { attack: 230, defense: 100, hp: 300, critRate: 0.11, critDamage: 0.2 }
  },
  {
    id: 'leg_ashjre_thul_dark', name: '아쉬레툴 - 흑마술의 정점', description: '검은바위 산의 저주를 완벽하게 흡수한 전설적인 석궁입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_crossbow_02.svg',
    stackable: false, maxStack: 1, sellPrice: 52000, requiredClass: 'hunter',
    stats: { attack: 280, critRate: 0.05, critDamage: 0.5 }
  },
  {
    id: 'leg_huln_spear', name: '훌른의 독수리 창', description: '고대의 전쟁 당시 높은산 타우렌 훌른이 사용하던 유물 창입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_spear_04.svg',
    stackable: false, maxStack: 1, sellPrice: 62000, requiredClass: 'hunter',
    stats: { attack: 250, hp: 400, critRate: 0.18, critDamage: 0.3 }
  },
  {
    id: 'leg_bm_pet_trinket', name: '야수왕의 뿔피리', description: '이 피리를 불면 아제로스 모든 야수들의 투쟁심이 끓어오릅니다.',
    type: 'accessory', rarity: 'legendary', iconUrl: '/assets/items/inv_misc_horn_01.svg',
    stackable: false, maxStack: 1, sellPrice: 40000, requiredClass: 'hunter',
    stats: { attack: 150, defense: 150, hp: 500, critRate: 0.1, critDamage: 0.25 }
  }
];
