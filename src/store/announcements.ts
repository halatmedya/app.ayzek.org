import { create } from 'zustand';

// Types
export interface UserInfo { id: string; name: string; avatar?: string; }
export interface BaseItem { id: string; user: UserInfo; createdAt: number; }
export interface AnnouncementPost extends BaseItem { type: 'post'; text: string; image?: string; }
export interface PollOption { id: string; text: string; votes: number; voters: string[]; }
export interface AnnouncementPoll extends BaseItem { type: 'poll'; question: string; options: PollOption[]; multiSelect: boolean; myVotes: string[]; }
export type AnnouncementItem = AnnouncementPost | AnnouncementPoll;
export interface CommentItem extends BaseItem { parentId: string; text: string; }

interface AnnouncementState {
  items: AnnouncementItem[];
  comments: Record<string, CommentItem[]>; // parentId -> comments
  addPost: (data: { text: string; image?: string; user: UserInfo; }) => void;
  addPoll: (data: { question: string; options: string[]; multiSelect: boolean; user: UserInfo; }) => void;
  votePoll: (pollId: string, optionId: string, userId: string) => void;
  addComment: (parentId: string, text: string, user: UserInfo) => void;
  changeVote: (pollId: string, optionId: string, userId: string) => void; // alias of vote for clarity
  hydrate: () => void;
}

const STORAGE_KEY = 'ayzek_announcements_v1';

function loadInitial(): Pick<AnnouncementState, 'items' | 'comments'> {
  try { const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); } catch(_){}
  return { items: [], comments: {} };
}

function persist(state: Pick<AnnouncementState, 'items' | 'comments'>){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(_){ }
}

export const useAnnouncementsStore = create<AnnouncementState>((set,get)=>{
  const init = loadInitial();
  return {
    items: init.items,
    comments: init.comments,
    hydrate: ()=> set(loadInitial()),
    addPost: ({text,image,user}) => set(state => {
      const item: AnnouncementPost = { id: crypto.randomUUID(), type:'post', text, image, user, createdAt: Date.now() };
      const items = [item, ...state.items];
      persist({items, comments: state.comments});
      return { items };
    }),
    addPoll: ({question, options, multiSelect, user}) => set(state => {
      const poll: AnnouncementPoll = { id: crypto.randomUUID(), type:'poll', question, options: options.filter(o=>o.trim()).map(o=> ({id: crypto.randomUUID(), text:o.trim(), votes:0, voters:[]})), multiSelect, user, createdAt: Date.now(), myVotes: [] };
      const items = [poll, ...state.items];
      persist({items, comments: state.comments});
      return { items };
    }),
    votePoll: (pollId, optionId, userId) => set(state => {
      const items = state.items.map(it => {
        if(it.type==='poll' && it.id===pollId){
          let myVotes = [...it.myVotes];
          const already = myVotes.includes(optionId);
          if(it.multiSelect){
            // toggle
            myVotes = already ? myVotes.filter(v=> v!==optionId) : [...myVotes, optionId];
          } else {
            myVotes = [optionId];
          }
          const options = it.options.map(op => {
            let voters = op.voters.filter(v=> v!==userId); // remove previous to recount
            if(myVotes.includes(op.id)){ if(!voters.includes(userId)) voters = [...voters, userId]; }
            return { ...op, voters, votes: voters.length };
          });
          return { ...it, options, myVotes } as AnnouncementPoll;
        }
        return it;
      });
      persist({items, comments: state.comments});
      return { items };
    }),
    changeVote: (pollId, optionId, userId) => get().votePoll(pollId, optionId, userId),
    addComment: (parentId, text, user) => set(state => {
      const c: CommentItem = { id: crypto.randomUUID(), parentId, text, user, createdAt: Date.now() };
      const existing = state.comments[parentId] || [];
      const comments = { ...state.comments, [parentId]: [...existing, c] };
      persist({items: state.items, comments});
      return { comments };
    })
  };
});
