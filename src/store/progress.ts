import { create } from 'zustand';

const STORAGE_KEY = 'ayzek_progress_v1';
function loadInitial(){
  try { const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); } catch(_) {}
  return { daily:25, weekly:40, monthly:10 };
}

interface ProgressState {
  progress: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  setProgress: (key: keyof ProgressState['progress'], value:number)=> void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>((set)=> ({
  progress: loadInitial(),
  setProgress: (key, value) => set(state => {
    const updated = { ...state.progress, [key]: value };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch(_){ }
    return { progress: updated };
  }),
  resetProgress: () => set(() => {
    const resetValues = { daily: 0, weekly: 0, monthly: 0 };
    try { 
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ Progress localStorage temizlendi');
    } catch(_){ }
    return { progress: resetValues };
  })
}));
