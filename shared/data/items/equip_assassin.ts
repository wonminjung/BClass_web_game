import type { Item } from '../../types/item';

/** 암살자 전용 장비 */
export const EQUIP_ASSASSIN: Item[] = [
  // --- Common (일반) ---
  {
    id: 'cmn_dagger_01', name: '낡은 뼈갈개', description: '골목길 불량배들이 주로 쓰는 녹슨 단검입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_weapon_shortblade_05.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'assassin',
    stats: { attack: 14, critRate: 0.02 }
  },
  {
    id: 'cmn_sword_01', name: '뒷골목 쾌검', description: '휘두르기 편하게 날을 짧게 깎은 도검입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_sword_09.svg',
    stackable: false, maxStack: 1, sellPrice: 6, requiredClass: 'assassin',
    stats: { attack: 16 }
  },
  {
    id: 'cmn_chest_01', name: '빛바랜 가죽 튜닉', description: '어둠 속에 섞이기 좋은 검고 낡은 가죽옷입니다.',
    type: 'chest', rarity: 'common', iconUrl: '/assets/items/inv_chest_leather_01.svg',
    stackable: false, maxStack: 1, sellPrice: 6, requiredClass: 'assassin',
    stats: { defense: 15, hp: 10 }
  },
  {
    id: 'cmn_legs_01', name: '헤진 가죽 바지', description: '다리의 움직임을 방해하지 않는 가죽 바지입니다.',
    type: 'legs', rarity: 'common', iconUrl: '/assets/items/inv_pants_leather_01.svg',
    stackable: false, maxStack: 1, sellPrice: 5, requiredClass: 'assassin',
    stats: { defense: 12, hp: 8 }
  },
  {
    id: 'cmn_boots_01', name: '발소리 없는 장화', description: '밑창에 푹신한 헝겊을 덧대어 발소리를 죽였습니다.',
    type: 'boots', rarity: 'common', iconUrl: '/assets/items/inv_boots_leather_01.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'assassin',
    stats: { defense: 10, hp: 5 }
  },
  {
    id: 'cmn_helm_01', name: '가죽 안대', description: '한쪽 눈을 가려 어둠에 빨리 적응하도록 돕습니다.',
    type: 'helm', rarity: 'common', iconUrl: '/assets/items/inv_helmet_19.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'assassin',
    stats: { defense: 8, hp: 5 }
  },
  {
    id: 'cmn_gloves_01', name: '소매치기의 장갑', description: '손가락 끝부분이 뚫려 있어 미세한 작업에 유리합니다.',
    type: 'gloves', rarity: 'common', iconUrl: '/assets/items/inv_gauntlets_12.svg',
    stackable: false, maxStack: 1, sellPrice: 3, requiredClass: 'assassin',
    stats: { defense: 8, hp: 5 }
  },
  {
    id: 'cmn_shoulders_01', name: '얇은 가죽 어깨보호대', description: '최소한의 방호력만 갖춘 어깨 덧대입니다.',
    type: 'shoulders', rarity: 'common', iconUrl: '/assets/items/inv_shoulder_17.svg',
    stackable: false, maxStack: 1, sellPrice: 4, requiredClass: 'assassin',
    stats: { defense: 10, hp: 6 }
  },
  {
    id: 'cmn_belt_01', name: '단검 꽂이 허리띠', description: '단검이나 투척 무기를 숨기기 좋은 허리띠입니다.',
    type: 'belt', rarity: 'common', iconUrl: '/assets/items/inv_belt_11.svg',
    stackable: false, maxStack: 1, sellPrice: 2, requiredClass: 'assassin',
    stats: { defense: 6, hp: 4 }
  },
  {
    id: 'cmn_throw_01', name: '조잡한 투척 단검', description: '도망치는 적의 발목을 잡기 위해 던지는 무기입니다.',
    type: 'weapon', rarity: 'common', iconUrl: '/assets/items/inv_weapon_shortblade_06.svg',
    stackable: false, maxStack: 1, sellPrice: 3, requiredClass: 'assassin',
    stats: { attack: 12, critDamage: 0.05 }
  },

  // --- Uncommon (고급) ---
  {
    id: 'unc_dagger_01', name: '톱니날 절단기', description: '상처를 찢어발기기 위해 날을 톱니처럼 세운 단검입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_weapon_shortblade_07.svg',
    stackable: false, maxStack: 1, sellPrice: 140, requiredClass: 'assassin',
    stats: { attack: 38, critRate: 0.04 }
  },
  {
    id: 'unc_sword_01', name: '지옥무쇠 쾌검', description: '가볍고 예리하게 벼려진 지옥무쇠 한손검입니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_sword_10.svg',
    stackable: false, maxStack: 1, sellPrice: 150, requiredClass: 'assassin',
    stats: { attack: 42, critDamage: 0.05 }
  },
  {
    id: 'unc_chest_01', name: '톱니매듭 가죽 튜닉', description: '톱니매듭 가죽으로 만들어져 튼튼하고 질깁니다.',
    type: 'chest', rarity: 'uncommon', iconUrl: '/assets/items/inv_chest_leather_02.svg',
    stackable: false, maxStack: 1, sellPrice: 160, requiredClass: 'assassin',
    stats: { defense: 35, hp: 30, attack: 10 }
  },
  {
    id: 'unc_legs_01', name: '톱니매듭 바지', description: '도적들의 민첩한 움직임을 완벽하게 지원합니다.',
    type: 'legs', rarity: 'uncommon', iconUrl: '/assets/items/inv_pants_leather_02.svg',
    stackable: false, maxStack: 1, sellPrice: 140, requiredClass: 'assassin',
    stats: { defense: 30, hp: 25, attack: 8 }
  },
  {
    id: 'unc_helm_01', name: '톱니매듭 복면', description: '입과 코를 가려 정체를 숨겨주는 복면입니다.',
    type: 'helm', rarity: 'uncommon', iconUrl: '/assets/items/inv_helmet_20.svg',
    stackable: false, maxStack: 1, sellPrice: 120, requiredClass: 'assassin',
    stats: { defense: 25, hp: 20, critRate: 0.01 }
  },
  {
    id: 'unc_boots_01', name: '톱니매듭 장화', description: '아웃랜드 척박한 지형에서도 발을 보호해 줍니다.',
    type: 'boots', rarity: 'uncommon', iconUrl: '/assets/items/inv_boots_leather_02.svg',
    stackable: false, maxStack: 1, sellPrice: 90, requiredClass: 'assassin',
    stats: { defense: 20, hp: 15 }
  },
  {
    id: 'unc_shoulders_01', name: '톱니매듭 어깨보호대', description: '어깨 관절의 움직임을 자유롭게 해줍니다.',
    type: 'shoulders', rarity: 'uncommon', iconUrl: '/assets/items/inv_shoulder_18.svg',
    stackable: false, maxStack: 1, sellPrice: 100, requiredClass: 'assassin',
    stats: { defense: 22, hp: 18 }
  },
  {
    id: 'unc_fist_01', name: '가시박힌 쇳조각', description: '주먹에 끼우고 휘두르면 치명적인 타격을 입힙니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_weapon_hand_01.svg',
    stackable: false, maxStack: 1, sellPrice: 130, requiredClass: 'assassin',
    stats: { attack: 40, critRate: 0.03 }
  },
  {
    id: 'unc_mace_01', name: '도적의 둔기', description: '적의 뒤통수를 내리쳐 기절시킬 때 씁니다.',
    type: 'weapon', rarity: 'uncommon', iconUrl: '/assets/items/inv_mace_09.svg',
    stackable: false, maxStack: 1, sellPrice: 120, requiredClass: 'assassin',
    stats: { attack: 45, critDamage: 0.1 }
  },
  {
    id: 'unc_accessory_01', name: '독이 든 약병', description: '언제든 무기에 바를 수 있도록 준비해둔 맹독입니다.',
    type: 'accessory', rarity: 'uncommon', iconUrl: '/assets/items/inv_potion_01.svg',
    stackable: false, maxStack: 1, sellPrice: 80, requiredClass: 'assassin',
    stats: { attack: 15, critRate: 0.02 }
  },

  // --- Rare (희귀) ---
  {
    id: 'rar_dagger_01', name: '은빛별 단검', description: '은은한 달빛 아래서 번뜩이는 날카로운 비수입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_weapon_shortblade_08.svg',
    stackable: false, maxStack: 1, sellPrice: 850, requiredClass: 'assassin',
    stats: { attack: 68, critRate: 0.06, critDamage: 0.1 }
  },
  {
    id: 'rar_sword_01', name: '라트로의 변화하는 검', description: '어둠의 미궁에서 수많은 도적들이 갈망하던 국민 도검입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_sword_11.svg',
    stackable: false, maxStack: 1, sellPrice: 880, requiredClass: 'assassin',
    stats: { attack: 75, speed: 5, critRate: 0.05 }
  },
  {
    id: 'rar_chest_01', name: '황무지방랑자 튜닉', description: '도적 던전 영웅 세트인 황무지방랑자의 가슴 방어구입니다.',
    type: 'chest', rarity: 'rare', iconUrl: '/assets/items/inv_chest_leather_03.svg',
    stackable: false, maxStack: 1, sellPrice: 900, requiredClass: 'assassin',
    stats: { defense: 60, hp: 60, attack: 40, critRate: 0.04 }
  },
  {
    id: 'rar_legs_01', name: '황무지방랑자 다리보호구', description: '적의 추적을 따돌리기 좋은 가벼운 다리 방어구입니다.',
    type: 'legs', rarity: 'rare', iconUrl: '/assets/items/inv_pants_leather_03.svg',
    stackable: false, maxStack: 1, sellPrice: 850, requiredClass: 'assassin',
    stats: { defense: 55, hp: 55, attack: 35, critRate: 0.03 }
  },
  {
    id: 'rar_helm_01', name: '황무지방랑자 복면', description: '마치 모래폭풍과 동화되는 듯한 느낌을 줍니다.',
    type: 'helm', rarity: 'rare', iconUrl: '/assets/items/inv_helmet_21.svg',
    stackable: false, maxStack: 1, sellPrice: 800, requiredClass: 'assassin',
    stats: { defense: 50, hp: 45, attack: 30, critDamage: 0.1 }
  },
  {
    id: 'rar_shoulders_01', name: '황무지방랑자 어깨보호대', description: '어깨 위로 가시가 돋아있어 접근하는 적을 위협합니다.',
    type: 'shoulders', rarity: 'rare', iconUrl: '/assets/items/inv_shoulder_19.svg',
    stackable: false, maxStack: 1, sellPrice: 780, requiredClass: 'assassin',
    stats: { defense: 45, hp: 40, attack: 25 }
  },
  {
    id: 'rar_gloves_01', name: '황무지방랑자 장갑', description: '기습과 맹독 공격의 정확도를 높여주는 장갑입니다.',
    type: 'gloves', rarity: 'rare', iconUrl: '/assets/items/inv_gauntlets_13.svg',
    stackable: false, maxStack: 1, sellPrice: 700, requiredClass: 'assassin',
    stats: { defense: 35, hp: 35, attack: 20, critRate: 0.02 }
  },
  {
    id: 'rar_boots_01', name: '고요한 발걸음의 장화', description: '그림자 속을 걷는 자들을 위한 암살의 필수품입니다.',
    type: 'boots', rarity: 'rare', iconUrl: '/assets/items/inv_boots_leather_03.svg',
    stackable: false, maxStack: 1, sellPrice: 680, requiredClass: 'assassin',
    stats: { defense: 30, hp: 30, attack: 20, critDamage: 0.05 }
  },
  {
    id: 'rar_accessory_01', name: '해체자의 모래시계', description: '공격 시 일정 확률로 민첩성을 폭발적으로 증가시키는 장신구입니다.',
    type: 'accessory', rarity: 'rare', iconUrl: '/assets/items/inv_misc_hourglass_01.svg',
    stackable: false, maxStack: 1, sellPrice: 600, requiredClass: 'assassin',
    stats: { attack: 45, critRate: 0.05, critDamage: 0.1 }
  },
  {
    id: 'rar_throw_01', name: '칼날비늘 투척 단검', description: '칼날산맥의 비룡 비늘을 갈아 만든 날카로운 투척 무기입니다.',
    type: 'weapon', rarity: 'rare', iconUrl: '/assets/items/inv_weapon_shortblade_09.svg',
    stackable: false, maxStack: 1, sellPrice: 500, requiredClass: 'assassin',
    stats: { attack: 35, critRate: 0.03 }
  },

  // --- Epic (영웅) ---
  {
    id: 'epc_dagger_01', name: '말차진', description: '카라잔 공작 말체자르가 드랍하는 무시무시한 에픽 단검입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_weapon_shortblade_10.svg',
    stackable: false, maxStack: 1, sellPrice: 4000, requiredClass: 'assassin',
    stats: { attack: 130, critRate: 0.08, critDamage: 0.15 }
  },
  {
    id: 'epc_sword_01', name: '증오의 일격', description: '카라잔 일루시아가 드랍하며, 도적들에게 매우 인기가 많은 도검입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_sword_12.svg',
    stackable: false, maxStack: 1, sellPrice: 4200, requiredClass: 'assassin',
    stats: { attack: 140, critRate: 0.07, critDamage: 0.1 }
  },
  {
    id: 'epc_fist_01', name: '아즈샤라의 발톱', description: '눈먼 군주 레오테라스가 떨어뜨리는 치명적인 장착 무기입니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_weapon_hand_02.svg',
    stackable: false, maxStack: 1, sellPrice: 3800, requiredClass: 'assassin',
    stats: { attack: 135, critRate: 0.09, critDamage: 0.12 }
  },
  {
    id: 'epc_chest_01', name: '죽음의 선고자 튜닉', description: '도적 티어 5 세트, 적에게 죽음을 선고하는 자의 흉갑입니다.',
    type: 'chest', rarity: 'epic', iconUrl: '/assets/items/inv_chest_leather_04.svg',
    stackable: false, maxStack: 1, sellPrice: 4800, requiredClass: 'assassin',
    stats: { defense: 90, hp: 100, attack: 75, critRate: 0.06 }
  },
  {
    id: 'epc_legs_01', name: '학살자의 다리보호구', description: '도적 티어 6 세트, 오직 살육을 위해 맞춰진 바지입니다.',
    type: 'legs', rarity: 'epic', iconUrl: '/assets/items/inv_pants_leather_04.svg',
    stackable: false, maxStack: 1, sellPrice: 5000, requiredClass: 'assassin',
    stats: { defense: 85, hp: 95, attack: 85, critDamage: 0.15 }
  },
  {
    id: 'epc_helm_01', name: '학살자의 복면', description: '도적 티어 6 세트, 피비린내 나는 학살자의 검은 복면입니다.',
    type: 'helm', rarity: 'epic', iconUrl: '/assets/items/inv_helmet_22.svg',
    stackable: false, maxStack: 1, sellPrice: 4600, requiredClass: 'assassin',
    stats: { defense: 75, hp: 80, attack: 70, critRate: 0.07 }
  },
  {
    id: 'epc_shoulders_01', name: '죽음의 선고자 어깨구장', description: '도적 티어 5 세트, 해골 장식이 돋보이는 어깨 방어구입니다.',
    type: 'shoulders', rarity: 'epic', iconUrl: '/assets/items/inv_shoulder_20.svg',
    stackable: false, maxStack: 1, sellPrice: 4500, requiredClass: 'assassin',
    stats: { defense: 70, hp: 70, attack: 60, critDamage: 0.1 }
  },
  {
    id: 'epc_boots_01', name: '그림자 밟기 장화', description: '적의 배후로 순식간에 이동할 수 있도록 돕는 마법의 장화입니다.',
    type: 'boots', rarity: 'epic', iconUrl: '/assets/items/inv_boots_leather_04.svg',
    stackable: false, maxStack: 1, sellPrice: 3500, requiredClass: 'assassin',
    stats: { defense: 50, hp: 55, attack: 50, critRate: 0.04 }
  },
  {
    id: 'epc_accessory_01', name: '배반자의 광기', description: '검은 사원에서 드랍되는, 방어구 관통과 전투력을 극대화하는 장신구입니다.',
    type: 'accessory', rarity: 'epic', iconUrl: '/assets/items/inv_jewelry_talisman_05.svg',
    stackable: false, maxStack: 1, sellPrice: 5500, requiredClass: 'assassin',
    stats: { attack: 100, critRate: 0.08, critDamage: 0.2 }
  },
  {
    id: 'epc_throw_01', name: '죽음의 깃털', description: '투척용 무기로는 최고 수준의 예리함을 자랑합니다.',
    type: 'weapon', rarity: 'epic', iconUrl: '/assets/items/inv_weapon_shortblade_11.svg',
    stackable: false, maxStack: 1, sellPrice: 2800, requiredClass: 'assassin',
    stats: { attack: 60, critRate: 0.05, critDamage: 0.05 }
  },

  // --- Legendary (전설) ---
  {
    id: 'leg_warglaive_mh_rogue', name: '아지노스의 전투검 (주장비)', description: '일리단의 무기로, 쌍수 도적에게 있어 완전한 로망이자 종결 무기입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_glave_01.svg',
    stackable: false, maxStack: 1, sellPrice: 60000, requiredClass: 'assassin',
    stats: { attack: 250, critRate: 0.15, critDamage: 0.3 }
  },
  {
    id: 'leg_warglaive_oh_rogue', name: '아지노스의 전투검 (보조장비)', description: '주장비와 결합할 때 비로소 진정한 파괴력을 내뿜습니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_glave_02.svg',
    stackable: false, maxStack: 1, sellPrice: 60000, requiredClass: 'assassin',
    stats: { attack: 220, critRate: 0.1, critDamage: 0.2 }
  },
  {
    id: 'leg_fangs_golad', name: '골라드 - 위상의 황혼', description: '검은용군단의 힘이 응축된, 암살자의 전설적인 단검 중 하나입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_shortblade_12.svg',
    stackable: false, maxStack: 1, sellPrice: 75000, requiredClass: 'assassin',
    stats: { attack: 280, critRate: 0.18, critDamage: 0.4 }
  },
  {
    id: 'leg_fangs_tiriosh', name: '티리오쉬 - 영겁의 악몽', description: '골라드와 한 쌍을 이루며, 적의 숨통을 단숨에 끊어버립니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_shortblade_13.svg',
    stackable: false, maxStack: 1, sellPrice: 75000, requiredClass: 'assassin',
    stats: { attack: 260, critRate: 0.15, critDamage: 0.35 }
  },
  {
    id: 'leg_garona_dagger', name: '가로나의 피비린내 나는 비수', description: '국왕 레인 린을 암살할 때 사용되었던 반오크 암살자 가로나의 무기입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_shortblade_14.svg',
    stackable: false, maxStack: 1, sellPrice: 80000, requiredClass: 'assassin',
    stats: { attack: 290, critRate: 0.2, critDamage: 0.5 }
  },
  {
    id: 'leg_valeera_blade', name: '발리라의 붉은 눈물', description: '검투사 발리라 생귀나르가 극한의 상황에서 피로 제련한 환검입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_sword_13.svg',
    stackable: false, maxStack: 1, sellPrice: 65000, requiredClass: 'assassin',
    stats: { attack: 270, hp: 100, critRate: 0.16, critDamage: 0.25 }
  },
  {
    id: 'leg_vancleef_fang', name: '에드윈 밴클리프의 숨겨진 송곳니', description: '데피아즈단의 수괴가 소매 속에 숨기고 다니던 저주받은 칼입니다.',
    type: 'weapon', rarity: 'legendary', iconUrl: '/assets/items/inv_weapon_shortblade_15.svg',
    stackable: false, maxStack: 1, sellPrice: 55000, requiredClass: 'assassin',
    stats: { attack: 255, critRate: 0.12, critDamage: 0.3 }
  },
  {
    id: 'leg_shaw_cloak', name: '마티아스 쇼의 그림자 망토', description: 'SI:7의 수장 마티아스 쇼가 착용했던, 모든 시야를 차단하는 전설의 망토입니다.',
    type: 'chest', rarity: 'legendary', iconUrl: '/assets/items/inv_misc_cape_01.svg',
    stackable: false, maxStack: 1, sellPrice: 50000, requiredClass: 'assassin',
    stats: { defense: 100, hp: 150, attack: 180, critRate: 0.1 }
  },
  {
    id: 'leg_ravenholdt_ring', name: '라벤홀트 암살자의 인장', description: '최고의 암살자 길드인 라벤홀트 장원의 마스터만이 낄 수 있는 반지입니다.',
    type: 'accessory', rarity: 'legendary', iconUrl: '/assets/items/inv_jewelry_ring_01.svg',
    stackable: false, maxStack: 1, sellPrice: 58000, requiredClass: 'assassin',
    stats: { attack: 150, critRate: 0.15, critDamage: 0.4 }
  },
  {
    id: 'leg_shadow_elegy', name: '그림자의 비가', description: '암살당한 모든 자들의 절망이 서려 있는 가죽 흉갑입니다.',
    type: 'chest', rarity: 'legendary', iconUrl: '/assets/items/inv_chest_leather_05.svg',
    stackable: false, maxStack: 1, sellPrice: 85000, requiredClass: 'assassin',
    stats: { defense: 140, hp: 200, attack: 200, critDamage: 0.3 }
  }
];
