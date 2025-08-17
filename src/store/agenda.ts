import { create } from 'zustand';

export interface TaskFeedback {
  id: string;
  message: string;
  createdAt: number;
}

export interface AgendaTask {
  id: string;
  name: string;
  completed: boolean;
  createdAt: number;
  feedbacks?: TaskFeedback[]; // admin geri bildirimleri
}

export interface AgendaSession {
  id: string;
  type: 'stopwatch' | 'countdown';
  durationSec: number; // actual elapsed duration
  createdAt: number;
  label?: string; // kullanıcı tarafından verilebilir isim
}

interface AgendaState {
  selectedDate: string; // YYYY-MM-DD
  tasks: Record<string, AgendaTask[]>; // date key -> tasks
  sessions: Record<string, AgendaSession[]>; // date key -> sessions
  selectDate: (date:string)=> void;
  addTask: (date:string, name:string)=> void;
  toggleTask: (date:string, id:string)=> void;
  editTask: (date:string, id:string, name:string)=> void;
  deleteTask: (date:string, id:string)=> void;
  addSession: (date:string, data: Omit<AgendaSession,'id'|'createdAt'>)=> void;
  editSession: (date:string, id:string, label:string)=> void;
  deleteSession: (date:string, id:string)=> void;
  clearDay: (date:string)=> void;
  moveTask: (fromDate:string, toDate:string, id:string)=> void;
  addFeedback: (date:string, id:string, message:string)=> void;
  importData: (data: {tasks: Record<string, AgendaTask[]>; sessions: Record<string, AgendaSession[]>})=> void;
  clearAllData: () => void; // Yeni eklenen
}

const STORAGE_KEY = 'ayzek_agenda_v1';

function loadInitial(){
  try { const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); } catch(_){}
  return { tasks: {}, sessions: {} } as Pick<AgendaState,'tasks'|'sessions'>;
}

function persist(partial: Pick<AgendaState,'tasks'|'sessions'>){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(partial)); } catch(_){ }
}

function todayKey(){
  return new Date().toISOString().slice(0,10);
}

export const useAgendaStore = create<AgendaState>((set,get)=> {
  const init = loadInitial();
  return {
    selectedDate: todayKey(),
    tasks: init.tasks,
    sessions: init.sessions,
    selectDate: (date) => set({selectedDate: date}),
    addTask: (date, name) => set(state => {
      const task: AgendaTask = { id: crypto.randomUUID(), name: name.trim(), completed:false, createdAt: Date.now() };
      const tasks = { ...state.tasks, [date]: [task, ...(state.tasks[date]||[])] };
      persist({tasks, sessions: state.sessions});
      return { tasks };
    }),
    toggleTask: (date, id) => set(state => {
      const currentTask = (state.tasks[date]||[]).find(t=> t.id===id);
      const wasIncomplete = currentTask && !currentTask.completed;
      const hadFeedbacks = currentTask && currentTask.feedbacks && currentTask.feedbacks.length > 0;
      
      const tasksArr = (state.tasks[date]||[]).map(t=> {
        if(t.id===id) {
          const newCompleted = !t.completed;
          // Eğer görev tamamlanıyorsa ve feedback varsa, feedback'leri temizle
          if(newCompleted && t.feedbacks && t.feedbacks.length > 0) {
            return {...t, completed: newCompleted, feedbacks: []};
          }
          return {...t, completed: newCompleted};
        }
        return t;
      });
      
      const tasks = { ...state.tasks, [date]: tasksArr };
      persist({tasks, sessions: state.sessions});
      
      // Bildirim logic
      try {
        const changed = tasksArr.find(t=> t.id===id);
        if(changed) {
          if(wasIncomplete && changed.completed && hadFeedbacks) {
            // Görev tamamlandı ve feedback vardı -> Admin'e bildir
            const { useNotificationsStore } = require('./notifications');
            useNotificationsStore.getState().add({
              title: 'Görev Düzeltildi',
              message: `Kullanıcı ${date} gününe ait "${changed.name}" görevini düzeltti`,
              type: 'task-fixed',
              taskId: changed.id,
              taskDate: date,
              taskName: changed.name,
              direction: 'user-to-admin',
              read: false
            });
          } else if(changed.completed && changed.feedbacks && changed.feedbacks.length>0) {
            // Normal task-restored logic (eski)
            const { useNotificationsStore } = require('./notifications');
            useNotificationsStore.getState().add({
              title: 'Görev Düzenlendi',
              message: `${changed.name} görevi tekrar tamamlandı`,
              type: 'task-restored',
              taskId: changed.id,
              taskDate: date,
              taskName: changed.name,
              direction: 'user-to-admin',
              read: false
            });
          }
        }
      } catch(_){ }
      
      return { tasks };
    }),
    editTask: (date, id, name) => set(state => {
      const tasksArr = (state.tasks[date]||[]).map(t=> t.id===id ? {...t, name: name.trim() }: t);
      const tasks = { ...state.tasks, [date]: tasksArr };
      persist({tasks, sessions: state.sessions});
      return { tasks };
    }),
    deleteTask: (date, id) => set(state => {
      const tasksArr = (state.tasks[date]||[]).filter(t=> t.id!==id);
      const tasks = { ...state.tasks, [date]: tasksArr };
      persist({tasks, sessions: state.sessions});
      return { tasks };
    }),
    addSession: (date, data) => set(state => {
      const session: AgendaSession = { id: crypto.randomUUID(), createdAt: Date.now(), ...data };
      const sessions = { ...state.sessions, [date]: [session, ...(state.sessions[date]||[])] };
      persist({tasks: state.tasks, sessions});
      return { sessions };
    }),
    clearDay: (date) => set(state => {
      const tasks = { ...state.tasks, [date]: [] };
      const sessions = { ...state.sessions, [date]: [] };
      persist({tasks, sessions});
      return { tasks, sessions };
    }),
    moveTask: (fromDate, toDate, id) => set(state => {
      if(fromDate === toDate) return {} as any;
      const fromArr = (state.tasks[fromDate]||[]);
      const task = fromArr.find(t=> t.id===id);
      if(!task) return {} as any;
      const newFrom = fromArr.filter(t=> t.id!==id);
      const toArr = state.tasks[toDate] || [];
      // Insert at beginning of destination (treat as newest)
      const tasks = { ...state.tasks, [fromDate]: newFrom, [toDate]: [task, ...toArr] };
      persist({tasks, sessions: state.sessions});
      return { tasks };
    }),
    addFeedback: (date, id, message) => set(state => {
      const list = state.tasks[date] || [];
      const tasksArr = list.map(t => t.id===id ? {
        ...t,
        feedbacks: [{id: crypto.randomUUID(), message: message.trim(), createdAt: Date.now()}, ...(t.feedbacks||[])]
      }: t);
      const tasks = { ...state.tasks, [date]: tasksArr };
      persist({tasks, sessions: state.sessions});
      return { tasks };
    }),
    importData: (data) => set(state => {
      // Basic validation
      if(!data || typeof data !== 'object') return {} as any;
      const tasks = sanitizeTasks(data.tasks || {});
      const sessions = sanitizeSessions(data.sessions || {});
      persist({tasks, sessions});
      return { tasks, sessions };
    }),
    editSession: (date, id, label) => set(state => {
      const sessionsForDate = state.sessions[date] || [];
      const updatedSessions = sessionsForDate.map(session => 
        session.id === id ? { ...session, label } : session
      );
      const sessions = { ...state.sessions, [date]: updatedSessions };
      persist({tasks: state.tasks, sessions});
      return { sessions };
    }),
    deleteSession: (date, id) => set(state => {
      const sessionsForDate = state.sessions[date] || [];
      const filteredSessions = sessionsForDate.filter(session => session.id !== id);
      const sessions = { ...state.sessions, [date]: filteredSessions };
      persist({tasks: state.tasks, sessions});
      return { sessions };
    }),
    clearAllData: () => set(state => {
      console.log('🗑️ Tüm veriler temizleniyor...');
      // localStorage'ı temizle
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('ayzek_progress_v1');
        localStorage.removeItem('ayzek_notifications_v1');
        console.log('✅ localStorage temizlendi');
      } catch(e) {
        console.error('❌ localStorage temizlenirken hata:', e);
      }
      
      // Store'u resetle
      const emptyTasks = {};
      const emptySessions = {};
      persist({tasks: emptyTasks, sessions: emptySessions});
      
      return { 
        tasks: emptyTasks, 
        sessions: emptySessions,
        selectedDate: todayKey()
      };
    })
  };
});

function sanitizeTasks(raw: Record<string, any>): Record<string, AgendaTask[]> {
  const out: Record<string, AgendaTask[]> = {};
  Object.entries(raw||{}).forEach(([k,v])=> {
    if(Array.isArray(v)){
      out[k] = v.filter(x=> x && typeof x==='object').map(x=> ({
        id: String(x.id|| crypto.randomUUID()),
        name: String(x.name||'').slice(0,200),
        completed: !!x.completed,
        createdAt: typeof x.createdAt==='number'? x.createdAt : Date.now()
      }));
    }
  });
  return out;
}

function sanitizeSessions(raw: Record<string, any>): Record<string, AgendaSession[]> {
  const out: Record<string, AgendaSession[]> = {};
  Object.entries(raw||{}).forEach(([k,v])=> {
    if(Array.isArray(v)){
      out[k] = v.filter(x=> x && typeof x==='object').map(x=> ({
        id: String(x.id|| crypto.randomUUID()),
        type: x.type==='countdown' ? 'countdown' : 'stopwatch',
        durationSec: typeof x.durationSec==='number'? x.durationSec : 0,
        createdAt: typeof x.createdAt==='number'? x.createdAt : Date.now()
      }));
    }
  });
  return out;
}

export function formatDateLabel(dateKey:string){
  const d = new Date(dateKey);
  return d.toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' });
}

export function addDays(base: Date, offset:number){
  const d = new Date(base); d.setDate(d.getDate()+offset); return d;
}

export function toKey(d:Date){ return d.toISOString().slice(0,10); }
