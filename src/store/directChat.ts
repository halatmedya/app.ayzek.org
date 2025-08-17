import { create } from 'zustand';

export interface DirectChatMessage {
  id: string;
  chatId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
}

export interface DirectChat {
  id: string; // chat_<userId>
  userId: string; // target user (non-admin)
  userName: string;
  createdAt: number;
  closed: boolean;
}

interface DirectChatState {
  chats: DirectChat[];
  messages: Record<string, DirectChatMessage[]>; // chatId -> messages
  startChat: (userId: string, userName: string) => string; // returns chatId
  sendMessage: (userId: string, authorId: string, authorName: string, content: string) => void;
  closeChat: (userId: string) => void;
  reopenChat: (userId: string) => void;
  getChatId: (userId: string) => string | null;
  hydrate: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'ayzek_direct_chat_v1';

function loadInitial(): Pick<DirectChatState,'chats'|'messages'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(_) {}
  return { chats: [], messages: {} };
}

function persist(state: Pick<DirectChatState,'chats'|'messages'>){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(_) {}
}

export const useDirectChatStore = create<DirectChatState>((set, get) => ({
  ...loadInitial(),
  startChat: (userId, userName) => {
    const existing = get().chats.find(c => c.userId === userId);
    if (existing) {
      if (existing.closed) {
        const chats = get().chats.map(c => c.userId===userId? {...c, closed:false}: c);
        persist({ chats, messages: get().messages });
        set({ chats });
      }
      return existing.id;
    }
    const chat: DirectChat = { id: 'chat_'+userId, userId, userName, createdAt: Date.now(), closed: false };
    const chats = [...get().chats, chat];
    persist({ chats, messages: get().messages });
    set({ chats });
    return chat.id;
  },
  sendMessage: (userId, authorId, authorName, content) => {
    if(!content.trim()) return;
    const { startChat } = get();
    const chatId = get().getChatId(userId) || startChat(userId, authorName); // ensure chat exists
    const msg: DirectChatMessage = {
      id: 'dmsg_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      chatId,
      authorId,
      authorName,
      content: content.trim(),
      createdAt: Date.now()
    };
    set(state => {
      const forChat = state.messages[chatId] || [];
      const messages = { ...state.messages, [chatId]: [...forChat, msg] };
      persist({ chats: state.chats, messages });
      return { messages };
    });
  },
  closeChat: (userId) => {
    set(state => {
      const chats = state.chats.map(c => c.userId===userId? {...c, closed:true}: c);
      persist({ chats, messages: state.messages });
      return { chats };
    });
  },
  reopenChat: (userId) => {
    set(state => {
      const chats = state.chats.map(c => c.userId===userId? {...c, closed:false}: c);
      persist({ chats, messages: state.messages });
      return { chats };
    });
  },
  getChatId: (userId) => {
    const chat = get().chats.find(c => c.userId === userId);
    return chat? chat.id : null;
  },
  hydrate: () => {
    set(loadInitial());
  },
  clearAll: () => {
    persist({ chats: [], messages: {} });
    set({ chats: [], messages: {} });
  }
}));

// Auto-hydrate
useDirectChatStore.getState().hydrate();
