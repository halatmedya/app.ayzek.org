import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANIM } from '../utils/anim';
import { useAgendaStore, toKey, addDays } from '../store/agenda';
import { cn } from '../utils/cn';
import { useNotificationsStore } from '../store/notifications';
import { useProgressStore } from '../store/progress';
import { useUIStore } from '../store/ui';

export function AgendaPage(){
  const { selectedDate, selectDate, tasks, sessions, addTask, toggleTask, editTask, deleteTask, addSession, editSession, deleteSession, moveTask } = useAgendaStore();
  const { activePage, focusTask, setFocusTask, pendingFeedbackDates, clearPendingFeedbackDate } = useUIStore();
  // Page enter animation cycle counter
  const [enterAnimTick, setEnterAnimTick] = useState(0);
  const [viewFeedbackTask, setViewFeedbackTask] = useState<string|null>(null);
  const baseToday = useMemo(()=> new Date(), []);
  // 14 günlük pencere; ileri geri oklarıyla kaydırılır
  const [calendarPage, setCalendarPage] = useState(0);
  const days = useMemo(()=> Array.from({length:14}, (_,i)=> addDays(baseToday, i-7 + calendarPage*14)), [baseToday, calendarPage]);
  // Navigation animation key to force re-mount (takvim ileri/geri aynı animasyon)
  const calendarAnimKey = `${enterAnimTick}-${calendarPage}`;
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [editId, setEditId] = useState<string|null>(null);

  // Ajanda sayfasına her geçişte bugüne dön ve animasyonları yeniden tetikle
  useEffect(() => {
    if (activePage === 'agenda') {
      const today = new Date();
      selectDate(toKey(today));
      setCalendarPage(0); // Takvimi de bugünün bulunduğu haftaya çek
      setEnterAnimTick(t=> t+1);
    }
  }, [activePage, selectDate]);

  const [stopwatch, setStopwatch] = useState({running:false, start:0, elapsed:0});
  const [countdown, setCountdown] = useState({running:false, target:0, duration: 15*60*1000, notified:false});
  const [showCountdownAlert, setShowCountdownAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const startSoundRef = useRef<HTMLAudioElement|null>(null);
  const stopSoundRef = useRef<HTMLAudioElement|null>(null);
  const [fullscreen, setFullscreen] = useState<null | 'stopwatch' | 'countdown'>(null);
  const addNotification = useNotificationsStore(s=> s.add);
  const { setProgress } = useProgressStore();

  // Geliştirici temizlik komutu - global window objesine ekle
  useEffect(() => {
    (window as any).clearAllAppData = () => {
      console.log('🗑️ Tüm uygulama verileri temizleniyor...');
      
      // LocalStorage temizle
      localStorage.removeItem('agenda-store');
      localStorage.removeItem('progress-store'); 
      localStorage.removeItem('notifications-store');
      
      console.log('✅ LocalStorage temizlendi');
      console.log('🔄 Sayfa yenileniyor...');
      
      // Sayfayı yenile
      window.location.reload();
    };
    
    console.log('🛠️ Geliştirici komutu hazır: clearAllAppData()');
    
    return () => {
      delete (window as any).clearAllAppData;
    };
  }, []);

  useEffect(()=> {
    let raf:number; function tick(){
      if (stopwatch.running){ setStopwatch(s => ({...s, elapsed: Date.now()-s.start})); }
      if (countdown.running){ setCountdown(c=> ({...c})); }
      raf = requestAnimationFrame(tick);
    } tick(); return ()=> cancelAnimationFrame(raf);
  },[stopwatch.running, countdown.running]);

  // Sort: incomplete first, then by creation time descending for now
  const currentTasksRaw = tasks[selectedDate] || [];
  const currentTasks = useMemo(()=> currentTasksRaw.slice().sort((a:any,b:any)=> {
    if(a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  }), [currentTasksRaw]);
  const currentSessions = sessions[selectedDate] || [];

  function openNew(){ setTaskName(''); setEditId(null); setShowTaskModal(true); }
  function openEdit(id:string, name:string){ setTaskName(name); setEditId(id); setShowTaskModal(true); }
  function saveTask(){ if(!taskName.trim()) return; if (editId) { editTask(selectedDate, editId, taskName); } else { addTask(selectedDate, taskName); } setShowTaskModal(false); setTaskName(''); setEditId(null); }

  function formatDuration(ms:number){ const sec = Math.floor(ms/1000); const h = Math.floor(sec/3600); const m = Math.floor((sec%3600)/60); const s = sec % 60; return [h,m,s].map(v=> String(v).padStart(2,'0')).join(':'); }
  function currentCountdownLeft(){ if(!countdown.running) return countdown.duration; const left = countdown.target - Date.now(); return left > 0 ? left : 0; }

  function startStopwatch(){ setStopwatch({running:true, start:Date.now(), elapsed:0}); }
  function stopStopwatch(){ setStopwatch(s=> ({...s, running:false, elapsed: Date.now()-s.start})); }
  function resetStopwatch(){ setStopwatch({running:false, start:0, elapsed:0}); }
  function saveStopwatch(){ if(stopwatch.elapsed>1000){ addSession(selectedDate, {type:'stopwatch', durationSec: Math.floor(stopwatch.elapsed/1000)}); resetStopwatch(); } }

  function startCountdown(){ setCountdown(c=> ({...c, running:true, target: Date.now() + c.duration, notified:false })); }
  function stopCountdown(){ setCountdown(c=> ({...c, running:false})); }
  function resetCountdown(){ setCountdown(c=> ({...c, running:false, target:0})); }
  function saveCountdown(){ const left = currentCountdownLeft(); const used = countdown.duration - left; if (used>1000){ addSession(selectedDate, {type:'countdown', durationSec: Math.floor(used/1000)}); } resetCountdown(); }

  // Countdown finish detection - show animated alert instead of auto-save
  useEffect(()=> {
    if(countdown.running){
      const left = currentCountdownLeft();
      if(left===0 && !countdown.notified){
        setCountdown(c=> ({...c, running:false, notified:true}));
        setShowCountdownAlert(true);
        // Sadece ses çalınır
        try { audioRef.current?.play().catch(()=>{
          try {
            const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext; if(!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.type='sine'; osc.frequency.value=880; gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime+0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+1.0);
            osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+1.05);
          } catch(_){}
        }); } catch(_){ }
        // Auto-save kaldırıldı - kullanıcı manuel kaydetsin
      }
    }
  });

  // Progress ring sync - TAMAMEN YENİDEN YAZILDI
  // Günlük: Bugünkü görevler
  // Haftalık: Bu haftanın Pazartesi-Pazar arası görevler (Pazartesi resetlenir)
  // Aylık: Bu aydaki tüm görevler
  useEffect(()=> {
    // Recalculate progress whenever tasks change or user switches selected day (bazı kullanıcı akışlarında sadece gün değişince güncellenmiyordu)
    const now = new Date();
    
    // === GÜNLÜK ===
  const todayKey = toKey(now);
    const todayTasks = tasks[todayKey] || [];
    const dailyCompleted = todayTasks.filter(t => t.completed).length;
    const dailyTotal = todayTasks.length;
    const dailyPercent = dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0;
    console.log(`Günlük: ${dailyCompleted}/${dailyTotal} = %${dailyPercent}`);
    setProgress('daily', dailyPercent);

  // Haftalık metrik kaldırıldı: sabit 0 set (eski veriler kalmasın diye)
  setProgress('weekly', 0);

    // === AYLIK ===
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript ayları 0-11, biz 1-12 istiyoruz
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}-`;
    
    let monthlyCompleted = 0;
    let monthlyTotal = 0;
    
    Object.entries(tasks).forEach(([key, taskList]) => {
      if (key.startsWith(monthPrefix) && taskList.length > 0) {
        monthlyTotal += taskList.length;
        monthlyCompleted += taskList.filter(t => t.completed).length;
      }
    });
    
    const monthlyPercent = monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0;
    setProgress('monthly', monthlyPercent);
    
  }, [tasks, selectedDate, setProgress]);

  // Export / Import / Temizle kaldırıldı (istek)
  
  // Manuel temizlik fonksiyonu
  function handleClearAllData() {
    if (confirm('⚠️ Tüm görevler, sayaç/kronometre kayıtları ve ilerleme verileri silinecek. Emin misiniz?')) {
      console.log('🗑️ Tüm veriler temizleniyor...');
      
      // Store'ları resetle
      const { clearAllData } = useAgendaStore.getState();
      const { resetProgress } = useProgressStore.getState();
      const { clear } = useNotificationsStore.getState();
      
      // Tüm store'ları temizle
      clearAllData();
      resetProgress();
      clear();
      
      // LocalStorage'ı da manuel temizle (emin olmak için)
      localStorage.removeItem('agenda-store');
      localStorage.removeItem('progress-store'); 
      localStorage.removeItem('notifications-store');
      localStorage.removeItem('ayzek_agenda_v1');
      localStorage.removeItem('ayzek_progress_v1');
      localStorage.removeItem('ayzek_notifications_v1');
      
      console.log('✅ Tüm veriler temizlendi');
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }

  function onDragStart(e: React.DragEvent, id:string){ e.dataTransfer.setData('text/ayzek-task', JSON.stringify({id, from:selectedDate})); e.dataTransfer.effectAllowed='move'; }
  function onDayDrop(e: React.DragEvent, dayKey:string){
    const raw = e.dataTransfer.getData('text/ayzek-task'); if(!raw) return; 
    try { 
      const obj = JSON.parse(raw); 
      moveTask(obj.from, dayKey, obj.id); 
      // Görev taşıma bildirimi kaldırıldı (kullanıcı isteği)
    } catch(_){ }
  }
  function allowDrop(e:React.DragEvent){ if(e.dataTransfer.types.includes('text/ayzek-task')){ e.preventDefault(); }}

  // Bildirimden gelen odak görevi takvim ve liste renderından sonra kaydır & highlight
  const taskFocusRef = useRef<HTMLDivElement|null>(null);
  useEffect(()=> {
    if(focusTask){
      // Tarihi seç ve sayfayı agenda'ya zaten gelmiş durumda
      selectDate(focusTask.taskDate);
      // Biraz gecikme ile scroll
      setTimeout(()=> {
        taskFocusRef.current?.scrollIntoView({behavior:'smooth', block:'center'});
      }, 150);
      // O güne ait pending highlight'ı temizle
      clearPendingFeedbackDate(focusTask.taskDate);
      // Tek seferlik
      setFocusTask(null);
    }
  }, [focusTask, selectDate, clearPendingFeedbackDate, setFocusTask]);

  // Kullanıcı manuel o günü seçtiğinde de highlight temizle
  useEffect(()=> {
    if(pendingFeedbackDates.includes(selectedDate)){
      clearPendingFeedbackDate(selectedDate);
    }
  }, [selectedDate, pendingFeedbackDates, clearPendingFeedbackDate]);

  return (
    <div className="space-y-16">
      <Calendar14 key={calendarAnimKey} days={days} selectedDate={selectedDate} onSelect={(k)=> selectDate(k)} onDayDrop={onDayDrop} allowDrop={allowDrop} onPrev={()=> setCalendarPage(p=> p-1)} onNext={()=> setCalendarPage(p=> p+1)} />
      <div className="flex flex-col xl:flex-row gap-10">
        <motion.section
          key={`tasks-${enterAnimTick}`}
          initial={{opacity:0, y:120}}
          animate={{opacity:1, y:0}}
          transition={{duration:ANIM.durLong, ease:ANIM.ease, delay:0.2}}
          className="flex-1 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Görevler</h2>
            <div className="flex items-center gap-2">
              <button onClick={openNew} className="px-3 py-1.5 rounded-md bg-cyan-600/70 hover:bg-cyan-500 text-sm font-medium">+ Görev</button>
              <button onClick={handleClearAllData} className="px-3 py-1.5 rounded-md bg-red-600/70 hover:bg-red-500 text-xs font-medium">🗑️ Tümünü Sil</button>
            </div>
          </div>
          <TaskList tasks={currentTasks} dateKey={selectedDate} onEdit={openEdit} onDragStart={onDragStart} />
          <SessionsList sessions={currentSessions} dateKey={selectedDate} onEditSession={editSession} onDeleteSession={deleteSession} />
        </motion.section>
        <motion.aside
          key={`timers-${enterAnimTick}`}
          initial={{opacity:0, x:140}}
          animate={{opacity:1, x:0}}
          transition={{duration:ANIM.durLong, ease:ANIM.ease, delay:0.4}}
          className="w-full xl:w-96 space-y-8"
        >
          <motion.div initial={{opacity:0, x:60}} animate={{opacity:1, x:0}} transition={{duration:ANIM.durMedium, ease:ANIM.ease, delay:0.55}}>
            <StopwatchCard stopwatch={stopwatch} start={()=> {startSoundRef.current?.play().catch(()=>{}); startStopwatch();}} stop={()=> {stopSoundRef.current?.play().catch(()=>{}); stopStopwatch();}} reset={resetStopwatch} save={saveStopwatch} format={formatDuration} openFull={()=> setFullscreen('stopwatch')} />
          </motion.div>
          <motion.div initial={{opacity:0, x:80}} animate={{opacity:1, x:0}} transition={{duration:ANIM.durMedium, ease:ANIM.ease, delay:0.7}}>
            <CountdownCard countdown={countdown} setCountdown={setCountdown} start={()=> {startSoundRef.current?.play().catch(()=>{}); startCountdown();}} stop={()=> {stopSoundRef.current?.play().catch(()=>{}); stopCountdown();}} reset={resetCountdown} save={saveCountdown} format={formatDuration} currentLeft={currentCountdownLeft()} openFull={()=> setFullscreen('countdown')} />
          </motion.div>
        </motion.aside>
      </div>
      <AnimatePresence>{showTaskModal && (<TaskModal key="taskModal" onClose={()=> setShowTaskModal(false)} onSave={saveTask} value={taskName} setValue={setTaskName} editing={!!editId} />)}</AnimatePresence>
      
      {/* Sayaç Bitti Alert */}
      <AnimatePresence>
        {showCountdownAlert && (
          <CountdownFinishedAlert 
            onClose={() => setShowCountdownAlert(false)} 
            onSave={() => {
              const used = countdown.duration;
              if(used > 1000) {
                addSession(selectedDate, {type:'countdown', durationSec: Math.floor(used/1000)});
              }
              resetCountdown();
              setShowCountdownAlert(false);
            }}
            duration={Math.floor(countdown.duration/60000)}
          />
        )}
        <AnimatePresence>{viewFeedbackTask && (
          <FeedbackModal task={viewFeedbackTask} onClose={()=> setViewFeedbackTask(null)} />
        )}</AnimatePresence>
      </AnimatePresence>
      
  <audio ref={audioRef} preload="auto" src="data:audio/wav;base64,UklGRoQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YYQAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA" />
  <audio ref={startSoundRef} preload="auto" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAABAACAgICA" />
  <audio ref={stopSoundRef} preload="auto" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA//8A//8A" />
  <FullscreenTimer fullscreen={fullscreen} onClose={()=> setFullscreen(null)}>
    {fullscreen==='stopwatch' && (
      <BigTimer title="Kronometre" value={stopwatch.elapsed} running={stopwatch.running} onClose={()=> setFullscreen(null)} format={formatDuration} />)}
    {fullscreen==='countdown' && (
      <BigTimer title="Sayaç" value={countdown.running? currentCountdownLeft(): countdown.duration} running={countdown.running} onClose={()=> setFullscreen(null)} format={formatDuration} />)}
  </FullscreenTimer>
    </div>
  );
}

function Calendar14({days, selectedDate, onSelect, onDayDrop, allowDrop, onPrev, onNext}:{days:Date[]; selectedDate:string; onSelect:(k:string)=>void; onDayDrop:(e:React.DragEvent, k:string)=>void; allowDrop:(e:React.DragEvent)=>void; onPrev:()=>void; onNext:()=>void;}){
  const { pendingFeedbackDates } = useUIStore();
  const { tasks } = useAgendaStore();
  const todayKey = toKey(new Date());
  
  // Feedback'li günleri hesapla
  const daysWithFeedback = useMemo(()=> {
    const dates = new Set<string>();
    Object.entries(tasks).forEach(([dateKey, taskList]) => {
      if(taskList.some(t=> t.feedbacks && t.feedbacks.length>0)){
        dates.add(dateKey);
      }
    });
    return dates;
  }, [tasks]);
  return (
    <div className="relative">
      <motion.div
        className="grid grid-cols-7 gap-3"
        initial="hidden"
        animate="show"
        variants={{ hidden:{}, show:{} }}
      >
        {days.map((d, idx)=> {
          const key = toKey(d);
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const hasPending = pendingFeedbackDates.includes(key);
          const hasFeedback = daysWithFeedback.has(key);
          // Yeni: sırayla biri üstten biri alttan kayma (alternating vertical direction)
          const direction = idx % 2 === 0 ? -60 : 60; // even -> from top, odd -> from bottom
          const orderIndex = idx; // basit sıralı gecikme
          return (
            <motion.button
              layout
              key={key}
              custom={orderIndex}
              variants={{
                hidden:{ opacity:0, y: direction, scale:0.9 },
                show:(i:number)=> ({
                  opacity:1,
                  y:0,
                  scale:1,
                  transition:{
                    opacity:{duration:0.4, delay:i*0.05},
                    y:{duration:0.55, ease:ANIM.ease, delay:i*0.05},
                    scale:{duration:0.55, ease:ANIM.ease, delay:i*0.05}
                  }
                })
              }}
              onClick={()=> onSelect(key)}
              onDrop={(e)=> onDayDrop(e,key)}
              onDragOver={allowDrop}
              whileTap={{scale:0.9}}
              className={cn("relative h-24 rounded-2xl border bg-slate-900/40 backdrop-blur-xl flex flex-col items-center justify-center gap-1 transition-colors overflow-hidden", isSelected ? 'border-cyan-400/60 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.3)]' : hasPending ? 'border-amber-400/70 text-amber-100 animate-pulse shadow-[0_0_0_1px_rgba(245,158,11,0.4)]' : hasFeedback ? 'border-yellow-400/50 animate-pulse shadow-[0_0_0_1px_rgba(250,204,21,0.3)]' : 'border-slate-700/40 hover:border-slate-500/40 text-slate-300')}
            >
              {isSelected && <motion.span layoutId="cal-sel" className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-indigo-500/10" />}
              {hasPending && !isSelected && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_0_2px_rgba(15,23,42,0.8)]" />}
              {hasFeedback && !isSelected && !hasPending && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_0_2px_rgba(15,23,42,0.8)]" />}
              <span className={cn("text-xs uppercase tracking-wider", isToday && 'text-emerald-400 font-semibold')}>{d.toLocaleDateString('tr-TR',{weekday:'short'})}</span>
              <span className="text-2xl font-bold">{d.getDate()}</span>
              <span className="text-[10px] tracking-widest text-slate-500">{d.toLocaleDateString('tr-TR',{month:'short'})}</span>
            </motion.button>
          );
        })}
      </motion.div>
      {/* Navigation arrows positioned lower to avoid touching calendar */}
      <div className="absolute -bottom-8 right-0 flex gap-2">
        <button onClick={onPrev} className="w-8 h-8 rounded-full bg-slate-800/70 border border-slate-600/40 hover:bg-slate-700/70 text-slate-200 text-sm flex items-center justify-center" aria-label="Geri">←</button>
        <button onClick={onNext} className="w-8 h-8 rounded-full bg-slate-800/70 border border-slate-600/40 hover:bg-slate-700/70 text-slate-200 text-sm flex items-center justify-center" aria-label="İleri">→</button>
      </div>
    </div>
  );
}

function TaskList({tasks, dateKey, onEdit, onDragStart}:{tasks: any[]; dateKey:string; onEdit:(id:string,name:string)=>void; onDragStart:(e:React.DragEvent,id:string)=>void;}){
  const { toggleTask, deleteTask } = useAgendaStore();
  const { focusTask } = useUIStore();
  const [viewFeedbackTask, setViewFeedbackTask] = useState<any|null>(null);
  if (!tasks.length) return <div className="text-sm text-slate-500">Görev yok. + ile ekle.</div>;
  return (
    <motion.ul
      className="space-y-2"
      initial="hidden"
      animate="show"
      variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.06 } } }}
    >
      <AnimatePresence initial={false}>
        {tasks.map((task, idx) => (
      <motion.li
        key={task.id}
        custom={idx}
        variants={{
          hidden:{ opacity:0, y:50 },
          show:(i:number)=> ({ opacity:1, y:0, transition:{ duration:0.65, ease:ANIM.ease, delay: i*0.02 } })
        }}
        exit={{opacity:0,y:-20, transition:{duration:0.3}}}
        draggable
        onDragStart={(e: any)=> onDragStart(e as React.DragEvent, task.id)}
        className={cn("group flex items-center gap-3 p-3 rounded-xl border cursor-grab active:cursor-grabbing bg-slate-800/50 hover:border-slate-600/40", focusTask && focusTask.taskId===task.id && focusTask.taskDate===dateKey ? 'border-amber-400 shadow-[0_0_0_1px_rgba(245,158,11,0.5)] animate-pulse' : task.feedbacks && task.feedbacks.length>0 ? 'border-cyan-400/60 shadow-[0_0_0_1px_rgba(34,211,238,0.4)] animate-pulse' : 'border-slate-700/40')}
      >
            <button onClick={()=> toggleTask(dateKey, task.id)} className={cn("w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold", task.completed ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700/70 hover:bg-slate-600')}>{task.completed ? '✓' : ''}</button>
            <span className={cn("flex-1 text-sm", task.completed && 'line-through text-slate-500')}>{task.name}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <IconButton label="Düzenle" onClick={()=> onEdit(task.id, task.name)}><EditIcon /></IconButton>
              <IconButton label="Sil" onClick={()=> deleteTask(dateKey, task.id)}><TrashIcon /></IconButton>
        {task.feedbacks && task.feedbacks.length>0 && (
          <>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">{task.feedbacks.length}</span>
            <IconButton label="Geri Bildirimleri Gör" onClick={()=> setViewFeedbackTask(task)}><EyeIcon /></IconButton>
          </>
        )}
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

function FeedbackModal({task, onClose}:{task:any; onClose:()=>void;}){
  if(!task || !task.feedbacks || task.feedbacks.length===0) return null;
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{scale:0.9, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.9, opacity:0, y:10}} transition={{type:'spring', stiffness:220, damping:24}} className="relative w-full max-w-lg rounded-3xl p-6 bg-slate-900/95 border border-slate-700/50 shadow-2xl space-y-5 m-6 max-h-[70vh] overflow-hidden">
        <h3 className="text-lg font-semibold tracking-tight">Geri Bildirimler: {task.name}</h3>
        <div className="space-y-3 overflow-y-auto max-h-80 pr-2">
          {task.feedbacks.map((f:any) => (
            <div key={f.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/40">
              <div className="text-sm text-slate-200 mb-2">{f.message}</div>
              <div className="text-xs text-slate-500">{new Date(f.createdAt).toLocaleString('tr-TR')}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm bg-slate-700/60 hover:bg-slate-600/60 text-slate-200">Kapat</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SessionsList({sessions, dateKey, onEditSession, onDeleteSession}:{sessions:any[]; dateKey:string; onEditSession:(date:string,id:string,label:string)=>void; onDeleteSession:(date:string,id:string)=>void;}){
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editLabel, setEditLabel] = useState('');
  
  if(!sessions.length) return <div className="text-xs text-slate-500">Kayıtlı süre yok.</div>;
  
  function startEdit(session:any) {
    setEditingId(session.id);
    setEditLabel(session.label || '');
  }
  
  function saveEdit(id:string) {
    onEditSession(dateKey, id, editLabel);
    setEditingId(null);
    setEditLabel('');
  }
  
  function cancelEdit() {
    setEditingId(null);
    setEditLabel('');
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold tracking-wider text-slate-400 mb-2">KAYDEDİLEN SÜRELER</h3>
      <ul className="space-y-2">
        {sessions.map(s => (
          <li key={s.id} className="group flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/40 hover:border-slate-600/40">
            <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-medium flex-shrink-0', s.type==='stopwatch' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300')}>
              {s.type==='stopwatch' ? 'Krono' : 'Sayaç'}
            </span>
            <span className="text-xs text-slate-300 flex-shrink-0">{formatSec(s.durationSec)}</span>
            
            {editingId === s.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input 
                  value={editLabel} 
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Ne yaptın?"
                  className="flex-1 px-2 py-1 text-xs rounded bg-slate-700/70 border border-slate-600/40 focus:border-cyan-400 outline-none text-slate-200"
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') saveEdit(s.id);
                    if(e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                />
                <button onClick={() => saveEdit(s.id)} className="text-emerald-400 hover:text-emerald-300 text-xs">✓</button>
                <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-300 text-xs">✕</button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs text-slate-300 truncate">
                  {s.label || 'İsimsiz çalışma'}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(s)} className="text-slate-400 hover:text-cyan-400 text-xs" title="Düzenle">✏️</button>
                  <button onClick={() => onDeleteSession(dateKey, s.id)} className="text-slate-400 hover:text-red-400 text-xs" title="Sil">🗑️</button>
                </div>
              </div>
            )}
            
            <span className="text-[10px] text-slate-500 flex-shrink-0">
              {new Date(s.createdAt).toLocaleTimeString('tr-TR',{hour:'2-digit', minute:'2-digit'})}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatSec(sec:number){ const h = Math.floor(sec/3600); const m = Math.floor((sec%3600)/60); const s = sec%60; return [h,m,s].map(v=> String(v).padStart(2,'0')).join(':'); }

function StopwatchCard({stopwatch,start,stop,reset,save,format,openFull}:{stopwatch:any; start:()=>void; stop:()=>void; reset:()=>void; save:()=>void; format:(ms:number)=>string; openFull:()=>void;}){
  return (
    <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-xl space-y-4 relative overflow-hidden">
      <div className="absolute inset-px rounded-2xl bg-gradient-to-br from-cyan-500/5 via-emerald-400/5 to-indigo-500/5 pointer-events-none" />
      <h3 className="text-sm font-semibold tracking-wide">Kronometre</h3>
      <FlipClock value={stopwatch.elapsed} active={stopwatch.running} format={format} />
      <div className="flex flex-wrap gap-2">
        {!stopwatch.running && stopwatch.elapsed===0 && <ActionBtn onClick={start}>Başlat</ActionBtn>}
        {stopwatch.running && <ActionBtn onClick={stop} variant="warn">Durdur</ActionBtn>}
        {!stopwatch.running && stopwatch.elapsed>0 && <ActionBtn onClick={start}>Devam</ActionBtn>}
        {!stopwatch.running && stopwatch.elapsed>0 && <ActionBtn onClick={reset} variant="ghost">Sıfırla</ActionBtn>}
        {!stopwatch.running && stopwatch.elapsed>0 && <ActionBtn onClick={save} variant="success">Kaydet</ActionBtn>}
        <ActionBtn onClick={openFull} variant="ghost">Tam Ekran</ActionBtn>
      </div>
    </div>
  );
}

function CountdownCard({countdown,setCountdown,start,stop,reset,save,format,currentLeft,openFull}:{countdown:any; setCountdown:any; start:()=>void; stop:()=>void; reset:()=>void; save:()=>void; format:(ms:number)=>string; currentLeft:number; openFull:()=>void;}){
  function changeDuration(min:number){ if(!countdown.running) setCountdown((c:any)=> ({...c, duration: min*60*1000 })); }
  const used = countdown.duration - currentLeft;
  const [editing, setEditing] = useState<null|'h'|'m'|'s'>(null);
  const inputRef = useRef<HTMLInputElement|null>(null);
  useEffect(()=> { if(editing && inputRef.current){ inputRef.current.focus(); inputRef.current.select(); } }, [editing]);
  const baseMs = countdown.running ? currentLeft : countdown.duration;
  let totalSec = Math.floor(baseMs/1000); if(totalSec<0) totalSec=0;
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec%60;
  function commit(val:string){
    if(editing===null) return;
    let num = parseInt(val); if(isNaN(num)|| num<0) num = 0;
    let nh=h, nm=m, ns=s;
    if(editing==='h'){ nh = Math.min(num, 99); }
    if(editing==='m'){ nm = Math.min(num,59); }
    if(editing==='s'){ ns = Math.min(num,59); }
    const newMs = (nh*3600 + nm*60 + ns)*1000;
    setCountdown((c:any)=> ({...c, duration: newMs}));
    setEditing(null);
  }
  function displaySeg(label:'h'|'m'|'s', val:number){
    const active = editing===label;
    return (
      <div className="relative w-16 perspective-[600px]" onClick={()=> { if(!countdown.running) setEditing(label); }}>
        <div className={cn("relative rounded-xl overflow-hidden shadow-inner border", active? 'bg-slate-700 border-cyan-400/60' : 'bg-slate-800/80 border-slate-700/50')}>
          {!active && (
            <motion.div key={val} initial={{rotateX:90, opacity:0}} animate={{rotateX:0, opacity:1}} exit={{rotateX:-90, opacity:0}} transition={{duration:0.5}} className="text-center text-3xl font-bold py-4 tracking-tight bg-gradient-to-b from-slate-50/90 to-slate-300/70 bg-clip-text text-transparent select-none">
              {String(val).padStart(2,'0')}
            </motion.div>
          )}
          {active && (
            <input ref={inputRef} defaultValue={String(val).padStart(2,'0')} onBlur={(e)=> commit(e.target.value)} onKeyDown={(e)=> { if(e.key==='Enter'){ commit((e.target as HTMLInputElement).value);} if(e.key==='Escape'){ setEditing(null);} }} className="w-full h-full text-center text-3xl font-bold py-4 bg-slate-900/70 text-cyan-300 outline-none" />
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-xl space-y-4 relative overflow-hidden">
      <div className="absolute inset-px rounded-2xl bg-gradient-to-br from-indigo-500/5 via-cyan-500/5 to-emerald-400/5 pointer-events-none" />
      <h3 className="text-sm font-semibold tracking-wide">Sayaç</h3>
      <div className="flex gap-2 select-none" aria-live="off">
        {displaySeg('h', h)}
        <div className="flex items-center text-xl pb-4 opacity-60">:</div>
        {displaySeg('m', m)}
        <div className="flex items-center text-xl pb-4 opacity-60">:</div>
        {displaySeg('s', s)}
      </div>
      <div className="flex flex-wrap gap-2 text-[11px]">
        {[5,10,15,20,25,30].map(mv=> (<button key={mv} disabled={countdown.running} onClick={()=> changeDuration(mv)} className={cn('px-2 py-1 rounded-md border', countdown.duration/60000===mv ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10' : 'border-slate-700/50 hover:border-slate-600/50 text-slate-400 disabled:opacity-40')}>{mv}dk</button>))}
      </div>
      <div className="flex flex-wrap gap-2">
        {!countdown.running && <ActionBtn onClick={start}>Başlat</ActionBtn>}
        {countdown.running && <ActionBtn onClick={stop} variant="warn">Durdur</ActionBtn>}
        {!countdown.running && used>0 && <ActionBtn onClick={save} variant="success">Kaydet</ActionBtn>}
        {!countdown.running && used>0 && <ActionBtn onClick={reset} variant="ghost">Sıfırla</ActionBtn>}
        <ActionBtn onClick={openFull} variant="ghost">Tam Ekran</ActionBtn>
      </div>
    </div>
  );
}

function FlipClock({value, active, format, countdown}:{value:number; active:boolean; format:(ms:number)=>string; countdown?:boolean;}){ const display = format(value); return (<div className="flex gap-2 select-none" aria-live="off">{display.split(':').map((seg,i)=> (<FlipUnit key={i} value={seg} />))}</div>); }
function FlipUnit({value}:{value:string;}){ return (<div className="relative w-16 perspective-[600px]"><div className="relative rounded-xl overflow-hidden shadow-inner bg-slate-800/80 border border-slate-700/50"><AnimatePresence mode="popLayout" initial={false}><motion.div key={value} initial={{rotateX:90, opacity:0}} animate={{rotateX:0, opacity:1}} exit={{rotateX:-90, opacity:0}} transition={{duration:0.6, ease:[0.77,0,0.175,1]}} className="text-center text-3xl font-bold py-4 tracking-tight bg-gradient-to-b from-slate-50/90 to-slate-300/70 bg-clip-text text-transparent">{value}</motion.div></AnimatePresence></div></div>); }

function TaskModal({onClose,onSave,value,setValue,editing}:{onClose:()=>void; onSave:()=>void; value:string; setValue:(v:string)=>void; editing:boolean;}){ return (<motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><div className="absolute inset-0 bg-transparent" onClick={onClose} /><motion.div initial={{scale:0.9, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.9, opacity:0, y:10}} transition={{type:'spring', stiffness:220, damping:24}} className="relative w-full max-w-md rounded-3xl p-6 bg-slate-900/95 border border-slate-700/50 shadow-2xl space-y-5 m-6"><h3 className="text-lg font-semibold tracking-tight">{editing ? 'Görevi Düzenle' : 'Yeni Görev'}</h3><div><input value={value} onChange={e=>setValue(e.target.value)} placeholder="Görev adı" className="w-full rounded-lg bg-slate-800/70 border border-slate-600/40 focus:border-cyan-400 outline-none px-3 py-2 text-sm" /></div><div className="flex justify-end gap-2"><ActionBtn variant="ghost" onClick={onClose}>İptal</ActionBtn><ActionBtn variant="success" onClick={onSave}>{editing ? 'Kaydet' : 'Ekle'}</ActionBtn></div></motion.div></motion.div>); }

function ActionBtn({children,onClick,variant}:{children:any; onClick:()=>void; variant?:'warn'|'success'|'ghost';}){ let cls = 'px-3 py-1.5 rounded-md text-xs font-medium transition-colors'; if(variant==='warn') cls += ' bg-amber-600 hover:bg-amber-500 text-slate-900'; else if(variant==='success') cls += ' bg-emerald-500 hover:bg-emerald-400 text-slate-900'; else if(variant==='ghost') cls += ' bg-slate-700/60 hover:bg-slate-600/60 text-slate-200'; else cls += ' bg-cyan-600 hover:bg-cyan-500 text-white'; return <button onClick={onClick} className={cls}>{children}</button>; }
function IconButton({children,onClick,label}:{children:any; onClick:()=>void; label:string;}){ return (<button aria-label={label} onClick={onClick} className="w-7 h-7 inline-flex items-center justify-center rounded-md bg-slate-700/60 hover:bg-slate-600/70 text-slate-200 border border-slate-600/40">{children}</button>); }
function EditIcon(){return <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>}
function TrashIcon(){return <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12"/><path d="M16 6v12"/><path d="M5 6l1 14c.1 1 1 2 2 2h8c1 0 1.9-1 2-2l1-14"/><path d="M10 6V4h4v2"/></svg>}
function EyeIcon(){return <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}

// Fullscreen overlay components
function FullscreenTimer({children, fullscreen, onClose}:{children: any; fullscreen: any; onClose:()=>void;}){
  useEffect(()=> {
    function onKey(e:KeyboardEvent){ if(e.key==='Escape') onClose(); }
    if(fullscreen){ window.addEventListener('keydown', onKey); }
    return ()=> window.removeEventListener('keydown', onKey);
  }, [fullscreen,onClose]);
  return (
    <AnimatePresence>{fullscreen && (
      <motion.div className="fixed inset-0 z-[80] flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="absolute inset-0 bg-transparent" onClick={onClose} />
        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} transition={{type:'spring', stiffness:200, damping:24}} className="relative w-full max-w-4xl rounded-3xl p-10 bg-slate-900/95 border border-slate-700/50 shadow-2xl overflow-hidden m-6">
          <div className="absolute inset-px rounded-3xl bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-indigo-500/10 pointer-events-none animate-pulse opacity-40" />
          <button onClick={onClose} className="absolute top-4 right-4 px-3 py-1.5 text-xs rounded-md bg-slate-700/60 hover:bg-slate-600/60">Kapat (Esc)</button>
          {children}
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
}

function BigTimer({title,value,running,onClose,format}:{title:string; value:number; running:boolean; onClose:()=>void; format:(ms:number)=>string;}){
  const display = format(value).split(':');
  return (
    <div className="relative z-10 flex flex-col items-center gap-10">
      <h2 className="text-3xl font-semibold tracking-wide bg-gradient-to-r from-cyan-300 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">{title}</h2>
      <div className="flex gap-4">
        {display.map((seg,i)=> (
          <div key={i} className="relative w-40 h-48 rounded-2xl bg-slate-800/60 border border-slate-600/40 flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden">
            <motion.div key={seg} initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{duration:0.6, ease:'easeOut'}} className="text-7xl font-bold tracking-tight bg-gradient-to-b from-slate-50 to-slate-300 bg-clip-text text-transparent">{seg}</motion.div>
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.15),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(129,140,248,0.10),transparent_55%)] animate-gradient-move" />
          </div>
        ))}
      </div>
      <div className="text-xs uppercase tracking-widest text-slate-400">{running? 'ÇALIŞIYOR' : 'DURDU'}</div>
    </div>
  );
}

// Sayaç bittiğinde çıkan animasyonlu uyarı
function CountdownFinishedAlert({onClose, onSave, duration}:{onClose:()=>void; onSave:()=>void; duration:number;}){
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6" 
      initial={{opacity:0}} 
      animate={{opacity:1}} 
      exit={{opacity:0}}
    >
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <motion.div 
        initial={{scale:0.5, opacity:0, y:50}} 
        animate={{scale:1, opacity:1, y:0}} 
        exit={{scale:0.5, opacity:0, y:50}} 
        transition={{type:'spring', stiffness:200, damping:20}}
        className="relative w-full max-w-md rounded-3xl p-8 bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-600/50 shadow-2xl overflow-hidden m-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-indigo-500/10 pointer-events-none" />
        
        {/* Sallanan ikon */}
        <motion.div 
          className="text-center mb-6"
          animate={{rotate: [-5, 5, -5]}}
          transition={{duration:0.5, repeat:Infinity, repeatType:'reverse'}}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-900 text-4xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            ⏰
          </div>
        </motion.div>
        
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Sayaç Bitti! 🎉
          </h3>
          <p className="text-slate-300">
            {duration} dakikalık sayaç tamamlandı.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <ActionBtn onClick={onSave} variant="success">Kaydet & Kapat</ActionBtn>
            <ActionBtn onClick={onClose} variant="ghost">Sadece Kapat</ActionBtn>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
