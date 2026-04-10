import type { Item } from '../../types/item';

/** 그림자 마법사 전용 장비 */
export const EQUIP_SHADOW_MAGE: Item[] = [
  // --- Common (일반) ---
  {
    id: 'cmn_staff_01', name: '수습생의 나무 지팡이', description: '기초적인 마나 집중을 돕는 평범한 지팡이입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_staff_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'shadow_mage',
    stats: { attack: 15 }
  },
  {
    id: 'cmn_wand_01', name: '희미한 마술봉', description: '미약한 마력의 빛을 내뿜는 낡은 마술봉입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_wand_01.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'shadow_mage',
    stats: { attack: 12 }
  },
  {
    id: 'cmn_robe_01', name: '수습생의 로브', description: '마법사 길드에서 지급하는 얇은 천 로브입니다.',
    type: 'chest', rarity: 'common', iconUrl: '/assets/items/inv_chest_cloth_01.svg',
    stackable: false, maxStack: 1, sellPrice: 6, requiredClass: 'shadow_mage',
    stats: { defense: 10, hp: 10 }
  },
  {
    id: 'cmn_pants_01', name: '수습생의 바지', description: '움직임이 편한 부드러운 천 바지입니다.',
    type: 'legs', rarity: 'common', iconUrl: '/assets/items/inv_pants_cloth_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'shadow_mage',
    stats: { defense: 8, hp: 8 }
  },
  {
    id: 'cmn_shoes_01', name: '수습생의 덧신', description: '발소리를 죽여주는 가벼운 천 신발입니다.',
    type: 'boots', rarity: 'common', iconUrl: '/assets/items/inv_boots_cloth_01.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'shadow_mage',
    stats: { defense: 6, hp: 5 }
  },
  {
    id: 'cmn_cowl_01', name: '허름한 두건', description: '얼굴을 반쯤 가려주는 평범한 천 두건입니다.',
    type: 'helm', rarity: 'common', iconUrl: '/assets/items/inv_helmet_09.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'shadow_mage',
    stats: { defense: 7, hp: 6 }
  },
  {
    id: 'cmn_gloves_01', name: '얇은 천 장갑', description: '손끝의 감각을 유지해주는 마법사용 장갑입니다.',
    type: 'gloves', rarity: 'common', iconUrl: '/assets/items/inv_gauntlets_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3, requiredClass: 'shadow_mage',
    stats: { defense: 5, hp: 5 }
  },
  {
    id: 'cmn_shoulders_01', name: '낡은 어깨걸이', description: '보온 효과 정도만 기대할 수 있는 어깨걸이입니다.',
    type: 'shoulders', rarity: 'common', iconUrl: '/assets/items/inv_shoulder_09.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'shadow_mage',
    stats: { defense: 6, hp: 5 }
  },
  {
    id: 'cmn_belt_01', name: '천 허리띠', description: '로브를 고정하기 위해 묶는 천 조각입니다.',
    type: 'belt', rarity: 'common', iconUrl: '/assets/items/inv_belt_09.svg',
    stackable: false, maxStack: 1, sellPrice: 2, requiredClass: 'shadow_mage',
    stats: { defense: 4, hp: 3 }
  },
  {
    id: 'cmn_dagger_01', name: '무딘 의식용 단검', description: '마법진을 그릴 때 쓰던 무딘 단검입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_weapon_shortblade_02.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'shadow_mage',
    stats: { attack: 10 }
  },

  // --- Uncommon (고급) ---
  {
    id: 'unc_staff_01', name: '테로카르 숲 수정 지팡이', description: '테로카르 숲의 마력이 깃든 수정을 가공한 지팡이입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_staff_02.svg',
    stackable: false, maxStack: 1, sellPrice: 150, requiredClass: 'shadow_mage',
    stats: { attack: 45, critRate: 0.02 }
  },
  {
    id: 'unc_wand_01', name: '황천매듭 마술봉', description: '황천매듭의 마력을 뿜어내는 마술봉입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_wand_02.svg',
    stackable: false, maxStack: 1, sellPrice: 110, requiredClass: 'shadow_mage',
    stats: { attack: 35, critRate: 0.01 }
  },
  {
    id: 'unc_robe_01', name: '황천매듭 로브', description: '아웃랜드의 재봉사들이 즐겨 만드는 튼튼한 마법사 로브입니다.',
    type: 'chest', rarity: 'uncommon', iconUrl: '/assets/items/inv_chest_cloth_02.svg',
    stackable: false, maxStack: 1, sellPrice: 160, requiredClass: 'shadow_mage',
    stats: { defense: 25, hp: 20, attack: 15 }
  },
  {
    id: 'unc_pants_01', name: '황천매듭 바지', description: '마나의 흐름을 원활하게 돕는 바지입니다.',
    type: 'legs', rarity: 'uncommon', iconUrl: '/assets/items/inv_pants_cloth_02.svg',
    stackable: false, maxStack: 1, sellPrice: 140, requiredClass: 'shadow_mage',
    stats: { defense: 22, hp: 18, attack: 12 }
  },
  {
    id: 'unc_cowl_01', name: '황천매듭 두건', description: '집중력을 높여주는 마법의 두건입니다.',
    type: 'helm', rarity: 'uncommon', iconUrl: '/assets/items/inv_helmet_10.svg',
    stackable: false, maxStack: 1, sellPrice: 120, requiredClass: 'shadow_mage',
    stats: { defense: 18, hp: 15, attack: 10 }
  },
  {
    id: 'unc_shoes_01', name: '황천매듭 장화', description: '대지의 마력과 공명하는 푹신한 장화입니다.',
    type: 'boots', rarity: 'uncommon', iconUrl: '/assets/items/inv_boots_cloth_02.svg',
    stackable: false, maxStack: 1, sellPrice: 90, requiredClass: 'shadow_mage',
    stats: { defense: 15, hp: 12 }
  },
  {
    id: 'unc_shoulders_01', name: '황천매듭 어깨보호대', description: '천으로 만들어졌지만 꽤 훌륭한 방어력을 지닙니다.',
    type: 'shoulders', rarity: 'uncommon', iconUrl: '/assets/items/inv_shoulder_10.svg',
    stackable: false, maxStack: 1, sellPrice: 100, requiredClass: 'shadow_mage',
    stats: { defense: 16, hp: 14 }
  },
  {
    id: 'unc_gloves_01', name: '황천매듭 장갑', description: '주문 영창 속도를 미세하게 올려주는 장갑입니다.',
    type: 'gloves', rarity: 'uncommon', iconUrl: '/assets/items/inv_gauntlets_05.svg',
    stackable: false, maxStack: 1, sellPrice: 85, requiredClass: 'shadow_mage',
    stats: { defense: 12, hp: 10, critRate: 0.01 }
  },
  {
    id: 'unc_dagger_01', name: '마력 깃든 희생의 단검', description: '어두운 의식에 사용된 흔적이 있는 단검입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_weapon_shortblade_03.svg',
    stackable: false, maxStack: 1, sellPrice: 130, requiredClass: 'shadow_mage',
    stats: { attack: 38, critDamage: 0.05 }
  },
  {
    id: 'unc_offhand_01', name: '어둠의 기록서', description: '알 수 없는 언어로 적힌 불길한 마도서입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_misc_book_01.svg',
    stackable: false, maxStack: 1, sellPrice: 100, requiredClass: 'shadow_mage',
    stats: { attack: 20, critRate: 0.02 }
  },

  // --- Rare (희귀) ---
  {
    id: 'rar_staff_01', name: '암흑 불길의 지팡이', description: '마나 무덤에서 발견된 검은 불꽃을 내뿜는 지팡이입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_staff_03.svg',
    stackable: false, maxStack: 1, sellPrice: 850, requiredClass: 'shadow_mage',
    stats: { attack: 85, critRate: 0.05, critDamage: 0.1 }
  },
  {
    id: 'rar_wand_01', name: '공허의 마술봉', description: '공허의 에너지를 발사하는 치명적인 마술봉입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_wand_03.svg',
    stackable: false, maxStack: 1, sellPrice: 650, requiredClass: 'shadow_mage',
    stats: { attack: 60, critRate: 0.03 }
  },
  {
    id: 'rar_robe_01', name: '마력 깃든 암흑매듭 로브', description: '암흑 사제와 마법사들이 탐내는 재봉술의 걸작입니다.',
    type: 'chest', rarity: 'rare', iconUrl: '/assets/items/inv_chest_cloth_03.svg',
    stackable: false, maxStack: 1, sellPrice: 900, requiredClass: 'shadow_mage',
    stats: { defense: 45, hp: 40, attack: 50, critRate: 0.04 }
  },
  {
    id: 'rar_pants_01', name: '마력 깃든 암흑매듭 바지', description: '암흑 마법의 위력을 한층 끌어올려 줍니다.',
    type: 'legs', rarity: 'rare', iconUrl: '/assets/items/inv_pants_cloth_03.svg',
    stackable: false, maxStack: 1, sellPrice: 850, requiredClass: 'shadow_mage',
    stats: { defense: 40, hp: 35, attack: 45, critRate: 0.03 }
  },
  {
    id: 'rar_cowl_01', name: '마력 깃든 암흑매듭 복면', description: '착용자의 눈빛마저 어둡게 물들이는 복면입니다.',
    type: 'helm', rarity: 'rare', iconUrl: '/assets/items/inv_helmet_11.svg',
    stackable: false, maxStack: 1, sellPrice: 800, requiredClass: 'shadow_mage',
    stats: { defense: 35, hp: 30, attack: 40, critDamage: 0.05 }
  },
  {
    id: 'rar_shoes_01', name: '마력 깃든 암흑매듭 장화', description: '그림자 속을 걷는 듯한 착각을 불러일으킵니다.',
    type: 'boots', rarity: 'rare', iconUrl: '/assets/items/inv_boots_cloth_03.svg',
    stackable: false, maxStack: 1, sellPrice: 750, requiredClass: 'shadow_mage',
    stats: { defense: 28, hp: 25, attack: 30 }
  },
  {
    id: 'rar_sword_01', name: '연속타격의 검', description: '한 손 마법검사들이 선호하는 날렵한 마력검입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_sword_06.svg',
    stackable: false, maxStack: 1, sellPrice: 820, requiredClass: 'shadow_mage',
    stats: { attack: 75, critRate: 0.06 }
  },
  {
    id: 'rar_offhand_01', name: '그림자 해골', description: '흑마술의 매개체로 사용되는 불길한 해골입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_misc_bone_skull_01.svg',
    stackable: false, maxStack: 1, sellPrice: 600, requiredClass: 'shadow_mage',
    stats: { attack: 35, critRate: 0.04, critDamage: 0.05 }
  },
  {
    id: 'rar_accessory_01', name: '은빛초승달의 상징', description: '영웅 던전 휘장으로 구매할 수 있는 마법사들의 필수 장신구입니다.',
    type: 'accessory', rarity: 'rare', iconUrl: '/assets/items/inv_jewelry_talisman_02.svg',
    stackable: false, maxStack: 1, sellPrice: 500, requiredClass: 'shadow_mage',
    stats: { attack: 40, critDamage: 0.1 }
  },
  {
    id: 'rar_shoulders_01', name: '붉은학살자의 어깨보호대', description: '잔혹한 학살자의 기운이 서린 천 어깨방어구입니다.',
    type: 'shoulders', rarity: 'rare', iconUrl: '/assets/items/inv_shoulder_11.svg',
    stackable: false, maxStack: 1, sellPrice: 780, requiredClass: 'shadow_mage',
    stats: { defense: 30, hp: 25, attack: 35 }
  },

  // --- Epic (영웅) ---
  {
    id: 'epc_sword_01', name: '나스레짐의 흡혈검', description: '공작 말체자르가 드랍하는, 암흑 마법사에게 최적화된 마법검입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_sword_07.svg',
    stackable: false, maxStack: 1, sellPrice: 4000, requiredClass: 'shadow_mage',
    stats: { attack: 140, critRate: 0.08, critDamage: 0.15 }
  },
  {
    id: 'epc_staff_01', name: '자르둠 - 포식자의 지팡이', description: '일리단 스톰레이지가 드랍하는 끔찍한 지옥견 모양의 지팡이입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_staff_04.svg',
    stackable: false, maxStack: 1, sellPrice: 5500, requiredClass: 'shadow_mage',
    stats: { attack: 170, critRate: 0.1, critDamage: 0.2 }
  },
  {
    id: 'epc_wand_01', name: '잊혀진 별', description: '폭풍우 요새에서 획득 가능한 에픽 마술봉입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_wand_04.svg',
    stackable: false, maxStack: 1, sellPrice: 2800, requiredClass: 'shadow_mage',
    stats: { attack: 85, critRate: 0.05, critDamage: 0.05 }
  },
  {
    id: 'epc_robe_01', name: '티리스팔의 흉갑', description: '마법사 티어 5 세트의 위엄 넘치는 가슴 방어구입니다.',
    type: 'chest', rarity: 'epic', iconUrl: '/assets/items/inv_chest_cloth_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4800, requiredClass: 'shadow_mage',
    stats: { defense: 70, hp: 90, attack: 80, critRate: 0.06 }
  },
  {
    id: 'epc_pants_01', name: '폭풍우 다리보호구', description: '마법사 티어 6 세트의 마력 증폭 다리 방어구입니다.',
    type: 'legs', rarity: 'epic', iconUrl: '/assets/items/inv_pants_cloth_04.svg',
    stackable: false, maxStack: 1, sellPrice: 5000, requiredClass: 'shadow_mage',
    stats: { defense: 65, hp: 85, attack: 75, critDamage: 0.15 }
  },
  {
    id: 'epc_cowl_01', name: '티리스팔의 두건', description: '마법사 티어 5 세트의 두건으로, 심연의 지혜를 담고 있습니다.',
    type: 'helm', rarity: 'epic', iconUrl: '/assets/items/inv_helmet_12.svg',
    stackable: false, maxStack: 1, sellPrice: 4600, requiredClass: 'shadow_mage',
    stats: { defense: 55, hp: 70, attack: 65, critRate: 0.05 }
  },
  {
    id: 'epc_shoulders_01', name: '폭풍우 어깨보호대', description: '마법사 티어 6 세트의 번개 문양이 새겨진 어깨 방어구입니다.',
    type: 'shoulders', rarity: 'epic', iconUrl: '/assets/items/inv_shoulder_12.svg',
    stackable: false, maxStack: 1, sellPrice: 4500, requiredClass: 'shadow_mage',
    stats: { defense: 50, hp: 60, attack: 60, critDamage: 0.1 }
  },
  {
    id: 'epc_offhand_01', name: '심판관의 영혼책', description: '어둠의 심판을 내릴 때 사용하는 보조 장비 마도서입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_misc_book_02.svg',
    stackable: false, maxStack: 1, sellPrice: 3500, requiredClass: 'shadow_mage',
    stats: { attack: 60, critRate: 0.07, critDamage: 0.1 }
  },
  {
    id: 'epc_accessory_01', name: '굴단의 해골', description: '일리단이 쥐고 있던 장신구로, 사용 시 압도적인 마법 가속을 부여합니다.',
    type: 'accessory', rarity: 'epic', iconUrl: '/assets/items/inv_misc_bone_skull_02.svg',
    stackable: false, maxStack: 1, sellPrice: 3800, requiredClass: 'shadow_mage',
    stats: { attack: 50, critRate: 0.1, critDamage: 0.25 }
  },
  {
    id: 'epc_gloves_01', name: '티리스팔의 장갑', description: '손에서 검은 불꽃이 피어오르는 에픽 장갑입니다.',
    type: 'gloves', rarity: 'epic', iconUrl: '/assets/items/inv_gauntlets_06.svg',
    stackable: false, maxStack: 1, sellPrice: 3600, requiredClass: 'shadow_mage',
    stats: { defense: 40, hp: 50, attack: 45, critRate: 0.05 }
  },

  // --- Legendary (전설) ---
  {
    id: 'leg_atiesh_shadow', name: '아티쉬 - 그림자 수호자의 지팡이', description: '타락한 메디브의 마력이 짙게 밴 전설적인 지팡이입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_staff_05.svg',
    stackable: false, maxStack: 1, sellPrice: 70000, requiredClass: 'shadow_mage',
    stats: { attack: 280, hp: 150, critRate: 0.15, critDamage: 0.3 }
  },
  {
    id: 'leg_nathrezim_blade', name: '나스레짐의 진정한 피의 검', description: '공포의 군주들이 가장 은밀한 암흑 마법사에게 하사한 마법검입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_sword_08.svg',
    stackable: false, maxStack: 1, sellPrice: 65000, requiredClass: 'shadow_mage',
    stats: { attack: 260, critRate: 0.2, critDamage: 0.4 }
  },
  {
    id: 'leg_medivh_book', name: '메디브의 흑마도서', description: '차원문을 열고 악마를 부리던 메디브의 친필 지식이 담긴 보조 장비입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_misc_book_03.svg',
    stackable: false, maxStack: 1, sellPrice: 60000, requiredClass: 'shadow_mage',
    stats: { attack: 150, critRate: 0.12, critDamage: 0.25 }
  },
  {
    id: 'leg_void_core', name: '공허의 심장', description: '무한한 어둠의 에너지를 뿜어내는 기괴한 장신구입니다.',
    type: 'accessory', rarity: 'legendary', iconUrl: '/assets/items/inv_misc_orb_01.svg',
    stackable: false, maxStack: 1, sellPrice: 50000, requiredClass: 'shadow_mage',
    stats: { attack: 120, hp: 200, critRate: 0.1, critDamage: 0.5 }
  },
  {
    id: 'leg_shadow_crown', name: '암흑 마법사의 왕관', description: '고대 암흑 제국의 제사장이 쓰던 금단의 투구입니다.',
    type: 'helm', rarity: 'legendary', iconUrl: '/assets/items/inv_helmet_13.svg',
    stackable: false, maxStack: 1, sellPrice: 55000, requiredClass: 'shadow_mage',
    stats: { defense: 100, hp: 120, attack: 180, critRate: 0.15 }
  },
  {
    id: 'leg_dark_robe', name: '어둠달 제사장의 제복', description: '어둠달 골짜기의 진정한 지배자만이 입을 수 있는 로브입니다.',
    type: 'chest', rarity: 'legendary', iconUrl: '/assets/items/inv_chest_cloth_05.svg',
    stackable: false, maxStack: 1, sellPrice: 58000, requiredClass: 'shadow_mage',
    stats: { defense: 120, hp: 150, attack: 200, critDamage: 0.3 }
  },
  {
    id: 'leg_zhardoom_true', name: '자르둠 - 포식자의 지팡이 (진품)', description: '지옥 에너지를 완전히 해방한 궁극의 지팡이입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_staff_06.svg',
    stackable: false, maxStack: 1, sellPrice: 75000, requiredClass: 'shadow_mage',
    stats: { attack: 300, critRate: 0.18, critDamage: 0.4 }
  },
  {
    id: 'leg_shadoweave_gloves', name: '태초의 암흑매듭 장갑', description: '어둠의 실타래를 최초로 엮어낸 전설의 장갑입니다.',
    type: 'gloves', rarity: 'legendary', iconUrl: '/assets/items/inv_gauntlets_07.svg',
    stackable: false, maxStack: 1, sellPrice: 48000, requiredClass: 'shadow_mage',
    stats: { defense: 80, hp: 90, attack: 140, critRate: 0.1 }
  },
  {
    id: 'leg_black_hole_wand', name: '특이점 마술봉', description: '공간을 일그러뜨려 블랙홀을 생성하는 가공할 마술봉입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_wand_05.svg',
    stackable: false, maxStack: 1, sellPrice: 52000, requiredClass: 'shadow_mage',
    stats: { attack: 200, critRate: 0.1, critDamage: 0.3 }
  },
  {
    id: 'leg_skull_guldan', name: '굴단의 해골 (완전한 형태)', description: '조각나지 않은 완전한 굴단의 해골로, 흑마술의 정점이라 할 수 있습니다.',
    type: 'accessory', rarity: 'legendary', iconUrl: '/assets/items/inv_misc_bone_skull_03.svg',
    stackable: false, maxStack: 1, sellPrice: 80000, requiredClass: 'shadow_mage',
    stats: { attack: 220, hp: 300, critRate: 0.2, critDamage: 0.5 }
  }
];
