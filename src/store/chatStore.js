import { create } from 'zustand';
import { chatService } from '../services/chatService.js';

const greeting = () => ({ id: 'welcome', role: 'bot', welcome: true, at: Date.now() });

/** Safety chatbot conversation. Kept in memory so it survives page changes (not reloads). */
export const useChatStore = create((set, get) => ({
  open: false,
  messages: [greeting()],
  thinking: false,

  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
  clear: () => set({ messages: [greeting()] }),

  send: async (text, language) => {
    const message = text.trim();
    if (!message || get().thinking) return;
    const userMsg = { id: `u_${Date.now()}`, role: 'user', text: message, at: Date.now() };
    set({ messages: [...get().messages, userMsg], thinking: true });
    const history = get()
      .messages.filter((m) => !m.welcome)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.role === 'user' ? m.text : m.reply?.text?.en || '' }));
    try {
      const reply = await chatService.ask({ message, history, language });
      set({ messages: [...get().messages, { id: `b_${Date.now()}`, role: 'bot', reply, source: message, at: Date.now() }] });
    } catch {
      set({ messages: [...get().messages, { id: `b_${Date.now()}`, role: 'bot', error: true, at: Date.now() }] });
    } finally {
      set({ thinking: false });
    }
  },
}));
