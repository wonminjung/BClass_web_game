export interface Artifact {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  costPerLevel: (level: number) => number;
  effectPerLevel: number;
  effectType: 'expPercent' | 'goldPercent' | 'dropRatePercent' | 'hpPercent' | 'mpPercent' | 'atkPercent' | 'defPercent' | 'gemPercent' | 'prestigeLevelKeep' | 'prestigeAbyssKeep' | 'prestigeGoldKeep' | 'allPercent' | 'autoHpThreshold' | 'battleSpeedBase';
  effectUnit: string;
}

// Cost function helper
const linear = (base: number) => (level: number) => base * level;

export const ARTIFACTS: Artifact[] = [
  {
    id: 'art_exp', name: '경험의 서', description: '경험치 획득량 증가',
    icon: '\uD83D\uDCD6', maxLevel: 20, costPerLevel: linear(200), effectPerLevel: 10,
    effectType: 'expPercent', effectUnit: '%',
  },
  {
    id: 'art_gold', name: '재물의 서', description: '골드 획득량 증가',
    icon: '\uD83D\uDCB0', maxLevel: 20, costPerLevel: linear(200), effectPerLevel: 10,
    effectType: 'goldPercent', effectUnit: '%',
  },
  {
    id: 'art_drop', name: '행운의 부적', description: '장비 드랍률 증가',
    icon: '\uD83C\uDF40', maxLevel: 20, costPerLevel: linear(300), effectPerLevel: 5,
    effectType: 'dropRatePercent', effectUnit: '%',
  },
  {
    id: 'art_hp', name: '생명의 결정', description: 'HP 증가',
    icon: '\u2764\uFE0F', maxLevel: 20, costPerLevel: linear(150), effectPerLevel: 5,
    effectType: 'hpPercent', effectUnit: '%',
  },
  {
    id: 'art_mp', name: '마나의 결정', description: 'MP 증가',
    icon: '\uD83D\uDCA7', maxLevel: 20, costPerLevel: linear(150), effectPerLevel: 5,
    effectType: 'mpPercent', effectUnit: '%',
  },
  {
    id: 'art_atk', name: '파괴의 룬', description: '공격력 증가',
    icon: '\u2694\uFE0F', maxLevel: 20, costPerLevel: linear(250), effectPerLevel: 3,
    effectType: 'atkPercent', effectUnit: '%',
  },
  {
    id: 'art_def', name: '수호의 룬', description: '방어력 증가',
    icon: '\uD83D\uDEE1\uFE0F', maxLevel: 20, costPerLevel: linear(250), effectPerLevel: 3,
    effectType: 'defPercent', effectUnit: '%',
  },
  {
    id: 'art_gem', name: '젬 증폭기', description: '환생 시 젬 획득량 증가',
    icon: '\uD83D\uDC8E', maxLevel: 20, costPerLevel: linear(300), effectPerLevel: 10,
    effectType: 'gemPercent', effectUnit: '%',
  },
  {
    id: 'art_level_keep', name: '기억의 수정', description: '환생 후 레벨 일부 유지 (최대 50%)',
    icon: '\uD83E\uDDE0', maxLevel: 20, costPerLevel: linear(400), effectPerLevel: 2.5,
    effectType: 'prestigeLevelKeep', effectUnit: '%',
  },
  {
    id: 'art_abyss_keep', name: '심연의 닻', description: '환생 후 심연 진행도 일부 유지 (최대 50%)',
    icon: '\u2693', maxLevel: 20, costPerLevel: linear(400), effectPerLevel: 2.5,
    effectType: 'prestigeAbyssKeep', effectUnit: '%',
  },
  {
    id: 'art_gold_keep', name: '황금의 보관함', description: '환생 후 골드 일부 유지 (최대 50%)',
    icon: '\uD83C\uDFF0', maxLevel: 20, costPerLevel: linear(400), effectPerLevel: 2.5,
    effectType: 'prestigeGoldKeep', effectUnit: '%',
  },
  {
    id: 'art_soul_flame', name: '영혼의 불꽃', description: '전체 스탯 +1% (무한 레벨)',
    icon: '\uD83D\uDD25', maxLevel: 99999, costPerLevel: (level: number) => level * level * 50, effectPerLevel: 1,
    effectType: 'allPercent', effectUnit: '%',
  },
];
