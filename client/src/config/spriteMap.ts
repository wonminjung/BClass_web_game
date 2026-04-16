/**
 * Sprite mapping configuration for DungeonTileset II pixel art assets.
 * All paths are relative to /assets/dungeon-tileset-ii/frames/ (public folder).
 */

const BASE = '/assets/dungeon-tileset-ii/frames';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate an array of frame paths for a standard 4-frame animation. */
function frames(prefix: string, count = 4): string[] {
  return Array.from({ length: count }, (_, i) => `${BASE}/${prefix}_f${i}.png`);
}

// ---------------------------------------------------------------------------
// 1. CLASS_SPRITES
// ---------------------------------------------------------------------------

export interface CharacterSpriteSet {
  idle: string[];
  run: string[];
  hit: string[];
}

/**
 * Maps each playable class to its sprite frames.
 *
 * Class -> Sprite mapping rationale:
 *  - dark_knight  -> knight_m  (armoured melee fighter)
 *  - shadow_mage  -> wizzard_m (spell caster, dark robes)
 *  - hunter       -> elf_m     (agile ranged fighter)
 *  - priest       -> wizzard_f (holy caster, distinct from shadow_mage)
 *  - assassin     -> elf_f     (stealthy, nimble)
 */
export const CLASS_SPRITES: Record<string, CharacterSpriteSet> = {
  dark_knight: {
    idle: frames('knight_m_idle_anim'),
    run: frames('knight_m_run_anim'),
    hit: [`${BASE}/knight_m_hit_anim_f0.png`],
  },
  shadow_mage: {
    idle: frames('wizzard_m_idle_anim'),
    run: frames('wizzard_m_run_anim'),
    hit: [`${BASE}/wizzard_m_hit_anim_f0.png`],
  },
  hunter: {
    idle: frames('elf_m_idle_anim'),
    run: frames('elf_m_run_anim'),
    hit: [`${BASE}/elf_m_hit_anim_f0.png`],
  },
  priest: {
    idle: frames('elf_f_idle_anim'),
    run: frames('elf_f_run_anim'),
    hit: [`${BASE}/elf_f_hit_anim_f0.png`],
  },
  assassin: {
    idle: frames('wizzard_f_idle_anim'),
    run: frames('wizzard_f_run_anim'),
    hit: [`${BASE}/wizzard_f_hit_anim_f0.png`],
  },
};

// ---------------------------------------------------------------------------
// 2. MONSTER_SPRITES
// ---------------------------------------------------------------------------

export interface MonsterSpriteSet {
  idle: string[];
  run: string[];
}

/**
 * Direct mapping from monster ID to sprite set.
 * Used as first-priority lookup before Korean name pattern matching.
 */
export const MONSTER_ID_SPRITES: Record<string, MonsterSpriteSet> = {
  // -- Forsaken Crypt / Haunted Fortress --
  rotting_ghoul: { idle: frames('zombie_anim', 3), run: frames('zombie_anim', 3) },
  shadow_spider: { idle: frames('slug_anim'), run: frames('slug_anim') },
  cursed_knight: { idle: frames('skelet_idle_anim'), run: frames('skelet_run_anim') },

  // -- Blood Sanctum / Abyss Gate --
  blood_demon: { idle: frames('chort_idle_anim'), run: frames('chort_run_anim') },
  abyss_lord: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') },

  // -- Burning Mine --
  fire_elemental: { idle: frames('imp_idle_anim'), run: frames('imp_run_anim') },
  dark_iron_miner: { idle: frames('dwarf_m_idle_anim'), run: frames('dwarf_m_run_anim') },
  molten_overseer: { idle: frames('ogre_idle_anim'), run: frames('ogre_run_anim') },

  // -- Venom Swamp --
  bog_creature: { idle: frames('swampy_anim'), run: frames('swampy_anim') },
  naga_siren: { idle: frames('muddy_anim'), run: frames('muddy_anim') },
  swamp_hydra: { idle: frames('big_zombie_idle_anim'), run: frames('big_zombie_run_anim') },

  // -- Forgotten Temple --
  temple_gargoyle: { idle: frames('wogol_idle_anim'), run: frames('wogol_run_anim') },
  undead_priest: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') },
  fallen_high_priest: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') },

  // -- Frozen Throne --
  frost_wraith: { idle: frames('ice_zombie_anim'), run: frames('ice_zombie_anim') },
  frozen_colossus: { idle: frames('big_zombie_idle_anim'), run: frames('big_zombie_run_anim') },
  frost_lich_king: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') },

  // -- Blackrock Abyss --
  blackrock_orc: { idle: frames('orc_warrior_idle_anim'), run: frames('orc_warrior_run_anim') },
  drake_whelp: { idle: frames('chort_idle_anim'), run: frames('chort_run_anim') },
  black_dragon: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') },

  // -- Twilight Bastion --
  twilight_cultist: { idle: frames('orc_shaman_idle_anim'), run: frames('orc_shaman_run_anim') },
  twilight_drake: { idle: frames('chort_idle_anim'), run: frames('chort_run_anim') },
  chogall: { idle: frames('ogre_idle_anim'), run: frames('ogre_run_anim') },

  // -- Gates of Hell --
  pit_lord: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') },
  eredar_warlock: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') },
  archimonde: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') },

  // -- Icecrown Citadel --
  death_knight_minion: { idle: frames('skelet_idle_anim'), run: frames('skelet_run_anim') },
  val_kyr: { idle: frames('angel_idle_anim'), run: frames('angel_run_anim') },
  lich_king_arthas: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') },

  // -- Tomb of Sargeras --
  fel_guard_elite: { idle: frames('masked_orc_idle_anim'), run: frames('masked_orc_run_anim') },
  doomguard: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') },
  sargeras_avatar: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') },
};

/**
 * Korean name pattern -> sprite mapping.
 * Order matters: more specific patterns should come first.
 */
const MONSTER_NAME_PATTERNS: Array<{ pattern: string; sprite: MonsterSpriteSet }> = [
  // Undead / skeletal
  { pattern: '해골', sprite: { idle: frames('skelet_idle_anim'), run: frames('skelet_run_anim') } },
  { pattern: '스켈', sprite: { idle: frames('skelet_idle_anim'), run: frames('skelet_run_anim') } },
  { pattern: '기사', sprite: { idle: frames('skelet_idle_anim'), run: frames('skelet_run_anim') } },

  // Zombies
  { pattern: '좀비', sprite: { idle: frames('big_zombie_idle_anim'), run: frames('big_zombie_run_anim') } },
  { pattern: '구울', sprite: { idle: frames('zombie_anim', 3), run: frames('zombie_anim', 3) } },
  { pattern: '언데드', sprite: { idle: frames('zombie_anim', 3), run: frames('zombie_anim', 3) } },
  { pattern: '망령', sprite: { idle: frames('ice_zombie_anim'), run: frames('ice_zombie_anim') } },

  // Demons
  { pattern: '악마', sprite: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') } },
  { pattern: '데몬', sprite: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') } },
  { pattern: '지옥', sprite: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') } },
  { pattern: '파멸', sprite: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') } },

  // Imps / small demons
  { pattern: '임프', sprite: { idle: frames('imp_idle_anim'), run: frames('imp_run_anim') } },
  { pattern: '정령', sprite: { idle: frames('imp_idle_anim'), run: frames('imp_run_anim') } },

  // Orcs
  { pattern: '오크', sprite: { idle: frames('orc_warrior_idle_anim'), run: frames('orc_warrior_run_anim') } },

  // Goblins
  { pattern: '고블린', sprite: { idle: frames('goblin_idle_anim'), run: frames('goblin_run_anim') } },

  // Necromancer / casters
  { pattern: '리치', sprite: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') } },
  { pattern: '마법사', sprite: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') } },
  { pattern: '흑마', sprite: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') } },
  { pattern: '사제', sprite: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') } },
  { pattern: '대사제', sprite: { idle: frames('necromancer_anim'), run: frames('necromancer_anim') } },
  { pattern: '광신도', sprite: { idle: frames('orc_shaman_idle_anim'), run: frames('orc_shaman_run_anim') } },

  // Swamp / bog
  { pattern: '늪', sprite: { idle: frames('swampy_anim'), run: frames('swampy_anim') } },
  { pattern: '히드라', sprite: { idle: frames('big_zombie_idle_anim'), run: frames('big_zombie_run_anim') } },
  { pattern: '세이렌', sprite: { idle: frames('muddy_anim'), run: frames('muddy_anim') } },

  // Stone / gargoyle
  { pattern: '가고일', sprite: { idle: frames('wogol_idle_anim'), run: frames('wogol_run_anim') } },
  { pattern: '거신', sprite: { idle: frames('big_zombie_idle_anim'), run: frames('big_zombie_run_anim') } },

  // Frost / ice
  { pattern: '서리', sprite: { idle: frames('ice_zombie_anim'), run: frames('ice_zombie_anim') } },
  { pattern: '얼음', sprite: { idle: frames('ice_zombie_anim'), run: frames('ice_zombie_anim') } },

  // Dragons
  { pattern: '용', sprite: { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') } },
  { pattern: '비룡', sprite: { idle: frames('chort_idle_anim'), run: frames('chort_run_anim') } },
  { pattern: '드레이크', sprite: { idle: frames('chort_idle_anim'), run: frames('chort_run_anim') } },

  // Angel / valkyrie
  { pattern: '천사', sprite: { idle: frames('angel_idle_anim'), run: frames('angel_run_anim') } },
  { pattern: '발키르', sprite: { idle: frames('angel_idle_anim'), run: frames('angel_run_anim') } },

  // Ogre-like
  { pattern: '감독관', sprite: { idle: frames('ogre_idle_anim'), run: frames('ogre_run_anim') } },
  { pattern: '군주', sprite: { idle: frames('ogre_idle_anim'), run: frames('ogre_run_anim') } },
  { pattern: '초갈', sprite: { idle: frames('ogre_idle_anim'), run: frames('ogre_run_anim') } },

  // Misc
  { pattern: '거미', sprite: { idle: frames('slug_anim'), run: frames('slug_anim') } },
  { pattern: '광부', sprite: { idle: frames('dwarf_m_idle_anim'), run: frames('dwarf_m_run_anim') } },
];

/** Default/fallback sprite when no match is found. */
export const DEFAULT_MONSTER_SPRITE: MonsterSpriteSet = {
  idle: frames('goblin_idle_anim'),
  run: frames('goblin_run_anim'),
};

// ---------------------------------------------------------------------------
// 3. getMonsterSprite
// ---------------------------------------------------------------------------

/**
 * Returns the best matching sprite set for a given monster.
 *
 * Lookup priority:
 *  1. Exact match by monster ID in MONSTER_ID_SPRITES
 *  2. Korean name pattern matching (first match wins)
 *  3. Default fallback (goblin)
 */
export function getMonsterSprite(
  nameOrId: string,
  monsterId?: string,
): MonsterSpriteSet {
  // 1. Try direct ID lookup first
  if (monsterId && MONSTER_ID_SPRITES[monsterId]) {
    return MONSTER_ID_SPRITES[monsterId];
  }

  // Also try nameOrId as an ID
  if (MONSTER_ID_SPRITES[nameOrId]) {
    return MONSTER_ID_SPRITES[nameOrId];
  }

  // 2. Pattern match against Korean name
  for (const { pattern, sprite } of MONSTER_NAME_PATTERNS) {
    if (nameOrId.includes(pattern)) {
      return sprite;
    }
  }

  // 3. Fallback
  return DEFAULT_MONSTER_SPRITE;
}

// ---------------------------------------------------------------------------
// 4. DUNGEON_BACKGROUNDS
// ---------------------------------------------------------------------------

export interface DungeonBackground {
  gradient: string;
  color: string;
}

/**
 * Background color/gradient mapping per dungeon.
 * Placeholder until proper background images are added.
 */
export const DUNGEON_BACKGROUNDS: Record<string, DungeonBackground> = {
  forsaken_crypt: {
    gradient: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    color: '#1a1a2e',
  },
  haunted_fortress: {
    gradient: 'linear-gradient(180deg, #2d2d44 0%, #1a1a2e 100%)',
    color: '#2d2d44',
  },
  blood_sanctum: {
    gradient: 'linear-gradient(180deg, #3d1a1a 0%, #2a0f0f 100%)',
    color: '#3d1a1a',
  },
  abyss_gate: {
    gradient: 'linear-gradient(180deg, #1a0a2e 0%, #0d0518 100%)',
    color: '#1a0a2e',
  },
  burning_mine: {
    gradient: 'linear-gradient(180deg, #4a2a0a 0%, #2e1a05 100%)',
    color: '#4a2a0a',
  },
  venom_swamp: {
    gradient: 'linear-gradient(180deg, #1a3d1a 0%, #0f2a0f 100%)',
    color: '#1a3d1a',
  },
  forgotten_temple: {
    gradient: 'linear-gradient(180deg, #3d3d2a 0%, #2a2a1a 100%)',
    color: '#3d3d2a',
  },
  frozen_throne: {
    gradient: 'linear-gradient(180deg, #1a2e3d 0%, #0f1a2e 100%)',
    color: '#1a2e3d',
  },
  blackrock_abyss: {
    gradient: 'linear-gradient(180deg, #2e1a0a 0%, #1a0f05 100%)',
    color: '#2e1a0a',
  },
  twilight_bastion: {
    gradient: 'linear-gradient(180deg, #2e1a3d 0%, #1a0f2e 100%)',
    color: '#2e1a3d',
  },
  gates_of_hell: {
    gradient: 'linear-gradient(180deg, #4a0a0a 0%, #2e0505 100%)',
    color: '#4a0a0a',
  },
  icecrown_citadel: {
    gradient: 'linear-gradient(180deg, #1a2a3d 0%, #0a1a2e 100%)',
    color: '#1a2a3d',
  },
  tomb_of_sargeras: {
    gradient: 'linear-gradient(180deg, #2e0a2e 0%, #1a051a 100%)',
    color: '#2e0a2e',
  },
};

/** Get dungeon background with fallback. */
export function getDungeonBackground(dungeonId: string): DungeonBackground {
  return DUNGEON_BACKGROUNDS[dungeonId] ?? {
    gradient: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    color: '#1a1a2e',
  };
}

// ---------------------------------------------------------------------------
// 5. PET_SPRITES
// ---------------------------------------------------------------------------

export const PET_SPRITES: Record<string, MonsterSpriteSet> = {
  pet_wolf:          { idle: frames('wogol_idle_anim'), run: frames('wogol_run_anim') },
  pet_cat:           { idle: frames('tiny_slug_anim'), run: frames('tiny_slug_anim') },
  pet_turtle:        { idle: frames('muddy_anim'), run: frames('muddy_anim') },
  pet_eagle:         { idle: frames('angel_idle_anim'), run: frames('angel_run_anim') },
  pet_phoenix:       { idle: frames('imp_idle_anim'), run: frames('imp_run_anim') },
  pet_dragon:        { idle: frames('chort_idle_anim'), run: frames('chort_run_anim') },
  pet_unicorn:       { idle: frames('angel_idle_anim'), run: frames('angel_run_anim') },
  pet_demon:         { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') },
  pet_angel:         { idle: frames('angel_idle_anim'), run: frames('angel_run_anim') },
  pet_myth_dragon:   { idle: frames('big_demon_idle_anim'), run: frames('big_demon_run_anim') },
  pet_myth_void:     { idle: frames('necromancer_anim'), run: frames('necromancer_anim') },
  pet_myth_eagle:    { idle: frames('angel_idle_anim'), run: frames('angel_run_anim') },
  pet_myth_unicorn:  { idle: frames('angel_idle_anim'), run: frames('angel_run_anim') },
  pet_myth_reaper:   { idle: frames('skelet_idle_anim'), run: frames('skelet_run_anim') },
};

export function getPetSprite(petId: string): MonsterSpriteSet {
  return PET_SPRITES[petId] ?? { idle: frames('imp_idle_anim'), run: frames('imp_run_anim') };
}
