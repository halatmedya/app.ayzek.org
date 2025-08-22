import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/ui';
import { navItems, PageKey } from './Sidebar';
import { useNotificationsStore } from '../store/notifications';

export function MobileTopBar(){
  const { activePage, setActivePage } = useUIStore();
  const unreadCount = useNotificationsStore(s=> s.unreadFeedbackCount());
  const [open, setOpen] = useState(false);
  const [seqIndex, setSeqIndex] = useState(0);
  const [logoText, setLogoText] = useState('');
  const [direction, setDirection] = useState<1|-1>(1);
  const [isPausing, setIsPausing] = useState(false);
  const [pauseMs, setPauseMs] = useState(0);
  const SEQUENCE = [
    { text: 'AYZEK', fullPause: 2500 },
    { text: 'Akıl Ve Yapay Zeka Derneği', fullPause: 3800 },
  ];
  const target = SEQUENCE[seqIndex].text;

  useEffect(()=>{
    let t: any;
    if(isPausing){
      t = setTimeout(()=>{
        setIsPausing(false);
        if(direction === 1 && logoText.length === target.length){
          setDirection(-1);
        } else if(direction === -1 && logoText.length === 0){
          setSeqIndex(i => (i+1)%SEQUENCE.length); setDirection(1);
        }
      }, pauseMs);
      return ()=> clearTimeout(t);
    }
    if(direction===1){
      if(logoText.length < target.length){
        t = setTimeout(()=> setLogoText(target.slice(0, logoText.length+1)), 110);
      } else { setPauseMs(SEQUENCE[seqIndex].fullPause); setIsPausing(true); }
    } else {
      if(logoText.length>0){
        t = setTimeout(()=> setLogoText(logoText.slice(0,-1)), 90);
      } else { setPauseMs(600); setIsPausing(true); }
    }
    return ()=> clearTimeout(t);
  }, [logoText, direction, isPausing, pauseMs, seqIndex, target]);

  const handleChange = (k: PageKey) => { setActivePage(k); setOpen(false); };

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-30">
      <div className="h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center px-3 justify-between">
        <div className="flex items-center text-lg font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
          <span>{logoText}</span>
          <span className={`w-1.5 h-5 ml-0.5 rounded-sm ${isPausing ? 'opacity-0' : 'bg-cyan-400/80 animate-pulse'}`} />
        </div>
        <button onClick={()=> setOpen(o=>!o)} aria-label="Menü" className="relative w-10 h-10 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700/40 transition">
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-current transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`}></span>
            <span className={`block h-0.5 w-6 bg-current transition-opacity ${open ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block h-0.5 w-6 bg-current transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`}></span>
          </div>
          {unreadCount>0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-[10px] font-bold text-slate-900 flex items-center justify-center animate-pulse">{unreadCount}</span>
          )}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{opacity:0, y:-12}}
            animate={{opacity:1, y:0}}
            exit={{opacity:0, y:-12}}
            transition={{type:'spring', stiffness:260, damping:26}}
            className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-xl"
          >
            <div className="py-2 px-3 grid grid-cols-2 gap-2">
              {navItems.map(it => (
                <button
                  key={it.key}
                  onClick={()=>handleChange(it.key)}
                  className={`text-left text-xs font-medium rounded-md px-3 py-3 flex items-center gap-2 border border-slate-700/60 bg-slate-800/40 hover:bg-slate-700/60 transition relative ${activePage===it.key ? 'ring-1 ring-cyan-400/40 bg-slate-700/70' : ''}`}
                >
                  <span className="w-4 h-4 text-slate-300">{it.icon}</span>
                  <span>{it.label}</span>
                  {it.key==='agenda' && unreadCount>0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-[10px] font-bold text-slate-900 flex items-center justify-center animate-pulse">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
