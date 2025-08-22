import { db } from './config';
import { collection, doc, getDocs, getDoc, setDoc, writeBatch } from 'firebase/firestore';

// Firestore structure:
// users/{uid} -> profile fields
// users/{uid}/agendaDays/{dateKey} -> { tasks: AgendaTask[], sessions: AgendaSession[] }

export async function fetchUserProfile(uid: string): Promise<any | null> {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('fetchUserProfile error', e); return null;
  }
}

export async function saveUserProfile(uid: string, data: any) {
  try {
    const ref = doc(db, 'users', uid);
    await setDoc(ref, data, { merge: true });
  } catch (e) { console.error('saveUserProfile error', e); }
}

export interface RemoteAgendaData { tasks: Record<string, any[]>; sessions: Record<string, any[]> }

export async function fetchAgendaAll(uid: string): Promise<RemoteAgendaData> {
  const result: RemoteAgendaData = { tasks: {}, sessions: {} };
  try {
    const col = collection(db, 'users', uid, 'agendaDays');
    const snaps = await getDocs(col);
    snaps.forEach(docSnap => {
      const dateKey = docSnap.id;
      const d = docSnap.data();
      if(Array.isArray(d.tasks)) result.tasks[dateKey] = d.tasks;
      if(Array.isArray(d.sessions)) result.sessions[dateKey] = d.sessions;
    });
  } catch(e){ console.error('fetchAgendaAll error', e); }
  return result;
}

export async function saveAgendaDate(uid: string, dateKey: string, data: { tasks?: any[]; sessions?: any[] }) {
  try {
    const ref = doc(db, 'users', uid, 'agendaDays', dateKey);
    await setDoc(ref, data, { merge: true });
  } catch(e){ console.error('saveAgendaDate error', e); }
}

export async function bulkSaveAgenda(uid: string, full: RemoteAgendaData) {
  try {
    const batch = writeBatch(db);
    const days = new Set([...Object.keys(full.tasks), ...Object.keys(full.sessions)]);
    days.forEach(day => {
      const ref = doc(db, 'users', uid, 'agendaDays', day);
      batch.set(ref, { tasks: full.tasks[day] || [], sessions: full.sessions[day] || [] }, { merge: true });
    });
    await batch.commit();
  } catch(e){ console.error('bulkSaveAgenda error', e); }
}
