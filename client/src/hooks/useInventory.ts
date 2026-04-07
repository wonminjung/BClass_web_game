import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ITEMS } from '@shared/data';
import type { Item, InventorySlot } from '@shared/types';
import axios from 'axios';

export interface ResolvedItem {
  slot: InventorySlot;
  data: Item;
}

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

  return {
    items,
    totalGold,
    totalGems,
    useItem,
    equipItem,
  };
}
