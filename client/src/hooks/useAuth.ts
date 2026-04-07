import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const saveCode = useAuthStore((s) => s.saveCode);
  const saveData = useAuthStore((s) => s.saveData);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loginAction = useAuthStore((s) => s.login);
  const createNewGameAction = useAuthStore((s) => s.createNewGame);
  const logoutAction = useAuthStore((s) => s.logout);
  const updateSaveData = useAuthStore((s) => s.updateSaveData);

  const login = useCallback(
    (code: string) => loginAction(code),
    [loginAction],
  );

  const createNewGame = useCallback(
    (name: string, characterId: string) => createNewGameAction(name, characterId),
    [createNewGameAction],
  );

  const logout = useCallback(() => logoutAction(), [logoutAction]);

  return {
    saveCode,
    saveData,
    isAuthenticated,
    error,
    isLoading,
    login,
    createNewGame,
    logout,
    updateSaveData,
  };
}
