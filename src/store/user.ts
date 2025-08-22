import { create } from 'zustand';
import { useAuthStore } from './auth';
import { saveUserProfile } from '../firebase/sync';

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  createdAt: number;
  updatedAt: number;
}

interface UserStore {
  profile: UserProfile;
  
  // Actions
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => void;
  setAvatar: (avatar: string) => void;
  removeAvatar: () => void;
  
  // Persistence
  hydrate: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'u_default',
  username: 'Test User',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  avatar: undefined,
  bio: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useUserStore = create<UserStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  
  updateProfile: (updates) => {
    set(state => ({
      profile: {
        ...state.profile,
        ...updates,
        updatedAt: Date.now()
      }
    }));
    const { profile } = get();
    try { localStorage.setItem('ayzek_user_v1', JSON.stringify(profile)); } catch(_){ }
    const uid = useAuthStore.getState().user?.uid;
    if(uid){ saveUserProfile(uid, profile); }
  },
  
  setAvatar: (avatar) => {
    set(state => ({
      profile: {
        ...state.profile,
        avatar,
        updatedAt: Date.now()
      }
    }));
    
    const { profile } = get();
    try { localStorage.setItem('ayzek_user_v1', JSON.stringify(profile)); } catch(_){ }
    const uid = useAuthStore.getState().user?.uid;
    if(uid){ saveUserProfile(uid, profile); }
  },
  
  removeAvatar: () => {
    set(state => ({
      profile: {
        ...state.profile,
        avatar: undefined,
        updatedAt: Date.now()
      }
    }));
    
    const { profile } = get();
    try { localStorage.setItem('ayzek_user_v1', JSON.stringify(profile)); } catch(_){ }
    const uid = useAuthStore.getState().user?.uid;
    if(uid){ saveUserProfile(uid, profile); }
  },
  
  hydrate: () => {
    try {
      const stored = localStorage.getItem('ayzek_user_v1');
      if (stored) {
        const profile = JSON.parse(stored);
        set({ profile: { ...DEFAULT_PROFILE, ...profile } });
      }
    } catch (error) {
      console.error('User store hydration failed:', error);
    }
  },
}));

// Auto-hydrate on import
useUserStore.getState().hydrate();
