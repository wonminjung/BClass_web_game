export interface SetBonus {
  requiredCount: number;
  stats?: {
    atkPercent?: number;
    defPercent?: number;
    hpPercent?: number;
    mpPercent?: number;
    critRateFlat?: number;
    critDmgPercent?: number;
  };
  active?: {
    type: 'reflect' | 'lifesteal_on_crit' | 'hp_regen_per_turn' | 'mp_regen_per_turn' | 'bonus_damage';
    chance?: number;   // 발동 확률 (0~1)
    value: number;     // % 값
  };
  description: string;
}

export interface SetDefinition {
  id: string;
  name: string;
  pieces: string[];   // itemId 목록
  bonuses: SetBonus[];
}

export const SETS: SetDefinition[] = [
  // ── 기사: 아지노스의 전투검 ──
  {
    id: 'set_dk_warglaive',
    name: '아지노스의 전투검',
    pieces: ['leg_warglaive_mh', 'leg_warglaive_oh'],
    bonuses: [
      { requiredCount: 2, stats: { atkPercent: 20, critRateFlat: 0.10 }, description: '공격력 +20%, 치명타율 +10%' },
    ],
  },
  // ── 기사: 지옥무쇠 ──
  {
    id: 'set_dk_felsteel',
    name: '지옥무쇠',
    pieces: ['dk_unc_sword_01', 'dk_unc_shield_01', 'dk_unc_chest_01', 'dk_unc_legs_01', 'dk_unc_helm_01', 'dk_unc_boots_01'],
    bonuses: [
      { requiredCount: 2, stats: { defPercent: 15 }, description: '방어력 +15%' },
      { requiredCount: 5, stats: { hpPercent: 20 }, active: { type: 'reflect', chance: 0.20, value: 50 }, description: 'HP +20%, 피격 시 20% 확률로 피해 50% 반사' },
    ],
  },
  // ── 도적: 아지노스의 전투검 ──
  {
    id: 'set_as_warglaive',
    name: '아지노스의 전투검',
    pieces: ['leg_warglaive_mh_rogue', 'leg_warglaive_oh_rogue'],
    bonuses: [
      { requiredCount: 2, stats: { atkPercent: 25, critDmgPercent: 15 }, description: '공격력 +25%, 치명타 피해 +15%' },
    ],
  },
  // ── 도적: 황무지방랑자 ──
  {
    id: 'set_as_wastewanderer',
    name: '황무지방랑자',
    pieces: ['as_rar_chest_01', 'as_rar_legs_01', 'as_rar_helm_01', 'as_rar_shoulders_01', 'as_rar_gloves_01'],
    bonuses: [
      { requiredCount: 2, stats: { atkPercent: 10 }, description: '공격력 +10%' },
      { requiredCount: 3, stats: { critRateFlat: 0.10 }, description: '치명타율 +10%' },
      { requiredCount: 5, active: { type: 'lifesteal_on_crit', value: 10 }, description: '크리티컬 시 HP 10% 흡수' },
    ],
  },
  // ── 사냥꾼: 야수왕 ──
  {
    id: 'set_hn_beastking',
    name: '야수왕',
    pieces: ['hn_rar_chest_01', 'hn_rar_legs_01', 'hn_rar_helm_01', 'leg_bm_pet_trinket'],
    bonuses: [
      { requiredCount: 2, stats: { atkPercent: 10 }, description: '공격력 +10%' },
      { requiredCount: 4, stats: { critDmgPercent: 20 }, active: { type: 'bonus_damage', chance: 0.10, value: 100 }, description: '치명타 피해 +20%, 공격 시 10% 확률로 추가 100% 피해' },
    ],
  },
  // ── 성직자: 달빛매듭 ──
  {
    id: 'set_pr_mooncloth',
    name: '달빛매듭',
    pieces: ['pr_rar_robe_01', 'pr_rar_pants_01', 'pr_rar_cowl_01', 'pr_rar_shoes_01'],
    bonuses: [
      { requiredCount: 2, stats: { defPercent: 10 }, description: '방어력 +10%' },
      { requiredCount: 4, stats: { hpPercent: 15 }, active: { type: 'hp_regen_per_turn', value: 3 }, description: 'HP +15%, 턴마다 HP 3% 회복' },
    ],
  },
  // ── 마법사: 황천매듭 ──
  {
    id: 'set_sm_netherweave',
    name: '황천매듭',
    pieces: ['sm_unc_wand_01', 'sm_unc_robe_01', 'sm_unc_pants_01', 'sm_unc_cowl_01', 'sm_unc_shoes_01', 'sm_unc_shoulders_01', 'sm_unc_gloves_01'],
    bonuses: [
      { requiredCount: 2, stats: { atkPercent: 10 }, description: '공격력 +10%' },
      { requiredCount: 3, stats: { mpPercent: 15 }, description: 'MP +15%' },
      { requiredCount: 5, stats: { atkPercent: 15 }, active: { type: 'mp_regen_per_turn', value: 5 }, description: '공격력 +15%, 턴마다 MP 5% 추가 회복' },
    ],
  },

  // ══════════════════════════════════════════════
  // Mythic Sets (신화 세트)
  // ══════════════════════════════════════════════

  // ── 암흑 기사: 불멸의 수호자 ──
  {
    id: 'set_myth_dk',
    name: '불멸의 수호자',
    pieces: ['myth_dk_weapon', 'myth_dk_offhand', 'myth_dk_helm', 'myth_dk_shoulders', 'myth_dk_chest', 'myth_dk_gloves', 'myth_dk_belt', 'myth_dk_legs', 'myth_dk_boots', 'myth_dk_accessory'],
    bonuses: [
      { requiredCount: 3, stats: { atkPercent: 30, defPercent: 30, hpPercent: 30, mpPercent: 30 }, description: '전 스탯 +30%' },
      { requiredCount: 5, stats: {}, active: { type: 'reflect', chance: 1.0, value: 50 }, description: '피격 시 50% 반사 + 턴HP 5% 회복' },
      { requiredCount: 10, stats: { atkPercent: 50, defPercent: 50, hpPercent: 50, mpPercent: 50 }, description: '전 스탯 +50% + 사망 시 1회 부활' },
    ],
  },
  // ── 그림자 마법사: 공허의 지배자 ──
  {
    id: 'set_myth_sm',
    name: '공허의 지배자',
    pieces: ['myth_sm_weapon', 'myth_sm_offhand', 'myth_sm_helm', 'myth_sm_shoulders', 'myth_sm_chest', 'myth_sm_gloves', 'myth_sm_belt', 'myth_sm_legs', 'myth_sm_boots', 'myth_sm_accessory'],
    bonuses: [
      { requiredCount: 3, stats: { atkPercent: 40, mpPercent: 40 }, description: '공격력 +40%, MP +40%' },
      { requiredCount: 5, stats: { critDmgPercent: 30 }, active: { type: 'mp_regen_per_turn', value: 10 }, description: '치명타 피해 +30%, 턴마다 MP 10% 회복' },
      { requiredCount: 10, stats: { atkPercent: 60, mpPercent: 60, critRateFlat: 0.2 }, description: '공격력 +60%, MP +60%, 치명타율 +20%' },
    ],
  },
  // ── 사냥꾼: 야생의 군주 ──
  {
    id: 'set_myth_hn',
    name: '야생의 군주',
    pieces: ['myth_hn_weapon', 'myth_hn_offhand', 'myth_hn_helm', 'myth_hn_shoulders', 'myth_hn_chest', 'myth_hn_gloves', 'myth_hn_belt', 'myth_hn_legs', 'myth_hn_boots', 'myth_hn_accessory'],
    bonuses: [
      { requiredCount: 3, stats: { critRateFlat: 0.2, critDmgPercent: 30 }, description: '치명타율 +20%, 치명타 피해 +30%' },
      { requiredCount: 5, stats: {}, active: { type: 'bonus_damage', chance: 0.25, value: 150 }, description: '공격 시 25% 확률로 추가 150% 피해' },
      { requiredCount: 10, stats: { atkPercent: 50, critRateFlat: 0.3, critDmgPercent: 50 }, description: '공격력 +50%, 치명타율 +30%, 치명타 피해 +50%' },
    ],
  },
  // ── 성직자: 빛의 화신 ──
  {
    id: 'set_myth_pr',
    name: '빛의 화신',
    pieces: ['myth_pr_weapon', 'myth_pr_offhand', 'myth_pr_helm', 'myth_pr_shoulders', 'myth_pr_chest', 'myth_pr_gloves', 'myth_pr_belt', 'myth_pr_legs', 'myth_pr_boots', 'myth_pr_accessory'],
    bonuses: [
      { requiredCount: 3, stats: { hpPercent: 40, mpPercent: 40, defPercent: 30 }, description: 'HP +40%, MP +40%, 방어력 +30%' },
      { requiredCount: 5, stats: {}, active: { type: 'hp_regen_per_turn', value: 8 }, description: '턴마다 HP 8% 회복 + MP 5% 회복' },
      { requiredCount: 10, stats: { hpPercent: 60, mpPercent: 60, defPercent: 50, atkPercent: 40 }, description: 'HP +60%, MP +60%, 방어력 +50%, 공격력 +40%' },
    ],
  },
  // ── 암살자: 그림자의 군주 ──
  {
    id: 'set_myth_as',
    name: '그림자의 군주',
    pieces: ['myth_as_weapon', 'myth_as_offhand', 'myth_as_helm', 'myth_as_shoulders', 'myth_as_chest', 'myth_as_gloves', 'myth_as_belt', 'myth_as_legs', 'myth_as_boots', 'myth_as_accessory'],
    bonuses: [
      { requiredCount: 3, stats: { atkPercent: 40, critRateFlat: 0.15 }, description: '공격력 +40%, 치명타율 +15%' },
      { requiredCount: 5, stats: {}, active: { type: 'lifesteal_on_crit', value: 20 }, description: '크리티컬 시 HP 20% 흡수' },
      { requiredCount: 10, stats: { atkPercent: 60, critRateFlat: 0.3, critDmgPercent: 60 }, description: '공격력 +60%, 치명타율 +30%, 치명타 피해 +60%' },
    ],
  },
];
