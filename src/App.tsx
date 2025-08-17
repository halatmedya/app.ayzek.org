import { useUIStore } from './store/ui';
import { useAuthStore } from './store/auth';
import { Sidebar } from './components/Sidebar';
import { HomeDashboard } from './components/HomeDashboard';
import { AgendaPage } from './components/AgendaPage';
import { AuroraBackground } from './components/AuroraBackground';
import { AnnouncementsPage } from './components/AnnouncementsPage';
import { SupportPage } from './components/SupportPage';
import { ProfilePage } from './components/ProfilePage';
import { LoginPage } from './components/LoginPage';
import { AuthListener } from './components/AuthListener';
import { AdminPage } from './components/AdminPage';
import { useEffect, useState } from 'react';
import { auth } from './firebase/config';

export default function App() {
  const { activePage } = useUIStore();
  const { user } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // F5 persistence için Firebase auth state'ini kontrol et
  useEffect(() => {
    // Firebase auth durumunu kontrol et
    const checkAuth = async () => {
      try {
        // Önce localStorage'da Firebase auth var mı bak
        const firebaseAuth = localStorage.getItem('firebase:authUser:[DEFAULT]');
        console.log('localStorage firebase auth:', firebaseAuth ? 'var' : 'yok');
        
        // Firebase'ın auth ready olmasını bekle
        await auth.authStateReady();
        console.log('Firebase auth ready, current user:', auth.currentUser?.email || 'none');
        
        // Eğer localStorage'da auth var ama Firebase'da yok ise biraz daha bekle
        if (firebaseAuth && firebaseAuth !== 'null' && !auth.currentUser) {
          console.log('localStorage var ama Firebase yok, 1 saniye daha bekle...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        // Her durumda kontrol tamamlandı
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Auth kontrol edilirken boş ekran göster (çok kısa)
  if (isCheckingAuth) {
    return (
      <>
        <AuthListener />
        <div className="h-screen w-screen bg-slate-950"></div>
      </>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <>
        <AuthListener />
        <LoginPage />
      </>
    );
  }

  return (
    <>
      <AuthListener />
      <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
        <AuroraBackground />
        <div className="flex h-full w-full relative z-10">
          <Sidebar />
          <main className="flex-1 relative z-10 h-full overflow-hidden">
            <div className="h-full w-full relative">
              <section
                aria-hidden={activePage !== 'home'}
                className={`absolute inset-0 transition-opacity duration-250 ${activePage === 'home' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="h-full overflow-y-auto p-10">
                  <HomeDashboard />
                </div>
              </section>
              <section
                aria-hidden={activePage !== 'agenda'}
                className={`absolute inset-0 transition-opacity duration-250 ${activePage === 'agenda' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="h-full overflow-y-auto p-10">
                  <AgendaPage />
                </div>
              </section>
              <section
                aria-hidden={activePage !== 'announcements'}
                className={`absolute inset-0 transition-opacity duration-250 ${activePage === 'announcements' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="h-full overflow-y-auto p-10">
                  <AnnouncementsPage />
                </div>
              </section>
              <section
                aria-hidden={activePage !== 'support'}
                className={`absolute inset-0 transition-opacity duration-250 ${activePage === 'support' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="h-full overflow-hidden">
                  <SupportPage />
                </div>
              </section>
              <section
                aria-hidden={activePage !== 'profile'}
                className={`absolute inset-0 transition-opacity duration-250 ${activePage === 'profile' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="h-full overflow-y-auto p-10">
                  <ProfilePage />
                </div>
              </section>
              <section
                aria-hidden={activePage !== 'admin'}
                className={`absolute inset-0 transition-opacity duration-250 ${activePage === 'admin' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="h-full overflow-y-auto p-10">
                  <AdminPage />
                </div>
              </section>
              <section
                aria-hidden={!(activePage !== 'home' && activePage !== 'agenda' && activePage !== 'announcements' && activePage !== 'support' && activePage !== 'profile' && activePage !== 'admin')}
                className={`absolute inset-0 transition-opacity duration-250 ${activePage !== 'home' && activePage !== 'agenda' && activePage !== 'announcements' && activePage !== 'support' && activePage !== 'profile' && activePage !== 'admin' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="h-full overflow-y-auto p-10 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-tight animate-pulse">
                      {pageLabel(activePage)} Sayfası
                    </h1>
                    <p className="text-slate-400">İçerik yakında. (UI placeholder)</p>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function pageLabel(key: string) {
  switch (key) {
    case 'agenda': return 'Ajanda';
    case 'announcements': return 'Duyuru';
    case 'support': return 'Destek';
    case 'profile': return 'Profil';
    case 'admin': return 'Yetkili';
    default: return 'Bilinmeyen';
  }
}