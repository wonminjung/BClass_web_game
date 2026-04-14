import { create } from 'zustand';
import { useEffect } from 'react';

// ── Toast Store ──
interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: number) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Shorthand
export const toast = {
  success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
  error: (msg: string) => useToastStore.getState().addToast(msg, 'error'),
  info: (msg: string) => useToastStore.getState().addToast(msg, 'info'),
};

// ── Confirm Store ──
interface ConfirmState {
  isOpen: boolean;
  message: string;
  resolve: ((value: boolean) => void) | null;
  show: (message: string) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  message: '',
  resolve: null,
  show: (message) => {
    return new Promise<boolean>((resolve) => {
      set({ isOpen: true, message, resolve });
    });
  },
  close: (result) => {
    const { resolve } = get();
    resolve?.(result);
    set({ isOpen: false, message: '', resolve: null });
  },
}));

export const confirm = (msg: string) => useConfirmStore.getState().show(msg);

// ── Toast Container Component ──
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  const colors = {
    success: 'bg-green-600/90 border-green-400',
    error: 'bg-red-600/90 border-red-400',
    info: 'bg-blue-600/90 border-blue-400',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${colors[t.type]} border text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-slide-in pointer-events-auto max-w-xs`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Confirm Modal Component ──
export function ConfirmModal() {
  const { isOpen, message, close } = useConfirmStore();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') close(true);
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60">
      <div className="bg-dungeon-panel border border-dungeon-border rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <p className="text-sm text-gray-200 whitespace-pre-line mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => close(true)}
            className="flex-1 py-2 rounded-lg bg-dungeon-accent/80 hover:bg-dungeon-accent text-white font-bold text-sm transition-colors"
          >
            확인
          </button>
          <button
            type="button"
            onClick={() => close(false)}
            className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold text-sm transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
