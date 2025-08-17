import { create } from 'zustand';
import type { PageKey } from '../components/Sidebar';

interface UIState {
  activePage: PageKey;
  setActivePage: (p:PageKey)=> void;
  focusTask?: { taskId: string; taskDate: string } | null; // bildirimden gelen odaklanılacak görev
  setFocusTask: (f: {taskId:string; taskDate:string} | null)=> void;
  pendingFeedbackDates: string[]; // admin bildirimi ile işaretlenecek günler
  addPendingFeedbackDate: (date:string)=> void;
  clearPendingFeedbackDate: (date:string)=> void;
}

const UI_STORAGE = 'ayzek_ui_meta_v1';
function loadUI(){
  try { const raw = localStorage.getItem(UI_STORAGE); if(raw) return JSON.parse(raw); } catch(_){ }
  return { pendingFeedbackDates: [] as string[] };
}
function persistUI(partial: Partial<Pick<UIState,'pendingFeedbackDates'>>){
  try { const current = loadUI(); const merged = { ...current, ...partial }; localStorage.setItem(UI_STORAGE, JSON.stringify(merged)); } catch(_){ }
}

export const useUIStore = create<UIState>((set,get) => ({
  activePage: 'home',
  setActivePage: (p) => { console.log('UI Store: Setting active page to:', p); set({activePage: p}); },
  focusTask: null,
  setFocusTask: (f) => set({focusTask: f}),
  pendingFeedbackDates: loadUI().pendingFeedbackDates,
  addPendingFeedbackDate: (date) => set(state => {
    if(state.pendingFeedbackDates.includes(date)) return {} as any;
    const arr = [...state.pendingFeedbackDates, date];
    persistUI({pendingFeedbackDates: arr});
    return {pendingFeedbackDates: arr};
  }),
  clearPendingFeedbackDate: (date) => set(state => {
    if(!state.pendingFeedbackDates.includes(date)) return {} as any;
    const arr = state.pendingFeedbackDates.filter(d=> d!==date);
    persistUI({pendingFeedbackDates: arr});
    return {pendingFeedbackDates: arr};
  })
}));
