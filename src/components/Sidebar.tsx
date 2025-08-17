import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useUIStore } from '../store/ui';
import { useNotificationsStore } from '../store/notifications';
import { useAuthStore } from '../store/auth';
import { cn } from '../utils/cn';

const items: {key:PageKey; label:string; icon: JSX.Element;}[] = [
  {key:'home', label:'Ana Sayfa', icon: <IconRings />},
  {key:'agenda', label:'Ajanda', icon: <IconAgenda />},
  {key:'announcements', label:'Duyuru', icon: <IconBell />},
  {key:'support', label:'Destek', icon: <IconSupport />},
  {key:'profile', label:'Profil', icon: <IconUser />},
  {key:'admin', label:'Yetkili', icon: <IconShield />},
];

export type PageKey = 'home'|'agenda'|'announcements'|'support'|'profile'|'admin';

export function Sidebar(){
  const { activePage, setActivePage } = useUIStore();
  const unreadCount = useNotificationsStore(s=> s.unreadFeedbackCount());
  const { logout } = useAuthStore();
  // Typing sequence: AYZEK -> (pause) -> delete -> Akıl Ve Yapay Zeka Derneği -> (pause) -> delete -> loop
  const SEQUENCE = [
    { text: 'AYZEK', fullPause: 3000 },            // 3s bekle
    { text: 'Akıl Ve Yapay Zeka Derneği', fullPause: 5000 }, // 5s bekle
  ];
  const [seqIndex, setSeqIndex] = useState(0);
  const [logoText, setLogoText] = useState('');
  const [direction, setDirection] = useState<1|-1>(1); // 1 = yaz, -1 = sil
  const [isPausing, setIsPausing] = useState(false);
  const [pauseMs, setPauseMs] = useState(0);
  const target = SEQUENCE[seqIndex].text;
  useEffect(()=> {
    let timer:any;
    // Pause phase
    if(isPausing){
      timer = setTimeout(()=> {
        setIsPausing(false);
        if(direction === 1 && logoText.length === target.length){
          // Finished typing current target -> start deleting
          setDirection(-1);
        } else if(direction === -1 && logoText.length === 0){
          // Finished deleting -> go to next sequence item and start typing
          setSeqIndex(i => (i + 1) % SEQUENCE.length);
          setDirection(1);
        }
      }, pauseMs);
      return ()=> clearTimeout(timer);
    }
    // Active phase (typing or deleting)
    if(direction === 1){
      if(logoText.length < target.length){
        timer = setTimeout(()=> setLogoText(target.slice(0, logoText.length + 1)), 220);
      } else {
        // Reached full text -> enter full pause specific to this phrase
        setPauseMs(SEQUENCE[seqIndex].fullPause);
        setIsPausing(true);
      }
    } else { // deleting
      if(logoText.length > 0){
        timer = setTimeout(()=> setLogoText(logoText.slice(0, -1)), 180);
      } else {
        // Fully deleted -> brief pause before next phrase typing starts
        setPauseMs(800);
        setIsPausing(true);
      }
    }
    return ()=> clearTimeout(timer);
  }, [logoText, direction, isPausing, pauseMs, seqIndex, target]);

  const handlePageChange = (pageKey: PageKey) => {
    console.log('Changing page to:', pageKey);
    setActivePage(pageKey);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="h-full w-60 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col select-none relative z-10">
      <div className="px-5 pt-6 pb-4">
        <div className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent flex items-center">
          <span>{logoText}</span>
          <span className={`w-2 h-6 ml-0.5 rounded-sm ${isPausing ? 'opacity-0' : 'bg-cyan-400/80 animate-pulse'}`} />
        </div>
      </div>
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto pt-4">
        {items.map(item=>{
          const isActive = item.key === activePage;
          return (
            <button 
              key={item.key} 
              onClick={() => handlePageChange(item.key)} 
              className={cn(
                "group w-full relative flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-all duration-200", 
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            > 
              <span className="w-5 h-5 text-slate-400 group-hover:text-slate-200 relative">{item.icon}
                {item.key==='agenda' && unreadCount>0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-[10px] font-bold text-slate-900 flex items-center justify-center animate-pulse">{unreadCount}</span>
                )}
              </span>
              <span className="relative z-10 flex items-center gap-1">{item.label}</span>
              {isActive && (
                <motion.span 
                  layoutId="sidebar-active" 
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 ring-1 ring-cyan-400/30" 
                  transition={{type:'spring', stiffness:300, damping:30}} 
                />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
        >
          <LogoutIcon />
          <span>Çıkış Yap</span>
        </button>
      </div>
      
      <div className="p-4 text-[10px] uppercase tracking-wider text-slate-500">v0.1 Preview</div>
    </aside>
  );
}

function IconRings(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" opacity="0.6" /><circle cx="12" cy="12" r="11" opacity="0.3" /></svg>}
function IconAgenda(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
function IconBell(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>}
function IconSupport(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h4l2 5h8l2-5h4" /></svg>}
function IconUser(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>}
function IconShield(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
function LogoutIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}

