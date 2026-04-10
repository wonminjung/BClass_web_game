import type { Item } from '../../types/item';

/** 성직자 전용 장비 */
export const EQUIP_PRIEST: Item[] = [
  // --- Common (일반) ---
  {
    id: 'cmn_mace_01', name: '수습생의 철퇴', description: '기본적인 호신용 철퇴입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_mace_04.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'priest',
    stats: { attack: 14 }
  },
  {
    id: 'cmn_wand_01', name: '나무 마술봉', description: '약한 빛을 내뿜는 평범한 마술봉입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_wand_06.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'priest',
    stats: { attack: 12 }
  },
  {
    id: 'cmn_robe_01', name: '수녀원 로브', description: '수도원에서 지급하는 정갈하고 깨끗한 로브입니다.',
    type: 'chest', rarity: 'common', iconUrl: '/assets/items/inv_chest_cloth_06.svg',
    stackable: false, maxStack: 1, sellPrice: 6, requiredClass: 'priest',
    stats: { defense: 10, hp: 12 }
  },
  {
    id: 'cmn_pants_01', name: '수녀원 바지', description: '기도를 올리기 편하게 통이 넓은 바지입니다.',
    type: 'legs', rarity: 'common', iconUrl: '/assets/items/inv_pants_cloth_05.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'priest',
    stats: { defense: 8, hp: 10 }
  },
  {
    id: 'cmn_shoes_01', name: '가벼운 샌들', description: '수도원의 정숙함을 유지해주는 굽 낮은 샌들입니다.',
    type: 'boots', rarity: 'common', iconUrl: '/assets/items/inv_boots_cloth_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'priest',
    stats: { defense: 6, hp: 8 }
  },
  {
    id: 'cmn_cowl_01', name: '수습생 두건', description: '기도할 때 시야를 차단하여 집중을 돕는 얇은 두건입니다.',
    type: 'helm', rarity: 'common', iconUrl: '/assets/items/inv_helmet_14.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'priest',
    stats: { defense: 7, hp: 8 }
  },
  {
    id: 'cmn_gloves_01', name: '흰색 헝겊 장갑', description: '부상자를 치료할 때 손을 청결하게 유지해줍니다.',
    type: 'gloves', rarity: 'common', iconUrl: '/assets/items/inv_gauntlets_08.svg',
    stackable: false, maxStack: 1, sellPrice: 3, requiredClass: 'priest',
    stats: { defense: 5, hp: 6 }
  },
  {
    id: 'cmn_shoulders_01', name: '수녀원 어깨걸이', description: '어깨를 살짝 덮는 깨끗한 천 조각입니다.',
    type: 'shoulders', rarity: 'common', iconUrl: '/assets/items/inv_shoulder_13.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'priest',
    stats: { defense: 6, hp: 7 }
  },
  {
    id: 'cmn_belt_01', name: '꼬인 밧줄 허리띠', description: '로브를 고정하기 위해 묶는 단순한 밧줄입니다.',
    type: 'belt', rarity: 'common', iconUrl: '/assets/items/inv_belt_10.svg',
    stackable: false, maxStack: 1, sellPrice: 2, requiredClass: 'priest',
    stats: { defense: 4, hp: 5 }
  },
  {
    id: 'cmn_staff_01', name: '순례자의 떡갈나무 지팡이', description: '여행하는 사제들의 지친 다리를 지탱해주는 지팡이입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_staff_07.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'priest',
    stats: { attack: 15 }
  },

  // --- Uncommon (고급) ---
  {
    id: 'unc_mace_01', name: '치유사의 철퇴', description: '성스러운 기운이 은은하게 감도는 철퇴입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_mace_05.svg',
    stackable: false, maxStack: 1, sellPrice: 140, requiredClass: 'priest',
    stats: { attack: 40, critRate: 0.02 }
  },
  {
    id: 'unc_wand_01', name: '은빛마루 마술봉', description: '어둠을 밝히는 순백의 빛을 발사하는 마술봉입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_wand_07.svg',
    stackable: false, maxStack: 1, sellPrice: 110, requiredClass: 'priest',
    stats: { attack: 35, critRate: 0.01 }
  },
  {
    id: 'unc_robe_01', name: '축복받은 비단 로브', description: '부드러운 비단으로 짜여져 신성력을 증폭시킵니다.',
    type: 'chest', rarity: 'uncommon', iconUrl: '/assets/items/inv_chest_cloth_07.svg',
    stackable: false, maxStack: 1, sellPrice: 160, requiredClass: 'priest',
    stats: { defense: 25, hp: 25, attack: 15 }
  },
  {
    id: 'unc_pants_01', name: '축복받은 비단 바지', description: '성스러운 기운이 다리를 가볍게 해줍니다.',
    type: 'legs', rarity: 'uncommon', iconUrl: '/assets/items/inv_pants_cloth_06.svg',
    stackable: false, maxStack: 1, sellPrice: 140, requiredClass: 'priest',
    stats: { defense: 22, hp: 20, attack: 12 }
  },
  {
    id: 'unc_cowl_01', name: '신성한 두건', description: '치유 주문에 대한 집중력을 크게 높여주는 두건입니다.',
    type: 'helm', rarity: 'uncommon', iconUrl: '/assets/items/inv_helmet_15.svg',
    stackable: false, maxStack: 1, sellPrice: 120, requiredClass: 'priest',
    stats: { defense: 18, hp: 18, attack: 10 }
  },
  {
    id: 'unc_shoes_01', name: '비단 덧신', description: '긴 순례길에 적합하게 밑창을 덧댄 비단 신발입니다.',
    type: 'boots', rarity: 'uncommon', iconUrl: '/assets/items/inv_boots_cloth_05.svg',
    stackable: false, maxStack: 1, sellPrice: 90, requiredClass: 'priest',
    stats: { defense: 15, hp: 15 }
  },
  {
    id: 'unc_shoulders_01', name: '비단 어깨보호대', description: '단정한 십자 문양이 새겨져 있습니다.',
    type: 'shoulders', rarity: 'uncommon', iconUrl: '/assets/items/inv_shoulder_14.svg',
    stackable: false, maxStack: 1, sellPrice: 100, requiredClass: 'priest',
    stats: { defense: 16, hp: 16 }
  },
  {
    id: 'unc_gloves_01', name: '비단 치유 장갑', description: '치유의 손길을 더욱 부드럽게 전할 수 있습니다.',
    type: 'gloves', rarity: 'uncommon', iconUrl: '/assets/items/inv_gauntlets_09.svg',
    stackable: false, maxStack: 1, sellPrice: 85, requiredClass: 'priest',
    stats: { defense: 12, hp: 12, critRate: 0.01 }
  },
  {
    id: 'unc_dagger_01', name: '의식용 은단검', description: '성수나 마도구의 불순물을 제거할 때 쓰는 단검입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_weapon_shortblade_04.svg',
    stackable: false, maxStack: 1, sellPrice: 130, requiredClass: 'priest',
    stats: { attack: 38, critDamage: 0.05 }
  },
  {
    id: 'unc_offhand_01', name: '고대의 기도서', description: '여러 성스러운 고대 기도문이 빼곡히 적힌 책입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_misc_book_04.svg',
    stackable: false, maxStack: 1, sellPrice: 100, requiredClass: 'priest',
    stats: { attack: 20, critRate: 0.02 }
  },

  // --- Rare (희귀) ---
  {
    id: 'rar_staff_01', name: '구원의 지팡이', description: '아우킨둔에서 발견된 영혼을 구제하는 치유의 지팡이입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_staff_08.svg',
    stackable: false, maxStack: 1, sellPrice: 850, requiredClass: 'priest',
    stats: { attack: 85, hp: 50, critRate: 0.04 }
  },
  {
    id: 'rar_wand_01', name: '정화의 마술봉', description: '타락한 기운을 씻어내는 성스러운 마술봉입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_wand_08.svg',
    stackable: false, maxStack: 1, sellPrice: 650, requiredClass: 'priest',
    stats: { attack: 60, critRate: 0.03 }
  },
  {
    id: 'rar_robe_01', name: '달빛매듭 로브', description: '치유 사제들을 위해 특별히 제작된 재봉술의 걸작입니다.',
    type: 'chest', rarity: 'rare', iconUrl: '/assets/items/inv_chest_cloth_08.svg',
    stackable: false, maxStack: 1, sellPrice: 900, requiredClass: 'priest',
    stats: { defense: 45, hp: 50, attack: 55, critRate: 0.03 }
  },
  {
    id: 'rar_pants_01', name: '달빛매듭 바지', description: '달빛의 축복이 깃들어 마나 회복을 돕습니다.',
    type: 'legs', rarity: 'rare', iconUrl: '/assets/items/inv_pants_cloth_07.svg',
    stackable: false, maxStack: 1, sellPrice: 850, requiredClass: 'priest',
    stats: { defense: 40, hp: 45, attack: 50, critRate: 0.02 }
  },
  {
    id: 'rar_cowl_01', name: '달빛매듭 두건', description: '머리를 감싸는 순간 마법의 흐름이 맑아짐을 느낍니다.',
    type: 'helm', rarity: 'rare', iconUrl: '/assets/items/inv_helmet_16.svg',
    stackable: false, maxStack: 1, sellPrice: 800, requiredClass: 'priest',
    stats: { defense: 35, hp: 40, attack: 45, critDamage: 0.05 }
  },
  {
    id: 'rar_shoes_01', name: '달빛매듭 덧신', description: '깃털처럼 가볍게 전장을 누비며 아군을 도울 수 있습니다.',
    type: 'boots', rarity: 'rare', iconUrl: '/assets/items/inv_boots_cloth_06.svg',
    stackable: false, maxStack: 1, sellPrice: 750, requiredClass: 'priest',
    stats: { defense: 28, hp: 30, attack: 35 }
  },
  {
    id: 'rar_mace_01', name: '성광의 망치', description: '악을 내리치고 아군을 치유하는 다목적 무기입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_mace_06.svg',
    stackable: false, maxStack: 1, sellPrice: 820, requiredClass: 'priest',
    stats: { attack: 75, hp: 40, critRate: 0.05 }
  },
  {
    id: 'rar_offhand_01', name: '빛나는 정령의 파편', description: '나루의 힘이 희미하게 남아있는 신성한 보석입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_misc_orb_02.svg',
    stackable: false, maxStack: 1, sellPrice: 600, requiredClass: 'priest',
    stats: { attack: 35, hp: 30, critRate: 0.03 }
  },
  {
    id: 'rar_accessory_01', name: '치유사의 은빛 브로치', description: '위급한 순간 폭발적인 생명력을 불어넣는 장신구입니다.',
    type: 'accessory', rarity: 'rare', iconUrl: '/assets/items/inv_jewelry_talisman_03.svg',
    stackable: false, maxStack: 1, sellPrice: 500, requiredClass: 'priest',
    stats: { attack: 50, critDamage: 0.1 }
  },
  {
    id: 'rar_shoulders_01', name: '수호성인의 어깨보호대', description: '성스러운 기운으로 어깨를 따뜻하게 감싸줍니다.',
    type: 'shoulders', rarity: 'rare', iconUrl: '/assets/items/inv_shoulder_15.svg',
    stackable: false, maxStack: 1, sellPrice: 780, requiredClass: 'priest',
    stats: { defense: 30, hp: 35, attack: 40 }
  },

  // --- Epic (영웅) ---
  {
    id: 'epc_mace_01', name: '빛의 정의', description: '카라잔의 공작 말체자르가 드랍하는 눈부신 치유의 철퇴입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_mace_07.svg',
    stackable: false, maxStack: 1, sellPrice: 4000, requiredClass: 'priest',
    stats: { attack: 135, hp: 80, critRate: 0.07, critDamage: 0.1 }
  },
  {
    id: 'epc_staff_01', name: '완전한 회복의 지팡이', description: '검은 사원에서 획득할 수 있는, 아군을 죽음에서 되돌리는 지팡이입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_staff_09.svg',
    stackable: false, maxStack: 1, sellPrice: 5500, requiredClass: 'priest',
    stats: { attack: 180, hp: 120, critRate: 0.08, critDamage: 0.15 }
  },
  {
    id: 'epc_wand_01', name: '나루의 생명력', description: '샤트라스 나루의 정수가 직접 담긴 에픽 마술봉입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_wand_09.svg',
    stackable: false, maxStack: 1, sellPrice: 2800, requiredClass: 'priest',
    stats: { attack: 90, hp: 40, critRate: 0.05 }
  },
  {
    id: 'epc_robe_01', name: '화신의 의복', description: '사제 티어 5 세트의 눈부시게 빛나는 성스러운 가슴 방어구입니다.',
    type: 'chest', rarity: 'epic', iconUrl: '/assets/items/inv_chest_cloth_09.svg',
    stackable: false, maxStack: 1, sellPrice: 4800, requiredClass: 'priest',
    stats: { defense: 70, hp: 110, attack: 90, critRate: 0.05 }
  },
  {
    id: 'epc_pants_01', name: '사면의 다리보호구', description: '사제 티어 6 세트의 고결한 다리 방어구입니다.',
    type: 'legs', rarity: 'epic', iconUrl: '/assets/items/inv_pants_cloth_08.svg',
    stackable: false, maxStack: 1, sellPrice: 5000, requiredClass: 'priest',
    stats: { defense: 65, hp: 100, attack: 85, critDamage: 0.15 }
  },
  {
    id: 'epc_cowl_01', name: '화신의 두건', description: '사제 티어 5 세트, 머리 뒤로 황금빛 후광이 비치는 두건입니다.',
    type: 'helm', rarity: 'epic', iconUrl: '/assets/items/inv_helmet_17.svg',
    stackable: false, maxStack: 1, sellPrice: 4600, requiredClass: 'priest',
    stats: { defense: 55, hp: 85, attack: 70, critRate: 0.06 }
  },
  {
    id: 'epc_shoulders_01', name: '사면의 어깨구장', description: '사제 티어 6 세트, 눈먼 천사의 형상이 조각된 어깨 방어구입니다.',
    type: 'shoulders', rarity: 'epic', iconUrl: '/assets/items/inv_shoulder_16.svg',
    stackable: false, maxStack: 1, sellPrice: 4500, requiredClass: 'priest',
    stats: { defense: 50, hp: 75, attack: 65, critDamage: 0.1 }
  },
  {
    id: 'epc_offhand_01', name: '축복받은 치유의 서', description: '생명 마법의 극의가 담겨있는 보조 장비 마도서입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_misc_book_05.svg',
    stackable: false, maxStack: 1, sellPrice: 3500, requiredClass: 'priest',
    stats: { attack: 65, hp: 60, critRate: 0.05 }
  },
  {
    id: 'epc_accessory_01', name: '므루의 눈물', description: '타락한 나루 므루가 남긴 마지막 빛방울로, 엄청난 마나 회복을 돕습니다.',
    type: 'accessory', rarity: 'epic', iconUrl: '/assets/items/inv_jewelry_talisman_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3800, requiredClass: 'priest',
    stats: { attack: 55, hp: 150, critRate: 0.08 }
  },
  {
    id: 'epc_gloves_01', name: '화신의 장갑', description: '손짓 한 번으로 빈사 상태의 아군을 일으켜 세우는 장갑입니다.',
    type: 'gloves', rarity: 'epic', iconUrl: '/assets/items/inv_gauntlets_10.svg',
    stackable: false, maxStack: 1, sellPrice: 3600, requiredClass: 'priest',
    stats: { defense: 40, hp: 65, attack: 50, critRate: 0.04 }
  },

  // --- Legendary (전설) ---
  {
    id: 'leg_atiesh_holy', name: '아티쉬 - 위대한 치유사의 지팡이', description: '사제를 위해 성스러운 힘으로 완벽하게 정화된 전설의 지팡이입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_staff_10.svg',
    stackable: false, maxStack: 1, sellPrice: 70000, requiredClass: 'priest',
    stats: { attack: 280, hp: 200, critRate: 0.15, critDamage: 0.3 }
  },
  {
    id: 'leg_valanyr_priest', name: '발라니르 - 고대 왕의 망치', description: '치유 시 빛의 보호막을 생성하는 강력한 티탄의 유물입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_mace_08.svg',
    stackable: false, maxStack: 1, sellPrice: 85000, requiredClass: 'priest',
    stats: { attack: 260, hp: 250, critRate: 0.18, critDamage: 0.35 }
  },
  {
    id: 'leg_book_of_argus', name: '아르거스의 각성', description: '예언자 벨렌이 아제로스로 직접 가져온 나루의 가장 순수한 가르침입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_misc_book_06.svg',
    stackable: false, maxStack: 1, sellPrice: 60000, requiredClass: 'priest',
    stats: { attack: 160, hp: 150, critRate: 0.12, critDamage: 0.25 }
  },
  {
    id: 'leg_heart_of_adal', name: '아달의 심장장식', description: '샤트라스의 영도자 아달의 빛을 온몸에 품을 수 있는 유물 장신구입니다.',
    type: 'accessory', rarity: 'legendary', iconUrl: '/assets/items/inv_jewelry_necklace_01.svg',
    stackable: false, maxStack: 1, sellPrice: 50000, requiredClass: 'priest',
    stats: { attack: 130, hp: 300, critRate: 0.1, critDamage: 0.4 }
  },
  {
    id: 'leg_archbishops_crown', name: '대주교의 금관', description: '아제로스 모든 사제들의 존경을 받는 찬란한 황금 투구입니다.',
    type: 'helm', rarity: 'legendary', iconUrl: '/assets/items/inv_helmet_18.svg',
    stackable: false, maxStack: 1, sellPrice: 55000, requiredClass: 'priest',
    stats: { defense: 100, hp: 180, attack: 190, critRate: 0.12 }
  },
  {
    id: 'leg_robe_of_purity', name: '절대 순수성의 예복', description: '어떠한 타락도 허용하지 않는, 눈이 멀 듯한 빛의 로브입니다.',
    type: 'chest', rarity: 'legendary', iconUrl: '/assets/items/inv_chest_cloth_10.svg',
    stackable: false, maxStack: 1, sellPrice: 58000, requiredClass: 'priest',
    stats: { defense: 120, hp: 220, attack: 210, critDamage: 0.3 }
  },
  {
    id: 'leg_tuure_beacon', name: '투레 - 나루의 봉화', description: '과거 공허의 세력으로부터 한 세계를 구원했던 성스러운 지팡이입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_staff_11.svg',
    stackable: false, maxStack: 1, sellPrice: 75000, requiredClass: 'priest',
    stats: { attack: 300, hp: 280, critRate: 0.15, critDamage: 0.4 }
  },
  {
    id: 'leg_hands_of_lightmother', name: '빛의 어머니의 손길', description: '죽어가는 자의 심장마저 다시 뛰게 만든다는 전설의 치유 장갑입니다.',
    type: 'gloves', rarity: 'legendary', iconUrl: '/assets/items/inv_gauntlets_11.svg',
    stackable: false, maxStack: 1, sellPrice: 48000, requiredClass: 'priest',
    stats: { defense: 80, hp: 130, attack: 150, critRate: 0.14 }
  },
  {
    id: 'leg_wand_of_dawn', name: '여명의 별빛', description: '칠흑 같은 어둠을 단숨에 몰아내는 찬란한 전설의 마술봉입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_wand_10.svg',
    stackable: false, maxStack: 1, sellPrice: 52000, requiredClass: 'priest',
    stats: { attack: 180, hp: 100, critRate: 0.1, critDamage: 0.2 }
  },
  {
    id: 'leg_chalice_of_light', name: '성스러운 빛의 영약', description: '영구적으로 사제의 치유력을 폭발적으로 증폭시키는 마르지 않는 성배입니다.',
    type: 'accessory', rarity: 'legendary', iconUrl: '/assets/items/inv_misc_chalice_01.svg',
    stackable: false, maxStack: 1, sellPrice: 80000, requiredClass: 'priest',
    stats: { attack: 230, hp: 400, critRate: 0.2, critDamage: 0.5 }
  }
];
