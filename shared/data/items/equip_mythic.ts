import type { Item } from '../../types/item';

/** 신화 등급 전용 장비 (클래스별 10개, 총 50개) */
export const EQUIP_MYTHIC: Item[] = [
  // ══════════════════════════════════════════════
  // 암흑 기사: 불멸의 수호자 (tanky self-sustain, high DEF/HP)
  // ══════════════════════════════════════════════
  {
    id: 'myth_dk_weapon', name: '불멸의 수호검',
    description: '천 년의 전쟁을 견뎌낸 불멸의 검. 이 검을 든 자는 절대 쓰러지지 않는다고 전해진다. 검에서 뿜어져 나오는 붉은 기운이 적의 의지를 꺾는다.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { attack: 600, defense: 100, critRate: 0.15, critDamage: 0.4 },
  },
  {
    id: 'myth_dk_offhand', name: '불멸의 성벽',
    description: '한때 왕국의 성문이었던 금속을 녹여 만든 방패. 수만 발의 화살도, 드래곤의 브레스도 이 방패 앞에서는 무력했다. 착용자의 영혼까지 보호한다는 전설이 있다.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 500, hp: 1000, mp: 100, speed: 5 },
  },
  {
    id: 'myth_dk_helm', name: '불멸의 용왕관',
    description: '고대 용의 두개골을 깎아 만든 투구. 착용자에게 용의 인내력과 불굴의 의지를 부여한다. 투구의 눈구멍에서 핏빛 빛이 새어나온다.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 400, hp: 800, speed: 10, mp: 100 },
  },
  {
    id: 'myth_dk_shoulders', name: '불멸의 전쟁견갑',
    description: '끝없는 전장의 무게를 견딘 견갑. 양쪽 어깨에 박힌 마석이 주인의 힘을 증폭시킨다. 이 견갑을 본 적들은 공포에 질려 도망쳤다고 전해진다.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { attack: 200, defense: 350, hp: 500, speed: 8 },
  },
  {
    id: 'myth_dk_chest', name: '불멸의 영혼흉갑',
    description: '수호자의 영혼이 서린 흉갑. 착용자가 쓰러질 위기에 처하면, 갑옷에 깃든 영혼들이 깨어나 주인을 지킨다. 흉갑 표면의 룬 문자가 영원히 빛난다.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 600, hp: 1500, mp: 200, speed: 3 },
  },
  {
    id: 'myth_dk_legs', name: '불멸의 철벽 다리갑',
    description: '천년의 전투에서 단 한 번도 관통되지 않은 다리갑. 대지의 정령이 깃들어 착용자를 뿌리처럼 단단하게 지탱한다. 무릎을 꿇는 것은 죽음뿐이다.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 500, hp: 1200, speed: 5, mp: 100 },
  },
  {
    id: 'myth_dk_gloves', name: '불멸의 강철 건틀릿',
    description: '적의 약점을 본능적으로 간파하는 건틀릿. 손가락 마디마디에 새겨진 고대 룬이 치명적 일격의 정확도를 극대화한다. 이 장갑으로 움켜쥔 검은 빗나가지 않는다.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { attack: 250, defense: 200, critRate: 0.12, critDamage: 0.3 },
  },
  {
    id: 'myth_dk_belt', name: '불멸의 사슬허리띠',
    description: '착용자의 육체와 영혼을 강화하는 사슬허리띠. 허리를 감싸는 마법 사슬이 생명력을 순환시켜 상처를 빠르게 아물게 한다. 전장의 중심에서도 흔들림이 없다.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 300, hp: 600, mp: 150, speed: 5 },
  },
  {
    id: 'myth_dk_boots', name: '불멸의 대지전투화',
    description: '전장을 누비는 불멸의 발걸음. 이 전투화를 신은 자는 대지의 축복을 받아 어떤 지형에서도 흔들리지 않는다. 발자국이 닿는 곳마다 대지가 굳어진다.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { speed: 20, defense: 300, hp: 500, mp: 80 },
  },
  {
    id: 'myth_dk_accessory', name: '불멸의 혈맹문장',
    description: '불멸의 수호자임을 증명하는 피의 문장. 착용자의 피가 문장과 공명하여 철벽 같은 방어력과 끝없는 생명력을 부여한다. 이 문장을 가진 자, 전장의 끝을 본다.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'dark_knight', setId: 'set_myth_dk',
    stats: { defense: 400, hp: 1000, mp: 200, critRate: 0.1 },
  },

  // ══════════════════════════════════════════════
  // 그림자 마법사: 공허의 지배자 (glass cannon, high ATK/MP)
  // ══════════════════════════════════════════════
  {
    id: 'myth_sm_weapon', name: '공허의 지배 지팡이',
    description: '공허의 심연에서 건져 올린 지팡이. 현실의 법칙을 무시하는 파괴적인 마력이 끊임없이 맥동한다. 이 지팡이가 가리키는 곳에 존재하는 것은 허무뿐이다.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 800, critRate: 0.18, critDamage: 0.6, mp: 100 },
  },
  {
    id: 'myth_sm_offhand', name: '공허의 금단마도서',
    description: '읽는 자의 정신을 공허로 이끄는 금단의 마도서. 페이지를 넘길 때마다 현실이 일그러지고, 그 틈에서 순수한 파괴의 힘이 쏟아진다. 마지막 페이지는 아무도 읽지 못했다.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 400, mp: 300, critDamage: 0.3, speed: 5 },
  },
  {
    id: 'myth_sm_helm', name: '공허의 심연왕관',
    description: '공허의 지배자만이 쓸 수 있는 왕관. 착용 순간 세계가 다르게 보이기 시작하며, 만물의 마력 흐름이 투명하게 드러난다. 왕관의 보석이 어둠 속에서도 검게 빛난다.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 200, mp: 250, defense: 150, speed: 8 },
  },
  {
    id: 'myth_sm_shoulders', name: '공허의 차원 어깨걸이',
    description: '공허의 에너지가 끊임없이 소용돌이치는 어깨걸이. 양 어깨 위에 떠 있는 소형 차원 균열에서 무한한 마력이 흘러나온다. 주변의 빛마저 삼키는 듯하다.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 300, defense: 150, mp: 200, speed: 10 },
  },
  {
    id: 'myth_sm_chest', name: '공허의 왜곡로브',
    description: '현실을 왜곡하는 공허의 로브. 이 로브를 입은 자의 주위로 공간이 일그러져, 적의 공격이 엉뚱한 곳으로 빗나간다. 직조된 마력의 실 하나하나가 주문 그 자체다.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 250, defense: 250, hp: 600, mp: 400 },
  },
  {
    id: 'myth_sm_legs', name: '공허의 차원바지',
    description: '공허의 안개가 끊임없이 피어오르는 하의. 다리를 감싸는 차원의 안개가 착용자를 부분적으로 다른 차원에 존재하게 한다. 물리적 공격이 그대로 통과하는 경우가 있다.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 200, defense: 200, hp: 500, mp: 300 },
  },
  {
    id: 'myth_sm_gloves', name: '공허의 파멸장갑',
    description: '손끝에서 공허의 파동이 일어나는 장갑. 손가락 끝에 맺힌 보랏빛 에너지가 주문의 위력을 극한까지 끌어올린다. 한 번의 손짓으로 요새가 무너진 기록이 있다.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 350, critRate: 0.15, critDamage: 0.5, mp: 150 },
  },
  {
    id: 'myth_sm_belt', name: '공허의 마력허리띠',
    description: '공허의 힘을 안정시키는 마력 허리띠. 허리를 감싸는 룬 사슬이 폭주하는 마력을 제어하여 착용자가 더 강력한 주문을 안전하게 시전할 수 있게 한다.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 200, mp: 250, defense: 100, speed: 8 },
  },
  {
    id: 'myth_sm_boots', name: '공허의 시공장화',
    description: '공허를 걷는 자의 장화. 현실과 공허의 경계를 자유로이 넘나들 수 있게 해준다. 한 걸음에 수십 미터를 이동하는 것이 가능하며, 발자국이 닿는 곳에 공간 균열이 남는다.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { speed: 25, attack: 200, mp: 200, defense: 100 },
  },
  {
    id: 'myth_sm_accessory', name: '공허의 심핵오브',
    description: '공허의 본질이 응축된 오브. 손바닥 위에서 끊임없이 형태가 변하며, 그 안에 하나의 소멸된 세계가 통째로 갇혀 있다. 이 오브의 주인은 공허 그 자체와 동화된다.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'shadow_mage', setId: 'set_myth_sm',
    stats: { attack: 500, critRate: 0.2, critDamage: 0.5, mp: 300 },
  },

  // ══════════════════════════════════════════════
  // 사냥꾼: 야생의 군주 (crit monster, fast)
  // ══════════════════════════════════════════════
  {
    id: 'myth_hn_weapon', name: '야생의 폭풍장궁',
    description: '야생의 정령이 깃든 전설의 장궁. 시위를 당기면 폭풍이 일어나고, 화살은 번개보다 빠르게 날아간다. 이 활에 맞고 살아남은 존재는 역사에 기록되지 않았다.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 700, critRate: 0.25, critDamage: 0.7, speed: 10 },
  },
  {
    id: 'myth_hn_offhand', name: '야생의 무한화살통',
    description: '무한한 화살이 담긴 야생의 화살통. 꺼낼 때마다 사냥감에 가장 치명적인 화살이 자동으로 생성된다. 화살통의 입구에서 야생의 기운이 솟구친다.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 350, critRate: 0.15, speed: 12, defense: 100 },
  },
  {
    id: 'myth_hn_helm', name: '야생의 맹수가면',
    description: '야수의 본능을 깨우는 원시의 가면. 착용하는 순간 오감이 수십 배로 예민해지며, 어둠 속에서도 먹잇감의 심장 박동이 들린다. 가면의 눈이 사냥감을 추적할 때 금빛으로 빛난다.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 250, hp: 500, critRate: 0.12, speed: 12 },
  },
  {
    id: 'myth_hn_shoulders', name: '야생의 질풍견갑',
    description: '야수의 뼈와 바람매의 깃털로 만든 견갑. 착용자에게 바람의 가호를 내려 움직임을 극한까지 가볍게 한다. 어깨 위의 깃털이 전투 중 폭풍처럼 날린다.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 250, critRate: 0.1, speed: 15, defense: 150 },
  },
  {
    id: 'myth_hn_chest', name: '야생의 대자연흉갑',
    description: '대자연의 보호를 받는 흉갑. 살아있는 나무껍질과 고대 짐승의 가죽이 완벽하게 결합되어 있다. 착용자의 생명이 위태로울 때 숲의 정령들이 깨어난다.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 350, hp: 800, critRate: 0.08, speed: 5 },
  },
  {
    id: 'myth_hn_legs', name: '야생의 추적 다리보호구',
    description: '밀림을 누비는 사냥꾼의 다리보호구. 어떤 지형에서도 완벽한 기동력을 보장하며, 먹잇감을 끝까지 추적할 수 있는 지구력을 부여한다. 다리에서 풀잎의 향기가 난다.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 300, hp: 700, speed: 10, critDamage: 0.2 },
  },
  {
    id: 'myth_hn_gloves', name: '야생의 명사수장갑',
    description: '활시위를 당기는 손에 완벽히 맞는 장갑. 손끝의 감각을 극대화하여 바람의 방향, 거리, 적의 약점까지 본능적으로 파악한다. 이 장갑을 낀 사냥꾼의 화살은 반드시 급소를 관통한다.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 300, critRate: 0.2, critDamage: 0.5, speed: 8 },
  },
  {
    id: 'myth_hn_belt', name: '야생의 사냥허리띠',
    description: '야수의 힘줄로 엮은 허리띠. 허리에 매달린 전리품들이 사냥꾼의 전설을 증명한다. 급소를 노리는 본능과 전장을 지배하는 속도를 동시에 부여한다.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { defense: 200, hp: 400, critRate: 0.1, speed: 10 },
  },
  {
    id: 'myth_hn_boots', name: '야생의 바람추적화',
    description: '어떤 먹잇감도 놓치지 않는 추적화. 바람보다 빠른 발걸음으로 사냥감과의 거리를 순식간에 좁힌다. 이 신발을 신은 자의 발자국은 땅에 남지 않는다.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { speed: 30, critRate: 0.1, defense: 200, hp: 300 },
  },
  {
    id: 'myth_hn_accessory', name: '야생의 군주부적',
    description: '야생의 군주의 축복이 담긴 부적. 모든 야수가 경의를 표하고, 자연의 힘이 착용자에게 모여든다. 치명적 정확도와 폭발적 파괴력, 그리고 바람 같은 민첩함을 동시에 부여한다.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'hunter', setId: 'set_myth_hn',
    stats: { attack: 350, critRate: 0.25, critDamage: 0.7, speed: 15 },
  },

  // ══════════════════════════════════════════════
  // 성직자: 빛의 화신 (sustain tank, balanced)
  // ══════════════════════════════════════════════
  {
    id: 'myth_pr_weapon', name: '빛의 심판성퇴',
    description: '신성한 빛의 힘이 깃든 성퇴. 한 때 대천사가 사용했다고 전해지며, 적을 치면 빛의 심판이 내려진다. 성퇴의 머리 부분에서 영원히 꺼지지 않는 빛이 타오른다.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { attack: 500, hp: 500, mp: 200, critRate: 0.1 },
  },
  {
    id: 'myth_pr_offhand', name: '빛의 계시성서',
    description: '빛의 가르침이 기록된 성서. 페이지를 펼치면 신성한 빛이 쏟아져 나와 아군을 치유하고 적을 정화한다. 이 성서의 마지막 장에는 세상의 끝과 새로운 시작이 기록되어 있다.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { attack: 250, hp: 600, mp: 300, defense: 150 },
  },
  {
    id: 'myth_pr_helm', name: '빛의 대관왕관',
    description: '빛의 화신만이 쓸 자격이 있는 왕관. 신의 축복이 직접 내려진 성물로, 착용자의 정신을 맑게 하고 무한한 신성력을 부여한다. 왕관에서 발산되는 후광이 어둠을 물리친다.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 350, hp: 900, mp: 250, speed: 5 },
  },
  {
    id: 'myth_pr_shoulders', name: '빛의 축복 어깨보호대',
    description: '성스러운 빛이 감싸는 어깨보호대. 양쪽 어깨에서 천사의 날개 형상이 빛으로 펼쳐진다. 신의 보호와 공격의 축복을 동시에 받을 수 있게 해주는 신성한 장비.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 300, hp: 600, mp: 200, attack: 150 },
  },
  {
    id: 'myth_pr_chest', name: '빛의 영원제의',
    description: '빛의 축복이 직조된 신성한 제의. 수천 년의 기도가 응축되어 만들어진 이 제의는, 착용자를 죽음의 문턱에서도 되돌려 놓는다. 제의 전체에서 따뜻한 금빛 광채가 흘러나온다.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 500, hp: 1500, mp: 400, attack: 100 },
  },
  {
    id: 'myth_pr_legs', name: '빛의 성스러운 하의',
    description: '빛의 보호막이 항시 감싸는 하의. 신성한 실로 직조되어 물리적 충격과 마법 공격 모두를 효과적으로 흡수한다. 무릎에 새겨진 성문이 치유의 기도를 증폭시킨다.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 450, hp: 1200, mp: 300, speed: 3 },
  },
  {
    id: 'myth_pr_gloves', name: '빛의 치유장갑',
    description: '치유의 손길을 극한까지 강화하는 장갑. 손바닥에 새겨진 성흔에서 끊임없이 치유의 빛이 흘러나온다. 이 장갑으로 만지는 것만으로도 치명상을 회복시킬 수 있다.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { attack: 250, hp: 500, mp: 200, critRate: 0.08 },
  },
  {
    id: 'myth_pr_belt', name: '빛의 순환허리띠',
    description: '신성한 에너지를 끊임없이 순환시키는 허리띠. 허리를 감싸는 빛의 고리가 생명력과 신성력의 균형을 완벽하게 유지한다. 전투가 길어질수록 더 강해지는 축복의 장비.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { defense: 250, hp: 700, mp: 250, speed: 5 },
  },
  {
    id: 'myth_pr_boots', name: '빛의 순례신발',
    description: '성스러운 땅을 밟는 빛의 신발. 이 신발이 닿는 곳은 잠시나마 성역이 되어 아군을 보호한다. 수천 마일의 순례를 거쳐도 닳지 않는, 신의 은총이 깃든 장비.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { speed: 18, defense: 250, hp: 500, mp: 200 },
  },
  {
    id: 'myth_pr_accessory', name: '빛의 화신성물',
    description: '빛의 화신의 힘이 응축된 성물. 이 성물을 가진 자는 빛 그 자체와 동화되어 끝없는 생명력과 신성력을 얻는다. 성물에서 뿜어져 나오는 빛은 가장 깊은 어둠도 꿰뚫는다.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'priest', setId: 'set_myth_pr',
    stats: { hp: 800, mp: 400, defense: 300, critRate: 0.12 },
  },

  // ══════════════════════════════════════════════
  // 암살자: 그림자의 군주 (pure damage, crit)
  // ══════════════════════════════════════════════
  {
    id: 'myth_as_weapon', name: '그림자의 멸절비수',
    description: '그림자에서 태어난 궁극의 비수. 칼날 자체가 응축된 어둠으로 이루어져 있어, 베인 상처에서 영혼까지 갈라진다. 이 비수로 죽은 자는 저승에서도 평안을 찾지 못한다.',
    type: 'weapon', rarity: 'mythic', iconUrl: '/assets/items/myth_weapon.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 800, critRate: 0.3, critDamage: 0.8, speed: 5 },
  },
  {
    id: 'myth_as_offhand', name: '그림자의 쌍칼단검',
    description: '보이지 않는 두 번째 칼날. 주인의 의지에 따라 그림자 속에서 나타나 적의 사각을 찌른다. 첫 번째 칼날이 주의를 끄는 사이, 이 단검이 승부를 끝낸다.',
    type: 'offhand', rarity: 'mythic', iconUrl: '/assets/items/myth_offhand.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 450, critRate: 0.2, critDamage: 0.4, speed: 8 },
  },
  {
    id: 'myth_as_helm', name: '그림자의 암야복면',
    description: '얼굴을 완전히 가리는 그림자의 복면. 착용 순간 존재감이 완전히 사라지며, 적의 눈앞에 서 있어도 감지되지 않는다. 복면 안쪽에서 흐르는 그림자가 오감을 극대화한다.',
    type: 'helm', rarity: 'mythic', iconUrl: '/assets/items/myth_helm.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { defense: 150, hp: 300, critRate: 0.15, speed: 12 },
  },
  {
    id: 'myth_as_shoulders', name: '그림자의 은신견갑',
    description: '그림자 속에 완벽히 녹아드는 견갑. 가벼운 소재임에도 불구하고 급소를 정확히 보호하며, 어깨 위의 그림자 문양이 착용자의 속도를 극대화한다. 번개보다 빠른 암살을 가능케 한다.',
    type: 'shoulders', rarity: 'mythic', iconUrl: '/assets/items/myth_shoulders.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 250, critRate: 0.12, speed: 15, defense: 100 },
  },
  {
    id: 'myth_as_chest', name: '그림자의 암영흉갑',
    description: '그림자가 직접 직조한 가슴 보호대. 공격을 받는 순간 착용자의 몸이 그림자처럼 흐려져 피해를 줄인다. 흉갑 전체에 새겨진 살의의 룬이 공격력을 끌어올린다.',
    type: 'chest', rarity: 'mythic', iconUrl: '/assets/items/myth_chest.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { defense: 200, hp: 500, attack: 300, critRate: 0.08 },
  },
  {
    id: 'myth_as_legs', name: '그림자의 무음 다리보호구',
    description: '소리 없는 움직임을 위한 다리보호구. 그림자의 실로 직조되어 어떤 움직임도 소리를 내지 않는다. 적이 알아차렸을 때는 이미 모든 것이 끝난 후다.',
    type: 'legs', rarity: 'mythic', iconUrl: '/assets/items/myth_legs.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { defense: 180, hp: 400, attack: 250, speed: 10 },
  },
  {
    id: 'myth_as_gloves', name: '그림자의 처형장갑',
    description: '치명적인 일격만을 위해 만들어진 장갑. 손가락 끝에 스며든 맹독과 그림자의 힘이 모든 공격을 필살로 만든다. 이 장갑으로 가한 상처는 절대 아물지 않는다.',
    type: 'gloves', rarity: 'mythic', iconUrl: '/assets/items/myth_gloves.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 400, critRate: 0.25, critDamage: 0.6, speed: 5 },
  },
  {
    id: 'myth_as_belt', name: '그림자의 독허리띠',
    description: '독과 암기를 숨기는 허리띠. 수십 가지의 치명적 도구가 차원 주머니에 저장되어 있다. 허리띠의 그림자 문양이 착용자의 공격에 추가적인 어둠의 힘을 부여한다.',
    type: 'belt', rarity: 'mythic', iconUrl: '/assets/items/myth_belt.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 200, hp: 300, critDamage: 0.3, speed: 8 },
  },
  {
    id: 'myth_as_boots', name: '그림자의 환영장화',
    description: '그림자처럼 빠르고 소리 없는 장화. 착용자가 이동할 때 잔상이 남아 적을 혼란에 빠뜨린다. 이 장화의 주인은 동시에 세 곳에 존재하는 것처럼 보인다.',
    type: 'boots', rarity: 'mythic', iconUrl: '/assets/items/myth_boots.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { speed: 35, attack: 200, critRate: 0.1, hp: 200 },
  },
  {
    id: 'myth_as_accessory', name: '그림자의 군주반지',
    description: '그림자의 군주만이 낄 수 있는 반지. 반지에 박힌 검은 보석이 착용자의 살의를 극대화하고, 모든 공격을 치명적으로 만든다. 이 반지의 주인은 그림자 자체를 지배한다.',
    type: 'accessory', rarity: 'mythic', iconUrl: '/assets/items/myth_accessory.svg',
    stackable: false, maxStack: 1, sellPrice: 200000, requiredClass: 'assassin', setId: 'set_myth_as',
    stats: { attack: 500, critRate: 0.3, critDamage: 0.8, speed: 10 },
  },
];
