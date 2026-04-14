import type { Item } from '../../types/item';

/** 신화 등급 전용 장비 (클래스별 10개, 총 50개) */
export const EQUIP_MYTHIC: Item[] = [
  // ══════════════════════════════════════════════
  // 암흑 기사: 불멸의 수호자 (tanky stats, high DEF/HP)
  // ══════════════════════════════════════════════
  {
    id: 'myth_dk_weapon', name: '불멸의 수호검', description: '수천 년의 전투를 견뎌낸 불멸의 검.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { attack: 600, critRate: 0.2, critDamage: 0.5 },
  },
  {
    id: 'myth_dk_offhand', name: '불멸의 방패', description: '어떤 공격도 막아내는 불멸의 방패.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 400, hp: 800 },
  },
  {
    id: 'myth_dk_helm', name: '불멸의 투구', description: '착용자에게 불멸의 의지를 부여하는 투구.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 350, hp: 700, critDamage: 0.3 },
  },
  {
    id: 'myth_dk_shoulders', name: '불멸의 견갑', description: '끝없는 전장의 무게를 견딘 견갑.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 300, hp: 600 },
  },
  {
    id: 'myth_dk_chest', name: '불멸의 흉갑', description: '영원한 수호의 힘이 깃든 흉갑.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 450, hp: 1000 },
  },
  {
    id: 'myth_dk_gloves', name: '불멸의 건틀릿', description: '적의 약점을 간파하는 불멸의 장갑.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 250, hp: 500, critRate: 0.1 },
  },
  {
    id: 'myth_dk_belt', name: '불멸의 허리띠', description: '착용자의 육체를 강화하는 불멸의 허리띠.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 200, hp: 400 },
  },
  {
    id: 'myth_dk_legs', name: '불멸의 다리갑', description: '천년의 전투에서 단 한 번도 관통되지 않은 다리갑.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 400, hp: 900 },
  },
  {
    id: 'myth_dk_boots', name: '불멸의 전투화', description: '전장을 누비는 불멸의 발걸음.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 250, hp: 500, speed: 15 },
  },
  {
    id: 'myth_dk_accessory', name: '불멸의 문장', description: '불멸의 수호자임을 증명하는 문장.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { attack: 200, defense: 200, hp: 500, critRate: 0.15 },
  },

  // ══════════════════════════════════════════════
  // 그림자 마법사: 공허의 지배자 (high ATK, MP)
  // ══════════════════════════════════════════════
  {
    id: 'myth_sm_weapon', name: '공허의 지배 지팡이', description: '공허의 힘을 자유자재로 다루는 지팡이.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 700, critRate: 0.15, critDamage: 0.6 },
  },
  {
    id: 'myth_sm_offhand', name: '공허의 마도서', description: '읽는 자의 정신을 공허로 이끄는 마도서.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 400, mp: 300 },
  },
  {
    id: 'myth_sm_helm', name: '공허의 왕관', description: '공허의 지배자만이 쓸 수 있는 왕관.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 300, mp: 200, critRate: 0.1 },
  },
  {
    id: 'myth_sm_shoulders', name: '공허의 어깨걸이', description: '공허의 에너지가 흘러넘치는 어깨걸이.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 250, defense: 150, mp: 150 },
  },
  {
    id: 'myth_sm_chest', name: '공허의 로브', description: '현실을 왜곡하는 공허의 로브.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 350, defense: 200, hp: 600, mp: 250 },
  },
  {
    id: 'myth_sm_gloves', name: '공허의 장갑', description: '손끝에서 공허의 파동이 일어나는 장갑.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 300, critDamage: 0.4 },
  },
  {
    id: 'myth_sm_belt', name: '공허의 허리띠', description: '공허의 힘을 안정시키는 허리띠.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 200, defense: 100, mp: 150 },
  },
  {
    id: 'myth_sm_legs', name: '공허의 바지', description: '공허의 안개가 감싸는 하의.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 250, defense: 200, hp: 500, mp: 200 },
  },
  {
    id: 'myth_sm_boots', name: '공허의 장화', description: '공허를 걷는 자의 장화.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 200, speed: 20, mp: 100 },
  },
  {
    id: 'myth_sm_accessory', name: '공허의 오브', description: '공허의 본질이 응축된 오브.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 350, critRate: 0.2, critDamage: 0.5 },
  },

  // ══════════════════════════════════════════════
  // 사냥꾼: 야생의 군주 (crit focused)
  // ══════════════════════════════════════════════
  {
    id: 'myth_hn_weapon', name: '야생의 장궁', description: '야생의 정령이 깃든 전설의 장궁.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 650, critRate: 0.25, critDamage: 0.6 },
  },
  {
    id: 'myth_hn_offhand', name: '야생의 화살통', description: '무한한 화살이 담긴 야생의 화살통.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 300, critRate: 0.15, critDamage: 0.3 },
  },
  {
    id: 'myth_hn_helm', name: '야생의 가면', description: '야수의 본능을 깨우는 가면.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 250, hp: 500, critRate: 0.15 },
  },
  {
    id: 'myth_hn_shoulders', name: '야생의 견갑', description: '야수의 뼈와 가죽으로 만든 견갑.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 200, hp: 400, critRate: 0.1 },
  },
  {
    id: 'myth_hn_chest', name: '야생의 흉갑', description: '대자연의 보호를 받는 흉갑.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 300, hp: 700, critRate: 0.1 },
  },
  {
    id: 'myth_hn_gloves', name: '야생의 장갑', description: '활시위를 당기는 손에 완벽히 맞는 장갑.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 250, critRate: 0.2, critDamage: 0.4 },
  },
  {
    id: 'myth_hn_belt', name: '야생의 허리띠', description: '야수의 힘줄로 엮은 허리띠.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 150, hp: 300, critRate: 0.05 },
  },
  {
    id: 'myth_hn_legs', name: '야생의 다리보호구', description: '밀림을 누비는 사냥꾼의 다리보호구.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 250, hp: 600, critRate: 0.1 },
  },
  {
    id: 'myth_hn_boots', name: '야생의 추적화', description: '어떤 먹잇감도 놓치지 않는 추적화.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { speed: 25, defense: 200, hp: 400 },
  },
  {
    id: 'myth_hn_accessory', name: '야생의 부적', description: '야생의 군주의 축복이 담긴 부적.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 300, critRate: 0.2, critDamage: 0.6 },
  },

  // ══════════════════════════════════════════════
  // 성직자: 빛의 화신 (balanced, HP heavy)
  // ══════════════════════════════════════════════
  {
    id: 'myth_pr_weapon', name: '빛의 성퇴', description: '신성한 빛의 힘이 깃든 성퇴.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { attack: 500, hp: 500, critRate: 0.1 },
  },
  {
    id: 'myth_pr_offhand', name: '빛의 성서', description: '빛의 가르침이 기록된 성서.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { attack: 300, hp: 400, mp: 200 },
  },
  {
    id: 'myth_pr_helm', name: '빛의 왕관', description: '빛의 화신만이 쓸 자격이 있는 왕관.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 300, hp: 800, mp: 200 },
  },
  {
    id: 'myth_pr_shoulders', name: '빛의 어깨보호대', description: '성스러운 빛이 감싸는 어깨보호대.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 250, hp: 600, mp: 150 },
  },
  {
    id: 'myth_pr_chest', name: '빛의 제의', description: '빛의 축복이 직조된 신성한 제의.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 400, hp: 1200, mp: 300 },
  },
  {
    id: 'myth_pr_gloves', name: '빛의 장갑', description: '치유의 손길을 강화하는 장갑.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { attack: 250, hp: 400, mp: 150 },
  },
  {
    id: 'myth_pr_belt', name: '빛의 허리띠', description: '신성한 에너지를 안정시키는 허리띠.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 200, hp: 500, mp: 100 },
  },
  {
    id: 'myth_pr_legs', name: '빛의 바지', description: '빛의 보호막이 감싸는 하의.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 350, hp: 900, mp: 200 },
  },
  {
    id: 'myth_pr_boots', name: '빛의 신발', description: '성스러운 땅을 밟는 빛의 신발.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 200, hp: 400, speed: 15, mp: 100 },
  },
  {
    id: 'myth_pr_accessory', name: '빛의 성물', description: '빛의 화신의 힘이 응축된 성물.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { attack: 300, hp: 600, critRate: 0.15, mp: 200 },
  },

  // ══════════════════════════════════════════════
  // 암살자: 그림자의 군주 (ATK/crit, low DEF)
  // ══════════════════════════════════════════════
  {
    id: 'myth_as_weapon', name: '그림자의 비수', description: '그림자에서 태어난 궁극의 비수.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 700, critRate: 0.3, critDamage: 0.7 },
  },
  {
    id: 'myth_as_offhand', name: '그림자의 단검', description: '보이지 않는 두 번째 칼날.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 400, critRate: 0.2, critDamage: 0.4 },
  },
  {
    id: 'myth_as_helm', name: '그림자의 복면', description: '얼굴을 완전히 가리는 그림자의 복면.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { defense: 150, hp: 300, critRate: 0.15, critDamage: 0.3 },
  },
  {
    id: 'myth_as_shoulders', name: '그림자의 견갑', description: '그림자 속에 녹아드는 견갑.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { defense: 120, hp: 250, attack: 200, critRate: 0.1 },
  },
  {
    id: 'myth_as_chest', name: '그림자의 흉갑', description: '그림자가 직접 직조한 가슴 보호대.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { defense: 200, hp: 500, attack: 300, critRate: 0.1 },
  },
  {
    id: 'myth_as_gloves', name: '그림자의 장갑', description: '치명적인 일격을 위한 장갑.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 350, critRate: 0.25, critDamage: 0.5 },
  },
  {
    id: 'myth_as_belt', name: '그림자의 허리띠', description: '독과 암기를 숨기는 허리띠.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { defense: 100, hp: 200, attack: 150, critDamage: 0.2 },
  },
  {
    id: 'myth_as_legs', name: '그림자의 다리보호구', description: '소리 없는 움직임을 위한 다리보호구.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { defense: 180, hp: 400, attack: 250, critRate: 0.15 },
  },
  {
    id: 'myth_as_boots', name: '그림자의 장화', description: '그림자처럼 빠르고 소리 없는 장화.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { speed: 30, defense: 100, hp: 300, attack: 150 },
  },
  {
    id: 'myth_as_accessory', name: '그림자의 반지', description: '그림자의 군주만이 낄 수 있는 반지.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 400, critRate: 0.25, critDamage: 0.7 },
  },
];
