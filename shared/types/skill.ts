export interface Skill {
  id: string;
  name: string;
  description: string;
  characterId: string;
  type: SkillType;
  targetType: TargetType;
  iconUrl: string;
  manaCost: number;
  cooldown: number;
  damageMultiplier: number;
  healMultiplier: number;
  statusEffect: StatusEffect | null;
  animation: SkillAnimation;
  special?: string;
  unlockLevel?: number;
}

export type SkillType = 'active' | 'passive';
export type TargetType = 'single_enemy' | 'all_enemies' | 'self' | 'single_ally' | 'all_allies';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  value: number;
}

export type StatusEffectType =
  | 'poison'
  | 'burn'
  | 'stun'
  | 'bleed'
  | 'defense_down'
  | 'attack_up'
  | 'defense_up'
  | 'regen'
  | 'shield';

export type SkillAnimation = 'slash' | 'magic' | 'arrow' | 'heal' | 'buff' | 'dark' | 'fire' | 'ice';

export interface SkillState {
  skillId: string;
  currentCooldown: number;
  isAvailable: boolean;
}
