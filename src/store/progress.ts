import { create } from 'zustand';
import { useAuthStore } from './auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const STORAGE_KEY = 'ayzek_progress_v1';
async function loadInitialRemote(){
  try { 
    const uid = useAuthStore.getState().user?.uid;
    if(uid){
      const ref = doc(db,'users',uid,'meta','progress');
      const snap = await getDoc(ref);
      if(snap.exists()) return snap.data();
    }
  } catch(_){}
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
  progress: { daily:25, weekly:40, monthly:10 },
  setProgress: (key, value) => set(state => {
    const updated = { ...state.progress, [key]: value };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch(_){ }
    const uid = useAuthStore.getState().user?.uid; if(uid){ setDoc(doc(db,'users',uid,'meta','progress'), updated, { merge:true }); }
    return { progress: updated };
  }),
  resetProgress: () => set(() => {
    const resetValues = { daily: 0, weekly: 0, monthly: 0 };
    try { 
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ Progress localStorage temizlendi');
    } catch(_){ }
    const uid = useAuthStore.getState().user?.uid; if(uid){ setDoc(doc(db,'users',uid,'meta','progress'), resetValues, { merge:true }); }
    return { progress: resetValues };
  })
}));

// Async hydrate remote
loadInitialRemote().then(data => { useProgressStore.setState({ progress: data }); });
