import { create } from 'zustand';
import type { Character, Dungeon } from '@shared/types';
import { CHARACTERS } from '@shared/data';
import { DUNGEONS } from '@shared/data';

interface GameState {
  characters: Character[];
  dungeons: Dungeon[];
  selectedCharacter: Character | null;

  loadGameData: () => void;
  selectCharacter: (characterId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  characters: [],
  dungeons: [],
  selectedCharacter: null,

  loadGameData: () => {
    set({
      characters: CHARACTERS,
      dungeons: DUNGEONS,
    });
  },

  selectCharacter: (characterId: string) => {
    const chars = get().characters.length > 0 ? get().characters : CHARACTERS;
    const found = chars.find((c) => c.id === characterId) ?? null;
    set({ selectedCharacter: found });
  },
}));
