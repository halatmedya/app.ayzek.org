import { create } from 'zustand';

const STORAGE_KEY = 'ayzek_notifications_v1';
function loadInitial(){
  try { const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); } catch(_){ }
  return [] as NotificationItem[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: number;
  type?: 'task-feedback' | 'task-restored' | string; // bildirimin kategorisi
  taskId?: string;      // ilgili görev
  taskDate?: string;    // YYYY-MM-DD
  taskName?: string;    // görev adı snapshot
  direction?: 'admin-to-user' | 'user-to-admin'; // akış yönü
  read?: boolean;       // okunma durumu
}

interface NotificationsState {
  notifications: NotificationItem[];
  add: (n: Omit<NotificationItem,'id'|'date'|'read'> & {read?: boolean})=> void;
  addMock: ()=> void;
  clear: ()=> void;
  markRead: (id:string)=> void;
  markAllRead: ()=> void;
  unreadFeedbackCount: () => number; // okunmamış task-feedback sayısı (admin-to-user)
}

const MOCK_TITLES = ['Görev Tamamlandı','Yeni Duyuru','Hatırlatma','Hedef Güncellemesi'];
const MOCK_MSG = [
  'Günlük görevlerin %50 seviyesine ulaştı! Böyle devam.','Haftalık hedefin için 2 yeni görev eklendi.','Bugünkü odak süren için 20 dk kaldı.','Aylık ilerleme geçen haftaya göre daha iyi gidiyor.'
];

export const useNotificationsStore = create<NotificationsState>((set,get)=> ({
  notifications: loadInitial(),
  add: (n) => set(state => {
    const list = [
      { ...n, id:crypto.randomUUID(), date:Date.now(), read: n.read ?? false },
      ...state.notifications
    ].slice(0,100);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(_){ }
    return {notifications: list};
  }),
  addMock: () => set(state => {
    const list = [{
      id: crypto.randomUUID(),
      title: randomPick(MOCK_TITLES),
      message: randomPick(MOCK_MSG),
      date: Date.now(),
      read: false,
      type: 'mock'
    }, ...state.notifications].slice(0,100);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(_){ }
    return {notifications: list};
  }),
  clear: () => set(() => {
    try { 
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ Notifications localStorage temizlendi');
    } catch(_){ }
    return { notifications: [] };
  }),
  markRead: (id) => set(state => {
    const list = state.notifications.map(n=> n.id===id? {...n, read:true}: n);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(_){ }
    return {notifications: list};
  }),
  markAllRead: () => set(state => {
    const list = state.notifications.map(n=> ({...n, read:true}));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(_){ }
    return {notifications: list};
  }),
  unreadFeedbackCount: () => get().notifications.filter(n => !n.read && n.type==='task-feedback' && n.direction==='admin-to-user').length
}));

function randomPick<T>(arr:T[]):T { return arr[Math.floor(Math.random()*arr.length)]; }
