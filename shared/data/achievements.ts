export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: { type: string; value: number };
  reward: { gold?: number; gems?: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_kill', name: '첫 처치', description: '몬스터를 처음으로 처치하세요', condition: { type: 'total_kills', value: 1 }, reward: { gold: 100 } },
  { id: 'kill_100', name: '백인참', description: '몬스터를 100마리 처치', condition: { type: 'total_kills', value: 100 }, reward: { gold: 5000 } },
  { id: 'kill_1000', name: '천인참', description: '몬스터를 1000마리 처치', condition: { type: 'total_kills', value: 1000 }, reward: { gold: 50000 } },
  { id: 'level_10', name: '성장의 시작', description: '레벨 10 달성', condition: { type: 'level', value: 10 }, reward: { gold: 1000 } },
  { id: 'level_30', name: '숙련 모험가', description: '레벨 30 달성', condition: { type: 'level', value: 30 }, reward: { gold: 10000 } },
  { id: 'level_60', name: '최고 레벨', description: '레벨 60 달성', condition: { type: 'level', value: 60 }, reward: { gold: 100000 } },
  { id: 'enhance_5', name: '강화 입문', description: '장비를 +5까지 강화', condition: { type: 'max_enhance', value: 5 }, reward: { gold: 3000 } },
  { id: 'enhance_10', name: '강화 숙련', description: '장비를 +10까지 강화', condition: { type: 'max_enhance', value: 10 }, reward: { gold: 20000 } },
  { id: 'enhance_20', name: '강화 장인', description: '장비를 +20까지 강화', condition: { type: 'max_enhance', value: 20 }, reward: { gold: 100000 } },
  { id: 'abyss_10', name: '심연 탐험가', description: '무한던전 10층 돌파', condition: { type: 'abyss_highest', value: 10 }, reward: { gold: 5000 } },
  { id: 'abyss_50', name: '심연 정복자', description: '무한던전 50층 돌파', condition: { type: 'abyss_highest', value: 50 }, reward: { gold: 30000 } },
  { id: 'abyss_100', name: '심연의 지배자', description: '무한던전 100층 돌파', condition: { type: 'abyss_highest', value: 100 }, reward: { gold: 200000 } },
  { id: 'abyss_500', name: '나락의 왕', description: '무한던전 500층 돌파', condition: { type: 'abyss_highest', value: 500 }, reward: { gold: 1000000, gems: 100 } },
  { id: 'gold_100k', name: '부자의 길', description: '골드 100,000 보유', condition: { type: 'gold', value: 100000 }, reward: { gems: 10 } },
  { id: 'gold_1m', name: '백만장자', description: '골드 1,000,000 보유', condition: { type: 'gold', value: 1000000 }, reward: { gems: 50 } },
  { id: 'bestiary_5', name: '몬스터 연구가', description: '도감에 5종 등록', condition: { type: 'bestiary_count', value: 5 }, reward: { gold: 2000 } },
  { id: 'bestiary_all', name: '도감 완성', description: '모든 몬스터 발견', condition: { type: 'bestiary_count', value: 32 }, reward: { gold: 500000, gems: 200 } },
];
