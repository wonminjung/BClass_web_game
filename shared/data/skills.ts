import type { Skill } from '../types/skill';

export const SKILLS: Skill[] = [
  // ── 카엘 (Dark Knight) ──
  {
    id: 'dk_shadow_slash', name: '그림자 참격', description: '어둠의 기운을 담은 검격으로 적 하나를 벤다.',
    characterId: 'dark_knight', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/shadow_slash.png',
    manaCost: 15, cooldown: 0, damageMultiplier: 1.6, healMultiplier: 0,
    statusEffect: null, animation: 'slash',
  },
  {
    id: 'dk_iron_wall', name: '철벽 방어', description: '3턴간 방어력이 크게 상승한다.',
    characterId: 'dark_knight', type: 'active', targetType: 'self', iconUrl: '/assets/skills/iron_wall.png',
    manaCost: 20, cooldown: 4, damageMultiplier: 0, healMultiplier: 0,
    statusEffect: { type: 'defense_up', duration: 3, value: 30 }, animation: 'buff',
  },
  {
    id: 'dk_dark_cleave', name: '암흑 강타', description: '거대한 어둠의 힘으로 모든 적을 타격한다.',
    characterId: 'dark_knight', type: 'active', targetType: 'all_enemies', iconUrl: '/assets/skills/dark_cleave.png',
    manaCost: 35, cooldown: 3, damageMultiplier: 1.2, healMultiplier: 0,
    statusEffect: null, animation: 'dark',
  },
  {
    id: 'dk_vengeance', name: '복수의 일격', description: 'HP가 낮을수록 데미지가 증가하는 강력한 일격.',
    characterId: 'dark_knight', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/vengeance.png',
    manaCost: 25, cooldown: 5, damageMultiplier: 2.5, healMultiplier: 0,
    statusEffect: null, animation: 'slash',
  },
  {
    id: 'dk_abyss_guard', name: '심연의 수호 (패시브)', description: 'HP가 30% 이하일 때 방어력 20% 증가.',
    characterId: 'dark_knight', type: 'passive', targetType: 'self', iconUrl: '/assets/skills/abyss_guard.png',
    manaCost: 0, cooldown: 0, damageMultiplier: 0, healMultiplier: 0,
    statusEffect: { type: 'defense_up', duration: 0, value: 20 }, animation: 'buff',
  },

  // ── 모르가나 (Shadow Mage) ──
  {
    id: 'sm_shadow_bolt', name: '그림자 화살', description: '응축된 암흑 에너지를 발사한다.',
    characterId: 'shadow_mage', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/shadow_bolt.png',
    manaCost: 12, cooldown: 0, damageMultiplier: 1.8, healMultiplier: 0,
    statusEffect: null, animation: 'magic',
  },
  {
    id: 'sm_void_storm', name: '공허의 폭풍', description: '공허의 힘으로 모든 적에게 마법 피해를 입힌다.',
    characterId: 'shadow_mage', type: 'active', targetType: 'all_enemies', iconUrl: '/assets/skills/void_storm.png',
    manaCost: 40, cooldown: 3, damageMultiplier: 1.4, healMultiplier: 0,
    statusEffect: null, animation: 'dark',
  },
  {
    id: 'sm_soul_drain', name: '영혼 흡수', description: '적의 생명력을 흡수하여 자신의 HP를 회복한다.',
    characterId: 'shadow_mage', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/soul_drain.png',
    manaCost: 25, cooldown: 2, damageMultiplier: 1.0, healMultiplier: 0.5,
    statusEffect: null, animation: 'dark',
  },
  {
    id: 'sm_dark_shield', name: '암흑 방벽', description: '마법 보호막을 생성하여 3턴간 피해를 흡수한다.',
    characterId: 'shadow_mage', type: 'active', targetType: 'self', iconUrl: '/assets/skills/dark_shield.png',
    manaCost: 30, cooldown: 4, damageMultiplier: 0, healMultiplier: 0,
    statusEffect: { type: 'shield', duration: 3, value: 60 }, animation: 'buff',
  },
  {
    id: 'sm_nightmare', name: '악몽 (패시브)', description: '마법 공격 시 15% 확률로 적을 기절시킨다.',
    characterId: 'shadow_mage', type: 'passive', targetType: 'single_enemy', iconUrl: '/assets/skills/nightmare.png',
    manaCost: 0, cooldown: 0, damageMultiplier: 0, healMultiplier: 0,
    statusEffect: { type: 'stun', duration: 1, value: 15 }, animation: 'dark',
  },

  // ── 아스트라 (Hunter) ──
  {
    id: 'ht_piercing_arrow', name: '관통 사격', description: '방어력을 무시하는 강력한 화살을 발사한다.',
    characterId: 'hunter', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/piercing_arrow.png',
    manaCost: 15, cooldown: 0, damageMultiplier: 1.7, healMultiplier: 0,
    statusEffect: { type: 'defense_down', duration: 2, value: 15 }, animation: 'arrow',
  },
  {
    id: 'ht_rain_of_arrows', name: '화살 비', description: '하늘에서 화살의 비가 쏟아져 모든 적을 타격한다.',
    characterId: 'hunter', type: 'active', targetType: 'all_enemies', iconUrl: '/assets/skills/rain_of_arrows.png',
    manaCost: 35, cooldown: 3, damageMultiplier: 1.1, healMultiplier: 0,
    statusEffect: null, animation: 'arrow',
  },
  {
    id: 'ht_venom_trap', name: '맹독 함정', description: '독이 묻은 함정을 설치하여 적에게 지속 피해를 준다.',
    characterId: 'hunter', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/venom_trap.png',
    manaCost: 20, cooldown: 2, damageMultiplier: 0.8, healMultiplier: 0,
    statusEffect: { type: 'poison', duration: 3, value: 12 }, animation: 'arrow',
  },
  {
    id: 'ht_eagle_eye', name: '매의 눈 (패시브)', description: '치명타 확률이 영구적으로 10% 증가한다.',
    characterId: 'hunter', type: 'passive', targetType: 'self', iconUrl: '/assets/skills/eagle_eye.png',
    manaCost: 0, cooldown: 0, damageMultiplier: 0, healMultiplier: 0,
    statusEffect: null, animation: 'buff',
  },
  {
    id: 'ht_fatal_shot', name: '필살 사격', description: '전신의 힘을 담아 치명적인 일격을 날린다. 높은 치명타율.',
    characterId: 'hunter', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/fatal_shot.png',
    manaCost: 30, cooldown: 5, damageMultiplier: 3.0, healMultiplier: 0,
    statusEffect: null, animation: 'arrow',
  },

  // ── 세라핌 (Priest) ──
  {
    id: 'pr_holy_light', name: '성스러운 빛', description: '신성한 빛으로 자신의 HP를 회복한다.',
    characterId: 'priest', type: 'active', targetType: 'self', iconUrl: '/assets/skills/holy_light.png',
    manaCost: 20, cooldown: 0, damageMultiplier: 0, healMultiplier: 2.0,
    statusEffect: null, animation: 'heal',
  },
  {
    id: 'pr_divine_shield', name: '신성 결계', description: '신의 보호막을 생성하여 3턴간 피해를 감소시킨다.',
    characterId: 'priest', type: 'active', targetType: 'self', iconUrl: '/assets/skills/divine_shield.png',
    manaCost: 30, cooldown: 4, damageMultiplier: 0, healMultiplier: 0,
    statusEffect: { type: 'shield', duration: 3, value: 80 }, animation: 'buff',
  },
  {
    id: 'pr_purify', name: '정화', description: '자신의 모든 디버프를 제거하고 소량의 HP를 회복한다.',
    characterId: 'priest', type: 'active', targetType: 'self', iconUrl: '/assets/skills/purify.png',
    manaCost: 15, cooldown: 2, damageMultiplier: 0, healMultiplier: 0.8,
    statusEffect: null, animation: 'heal',
  },
  {
    id: 'pr_judgment', name: '심판의 빛', description: '신성한 빛으로 적 하나에게 큰 피해를 입힌다.',
    characterId: 'priest', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/judgment.png',
    manaCost: 25, cooldown: 2, damageMultiplier: 2.0, healMultiplier: 0,
    statusEffect: null, animation: 'magic',
  },
  {
    id: 'pr_resurrection_aura', name: '부활의 오라 (패시브)', description: '매 턴 HP가 최대치의 3%만큼 자동 회복된다.',
    characterId: 'priest', type: 'passive', targetType: 'self', iconUrl: '/assets/skills/resurrection_aura.png',
    manaCost: 0, cooldown: 0, damageMultiplier: 0, healMultiplier: 0.03,
    statusEffect: { type: 'regen', duration: 0, value: 3 }, animation: 'heal',
  },

  // ── 제로 (Assassin) ──
  {
    id: 'as_backstab', name: '급소 찌르기', description: '적의 급소를 노려 치명적인 피해를 입힌다.',
    characterId: 'assassin', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/backstab.png',
    manaCost: 12, cooldown: 0, damageMultiplier: 1.9, healMultiplier: 0,
    statusEffect: null, animation: 'slash',
  },
  {
    id: 'as_shadow_step', name: '그림자 이동', description: '그림자 속으로 사라져 다음 공격의 치명타율 100%.',
    characterId: 'assassin', type: 'active', targetType: 'self', iconUrl: '/assets/skills/shadow_step.png',
    manaCost: 20, cooldown: 3, damageMultiplier: 0, healMultiplier: 0,
    statusEffect: { type: 'attack_up', duration: 1, value: 50 }, animation: 'dark',
  },
  {
    id: 'as_blade_dance', name: '칼날 춤', description: '빠른 연속 베기로 모든 적에게 피해를 입힌다.',
    characterId: 'assassin', type: 'active', targetType: 'all_enemies', iconUrl: '/assets/skills/blade_dance.png',
    manaCost: 30, cooldown: 3, damageMultiplier: 1.3, healMultiplier: 0,
    statusEffect: { type: 'bleed', duration: 2, value: 8 }, animation: 'slash',
  },
  {
    id: 'as_poison_edge', name: '독날', description: '독을 바른 단검으로 적을 베어 지속 피해를 준다.',
    characterId: 'assassin', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/poison_edge.png',
    manaCost: 18, cooldown: 2, damageMultiplier: 1.2, healMultiplier: 0,
    statusEffect: { type: 'poison', duration: 3, value: 15 }, animation: 'slash',
  },
  {
    id: 'as_death_mark', name: '죽음의 표식 (패시브)', description: 'HP 20% 이하인 적에게 데미지 40% 증가.',
    characterId: 'assassin', type: 'passive', targetType: 'single_enemy', iconUrl: '/assets/skills/death_mark.png',
    manaCost: 0, cooldown: 0, damageMultiplier: 0.4, healMultiplier: 0,
    statusEffect: null, animation: 'dark',
  },

  // ── 공통 스킬 (모든 캐릭터) ──
  {
    id: 'common_basic_attack', name: '기본 공격', description: '마나를 소모하지 않는 기본 공격.',
    characterId: 'common', type: 'active', targetType: 'single_enemy', iconUrl: '/assets/skills/basic_attack.png',
    manaCost: 0, cooldown: 0, damageMultiplier: 1.0, healMultiplier: 0,
    statusEffect: null, animation: 'slash',
  },
];
