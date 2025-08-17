import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuthStore } from '../store/auth';
import { useUserStore } from '../store/user';

export function AuthListener() {
  const { setUser } = useAuthStore();
  const { updateProfile } = useUserStore();

  useEffect(() => {
    // İlk yükleme: Mevcut user'ı hemen kontrol et
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('🚀 AuthListener: Mevcut user bulundu:', currentUser.email);
      setUser(currentUser);
      updateProfile({
        email: currentUser.email || '',
        username: currentUser.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı'
      });
    }

    // Firebase otomatik olarak auth state'i restore eder
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 Auth state changed:', user?.email || 'logged out');
      setUser(user);
      
      // Kullanıcı giriş yaptıysa profil bilgilerini güncelle
      if (user) {
        updateProfile({
          email: user.email || '',
          username: user.displayName || user.email?.split('@')[0] || 'Kullanıcı'
        });
        console.log('✅ Auth restored:', user.email);
      } else {
        console.log('❌ No auth found');
      }
    });

    return () => unsubscribe();
  }, [setUser, updateProfile]);

  return null;
}
