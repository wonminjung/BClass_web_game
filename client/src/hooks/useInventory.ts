import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ITEMS } from '@shared/data';
import type { Item, InventorySlot } from '@shared/types';
import axios from 'axios';

export interface ResolvedItem {
  slot: InventorySlot;
  data: Item;
}

export interface EquippedSlotInfo {
  slotName: string;
  itemId: string | null;
  data: Item | null;
  enhanceLevel: number;
}

const EQUIP_SLOTS = ['weapon', 'shield', 'helm', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'accessory'] as const;
const EQUIP_TYPES = new Set(['weapon', 'shield', 'helm', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'accessory']);

const SLOT_LABELS: Record<string, string> = {
  weapon: '무기',
  shield: '방패',
  helm: '투구',
  shoulders: '견갑',
  chest: '흉갑',
  gloves: '장갑',
  belt: '허리띠',
  legs: '다리',
  boots: '장화',
  accessory: '장신구',
};

export function useInventory() {
  const saveData = useAuthStore((s) => s.saveData);
  const updateSaveData = useAuthStore((s) => s.updateSaveData);

  const items = useMemo<ResolvedItem[]>(() => {
    if (!saveData?.inventory) return [];
    return saveData.inventory
      .map((slot) => {
        const data = ITEMS.find((item) => item.id === slot.itemId);
        if (!data) return null;
        return { slot, data };
      })
      .filter((entry): entry is ResolvedItem => entry !== null);
  }, [saveData?.inventory]);

  const equipmentItems = useMemo(
    () => items.filter((i) => EQUIP_TYPES.has(i.data.type)),
    [items],
  );

  const nonEquipmentItems = useMemo(
    () => items.filter((i) => !EQUIP_TYPES.has(i.data.type)),
    [items],
  );

  const equippedSlots = useMemo<EquippedSlotInfo[]>(() => {
    if (!saveData) return EQUIP_SLOTS.map((s) => ({ slotName: s, itemId: null, data: null, enhanceLevel: 0 }));
    return EQUIP_SLOTS.map((slotName) => {
      const itemId = saveData.equippedItems[slotName] ?? null;
      const data = itemId ? ITEMS.find((i) => i.id === itemId) ?? null : null;
      const enhanceLevel = itemId ? (saveData.enhanceLevels?.[itemId]?.level ?? 0) : 0;
      return { slotName, itemId, data, enhanceLevel };
    });
  }, [saveData?.equippedItems, saveData?.enhanceLevels]);

  const getEnhanceLevel = useCallback(
    (itemId: string) => saveData?.enhanceLevels?.[itemId]?.level ?? 0,
    [saveData?.enhanceLevels],
  );

  const getEnhanceExp = useCallback(
    (itemId: string) => saveData?.enhanceLevels?.[itemId]?.exp ?? 0,
    [saveData?.enhanceLevels],
  );

  const totalGold = useMemo(() => saveData?.gold ?? 0, [saveData?.gold]);
  const totalGems = useMemo(() => saveData?.gems ?? 0, [saveData?.gems]);

  const useItem = useCallback(
    async (itemId: string) => {
      try {
        const res = await axios.post<{ saveData: typeof saveData }>('/api/inventory/use', { itemId });
        if (res.data.saveData) {
          updateSaveData(res.data.saveData);
        }
      } catch {
        // Error handling left to UI
      }
    },
    [updateSaveData],
  );

  const equipItem = useCallback(
    async (itemId: string, slot: string) => {
      try {
        const res = await axios.post<{ saveData: typeof saveData }>('/api/inventory/equip', {
          itemId,
          slot,
        });
        if (res.data.saveData) {
          updateSaveData(res.data.saveData);
        }
      } catch {
        // Error handling left to UI
      }
    },
    [updateSaveData],
  );

  const unequipItem = useCallback(
    async (slot: string) => {
      try {
        const res = await axios.post<{ saveData: typeof saveData }>('/api/inventory/unequip', { slot });
        if (res.data.saveData) {
          updateSaveData(res.data.saveData);
        }
      } catch {
        // Error handling left to UI
      }
    },
    [updateSaveData],
  );

  return {
    items,
    equipmentItems,
    nonEquipmentItems,
    equippedSlots,
    getEnhanceLevel,
    getEnhanceExp,
    totalGold,
    totalGems,
    useItem,
    equipItem,
    unequipItem,
    SLOT_LABELS,
  };
}
