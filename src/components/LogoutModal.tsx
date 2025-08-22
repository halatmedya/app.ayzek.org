import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function LogoutModal({ open, onClose, onConfirm }: LogoutModalProps){
  useEffect(()=>{
    if(!open) return; const h=(e:KeyboardEvent)=> e.key==='Escape'&& onClose(); window.addEventListener('keydown',h); return()=> window.removeEventListener('keydown',h); },[open,onClose]);
  const LETTERS = 'AYZEK'.split('');
  const letterVariants = { initial:{ y:28, opacity:0, filter:'blur(8px)', rotateX:60, scale:1.15 }, animate:(i:number)=>({ y:0, opacity:1, filter:'blur(0px)', rotateX:0, scale:1, transition:{ delay:0.2+i*0.08, duration:0.6, ease:[0.16,0.84,0.44,1] } }) };
  const ring = (d:number)=>({ initial:{ scale:0.6, opacity:0 }, animate:{ scale:1, opacity:1, transition:{ delay:d, type:'spring', stiffness:120, damping:18 } } });
  const confirmDelay = 0.4 + LETTERS.length*0.08;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          exit={{ opacity:0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
          />
          <motion.div
            className="relative max-w-[90vw] w-[960px] rounded-3xl border border-slate-700/60 bg-[radial-gradient(circle_at_30%_30%,rgba(30,90,140,0.35),rgba(8,12,20,0.9))] shadow-[0_0_60px_-15px_rgba(0,200,255,0.4),0_0_0_1px_rgba(255,255,255,0.05)] p-14 overflow-visible backdrop-blur-xl"
            initial={{ scale:0.85, opacity:0, y:30 }}
            animate={{ scale:1, opacity:1, y:0 }}
            exit={{ scale:0.9, opacity:0, y:20 }}
            transition={{ type:'spring', stiffness:220, damping:24 }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute -top-48 -left-32 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(0,200,255,0.35),transparent_70%)] blur-3xl opacity-40 animate-pulse" />
              <div className="absolute -bottom-48 -right-40 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.35),transparent_70%)] blur-3xl opacity-30 animate-pulse [animation-duration:5s]" />
            </div>
            <div className="relative">
              <div className="relative mx-auto mb-12 flex items-center justify-center">
                <div className="relative w-[340px] h-[340px] flex items-center justify-center">
                  <motion.div variants={ring(0.05)} initial="initial" animate="animate" className="absolute inset-0 rounded-full border border-cyan-400/30" />
                  <motion.div variants={ring(0.15)} initial="initial" animate="animate" className="absolute inset-8 rounded-full border border-emerald-400/25" />
                  <motion.div variants={ring(0.25)} initial="initial" animate="animate" className="absolute inset-16 rounded-full border border-fuchsia-400/20" />
                  <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-cyan-400/40 via-emerald-400/40 to-fuchsia-400/40 blur-2xl animate-pulse" />
                  <div className="relative flex gap-2">
                    {LETTERS.map((L,i)=> (
                      <motion.span key={L+i} custom={i} variants={letterVariants} initial="initial" animate="animate" className="text-6xl font-black tracking-tight bg-gradient-to-br from-cyan-300 via-emerald-300 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-[0_3px_12px_rgba(16,185,129,0.25)]">{L}</motion.span>
                    ))}
                  </div>
                </div>
              </div>
              <motion.p className="text-center text-slate-200 font-medium text-xl" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 + LETTERS.length*0.08, duration:0.5 }}>
                Çıkış yapmak istediğine emin misin?
              </motion.p>
              <motion.div className="mt-10 flex items-center justify-center gap-5" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: confirmDelay, duration:0.45 }}>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg border border-slate-600/70 bg-slate-800/50 hover:bg-slate-700/60 text-slate-300 text-sm font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={onConfirm}
                  className="relative px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 text-white text-sm font-semibold shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400/60 focus:ring-offset-slate-900 transition-all"
                >
                  <span className="relative z-10">Evet, Çıkış Yap</span>
                  <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if(!open) return modalContent; // returned inside portal conditionally anyway
  if(typeof document !== 'undefined'){
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}

export default LogoutModal;
