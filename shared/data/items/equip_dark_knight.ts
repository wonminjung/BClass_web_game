import type { Item } from '../../types/item';

/** 암흑 기사 전용 장비 */
export const EQUIP_DARK_KNIGHT: Item[] = [
  // --- Common (일반) ---
  {
    id: 'cmn_sword_01', name: '회색빛 야영지 장검', description: '기본적인 철제 장검입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_sword_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'dark_knight',
    stats: { attack: 15 },
  },
  {
    id: 'cmn_axe_01', name: '녹슨 지옥절단기 도끼', description: '버려진 지옥절단기의 파편으로 만든 도끼입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_axe_01.svg',
    stackable: false, maxStack: 1, sellPrice: 6, requiredClass: 'dark_knight',
    stats: { attack: 18 },
  },
  {
    id: 'cmn_shield_01', name: '금이 간 아웃랜드 방패', description: '방어용으로 쓰기엔 조금 부실해 보입니다.',
    type: 'shield', rarity: 'common', iconUrl: '/assets/items/inv_shield_01.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'dark_knight',
    stats: { defense: 20, hp: 10 },
  },
  {
    id: 'cmn_chest_01', name: '징집병의 판금 흉갑', description: '명예의 요새 징집병들에게 지급되는 흉갑입니다.',
    type: 'chest', rarity: 'common', iconUrl: '/assets/items/inv_chest_plate_01.svg',
    stackable: false, maxStack: 1, sellPrice: 8, requiredClass: 'dark_knight',
    stats: { defense: 30, hp: 50 },
  },
  {
    id: 'cmn_legs_01', name: '징집병의 판금 다리갑옷', description: '기본적인 방호력을 제공합니다.',
    type: 'legs', rarity: 'common', iconUrl: '/assets/items/inv_pants_plate_01.svg',
    stackable: false, maxStack: 1, sellPrice: 7, requiredClass: 'dark_knight',
    stats: { defense: 25, hp: 40 },
  },
  {
    id: 'cmn_helm_01', name: '무거운 강철 투구', description: '무겁지만 머리를 확실히 보호합니다.',
    type: 'helm', rarity: 'common', iconUrl: '/assets/items/inv_helmet_01.svg',
    stackable: false, maxStack: 1, sellPrice: 6, requiredClass: 'dark_knight',
    stats: { defense: 20, hp: 30 },
  },
  {
    id: 'cmn_boots_01', name: '낡은 나그란드 판금 장화', description: '나그란드의 흙먼지가 묻어있습니다.',
    type: 'boots', rarity: 'common', iconUrl: '/assets/items/inv_boots_plate_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'dark_knight',
    stats: { defense: 15, hp: 20 },
  },
  {
    id: 'cmn_gloves_01', name: '해진 기사의 장갑', description: '손놀림이 둔해지는 낡은 장갑입니다.',
    type: 'gloves', rarity: 'common', iconUrl: '/assets/items/inv_gauntlets_01.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'dark_knight',
    stats: { defense: 15, hp: 20 },
  },
  {
    id: 'cmn_shoulders_01', name: '단순한 강철 견갑', description: '어깨를 덮는 투박한 철판입니다.',
    type: 'shoulders', rarity: 'common', iconUrl: '/assets/items/inv_shoulder_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'dark_knight',
    stats: { defense: 18, hp: 25 },
  },
  {
    id: 'cmn_belt_01', name: '기본적인 판금 허리띠', description: '허리를 단단히 조여줍니다.',
    type: 'belt', rarity: 'common', iconUrl: '/assets/items/inv_belt_01.svg',
    stackable: false, maxStack: 1, sellPrice: 3, requiredClass: 'dark_knight',
    stats: { defense: 12, hp: 15 },
  },

  // --- Uncommon (고급) ---
  {
    id: 'unc_sword_01', name: '지옥무쇠 대검', description: '지옥무쇠로 벼려낸 튼튼한 양손검입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_sword_02.svg',
    stackable: false, maxStack: 1, sellPrice: 150, requiredClass: 'dark_knight',
    stats: { attack: 35 },
  },
  {
    id: 'unc_shield_01', name: '지옥무쇠 방패', description: '지옥무쇠 주괴를 두드려 만든 방패입니다.',
    type: 'shield', rarity: 'uncommon', iconUrl: '/assets/items/inv_shield_02.svg',
    stackable: false, maxStack: 1, sellPrice: 120, requiredClass: 'dark_knight',
    stats: { defense: 40, hp: 30 },
  },
  {
    id: 'unc_chest_01', name: '지옥무쇠 흉갑', description: '단단한 지옥무쇠 판금 갑옷입니다.',
    type: 'chest', rarity: 'uncommon', iconUrl: '/assets/items/inv_chest_plate_02.svg',
    stackable: false, maxStack: 1, sellPrice: 180, requiredClass: 'dark_knight',
    stats: { defense: 50, hp: 80 },
  },
  {
    id: 'unc_legs_01', name: '지옥무쇠 다리갑옷', description: '전투 시 하체를 보호해 줍니다.',
    type: 'legs', rarity: 'uncommon', iconUrl: '/assets/items/inv_pants_plate_02.svg',
    stackable: false, maxStack: 1, sellPrice: 160, requiredClass: 'dark_knight',
    stats: { defense: 45, hp: 70 },
  },
  {
    id: 'unc_helm_01', name: '지옥무쇠 투구', description: '아웃랜드 초반 모험가들의 국민 투구입니다.',
    type: 'helm', rarity: 'uncommon', iconUrl: '/assets/items/inv_helmet_02.svg',
    stackable: false, maxStack: 1, sellPrice: 140, requiredClass: 'dark_knight',
    stats: { defense: 35, hp: 50 },
  },
  {
    id: 'unc_boots_01', name: '지옥무쇠 장화', description: '발을 보호하는 튼튼한 장화입니다.',
    type: 'boots', rarity: 'uncommon', iconUrl: '/assets/items/inv_boots_plate_02.svg',
    stackable: false, maxStack: 1, sellPrice: 100, requiredClass: 'dark_knight',
    stats: { defense: 25, hp: 40 },
  },
  {
    id: 'unc_mace_01', name: '테로카르 망치', description: '테로카르 숲에서 흔히 볼 수 있는 무기입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_mace_01.svg',
    stackable: false, maxStack: 1, sellPrice: 130, requiredClass: 'dark_knight',
    stats: { attack: 38, critRate: 0.02 },
  },
  {
    id: 'unc_axe_01', name: '장가르 나무꾼의 도끼', description: '거대한 버섯을 벨 때 쓰던 도끼입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_axe_02.svg',
    stackable: false, maxStack: 1, sellPrice: 135, requiredClass: 'dark_knight',
    stats: { attack: 40, critDamage: 0.05 },
  },
  {
    id: 'unc_shoulders_01', name: '아웃랜드 수호자의 견갑', description: '수호자들에게 지급되는 제식 견갑입니다.',
    type: 'shoulders', rarity: 'uncommon', iconUrl: '/assets/items/inv_shoulder_02.svg',
    stackable: false, maxStack: 1, sellPrice: 120, requiredClass: 'dark_knight',
    stats: { defense: 30, hp: 45 },
  },
  {
    id: 'unc_belt_01', name: '칼날산맥의 판금 요대', description: '칼날산맥의 오우거들이 차고 다니던 요대입니다.',
    type: 'belt', rarity: 'uncommon', iconUrl: '/assets/items/inv_belt_02.svg',
    stackable: false, maxStack: 1, sellPrice: 90, requiredClass: 'dark_knight',
    stats: { defense: 20, hp: 30 },
  },

  // --- Rare (희귀) ---
  {
    id: 'rar_sword_01', name: '라트로의 춤추는 검', description: '어둠의 미궁에서 드랍되는 전사들의 훌륭한 초반 한손검입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_sword_03.svg',
    stackable: false, maxStack: 1, sellPrice: 850, requiredClass: 'dark_knight',
    stats: { attack: 65, critRate: 0.05 },
  },
  {
    id: 'rar_shield_01', name: '명예의 문장 방패', description: '부서진 전당에서 획득 가능한 방어 전사용 방패입니다.',
    type: 'shield', rarity: 'rare', iconUrl: '/assets/items/inv_shield_03.svg',
    stackable: false, maxStack: 1, sellPrice: 750, requiredClass: 'dark_knight',
    stats: { defense: 80, hp: 100 },
  },
  {
    id: 'rar_chest_01', name: '정의의 흉갑', description: '정의를 수호하는 자들을 위한 흉갑입니다.',
    type: 'chest', rarity: 'rare', iconUrl: '/assets/items/inv_chest_plate_03.svg',
    stackable: false, maxStack: 1, sellPrice: 900, requiredClass: 'dark_knight',
    stats: { defense: 90, hp: 150 },
  },
  {
    id: 'rar_legs_01', name: '거침없는 힘의 다리갑옷', description: '물리적인 충격을 훌륭하게 흡수합니다.',
    type: 'legs', rarity: 'rare', iconUrl: '/assets/items/inv_pants_plate_03.svg',
    stackable: false, maxStack: 1, sellPrice: 880, requiredClass: 'dark_knight',
    stats: { defense: 85, hp: 130 },
  },
  {
    id: 'rar_helm_01', name: '투시력의 판금 투구', description: '전장의 흐름을 꿰뚫어 볼 수 있게 해줍니다.',
    type: 'helm', rarity: 'rare', iconUrl: '/assets/items/inv_helmet_03.svg',
    stackable: false, maxStack: 1, sellPrice: 820, requiredClass: 'dark_knight',
    stats: { defense: 70, hp: 110, critRate: 0.02 },
  },
  {
    id: 'rar_mace_01', name: '무자비한 자의 철퇴', description: '적의 방어구를 부수는데 특화된 철퇴입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_mace_02.svg',
    stackable: false, maxStack: 1, sellPrice: 800, requiredClass: 'dark_knight',
    stats: { attack: 70, critDamage: 0.1 },
  },
  {
    id: 'rar_axe_01', name: '공허의 발톱', description: '황천의 에너지가 서려 있는 날카로운 도끼입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_axe_03.svg',
    stackable: false, maxStack: 1, sellPrice: 830, requiredClass: 'dark_knight',
    stats: { attack: 75, critRate: 0.04 },
  },
  {
    id: 'rar_accessory_01', name: '아다만타이트 조각상', description: '전사들의 생존력을 올려주는 장신구입니다.',
    type: 'accessory', rarity: 'rare', iconUrl: '/assets/items/inv_misc_statue_01.svg',
    stackable: false, maxStack: 1, sellPrice: 500, requiredClass: 'dark_knight',
    stats: { defense: 40, hp: 200 },
  },
  {
    id: 'rar_shoulders_01', name: '용기병의 견갑', description: '용기병의 비늘로 만들어져 매우 단단합니다.',
    type: 'shoulders', rarity: 'rare', iconUrl: '/assets/items/inv_shoulder_03.svg',
    stackable: false, maxStack: 1, sellPrice: 780, requiredClass: 'dark_knight',
    stats: { defense: 60, hp: 90 },
  },
  {
    id: 'rar_belt_01', name: '굳건한 수호자의 허리띠', description: '어떤 공격에도 흔들리지 않게 잡아줍니다.',
    type: 'belt', rarity: 'rare', iconUrl: '/assets/items/inv_belt_03.svg',
    stackable: false, maxStack: 1, sellPrice: 600, requiredClass: 'dark_knight',
    stats: { defense: 45, hp: 70 },
  },

  // --- Epic (영웅) ---
  {
    id: 'epc_sword_01', name: '우박가시', description: '카라잔 일루시아가 드랍하는 치명적인 검입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_sword_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3500, requiredClass: 'dark_knight',
    stats: { attack: 120, critRate: 0.08, critDamage: 0.15 },
  },
  {
    id: 'epc_sword_02', name: '사자심장 처형검', description: '대장기술로 제작할 수 있는 강력한 양손검입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_sword_05.svg',
    stackable: false, maxStack: 1, sellPrice: 5000, requiredClass: 'dark_knight',
    stats: { attack: 150, critRate: 0.1 },
  },
  {
    id: 'epc_shield_01', name: '알도르의 유산 방패', description: '그룰의 둥지에서 획득 가능한 방패입니다.',
    type: 'shield', rarity: 'epic', iconUrl: '/assets/items/inv_shield_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3800, requiredClass: 'dark_knight',
    stats: { defense: 150, hp: 300 },
  },
  {
    id: 'epc_chest_01', name: '파괴자의 흉갑', description: '전사 티어 5 (파괴자) 세트의 가슴 방어구입니다.',
    type: 'chest', rarity: 'epic', iconUrl: '/assets/items/inv_chest_plate_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4500, requiredClass: 'dark_knight',
    stats: { defense: 180, hp: 400 },
  },
  {
    id: 'epc_legs_01', name: '맹공의 다리갑옷', description: '전사 티어 6 (맹공) 세트의 다리 방어구입니다.',
    type: 'legs', rarity: 'epic', iconUrl: '/assets/items/inv_pants_plate_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4800, requiredClass: 'dark_knight',
    stats: { defense: 170, hp: 380, critRate: 0.05 },
  },
  {
    id: 'epc_helm_01', name: '맹공의 위대한 투구', description: '전사 티어 6 (맹공) 세트의 투구입니다.',
    type: 'helm', rarity: 'epic', iconUrl: '/assets/items/inv_helmet_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4600, requiredClass: 'dark_knight',
    stats: { defense: 140, hp: 320, critDamage: 0.2 },
  },
  {
    id: 'epc_axe_01', name: '황천의 파멸', description: '폭풍우 요새 알라르가 드랍하는 한손 도끼입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_axe_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3700, requiredClass: 'dark_knight',
    stats: { attack: 130, critRate: 0.07, critDamage: 0.1 },
  },
  {
    id: 'epc_mace_01', name: '스톰헤럴드', description: '대장기술의 정점, 상대를 기절시키는 양손 철퇴입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_mace_03.svg',
    stackable: false, maxStack: 1, sellPrice: 5500, requiredClass: 'dark_knight',
    stats: { attack: 145, critDamage: 0.25 },
  },
  {
    id: 'epc_accessory_01', name: '용의 뼈 전리품', description: '근접 딜러들의 꿈의 장신구입니다.',
    type: 'accessory', rarity: 'epic', iconUrl: '/assets/items/inv_misc_bone_01.svg',
    stackable: false, maxStack: 1, sellPrice: 2500, requiredClass: 'dark_knight',
    stats: { attack: 40, critRate: 0.1, critDamage: 0.2 },
  },
  {
    id: 'epc_shoulders_01', name: '전쟁인도자의 견갑', description: '전사 티어 4 (전쟁인도자) 세트의 어깨 방어구입니다.',
    type: 'shoulders', rarity: 'epic', iconUrl: '/assets/items/inv_shoulder_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4000, requiredClass: 'dark_knight',
    stats: { defense: 120, hp: 280 },
  },

  // --- Legendary (전설) ---
  {
    id: 'leg_warglaive_mh', name: '아지노스의 전투검 (주장비)', description: '일리단 스톰레이지가 사용하던 전설의 무기입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_glave_01.svg',
    stackable: false, maxStack: 1, sellPrice: 50000, requiredClass: 'dark_knight',
    stats: { attack: 250, critRate: 0.15, critDamage: 0.3 },
  },
  {
    id: 'leg_warglaive_oh', name: '아지노스의 전투검 (보조장비)', description: '주장비와 세트를 이루면 전투력이 급증합니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_glave_02.svg',
    stackable: false, maxStack: 1, sellPrice: 50000, requiredClass: 'dark_knight',
    stats: { attack: 220, critRate: 0.1, critDamage: 0.2 },
  },
  {
    id: 'leg_thunderfury', name: '우레폭풍 - 바람추적자의 성검', description: 'TBC 초반까지도 방어 전사에게 쓰였습니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_sword_39.svg',
    stackable: false, maxStack: 1, sellPrice: 45000, requiredClass: 'dark_knight',
    stats: { attack: 200, defense: 50, hp: 200, critRate: 0.05 },
  },
  {
    id: 'leg_sulfuras', name: '설퍼라스 - 라그나로스의 손', description: '강력한 화염 피해를 입히는 라그나로스의 망치입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_hammer_04.svg',
    stackable: false, maxStack: 1, sellPrice: 40000, requiredClass: 'dark_knight',
    stats: { attack: 280, critDamage: 0.4 },
  },
  {
    id: 'leg_gorribal', name: '고리발 - 살게라스의 파멸', description: '살게라스의 파괴된 대검 조각을 벼려낸 무기입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_sword_100.svg',
    stackable: false, maxStack: 1, sellPrice: 80000, requiredClass: 'dark_knight',
    stats: { attack: 300, critRate: 0.1, critDamage: 0.5 },
  },
  {
    id: 'leg_taeshalach', name: '타샤라크 - 아그라마르의 검', description: '불꽃을 베어내는 티탄의 검입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_sword_101.svg',
    stackable: false, maxStack: 1, sellPrice: 80000, requiredClass: 'dark_knight',
    stats: { attack: 290, critRate: 0.2 },
  },
  {
    id: 'leg_anduin_greatsword', name: '안두인 로서의 위대한 대검', description: '얼라이언스의 영웅 안두인 로서가 남긴 성검입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_sword_102.svg',
    stackable: false, maxStack: 1, sellPrice: 75000, requiredClass: 'dark_knight',
    stats: { attack: 270, defense: 100, hp: 500 },
  },
  {
    id: 'leg_broxigar_axe', name: '세나리우스의 나무 도끼', description: '브록시가르가 살게라스에게 상처를 입혔던 전설의 도끼입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_axe_100.svg',
    stackable: false, maxStack: 1, sellPrice: 90000, requiredClass: 'dark_knight',
    stats: { attack: 320, critRate: 0.25, critDamage: 0.5 },
  },
  {
    id: 'leg_gorehowl_true', name: '피의 울음소리 (진품)', description: '그롬 헬스크림의 영혼이 깃든 피비린내 나는 도끼입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_axe_101.svg',
    stackable: false, maxStack: 1, sellPrice: 70000, requiredClass: 'dark_knight',
    stats: { attack: 310, critRate: 0.3, critDamage: 0.6 },
  },

  // --- 기존 일반 장비 (하위 호환) ---
  {
    id: 'iron_sword', name: '무쇠 검', description: '기본적인 철제 검.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/iron_sword.svg',
    stackable: false, maxStack: 1, sellPrice: 30, requiredClass: 'dark_knight',
    stats: { attack: 10 },
  },
  {
    id: 'shadow_blade', name: '그림자 단검', description: '어둠의 기운이 서린 날카로운 단검.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/shadow_blade.svg',
    stackable: false, maxStack: 1, sellPrice: 150, requiredClass: 'dark_knight',
    stats: { attack: 25, critRate: 0.05 },
  },
  {
    id: 'leather_armor', name: '가죽 갑옷', description: '가볍고 튼튼한 가죽 갑옷.',
    type: 'chest', rarity: 'common', iconUrl: '/assets/items/leather_armor.svg',
    stackable: false, maxStack: 1, sellPrice: 40, requiredClass: 'dark_knight',
    stats: { defense: 8, hp: 20 },
  },
  {
    id: 'bone_ring', name: '뼈의 반지', description: '망자의 뼈로 만든 저주받은 반지.',
    type: 'accessory', rarity: 'uncommon', iconUrl: '/assets/items/bone_ring.svg',
    stackable: false, maxStack: 1, sellPrice: 60, requiredClass: 'dark_knight',
    stats: { attack: 5, critDamage: 0.1 },
  },
];
