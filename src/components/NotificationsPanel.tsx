import { useNotificationsStore } from '../store/notifications';
import { useUIStore } from '../store/ui';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationsPanel(){
  const { notifications, markRead, clear, markAllRead } = useNotificationsStore();
  const { setActivePage, setFocusTask, addPendingFeedbackDate } = useUIStore() as any;

  function handleClick(n:any){
    if(n.type==='task-feedback' && n.taskId && n.taskDate){
      // Takvimde highlight için date ekle (okunmamışsa)
      addPendingFeedbackDate(n.taskDate);
      setFocusTask({taskId:n.taskId, taskDate:n.taskDate});
      setActivePage('agenda');
    }
    markRead(n.id);
  }
  return (
  <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-6 backdrop-blur-2xl w-full h-full flex flex-col shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm tracking-wide text-slate-200">Bildirimler</h2>
        {notifications.length>0 && (
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} className="text-[10px] px-2 py-1 rounded-md bg-slate-700/50 hover:bg-slate-600/50 text-slate-300">Hepsini Oku</button>
            <button onClick={clear} className="text-[10px] px-2 py-1 rounded-md bg-red-600/60 hover:bg-red-500 text-white">Temizle</button>
          </div>
        )}
      </div>
  <ul className="space-y-3 overflow-y-auto pr-1 custom-scroll flex-1">
        <AnimatePresence initial={false}>
          {notifications.length === 0 && (
            <motion.li key="empty" initial={{opacity:0}} animate={{opacity:0.6}} exit={{opacity:0}} className="text-xs text-slate-500 py-6 text-center">Henüz bildirim yok</motion.li>
          )}
          {notifications.map((n:any) => (
            <motion.li layout key={n.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} onClick={()=> handleClick(n)} className={`group relative p-3 rounded-xl cursor-pointer bg-gradient-to-br from-slate-800/80 to-slate-900/60 border transition-colors ${n.type==='task-restored' || n.type==='task-fixed' ? (n.read? 'border-emerald-600/30 hover:border-emerald-500/40' : 'border-emerald-500/60 hover:border-emerald-400/70') : (n.read? 'border-slate-700/40 hover:border-slate-600/40 opacity-70':'border-cyan-500/40 hover:border-cyan-400/60')} `}>
              <div className="flex items-start gap-2">
                {!n.read && <span className={`mt-0.5 w-2 h-2 rounded-full animate-pulse ${n.type==='task-restored' || n.type==='task-fixed' ? 'bg-emerald-400':'bg-cyan-400'}`} />}
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-200 mb-1">{n.title}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{n.message}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">{new Date(n.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
