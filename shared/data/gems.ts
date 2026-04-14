import type { Gem } from '../types/item';

export const GEMS: Gem[] = [
  { id: 'gem_atk_1', name: '힘의 보석 I', description: '공격력 +5', stat: 'attack', value: 5, cost: 10 },
  { id: 'gem_atk_2', name: '힘의 보석 II', description: '공격력 +15', stat: 'attack', value: 15, cost: 30 },
  { id: 'gem_atk_3', name: '힘의 보석 III', description: '공격력 +30', stat: 'attack', value: 30, cost: 60 },
  { id: 'gem_def_1', name: '수호의 보석 I', description: '방어력 +5', stat: 'defense', value: 5, cost: 10 },
  { id: 'gem_def_2', name: '수호의 보석 II', description: '방어력 +15', stat: 'defense', value: 15, cost: 30 },
  { id: 'gem_hp_1', name: '생명의 보석 I', description: 'HP +20', stat: 'hp', value: 20, cost: 10 },
  { id: 'gem_hp_2', name: '생명의 보석 II', description: 'HP +50', stat: 'hp', value: 50, cost: 30 },
  { id: 'gem_crit_1', name: '치명의 보석 I', description: '치명타율 +2%', stat: 'critRate', value: 0.02, cost: 20 },
  { id: 'gem_crit_2', name: '치명의 보석 II', description: '치명타율 +5%', stat: 'critRate', value: 0.05, cost: 50 },
  { id: 'gem_spd_1', name: '신속의 보석 I', description: '속도 +3', stat: 'speed', value: 3, cost: 15 },
];
