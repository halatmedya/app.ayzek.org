import { useState, useMemo, useEffect } from 'react';
import { useAgendaStore } from '../store/agenda';
import { useUserStore } from '../store/user';
import { useNotificationsStore } from '../store/notifications';
import { useSupportStore } from '../store/support';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminChatStore } from '../store/adminChat';
import { useDirectChatStore } from '../store/directChat';
import { useUIStore } from '../store/ui';
import { ANIM } from '../utils/anim';

export function AdminPage(){
  const [tab, setTab] = useState<'stats'|'users'|'support'|'chat'>('stats');
  const { activePage } = useUIStore();
  const [enterAnimTick, setEnterAnimTick] = useState(0);
  useEffect(()=> { if(activePage==='admin'){ setEnterAnimTick(t=> t+1);} }, [activePage]);
  return (
    <div className="space-y-10" key={`admin-${enterAnimTick}`}>
      <motion.div className="flex gap-3" initial={{opacity:0, y:-40}} animate={{opacity:1, y:0}} transition={{duration:ANIM.durMedium, ease:ANIM.ease}}>
        <AdminTab label="İstatistikler" active={tab==='stats'} onClick={()=> setTab('stats')} />
        <AdminTab label="Kullanıcılar" active={tab==='users'} onClick={()=> setTab('users')} />
        <AdminTab label="Destek Paneli" active={tab==='support'} onClick={()=> setTab('support')} />
        <AdminTab label="Chat" active={tab==='chat'} onClick={()=> setTab('chat')} />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{opacity:0, y:40}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-30}} transition={{duration:ANIM.durMedium, ease:ANIM.ease}}>
          {tab==='stats' && <StatsView />}
          {tab==='users' && <UsersView />}
          {tab==='support' && <SupportAdminView />}
          {tab==='chat' && <AdminChatView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AdminTab({label, active, onClick}:{label:string; active:boolean; onClick:()=>void;}){
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-medium relative overflow-hidden transition ${active? 'text-white':'text-slate-400 hover:text-slate-200'}`}>
      {active && <motion.span layoutId="admin-tab" className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 rounded-xl" />}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

// === İSTATİSTİKLER ===
function StatsView(){
  const { tasks } = useAgendaStore();
  // Son 14 gün
  const days = useMemo(()=> {
    const arr: {date:string; percent:number; label:string;}[] = [];
    for(let i=13;i>=0;i--){
      const d = new Date(); d.setDate(d.getDate()-i);
      const key = d.toISOString().slice(0,10);
      const list = tasks[key] || [];
      const done = list.filter(t=> t.completed).length;
      const percent = list.length? Math.round(done/list.length*100):0;
      arr.push({
        date: key, 
        percent, 
        label: d.toLocaleDateString('tr-TR', {day:'2-digit', month:'2-digit'})
      });
    }
    return arr;
  },[tasks]);

  const maxPercent = 100;
  const chartWidth = 500;
  const chartHeight = 200;
  const padding = { top: 15, right: 30, bottom: 40, left: 45 };
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60">
      <h2 className="text-lg font-semibold mb-4 text-slate-100">Görev Tamamlama Eğrisi</h2>
      <div className="bg-slate-950/30 rounded-lg p-4 border border-slate-700/20">
        <svg 
          width={chartWidth} 
          height={chartHeight + padding.top + padding.bottom} 
          viewBox={`0 0 ${chartWidth} ${chartHeight + padding.top + padding.bottom}`}
          className="w-full h-auto max-w-lg mx-auto"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines (horizontal) */}
          {gridLines.map(percent => {
            const y = padding.top + (chartHeight * (1 - percent / 100));
            return (
              <g key={percent}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={chartWidth - padding.right} 
                  y2={y} 
                  stroke="#475569" 
                  strokeWidth="1" 
                  strokeOpacity="0.3"
                />
                <text 
                  x={padding.left - 8} 
                  y={y + 3} 
                  textAnchor="end" 
                  className="text-[10px] fill-slate-400"
                >
                  {percent}%
                </text>
              </g>
            );
          })}
          
          {/* Vertical axis */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={chartHeight + padding.top} 
            stroke="#64748b" 
            strokeWidth="2"
          />
          
          {/* Horizontal axis */}
          <line 
            x1={padding.left} 
            y1={chartHeight + padding.top} 
            x2={chartWidth - padding.right} 
            y2={chartHeight + padding.top} 
            stroke="#64748b" 
            strokeWidth="2"
          />
          
          {/* Data points and line */}
          {days.map((d, i) => {
            const x = padding.left + (i * (chartWidth - padding.left - padding.right) / (days.length - 1));
            const y = padding.top + (chartHeight * (1 - d.percent / 100));
            
            return (
              <g key={d.date}>
                {/* Vertical guide line */}
                <line 
                  x1={x} 
                  y1={chartHeight + padding.top} 
                  x2={x} 
                  y2={chartHeight + padding.top + 5} 
                  stroke="#64748b" 
                  strokeWidth="1"
                />
                
                {/* Date label */}
                <text 
                  x={x} 
                  y={chartHeight + padding.top + 15} 
                  textAnchor="middle" 
                  className="text-[10px] fill-slate-400"
                  transform={`rotate(-45, ${x}, ${chartHeight + padding.top + 15})`}
                >
                  {d.label}
                </text>
                
                {/* Data point */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="4" 
                  fill="url(#lineGradient)" 
                  stroke="#1e293b" 
                  strokeWidth="2"
                >
                  <title>{d.label}: %{d.percent}</title>
                </circle>
                
                {/* Hover effect */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="8" 
                  fill="transparent" 
                  className="hover:fill-cyan-400/20 cursor-pointer"
                >
                  <title>{d.label}: %{d.percent}</title>
                </circle>
              </g>
            );
          })}
          
          {/* Connection line */}
          <path 
            d={`M ${days.map((d, i) => {
              const x = padding.left + (i * (chartWidth - padding.left - padding.right) / (days.length - 1));
              const y = padding.top + (chartHeight * (1 - d.percent / 100));
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}`}
            fill="none" 
            stroke="url(#lineGradient)" 
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Area under curve */}
          <path 
            d={`M ${padding.left} ${chartHeight + padding.top} ${days.map((d, i) => {
              const x = padding.left + (i * (chartWidth - padding.left - padding.right) / (days.length - 1));
              const y = padding.top + (chartHeight * (1 - d.percent / 100));
              return `L ${x} ${y}`;
            }).join(' ')} L ${padding.left + (chartWidth - padding.left - padding.right)} ${chartHeight + padding.top} Z`}
            fill="url(#areaGradient)"
          />
          
          {/* Axis labels */}
          <text 
            x={padding.left / 2} 
            y={chartHeight / 2 + padding.top} 
            textAnchor="middle" 
            className="text-xs fill-slate-300 font-medium"
            transform={`rotate(-90, ${padding.left / 2}, ${chartHeight / 2 + padding.top})`}
          >
            Tamamlama (%)
          </text>
          
          <text 
            x={chartWidth / 2} 
            y={chartHeight + padding.top + 35} 
            textAnchor="middle" 
            className="text-xs fill-slate-300 font-medium"
          >
            Son 14 Gün
          </text>
        </svg>
        
        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded"></div>
            <span>Trend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500"></div>
            <span>Günlük</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// === KULLANICILAR ===
function UsersView(){
  const [selectedUser, setSelectedUser] = useState<string|null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0,10));
  const { tasks, addFeedback, toggleTask } = useAgendaStore();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const addNotification = useNotificationsStore(s=> s.add);
  const [feedbackTaskId, setFeedbackTaskId] = useState<string|null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const { addPendingFeedbackDate } = (window as any).useUIStore ? (window as any).useUIStore() : { addPendingFeedbackDate: (_:string)=>{} };
  const { startChat, sendMessage, getChatId, messages: directMessages, chats, closeChat, reopenChat } = useDirectChatStore();
  const [directMsg, setDirectMsg] = useState('');

  // Mevcut kullanıcıyı al
  const currentUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || profile.username || 'Kullanıcı',
      photoURL: user.photoURL || profile.avatar
    };
  }, [user, profile]);

  const monthStats = useMemo(()=> {
    if(!currentUser) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let added = 0; let completed = 0; let workSeconds = 0;
    Object.entries(tasks).forEach(([dateKey, list])=> {
      const d = new Date(dateKey);
      if(d.getFullYear()===year && d.getMonth()===month){
        added += list.length;
        completed += list.filter(t=> t.completed).length;
      }
    });
    // Work time: approximate sessions for this month if we had sessions store accessible (not passed here). We'll skip until integrated unless needed.
    // Could integrate sessions by importing useAgendaStore earlier (sessions already available above if needed) - add real calculation:
    const { sessions } = useAgendaStore.getState();
    Object.entries(sessions).forEach(([dateKey, sessList])=> {
      const d = new Date(dateKey);
      if(d.getFullYear()===year && d.getMonth()===month){
        workSeconds += sessList.reduce((s, ss)=> s+ ss.durationSec, 0);
      }
    });
    const hours = Math.floor(workSeconds/3600);
    const mins = Math.floor((workSeconds%3600)/60);
    return { added, completed, workLabel: `${hours}s ${mins}dk` };
  }, [tasks, currentUser]);

  const taskList = selectedUser ? (tasks[selectedDate] || []) : [];

  function openFeedback(taskId:string){
    setFeedbackTaskId(taskId);
    setFeedbackMsg('');
  }

  function submitFeedback(){
    if(!feedbackTaskId || !feedbackMsg.trim()) return;
    const task = (tasks[selectedDate]||[]).find(t=> t.id===feedbackTaskId);
    if(!task) { setFeedbackTaskId(null); return; }
    // Ekle
    addFeedback(selectedDate, feedbackTaskId, feedbackMsg.trim());
    // Görev tamamlandıysa geri aç
    if(task.completed){ toggleTask(selectedDate, task.id); }
    // Bildirim (admin -> user)
  try { addPendingFeedbackDate(selectedDate); } catch(_){ }
    addNotification({
      title:'Görev Geri Bildirim',
      message: `${task.name} görevi için: ${feedbackMsg.trim()}`,
      type:'task-feedback',
      taskId: task.id,
      taskDate: selectedDate,
      taskName: task.name,
      direction: 'admin-to-user',
      read: false
    });
    setFeedbackTaskId(null);
    setFeedbackMsg('');
  }

  // Direct chat derived state
  const chatId = selectedUser ? getChatId(selectedUser) : null;
  const chat = chats.find(c=> c.id === chatId);
  const chatMessages = chatId ? (directMessages[chatId]||[]) : [];
  const adminName = (user?.displayName) || profile.username || 'Yetkili';

  function sendDirect(){
    if(!selectedUser || !directMsg.trim()) return;
    sendMessage(selectedUser, 'admin', adminName + ' ★', directMsg.trim());
    setDirectMsg('');
  }

  function ensureChat(){
    if(selectedUser){ startChat(selectedUser, currentUser?.displayName || 'Kullanıcı'); }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Kullanıcı bilgileri yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-1 space-y-3">
        <h3 className="text-sm font-semibold tracking-wide text-slate-300 mb-2">KULLANICILAR (1)</h3>
        <div className="space-y-2">
          <button 
            onClick={()=> setSelectedUser(currentUser.id)} 
            className={`w-full text-left px-3 py-3 rounded-lg text-sm transition border ${
              selectedUser === currentUser.id
                ? 'bg-cyan-500/20 border-cyan-500/40 text-white'
                : 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600/40 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-900 text-xs font-bold">
                  {currentUser.displayName[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{currentUser.displayName}</div>
                <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
              </div>
            </div>
          </button>
          
          {/* İleride daha fazla kullanıcı için placeholder */}
          <div className="text-xs text-slate-600 p-2 rounded-lg border border-slate-700/30 border-dashed text-center">
            Diğer kullanıcılar<br/>yakında eklenecek
          </div>
        </div>
      </div>
      <div className="lg:col-span-4 space-y-6">
        {!selectedUser && <div className="text-sm text-slate-500">Bir kullanıcı seç.</div>}
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e)=> setSelectedDate(e.target.value)} 
                className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm focus:border-cyan-400 outline-none" 
              />
              <div className="text-xs text-slate-400">
                Görüntülenen: {currentUser.displayName}
              </div>
            </div>
            {monthStats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className="text-[10px] tracking-wider text-slate-400 mb-1">BU AY EKLENEN</div>
                  <div className="text-lg font-semibold text-cyan-300">{monthStats.added}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className="text-[10px] tracking-wider text-slate-400 mb-1">BU AY TAMAMLANAN</div>
                  <div className="text-lg font-semibold text-emerald-300">{monthStats.completed}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className="text-[10px] tracking-wider text-slate-400 mb-1">TOPLAM ÇALIŞMA</div>
                  <div className="text-lg font-semibold text-violet-300">{monthStats.workLabel}</div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {taskList.length===0 && (
                <div className="text-center py-8 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="text-sm text-slate-500">Bu tarih için görev yok</div>
                  <div className="text-xs text-slate-600 mt-1">{selectedDate}</div>
                </div>
              )}
              {taskList.map(t=> (
                <div key={t.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center gap-3 hover:border-slate-600/40 transition">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${t.completed? 'bg-emerald-400':'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${t.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {t.name}
                    </div>
                    {t.feedbacks && t.feedbacks.length>0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.feedbacks.map(f=> (
                          <span key={f.id} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {f.message}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={()=> openFeedback(t.id)} 
                    className="px-3 py-1.5 rounded-md text-xs bg-cyan-600/60 hover:bg-cyan-500 text-white transition flex-shrink-0"
                  >
                    📢 Bildir
                  </button>
                </div>
              ))}
            </div>
            {/* Direct Chat Section */}
            <div className="mt-6 rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span>Direkt Sohbet</span>
                  {chat && chat.closed && <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">KAPALI</span>}
                </div>
                <div className="flex gap-2">
                  {!chat && <button onClick={ensureChat} className="px-3 py-1.5 text-[11px] rounded-md bg-cyan-600/60 hover:bg-cyan-500 text-white">Başlat</button>}
                  {chat && !chat.closed && <button onClick={()=> closeChat(selectedUser!)} className="px-3 py-1.5 text-[11px] rounded-md bg-red-600/60 hover:bg-red-500 text-white">Kapat</button>}
                  {chat && chat.closed && <button onClick={()=> reopenChat(selectedUser!)} className="px-3 py-1.5 text-[11px] rounded-md bg-emerald-600/60 hover:bg-emerald-500 text-white">Aç</button>}
                </div>
              </div>
              {chatId ? (
                <div className="flex flex-col h-64">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="admin-direct-chat-scroll">
                    {chatMessages.length===0 && <div className="text-[11px] text-slate-500">Mesaj yok.</div>}
                    {chatMessages.map(m=> (
                      <div key={m.id} className={`max-w-[70%] text-[11px] px-2 py-1.5 rounded-lg border ${m.authorId==='admin'? 'bg-cyan-600/25 border-cyan-500/30 text-cyan-100':'bg-slate-700/40 border-slate-600/40 text-slate-200'} ${m.authorId==='admin'? 'ml-auto':'mr-auto'}`}>
                        <div className="text-[9px] opacity-70 mb-0.5 flex items-center gap-1">{m.authorName}</div>
                        <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      </div>
                    ))}
                  </div>
                  {!chat?.closed && (
                    <div className="mt-2 flex gap-2">
                      <input value={directMsg} onChange={e=> setDirectMsg(e.target.value)} onKeyDown={e=> { if(e.key==='Enter'){ sendDirect(); } }} placeholder="Mesaj yaz..." className="flex-1 text-[11px] px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700/50 focus:border-cyan-400 outline-none" />
                      <button onClick={sendDirect} disabled={!directMsg.trim()} className="px-3 py-2 rounded-lg text-[11px] bg-cyan-600/70 hover:bg-cyan-500 text-white disabled:opacity-40">Gönder</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">Sohbet başlatılmadı.</div>
              )}
            </div>
          </div>
        )}
        <AnimatePresence>{feedbackTaskId && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={()=> setFeedbackTaskId(null)} />
            <motion.div initial={{scale:0.9, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.9, opacity:0, y:10}} transition={{type:'spring', stiffness:220, damping:24}} className="relative w-full max-w-md rounded-3xl p-6 bg-slate-900/95 border border-slate-700/50 shadow-2xl space-y-5 m-6">
              <h3 className="text-lg font-semibold tracking-tight">Görev Geri Bildirim</h3>
              <textarea value={feedbackMsg} onChange={e=> setFeedbackMsg(e.target.value)} placeholder="Mesaj" rows={4} className="w-full rounded-lg bg-slate-800/70 border border-slate-600/40 focus:border-cyan-400 outline-none px-3 py-2 text-sm resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={()=> setFeedbackTaskId(null)} className="px-3 py-1.5 rounded-md text-xs bg-slate-700/60 hover:bg-slate-600/60 text-slate-200">İptal</button>
                <button onClick={submitFeedback} disabled={!feedbackMsg.trim()} className="px-3 py-1.5 rounded-md text-xs bg-emerald-500/80 hover:bg-emerald-500 text-slate-900 disabled:opacity-40">Gönder</button>
              </div>
            </motion.div>
          </motion.div>
        )}</AnimatePresence>
      </div>
    </div>
  );
}

// === DESTEK PANELİ ===
function SupportAdminView(){
  const { tickets, messages, addMessage, updateTicketStatus } = useSupportStore();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const [selectedTicket, setSelectedTicket] = useState<string|null>(null);
  const [reply, setReply] = useState('');

  const selectedMessages = selectedTicket ? (messages[selectedTicket] || []) : [];
  const adminDisplayName = (user?.displayName) || profile.username || 'Yetkili';

  function send(){
    if(!selectedTicket || !reply.trim()) return;
    addMessage(selectedTicket, reply.trim(), false, adminDisplayName + ' ★');
    setReply('');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-sm font-semibold tracking-wide text-slate-300">TİCKETLAR</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {tickets.length===0 && <div className="text-xs text-slate-500">Ticket yok.</div>}
          {tickets.map(t=> (
            <button key={t.id} onClick={()=> setSelectedTicket(t.id)} className={`w-full text-left p-3 rounded-xl border text-xs transition ${selectedTicket===t.id? 'bg-cyan-500/20 border-cyan-500/40 text-white':'bg-slate-800/50 border-slate-700/40 hover:border-slate-600/40 text-slate-300'}`}>
              <div className="flex justify-between">
                <span className="font-medium">{t.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60">{t.priority}</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 line-clamp-2">{t.description}</div>
              <div className="mt-1 text-[9px] text-slate-500 flex gap-2">
                <span>{t.status}</span>
                <span>{new Date(t.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-3 flex flex-col h-[560px]">
        {!selectedTicket && <div className="text-sm text-slate-500">Bir ticket seç.</div>}
        {selectedTicket && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-semibold">Ticket Mesajları</div>
              <div className="flex gap-2">
                <select onChange={(e)=> updateTicketStatus(selectedTicket, e.target.value as any)} className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1">
                  <option value="open">open</option>
                  <option value="in-progress">in-progress</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                </select>
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-slate-900/50 border border-slate-800/60 p-4 overflow-y-auto space-y-3">
              {selectedMessages.map(m=> (
                <div key={m.id} className={`max-w-[70%] p-2 rounded-lg text-xs ${m.isFromUser? 'ml-auto bg-emerald-600/30 text-emerald-100':'mr-auto bg-cyan-600/30 text-cyan-100'}`}>
                  <div className="text-[10px] opacity-70 mb-0.5">{m.authorName}</div>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={reply} onChange={(e)=> setReply(e.target.value)} onKeyDown={(e)=> { if(e.key==='Enter'){ send(); } }} placeholder="Yanıt yaz..." className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-cyan-400 outline-none" />
              <button onClick={send} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium">Gönder</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// === ADMIN CHAT ===
function AdminChatView(){
  const { messages, send } = useAdminChatStore();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const [input, setInput] = useState('');
  const adminDisplayName = (user?.displayName) || profile.username || 'Yetkili';
  const adminId = user?.uid || profile.id;

  function submit(){
    if(!input.trim()) return;
    send(input.trim(), adminId, adminDisplayName);
    setInput('');
  }

  useEffect(()=> {
    const el = document.getElementById('admin-chat-scroll');
    if(el) { el.scrollTop = el.scrollHeight; }
  }, [messages.length]);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-slate-300">YETKİLİ CHAT</h3>
        <div className="text-[10px] text-slate-500">Toplam {messages.length} mesaj</div>
      </div>
      <div id="admin-chat-scroll" className="flex-1 rounded-2xl bg-slate-900/60 border border-slate-800/70 p-4 overflow-y-auto space-y-4">
        {messages.length===0 && <div className="text-xs text-slate-500">Mesaj yok. Yazmaya başla.</div>}
        {messages.map(m=> (
          <div key={m.id} className="flex flex-col max-w-[70%] bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-xs">
            <div className="mb-1 font-semibold text-cyan-300 flex items-center gap-1">
              <span>{m.authorName}</span>
              <span className="text-[8px] text-slate-500">{new Date(m.createdAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</span>
            </div>
            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">{m.content}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input 
          value={input} 
            onChange={e=> setInput(e.target.value)} 
            onKeyDown={e=> { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); submit(); } }}
          placeholder="Mesaj yaz..." 
          className="flex-1 rounded-xl bg-slate-800/70 border border-slate-700/50 focus:border-cyan-400 outline-none px-3 py-2 text-sm" />
        <button onClick={submit} disabled={!input.trim()} className="px-4 py-2 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-xs font-medium disabled:opacity-40">Gönder</button>
      </div>
    </div>
  );
}
