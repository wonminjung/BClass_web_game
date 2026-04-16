export type PassiveNodeType = 'start' | 'minor' | 'notable' | 'keystone';

export interface PassiveNodeEffect {
  stat?: string;      // 'atkPercent' | 'defPercent' | 'hpPercent' | 'mpPercent' | 'spdFlat' | 'critRate' | 'critDamage' | 'goldPercent' | 'expPercent' | 'dropPercent' | 'lifesteal' | 'reflect' | 'penetration' | 'defIgnore' | 'skillDamage' | 'cooldownReduce' | 'aoeDamage' | 'dotDamage' | 'manaRegen' | 'hpRegen'
  value?: number;
  special?: string;   // keystone/notable unique effects
  description: string;
}

export interface PassiveNode {
  id: string;
  name: string;
  type: PassiveNodeType;
  x: number;          // position for UI (0~1000)
  y: number;
  connections: string[]; // connected node IDs
  effect: PassiveNodeEffect;
  cost: number;       // talent points to allocate
  requiredClass?: string; // class-specific node
  icon?: string;      // emoji or icon key
}

export interface PassiveTreeState {
  allocatedNodes: string[]; // list of allocated node IDs
}
