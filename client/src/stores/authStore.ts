import { create } from 'zustand';
import axios from 'axios';
import type { SaveData, AuthResponse } from '@shared/types';

interface AuthState {
  saveCode: string;
  token: string | null;
  saveData: SaveData | null;
  isAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;

  login: (saveCode: string) => Promise<void>;
  createNewGame: (playerName: string, characterId: string) => Promise<void>;
  logout: () => void;
  updateSaveData: (data: Partial<SaveData>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  saveCode: '',
  token: null,
  saveData: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,

  login: async (saveCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post<AuthResponse>('/api/auth/login', { saveCode });
      if (res.data.success && res.data.data && res.data.token) {
        set({
          saveCode,
          token: res.data.token,
          saveData: res.data.data,
          isAuthenticated: true,
          isLoading: false,
        });
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      } else {
        set({ error: res.data.message || '로그인에 실패했습니다.', isLoading: false });
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '서버 연결에 실패했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  createNewGame: async (playerName: string, characterId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post<AuthResponse>('/api/auth/new-game', {
        playerName,
        characterId,
      });
      if (res.data.success && res.data.data && res.data.token) {
        set({
          saveCode: res.data.data.saveCode,
          token: res.data.token,
          saveData: res.data.data,
          isAuthenticated: true,
          isLoading: false,
        });
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      } else {
        set({ error: res.data.message || '게임 생성에 실패했습니다.', isLoading: false });
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '서버 연결에 실패했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  logout: () => {
    delete axios.defaults.headers.common['Authorization'];
    set({
      saveCode: '',
      token: null,
      saveData: null,
      isAuthenticated: false,
      error: null,
    });
  },

  updateSaveData: (data: Partial<SaveData>) => {
    const current = get().saveData;
    if (current) {
      set({ saveData: { ...current, ...data } });
    }
  },
}));
