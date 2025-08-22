import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail, User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { fetchUserProfile, saveUserProfile, fetchAgendaAll, bulkSaveAgenda } from '../firebase/sync';
import { useAgendaStore } from './agenda';
import { useUserStore } from './user';

const AUTH_STORAGE_KEY = 'ayzek_auth_state';

// Basit localStorage kontrolü
function hasStoredAuth(): boolean {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored === 'logged_in';
  } catch {
    return false;
  }
}

function setStoredAuth(loggedIn: boolean) {
  try {
    if (loggedIn) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'logged_in');
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {}
}

interface AuthStore {
  user: User | null;
  hasStoredSession: boolean; // localStorage'da session var mı
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  hasStoredSession: hasStoredAuth(),
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      set({ user, loading: false, hasStoredSession: true });
      setStoredAuth(true); // Manuel localStorage işareti
      
      // Uzak profil ve agenda senkronizasyonu
      try {
        const uid = user.uid;
        const remoteProfile = await fetchUserProfile(uid);
        const agendaStore = useAgendaStore.getState();
        const userStore = useUserStore.getState();
        if(remoteProfile){
          userStore.updateProfile({
            email: remoteProfile.email || user.email || '',
            username: remoteProfile.username || user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
            firstName: remoteProfile.firstName || '',
            lastName: remoteProfile.lastName || ''
          });
        } else {
          // ilk kez -> kaydet
            await saveUserProfile(uid, { email: user.email, username: user.displayName || user.email?.split('@')[0] });
            userStore.updateProfile({ email: user.email || '', username: user.displayName || user.email?.split('@')[0] || 'Kullanıcı' });
        }
        // Agenda uzak verileri çek
        const remoteAgenda = await fetchAgendaAll(uid);
        if(Object.keys(remoteAgenda.tasks).length || Object.keys(remoteAgenda.sessions).length){
          agendaStore.importData(remoteAgenda);
        } else {
          // lokal varsa ilk yüklemede sunucuya gönder
          bulkSaveAgenda(uid, { tasks: agendaStore.tasks, sessions: agendaStore.sessions });
        }
      } catch(e){ console.error('Login sync error', e); }
    } catch (error: any) {
      let errorMessage = 'Giriş yapılırken bir hata oluştu.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Bu e-posta adresi kayıtlı değil.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Hatalı şifre.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz e-posta adresi.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Bu hesap devre dışı bırakılmış.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ağ bağlantısı hatası.';
          break;
      }
      
      set({ error: errorMessage, loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      set({ user: null, loading: false, hasStoredSession: false });
      setStoredAuth(false); // Manuel localStorage temizle
    } catch (error) {
      set({ error: 'Çıkış yapılırken bir hata oluştu.', loading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (error: any) {
      let errorMessage = 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Bu e-posta adresi kayıtlı değil.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz e-posta adresi.';
          break;
      }
      
      set({ error: errorMessage, loading: false });
    }
  },

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  clearError: () => set({ error: null }),
}));

// Global auth state listener (runs once when module imported)
onAuthStateChanged(auth, async (user) => {
  const store = useAuthStore.getState();
  if(user){
    store.setUser(user);
    setStoredAuth(true);
    // senkronize
    try {
      const uid = user.uid;
      const remoteProfile = await fetchUserProfile(uid);
      const userStore = useUserStore.getState();
      if(remoteProfile){
        userStore.updateProfile({
          email: remoteProfile.email || user.email || '',
          username: remoteProfile.username || user.displayName || user.email?.split('@')[0] || 'Kullanıcı'
        });
      }
      const agendaStore = useAgendaStore.getState();
      const remoteAgenda = await fetchAgendaAll(uid);
      if(Object.keys(remoteAgenda.tasks).length || Object.keys(remoteAgenda.sessions).length){
        agendaStore.importData(remoteAgenda);
      }
    } catch(e){ console.error('Auth listener sync error', e); }
  } else {
    store.setUser(null);
    setStoredAuth(false);
  }
});
