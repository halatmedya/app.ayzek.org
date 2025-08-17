import { create } from 'zustand';

export interface AdminChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: number;
}

interface AdminChatState {
  messages: AdminChatMessage[];
  send: (content: string, authorId: string, authorName: string) => void;
  hydrate: () => void;
  clear: () => void;
}

const STORAGE_KEY = 'ayzek_admin_chat_v1';

function loadInitial(): AdminChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdminChatMessage[];
  } catch (_) {}
  return [];
}

function persist(messages: AdminChatMessage[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch (_) {}
}

export const useAdminChatStore = create<AdminChatState>((set, get) => ({
  messages: loadInitial(),
  send: (content, authorId, authorName) => {
    const msg: AdminChatMessage = {
      id: 'acm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      content: content.trim(),
      authorId,
      authorName,
      createdAt: Date.now(),
    };
    set(state => {
      const messages = [...state.messages, msg];
      persist(messages);
      return { messages };
    });
  },
  hydrate: () => {
    set({ messages: loadInitial() });
  },
  clear: () => {
    persist([]);
    set({ messages: [] });
  }
}));

// Auto-hydrate
useAdminChatStore.getState().hydrate();
