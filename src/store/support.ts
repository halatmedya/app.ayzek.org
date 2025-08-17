import { create } from 'zustand';

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  isFromUser: boolean;
  authorName: string;
  createdAt: number;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  userName: string;
}

interface SupportStore {
  tickets: SupportTicket[];
  messages: Record<string, TicketMessage[]>;
  
  // Actions
  createTicket: (data: {
    title: string;
    description: string;
    priority: TicketPriority;
    category: string;
    userId: string;
    userName: string;
  }) => void;
  
  addMessage: (ticketId: string, content: string, isFromUser: boolean, authorName: string) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  
  // Persistence
  hydrate: () => void;
}

export const useSupportStore = create<SupportStore>((set, get) => ({
  tickets: [],
  messages: {},
  
  createTicket: (data) => {
    const ticket: SupportTicket = {
      id: 'ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: data.title,
      description: data.description,
      status: 'open',
      priority: data.priority,
      category: data.category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: data.userId,
      userName: data.userName,
    };
    
    const initialMessage: TicketMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ticketId: ticket.id,
      content: data.description,
      isFromUser: true,
      authorName: data.userName,
      createdAt: Date.now(),
    };
    
    set(state => ({
      tickets: [ticket, ...state.tickets],
      messages: {
        ...state.messages,
        [ticket.id]: [initialMessage]
      }
    }));
    
    // Persist to localStorage
    const { tickets, messages } = get();
    localStorage.setItem('ayzek_support_v1', JSON.stringify({ tickets, messages }));
  },
  
  addMessage: (ticketId, content, isFromUser, authorName) => {
    const message: TicketMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ticketId,
      content,
      isFromUser,
      authorName,
      createdAt: Date.now(),
    };
    
    set(state => {
      const updatedTickets = state.tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, updatedAt: Date.now(), status: isFromUser && ticket.status === 'resolved' ? 'open' : ticket.status }
          : ticket
      );
      
      return {
        tickets: updatedTickets,
        messages: {
          ...state.messages,
          [ticketId]: [...(state.messages[ticketId] || []), message]
        }
      };
    });
    
    // Persist to localStorage
    const { tickets, messages } = get();
    localStorage.setItem('ayzek_support_v1', JSON.stringify({ tickets, messages }));
  },
  
  updateTicketStatus: (ticketId, status) => {
    set(state => ({
      tickets: state.tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status, updatedAt: Date.now() }
          : ticket
      )
    }));
    
    // Persist to localStorage
    const { tickets, messages } = get();
    localStorage.setItem('ayzek_support_v1', JSON.stringify({ tickets, messages }));
  },
  
  hydrate: () => {
    try {
      const stored = localStorage.getItem('ayzek_support_v1');
      if (stored) {
        const { tickets, messages } = JSON.parse(stored);
        set({ tickets: tickets || [], messages: messages || {} });
      }
    } catch (error) {
      console.error('Support store hydration failed:', error);
    }
  },
}));

// Auto-hydrate on import
useSupportStore.getState().hydrate();
