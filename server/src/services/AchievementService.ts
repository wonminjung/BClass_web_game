import type { SaveData } from '../../../shared/types';
import { ACHIEVEMENTS } from '../../../shared/data';

export function checkAchievements(saveData: SaveData): { newAchievements: string[]; goldEarned: number; gemsEarned: number } {
  if (!saveData.achievements) saveData.achievements = [];
  if (!saveData.totalKills) saveData.totalKills = 0;

  let goldEarned = 0, gemsEarned = 0;
  const newAchievements: string[] = [];

  const maxEnhance = Math.max(0, ...Object.values(saveData.enhanceLevels || {}).map(e => e.level));

  for (const ach of ACHIEVEMENTS) {
    if (saveData.achievements.includes(ach.id)) continue;

    let met = false;
    switch (ach.condition.type) {
      case 'total_kills': met = saveData.totalKills >= ach.condition.value; break;
      case 'level': met = saveData.level >= ach.condition.value; break;
      case 'max_enhance': met = maxEnhance >= ach.condition.value; break;
      case 'abyss_highest': met = (saveData.abyssHighest ?? 0) >= ach.condition.value; break;
      case 'gold': met = saveData.gold >= ach.condition.value; break;
      case 'bestiary_count': met = (saveData.bestiary?.length ?? 0) >= ach.condition.value; break;
    }

    if (met) {
      saveData.achievements.push(ach.id);
      goldEarned += ach.reward.gold ?? 0;
      gemsEarned += ach.reward.gems ?? 0;
      newAchievements.push(ach.id);
    }
  }

  saveData.gold += goldEarned;
  saveData.gems += gemsEarned;
  return { newAchievements, goldEarned, gemsEarned };
}
