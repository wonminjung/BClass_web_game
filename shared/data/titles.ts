export interface Title {
  id: string;
  name: string;
  description: string;
  requirement: string; // achievement ID
  bonus?: { stat: string; value: number };
}

export const TITLES: Title[] = [
  { id: 'title_first_kill', name: '초보 모험가', description: '첫 몬스터를 처치', requirement: 'first_kill' },
  { id: 'title_kill_100', name: '숙련된 사냥꾼', description: '100마리 처치', requirement: 'kill_100', bonus: { stat: 'atkPercent', value: 2 } },
  { id: 'title_kill_1000', name: '전장의 지배자', description: '1000마리 처치', requirement: 'kill_1000', bonus: { stat: 'atkPercent', value: 5 } },
  { id: 'title_abyss_100', name: '심연의 지배자', description: '무한던전 100층', requirement: 'abyss_100', bonus: { stat: 'hpPercent', value: 5 } },
  { id: 'title_abyss_500', name: '나락의 왕', description: '무한던전 500층', requirement: 'abyss_500', bonus: { stat: 'atkPercent', value: 10 } },
  { id: 'title_bestiary', name: '박물학자', description: '도감 완성', requirement: 'bestiary_all', bonus: { stat: 'goldPercent', value: 10 } },
  { id: 'title_prestige', name: '환생자', description: '첫 환생', requirement: 'level_60', bonus: { stat: 'hpPercent', value: 3 } },
];
