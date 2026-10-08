import { create } from 'zustand';
import type { Interactable } from '../engine/room';

export type PanelId =
  | 'brewos' | 'coffee' | 'vending' | 'cooler' | 'whiteboard' | 'copier' | 'library' | 'record' | 'arcade'
  | 'wardrobe' | 'pet' | 'rooms' | 'shop' | 'stats' | 'settings' | 'account' | 'tasks' | 'person' | 'help' | 'messages';

export type ToastKind = 'info' | 'success' | 'error' | 'ticket';

export interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

export interface ChatMessage {
  id: string;
  from: string;
  fromId: string;
  text: string;
  at: number;
  system?: boolean;
}

interface UIState {
  panel: PanelId | null;
  panelArg: unknown;
  toasts: Toast[];
  near: Interactable | null;
  zone: string;
  seatId: string | null;
  sittingDesk: number | null;
  chat: ChatMessage[];
  chatOpen: boolean;
  audioUnlocked: boolean;
  online: { count: number; signedIn: boolean };
  openPanel: (p: PanelId, arg?: unknown) => void;
  closePanel: () => void;
  pushChat: (m: ChatMessage) => void;
  set: (p: Partial<UIState>) => void;
}

let toastId = 1;

export const useUI = create<UIState>()((set, get) => ({
  panel: null,
  panelArg: null,
  toasts: [],
  near: null,
  zone: '',
  seatId: null,
  sittingDesk: null,
  chat: [],
  chatOpen: false,
  audioUnlocked: false,
  online: { count: 0, signedIn: false },
  openPanel: (p, arg) => set({ panel: p, panelArg: arg ?? null }),
  closePanel: () => set({ panel: null, panelArg: null }),
  pushChat: (m) => {
    if (get().chat.some((c) => c.id === m.id)) return;
    set({ chat: [...get().chat, m].slice(-80) });
  },
  set: (p) => set(p),
}));

export function toast(text: string, kind: ToastKind = 'info') {
  const id = toastId++;
  useUI.setState((s) => ({ toasts: [...s.toasts, { id, text, kind }].slice(-4) }));
  setTimeout(() => useUI.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), kind === 'error' ? 3200 : 2600);
}
