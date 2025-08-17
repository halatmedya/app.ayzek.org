import { Rings } from './Rings';
import { NotificationsPanel } from './NotificationsPanel';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgendaStore } from '../store/agenda';
import { useUserStore } from '../store/user';
import { useDirectChatStore } from '../store/directChat';

const QUOTES = [
  'Bugün attığın küçük adımlar yarının büyük zaferleri olur.',
  'Disiplin, hedeflerine duyduğun sevginin bir ifadesidir.',
  'Zor geldiğinde bırakmak yerine yavaşla – ama durma.',
  'Süreklilik yetenekten daha güçlüdür.',
  'Enerjini yönettiğin gün, zamanını kazanmaya başlarsın.',
  '1% daha iyi \u003d 1 yıl sonra 37 kat ileri.',
  'Odaklandığın büyür – odaklanmayı seç.',
];

export function HomeDashboard(){
  const [index, setIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { sessions } = useAgendaStore();
  const { profile } = useUserStore();
  const { chats, messages, sendMessage } = useDirectChatStore();
  const [userChatInput, setUserChatInput] = useState('');

  // Aktif chat (tek kullanıcı senaryosu: userId = profile.id)
  const myChat = useMemo(()=> chats.find(c=> c.userId === profile.id && !c.closed), [chats, profile.id]);
  const myChatMessages = useMemo(()=> myChat ? (messages[myChat.id]||[]) : [], [myChat, messages]);
  
  function sendUserChat(){
    if(!myChat || !userChatInput.trim()) return;
    sendMessage(profile.id, profile.id, (profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : profile.username), userChatInput.trim());
    setUserChatInput('');
  }

  // Gerçek zamanlı saat
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Bugünkü toplam çalışma süresi
  const todayWorkTime = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0,10);
    const todaySessions = sessions[todayKey] || [];
    const totalSeconds = todaySessions.reduce((sum, session) => sum + session.durationSec, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}s ${minutes}dk`;
  }, [sessions]);
  
  function nextQuote(){ setIndex(i => (i+1) % QUOTES.length); }

  useEffect(()=> {
    const el = document.getElementById('user-direct-chat-scroll');
    if(el) el.scrollTop = el.scrollHeight;
  }, [myChatMessages.length]);

  return (
    <div className="space-y-12">
      {/* Kullanıcı Bilgileri ve Günlük Özet */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-200">
            {profile.firstName && profile.lastName 
              ? `${profile.firstName} ${profile.lastName}`
              : profile.username
            }
          </h1>
          <p className="text-sm text-slate-400">
            {currentTime.toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} • {currentTime.toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-emerald-400">{todayWorkTime}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Bugün Çalışılan</div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        <div className="flex-1 flex items-center justify-center">
          <Rings />
        </div>
        <div className="w-full lg:w-[460px] 2xl:w-[520px] flex flex-col gap-6">
          <div className="relative group rounded-3xl p-6 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/40 border border-slate-700/40 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden">
            <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.15),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(129,140,248,0.12),transparent_55%)] animate-gradient-move" />
            </div>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wider text-cyan-300/80">MOTİVASYON</h2>
              <button onClick={nextQuote} className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-md bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/50">Değiştir</button>
            </div>
            <div className="min-h-[120px] relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={index}
                  initial={{opacity:0, y:10, filter:'blur(4px)'}}
                  animate={{opacity:1, y:0, filter:'blur(0px)'}}
                  exit={{opacity:0, y:-10, filter:'blur(4px)'}}
                  transition={{duration:0.6, ease:'easeOut'}}
                  className="text-lg leading-relaxed font-medium text-slate-200"
                >
                  “{QUOTES[index]}”
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-4 text-[10px] tracking-widest text-slate-500 uppercase">{index+1}/{QUOTES.length}</div>
          </div>
          <div className="flex-1 min-h-[320px]">
            <NotificationsPanel />
          </div>
          {myChat && (
            <div className="rounded-3xl p-4 bg-slate-900/60 border border-slate-800/60 flex flex-col h-72">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold tracking-wide text-cyan-300">YETKİLİ İLE SOHBET</h3>
                <div className="text-[10px] text-slate-500">{myChatMessages.length} mesaj</div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="user-direct-chat-scroll">
                {myChatMessages.map(m=> (
                  <div key={m.id} className={`max-w-[75%] text-[11px] px-2 py-1.5 rounded-lg border ${m.authorId==='admin'? 'bg-cyan-600/25 border-cyan-500/30 text-cyan-100 ml-auto':'bg-slate-700/40 border-slate-600/40 text-slate-200 mr-auto'}`}>
                    <div className="text-[9px] opacity-70 mb-0.5">{m.authorName}</div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                ))}
                {myChatMessages.length===0 && <div className="text-[10px] text-slate-500">Henüz mesaj yok.</div>}
              </div>
              <div className="mt-2 flex gap-2">
                <input value={userChatInput} onChange={e=> setUserChatInput(e.target.value)} onKeyDown={e=> { if(e.key==='Enter'){ sendUserChat(); } }} placeholder="Mesaj yaz..." className="flex-1 text-[11px] px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700/50 focus:border-cyan-400 outline-none" />
                <button onClick={sendUserChat} disabled={!userChatInput.trim()} className="px-3 py-2 rounded-lg text-[11px] bg-cyan-600/70 hover:bg-cyan-500 text-white disabled:opacity-40">Gönder</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
