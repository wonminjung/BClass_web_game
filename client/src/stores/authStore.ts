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
  restoreSession: () => Promise<void>;
}

function persistAuth(token: string, saveCode: string) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_saveCode', saveCode);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_saveCode');
  delete axios.defaults.headers.common['Authorization'];
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
        persistAuth(res.data.token, saveCode);
        set({
          saveCode,
          token: res.data.token,
          saveData: res.data.data,
          isAuthenticated: true,
          isLoading: false,
        });
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
        persistAuth(res.data.token, res.data.data.saveCode);
        set({
          saveCode: res.data.data.saveCode,
          token: res.data.token,
          saveData: res.data.data,
          isAuthenticated: true,
          isLoading: false,
        });
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
    clearAuth();
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

  restoreSession: async () => {
    const token = localStorage.getItem('auth_token');
    const saveCode = localStorage.getItem('auth_saveCode');
    if (!token || !saveCode) return;

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      const res = await axios.post<AuthResponse>('/api/auth/login', { saveCode });
      if (res.data.success && res.data.data) {
        set({
          saveCode,
          token,
          saveData: res.data.data,
          isAuthenticated: true,
        });
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  },
}));

// Setup axios interceptor for 401 handling
let isRefreshing = false;
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRefreshing) {
      isRefreshing = true;
      const saveCode = localStorage.getItem('auth_saveCode');
      if (saveCode) {
        try {
          const res = await axios.post('/api/auth/login', { saveCode });
          if (res.data.success && res.data.token) {
            persistAuth(res.data.token, saveCode);
            if (res.data.data) {
              useAuthStore.setState({
                token: res.data.token,
                saveData: res.data.data,
                isAuthenticated: true,
              });
            }
            // Retry original request
            error.config.headers['Authorization'] = `Bearer ${res.data.token}`;
            isRefreshing = false;
            return axios(error.config);
          }
        } catch {
          // Re-login failed
        }
      }
      isRefreshing = false;
      clearAuth();
      useAuthStore.setState({
        saveCode: '',
        token: null,
        saveData: null,
        isAuthenticated: false,
        error: null,
      });
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
