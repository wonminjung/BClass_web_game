import type { Item } from '../../types/item';
import { CONSUMABLES } from './consumables';
import { MATERIALS } from './materials';
import { EQUIP_DARK_KNIGHT } from './equip_dark_knight';
import { EQUIP_SHADOW_MAGE } from './equip_shadow_mage';
import { EQUIP_HUNTER } from './equip_hunter';
import { EQUIP_PRIEST } from './equip_priest';
import { EQUIP_ASSASSIN } from './equip_assassin';
import { EQUIP_MYTHIC } from './equip_mythic';

export {
  CONSUMABLES,
  MATERIALS,
  EQUIP_DARK_KNIGHT,
  EQUIP_SHADOW_MAGE,
  EQUIP_HUNTER,
  EQUIP_PRIEST,
  EQUIP_ASSASSIN,
  EQUIP_MYTHIC,
};

/** 모든 아이템 통합 배열 (기존 ITEMS 호환) */
export const ITEMS: Item[] = [
  ...CONSUMABLES,
  ...MATERIALS,
  ...EQUIP_DARK_KNIGHT,
  ...EQUIP_SHADOW_MAGE,
  ...EQUIP_HUNTER,
  ...EQUIP_PRIEST,
  ...EQUIP_ASSASSIN,
  ...EQUIP_MYTHIC,
];
