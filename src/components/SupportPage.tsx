import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupportStore, SupportTicket, TicketPriority, TicketStatus } from '../store/support';
import { useUserStore } from '../store/user';
import { cn } from '../utils/cn';
import { useUIStore } from '../store/ui';
import { ANIM } from '../utils/anim';

const CATEGORIES = [
  'Teknik Sorun',
  'Hesap Sorunu',
  'Özellik İsteği',
  'Faturalandırma',
  'Genel Soru',
  'Diğer'
];

export function SupportPage() {
  const { tickets, messages, createTicket, addMessage } = useSupportStore();
  const { profile } = useUserStore();
  const { activePage } = useUIStore();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [enterAnimTick, setEnterAnimTick] = useState(0);
  useEffect(()=> { if(activePage==='support'){ setEnterAnimTick(t=> t+1);} }, [activePage]);

  const CURRENT_USER = { 
    id: profile.id, 
    name: profile.firstName && profile.lastName 
      ? `${profile.firstName} ${profile.lastName}`
      : profile.username
  };

  return (
    <div className="h-full flex" key={`sup-${enterAnimTick}`}>
      {/* Ticket List */}
      <motion.div className="w-1/3 border-r border-slate-800/60 flex flex-col" initial={{opacity:0, x:-80}} animate={{opacity:1, x:0}} transition={{duration:ANIM.durMedium, ease:ANIM.ease}}>
        <div className="p-6 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Destek Talepleri</h2>
            <button
              onClick={() => setShowNewTicket(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold text-sm hover:brightness-110 transition"
            >
              Yeni Talep
            </button>
          </div>
          <TicketStats tickets={tickets} />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <p className="text-sm">Henüz destek talebi yok.</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {tickets.map(ticket => (
                <TicketItem 
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={selectedTicket === ticket.id}
                  onClick={() => setSelectedTicket(ticket.id)}
                  messageCount={messages[ticket.id]?.length || 0}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Ticket Detail */}
      <motion.div className="flex-1 flex flex-col" initial={{opacity:0, x:120}} animate={{opacity:1, x:0}} transition={{duration:ANIM.durLong, ease:ANIM.ease, delay:0.2}}>
        {selectedTicket ? (
          <TicketDetail 
            ticketId={selectedTicket}
            onAddMessage={(content) => addMessage(selectedTicket, content, true, CURRENT_USER.name)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center space-y-2">
              <div className="text-4xl mb-4">🎫</div>
              <p>Bir destek talebi seçin</p>
              <p className="text-xs">veya yeni talep oluşturun</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewTicket && (
          <NewTicketModal
            onClose={() => setShowNewTicket(false)}
            onSubmit={(data) => {
              createTicket({ ...data, userId: CURRENT_USER.id, userName: CURRENT_USER.name });
              setShowNewTicket(false);
              // Auto-select the new ticket
              setTimeout(() => {
                const newTicket = useSupportStore.getState().tickets[0];
                if (newTicket) setSelectedTicket(newTicket.id);
              }, 100);
            }}
          />
        )}
      </AnimatePresence>
  </div>
  );
}

function TicketStats({ tickets }: { tickets: SupportTicket[] }) {
  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="bg-slate-800/40 rounded-lg p-2 text-center">
        <div className="font-bold text-orange-400">{stats.open}</div>
        <div className="text-slate-400">Açık</div>
      </div>
      <div className="bg-slate-800/40 rounded-lg p-2 text-center">
        <div className="font-bold text-blue-400">{stats.inProgress}</div>
        <div className="text-slate-400">İşlemde</div>
      </div>
      <div className="bg-slate-800/40 rounded-lg p-2 text-center">
        <div className="font-bold text-green-400">{stats.resolved}</div>
        <div className="text-slate-400">Çözüldü</div>
      </div>
    </div>
  );
}

function TicketItem({ 
  ticket, 
  isSelected, 
  onClick, 
  messageCount 
}: { 
  ticket: SupportTicket; 
  isSelected: boolean; 
  onClick: () => void;
  messageCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all',
        isSelected 
          ? 'border-cyan-400/50 bg-cyan-500/10' 
          : 'border-slate-700/50 hover:border-slate-600/50 bg-slate-800/30'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="text-xs text-slate-500">
          {messageCount} mesaj
        </div>
      </div>
      
      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{ticket.title}</h3>
      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{ticket.description}</p>
      
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{ticket.category}</span>
        <span>{timeAgo(ticket.updatedAt)}</span>
      </div>
    </button>
  );
}

function TicketDetail({ ticketId, onAddMessage }: { ticketId: string; onAddMessage: (content: string) => void }) {
  const { tickets, messages } = useSupportStore();
  const [newMessage, setNewMessage] = useState('');
  
  const ticket = tickets.find(t => t.id === ticketId);
  const ticketMessages = messages[ticketId] || [];
  
  if (!ticket) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onAddMessage(newMessage.trim());
    setNewMessage('');
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/60">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold mb-1">{ticket.title}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>#{ticket.id.slice(-8)}</span>
              <span>•</span>
              <span>{ticket.category}</span>
              <span>•</span>
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {ticketMessages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>

      {/* Reply Form */}
      {ticket.status !== 'closed' && (
        <div className="p-6 border-t border-slate-800/60">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Yanıtınızı yazın..."
              rows={3}
              className="w-full resize-none rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none p-4 text-sm"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition',
                  newMessage.trim()
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                )}
              >
                Gönder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MessageItem({ message }: { message: any }) {
  const isAdmin = !message.isFromUser; // store sets isFromUser=false for admin side messages
  const name = message.isFromUser ? 'Sen' : message.authorName;
  return (
    <div className={cn('flex gap-3', message.isFromUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-md rounded-2xl p-4 relative',
        message.isFromUser 
          ? 'bg-cyan-500/20 border border-cyan-400/30' 
          : 'bg-slate-800/60 border border-slate-700/50'
      )}>
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className={cn('font-semibold flex items-center gap-1', message.isFromUser ? 'text-cyan-300' : 'text-emerald-300')}>
            {name}{isAdmin && !String(name).includes('★') && <span className="text-[10px]">★</span>}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-500">{timeAgo(message.createdAt)}</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

function NewTicketModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; priority: TicketPriority; category: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [category, setCategory] = useState(CATEGORIES[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), priority, category });
  };

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        className="relative w-full max-w-2xl rounded-3xl p-8 bg-slate-900/95 border border-slate-700/50 shadow-2xl m-6"
      >
        <h2 className="text-xl font-bold mb-6">Yeni Destek Talebi</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Konu</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sorunun kısa açıklaması"
              className="w-full rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none p-3 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none p-3 text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none p-3 text-sm"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sorununuzu detaylı olarak açıklayın..."
              rows={4}
              className="w-full resize-none rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none p-3 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-600/40 hover:bg-slate-600/60 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !description.trim()}
              className={cn(
                'px-6 py-2 rounded-lg text-sm font-semibold transition',
                title.trim() && description.trim()
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 hover:brightness-110'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              )}
            >
              Talep Oluştur
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const config = {
    open: { label: 'Açık', color: 'bg-orange-500/20 text-orange-300 border-orange-400/30' },
    'in-progress': { label: 'İşlemde', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
    resolved: { label: 'Çözüldü', color: 'bg-green-500/20 text-green-300 border-green-400/30' },
    closed: { label: 'Kapalı', color: 'bg-slate-500/20 text-slate-300 border-slate-400/30' },
  };

  const { label, color } = config[status];
  return (
    <span className={cn('px-2 py-1 rounded-md text-xs font-medium border', color)}>
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = {
    low: { label: 'Düşük', color: 'bg-slate-500/20 text-slate-300' },
    medium: { label: 'Orta', color: 'bg-yellow-500/20 text-yellow-300' },
    high: { label: 'Yüksek', color: 'bg-orange-500/20 text-orange-300' },
    urgent: { label: 'Acil', color: 'bg-red-500/20 text-red-300' },
  };

  const { label, color } = config[priority];
  return (
    <span className={cn('px-2 py-1 rounded-md text-xs font-medium', color)}>
      {label}
    </span>
  );
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}g`;
  if (hours > 0) return `${hours}s`;
  if (minutes > 0) return `${minutes}dk`;
  return `${seconds}sn`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
