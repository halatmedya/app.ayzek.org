import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useAnnouncementsStore, AnnouncementItem, AnnouncementPoll, AnnouncementPost } from '../store/announcements';
import { useUserStore } from '../store/user';
import { cn } from '../utils/cn';
import { useUIStore } from '../store/ui';
import { ANIM } from '../utils/anim';

export function AnnouncementsPage(){
  const { items, addPost, addPoll, votePoll, addComment } = useAnnouncementsStore();
  const { profile } = useUserStore();
  const { activePage } = useUIStore();
  const [showComposer, setShowComposer] = useState(false);
  const [mode, setMode] = useState<'select'|'post'|'poll'>('select');
  const [enterAnimTick, setEnterAnimTick] = useState(0);
  useEffect(()=> { if(activePage==='announcements'){ setEnterAnimTick(t=> t+1);} }, [activePage]);
  
  const CURRENT_USER = { 
    id: profile.id, 
    name: profile.firstName && profile.lastName 
      ? `${profile.firstName} ${profile.lastName}`
      : profile.username,
    avatar: profile.avatar 
  };
  
  console.log('AnnouncementsPage render - showComposer:', showComposer, 'mode:', mode);
  
  return (
    <div className="space-y-8" key={`ann-${enterAnimTick}`}>
      <motion.div initial={{opacity:0, y:-40}} animate={{opacity:1, y:0}} transition={{duration:ANIM.durMedium, ease:ANIM.ease}}>
        <ComposerTrigger onOpen={()=> { setShowComposer(true); setMode('select'); }} />
      </motion.div>
      <AnimatePresence>
        {showComposer && (
          <ComposerModal 
            mode={mode}
            onSelectMode={(m)=> setMode(m)}
            onBack={()=> setMode('select')}
            onClose={()=> setShowComposer(false)}
            onPost={(text,image)=> { addPost({text,image,user:CURRENT_USER}); setShowComposer(false);} }
            onPoll={(q, opts, multi)=> { addPoll({question:q, options:opts, multiSelect:multi, user:CURRENT_USER}); setShowComposer(false);} }
          />
        )}
      </AnimatePresence>
      <FeedList items={items} onVote={(pid, oid)=> votePoll(pid, oid, CURRENT_USER.id)} onComment={(pid, text)=> addComment(pid, text, CURRENT_USER)} enterTick={enterAnimTick} />
    </div>
  );
}

function ComposerTrigger({onOpen}:{onOpen:()=>void;}){
  return (
    <div className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
      <div className="text-slate-400 text-sm">Yeni duyuru veya anket oluştur...</div>
      <button onClick={()=> { console.log('Composer trigger clicked'); onOpen(); }} className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-900 font-bold text-2xl flex items-center justify-center shadow hover:scale-105 transition-transform">+</button>
    </div>
  );
}

interface ComposerModalProps {
  mode: 'select' | 'post' | 'poll';
  onSelectMode: (m:'post'|'poll')=>void;
  onBack: ()=>void;
  onClose: ()=>void;
  onPost: (text:string, image?:string)=>void;
  onPoll: (question:string, options:string[], multi:boolean)=>void;
}

function ComposerModal({mode,onSelectMode,onBack,onClose,onPost,onPoll}:ComposerModalProps){
  const [text,setText] = useState('');
  const [image,setImage] = useState<string|undefined>();
  const [question,setQuestion] = useState('');
  const [opts,setOpts] = useState<string[]>(['','']);
  const [multi,setMulti] = useState(false);
  
  function updateOpt(i:number, val:string){ setOpts(o=> o.map((v,idx)=> idx===i?val:v)); }
  function addOpt(){ setOpts(o=> [...o,'']); }
  function canPost(){ return text.trim().length>0; }
  function canPoll(){ return question.trim().length>0 && opts.filter(o=> o.trim()).length>=2; }
  
  function onImageSelect(e:React.ChangeEvent<HTMLInputElement>){ const file = e.target.files?.[0]; if(!file) return; const reader = new FileReader(); reader.onload = ()=> setImage(String(reader.result)); reader.readAsDataURL(file); }
  
  return (
    <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <motion.div initial={{scale:0.9, opacity:0, y:30}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.9, opacity:0, y:10}} transition={{type:'spring', stiffness:220, damping:26}} className="relative w-full max-w-2xl rounded-3xl p-8 bg-slate-900/95 border border-slate-700/50 shadow-2xl space-y-6 overflow-hidden m-6 pointer-events-auto">
        <div className="absolute inset-px rounded-3xl bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-indigo-500/10 pointer-events-none" />
        {mode==='select' && (
          <div className="grid grid-cols-2 gap-6">
            <button onClick={()=> onSelectMode('post')} className="group rounded-2xl p-6 bg-slate-800/50 border border-slate-700/50 hover:border-cyan-400/50 transition relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20" />
              <div className="relative text-left space-y-2">
                <div className="text-lg font-semibold">Duyuru</div>
                <p className="text-xs text-slate-400 leading-relaxed">Kısa bir mesaj ve isteğe bağlı görselle paylaş.</p>
              </div>
            </button>
            <button onClick={()=> onSelectMode('poll')} className="group rounded-2xl p-6 bg-slate-800/50 border border-slate-700/50 hover:border-indigo-400/50 transition relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20" />
              <div className="relative text-left space-y-2">
                <div className="text-lg font-semibold">Anket</div>
                <p className="text-xs text-slate-400 leading-relaxed">Bir soru sor, seçenekler ekle, çoklu oylama aç/kapat.</p>
              </div>
            </button>
          </div>
        )}
        {mode==='post' && (
          <div className="space-y-5">
            <textarea value={text} onChange={e=> setText(e.target.value)} rows={4} placeholder="Duyurunu yaz..." className="w-full resize-none rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none p-4 text-sm" />
            {image && (<div className="relative group">
              <img src={image} className="max-h-56 rounded-xl object-cover" />
              <button onClick={()=> setImage(undefined)} className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-md bg-slate-900/70 hover:bg-slate-900/90">Kaldır</button>
            </div>)}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs px-3 py-1.5 rounded-md bg-slate-700/60 hover:bg-slate-600/60 cursor-pointer">Görsel
                  <input type="file" accept="image/*" className="hidden" onChange={onImageSelect} />
                </label>
                <button onClick={()=> setText(t=> t + ' #etiket')} className="text-xs px-3 py-1.5 rounded-md bg-slate-700/60 hover:bg-slate-600/60">#</button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onBack} className="text-xs px-3 py-1.5 rounded-md bg-slate-600/40 hover:bg-slate-600/60">Geri</button>
                <button disabled={!canPost()} onClick={()=> onPost(text.trim(), image)} className={cn('text-xs px-4 py-2 rounded-md font-semibold transition', canPost()? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 hover:brightness-110' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed')}>Paylaş</button>
              </div>
            </div>
          </div>
        )}
        {mode==='poll' && (
          <div className="space-y-5">
            <input value={question} onChange={e=> setQuestion(e.target.value)} placeholder="Soru?" className="w-full rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-indigo-400 outline-none p-3 text-sm" />
            <div className="space-y-2">
              {opts.map((o,i)=>(
                <input key={i} value={o} onChange={e=> updateOpt(i,e.target.value)} placeholder={`Seçenek ${i+1}`} className="w-full rounded-lg bg-slate-800/60 border border-slate-600/40 focus:border-indigo-400 outline-none px-3 py-2 text-xs" />
              ))}
              <button onClick={addOpt} className="text-[11px] mt-1 px-2 py-1 rounded-md bg-slate-700/50 hover:bg-slate-600/50">+ Seçenek</button>
              <label className="flex items-center gap-2 text-[11px] text-slate-400 mt-2 select-none">
                <input type="checkbox" checked={multi} onChange={e=> setMulti(e.target.checked)} /> Birden fazla seçime izin ver
              </label>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={onBack} className="text-xs px-3 py-1.5 rounded-md bg-slate-600/40 hover:bg-slate-600/60">Geri</button>
              <button disabled={!canPoll()} onClick={()=> onPoll(question.trim(), opts, multi)} className={cn('text-xs px-4 py-2 rounded-md font-semibold transition', canPoll()? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:brightness-110' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed')}>Yayınla</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function FeedList({items,onVote,onComment,enterTick}:{items:AnnouncementItem[]; onVote:(pollId:string, optionId:string)=>void; onComment:(parentId:string, text:string)=>void; enterTick:number;}){
  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={{hidden:{}, show:{transition:{staggerChildren:0.08}}}} key={`feed-${enterTick}`}>
      {items.map((it,i)=> (
        <FeedCard key={it.id} item={it} onVote={onVote} onComment={onComment} index={i} />
      ))}
      {items.length===0 && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center text-xs text-slate-500 py-10">Henüz içerik yok.</motion.div>}
    </motion.div>
  );
}

function FeedCard({item,onVote,onComment,index}:{item:AnnouncementItem; onVote:(pid:string, oid:string)=>void; onComment:(pid:string,text:string)=>void; index:number;}){
  const [commentText, setCommentText] = useState('');
  const { comments } = useAnnouncementsStore();
  const list = comments[item.id] || [];
  const isPoll = item.type==='poll';
  return (
    <motion.div className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl space-y-5 relative overflow-hidden" initial={{opacity:0, y:60}} animate={{opacity:1, y:0}} transition={{duration:0.8, ease:ANIM.ease, delay:index*0.06}}>
      <div className="absolute inset-px rounded-3xl bg-gradient-to-br from-slate-50/2 via-slate-50/0 to-slate-50/0 pointer-events-none" />
      <div className="flex items-start gap-4">
        <Avatar name={item.user.name} avatar={item.user.avatar} />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-300">{item.user.name}</span>
            <span>· {timeAgo(item.createdAt)}</span>
            {isPoll && <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px]">ANKET</span>}
          </div>
          {item.type==='post' && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">{item.text}</p>
              {item.image && <img src={item.image} className="rounded-xl max-h-80 object-cover" />}
            </div>
          )}
          {item.type==='poll' && (
            <PollView poll={item} onVote={onVote} />
          )}
          <div className="pt-2 space-y-3">
            <form onSubmit={e=> { e.preventDefault(); if(!commentText.trim()) return; onComment(item.id, commentText.trim()); setCommentText(''); }} className="flex items-center gap-2">
              <input value={commentText} onChange={e=> setCommentText(e.target.value)} placeholder="Yorum yaz..." className="flex-1 rounded-lg bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none px-3 py-2 text-xs" />
              <button type="submit" className="px-3 py-1.5 rounded-md bg-cyan-600/70 hover:bg-cyan-500 text-[11px] font-medium">Gönder</button>
            </form>
            <div className="space-y-2">
              {list.map(c=> (
                <div key={c.id} className="flex items-start gap-3 text-xs">
                  <Avatar name={c.user.name} avatar={c.user.avatar} size={28} />
                  <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-300">{c.user.name}</span>
                      <span>· {timeAgo(c.createdAt)}</span>
                    </div>
                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{c.text}</div>
                  </div>
                </div>
              ))}
              {list.length===0 && <div className="text-[10px] text-slate-600">Yorum yok.</div>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PollView({poll,onVote}:{poll:AnnouncementPoll; onVote:(pid:string, oid:string)=>void;}){
  const totalVotes = poll.options.reduce((s,o)=> s+o.votes,0);
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-200 leading-relaxed">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map(op=> {
          const selected = poll.myVotes.includes(op.id);
          const percent = totalVotes>0 ? Math.round((op.votes/totalVotes)*100) : 0;
          return (
            <button key={op.id} onClick={()=> onVote(poll.id, op.id)} className={cn('w-full text-left px-4 py-2 rounded-xl border relative overflow-hidden', selected ? 'border-cyan-400/70 bg-cyan-500/10 text-cyan-200' : 'border-slate-600/40 hover:border-slate-500/50 text-slate-300')}>
              <span className="relative z-10 text-sm font-medium">{op.text}</span>
              <span className="relative z-10 text-[10px] ml-2 opacity-70">{percent}% ({op.votes})</span>
              <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <motion.div initial={{width:0}} animate={{width: percent+'%'}} transition={{duration:0.6}} className="h-full bg-cyan-500/10" />
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-slate-500 tracking-wider uppercase">{totalVotes} oy • {poll.multiSelect? 'Çoklu seçim' : 'Tek seçim'}</div>
    </div>
  );
}

function Avatar({name,avatar,size=40}:{name:string; avatar?:string; size?:number;}){
  const initials = name.split(/\s+/).map(p=> p[0]).slice(0,2).join('').toUpperCase();
  
  if (avatar) {
    return (
      <div style={{width:size, height:size}} className="rounded-full overflow-hidden shadow-inner border-2 border-slate-600/40">
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  
  return (
    <div style={{width:size, height:size}} className="flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-900 text-xs font-bold shadow-inner">
      {initials}
    </div>
  );
}

function timeAgo(ts:number){
  const diff = Date.now()-ts;
  const sec = Math.floor(diff/1000);
  if(sec<60) return sec+'sn';
  const min = Math.floor(sec/60); if(min<60) return min+'dk';
  const hr = Math.floor(min/60); if(hr<24) return hr+'s';
  const day = Math.floor(hr/24); return day+'g';
}
