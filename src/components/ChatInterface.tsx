import React from 'react';
import { Send, Loader2, Mic } from 'lucide-react';
import { ChatMessage, Character } from '../types';
import { auth, db, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { getAIResponse } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  character: Character;
}

export default function ChatInterface({ character }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const chatId = [auth.currentUser?.uid, character.id].sort().join('_');

  React.useEffect(() => {
    if (!character.id) return;
    try {
      const activeChatsStr = localStorage.getItem('openlover_active_chats_v2') || '[]';
      const activeChats = JSON.parse(activeChatsStr) as string[];
      if (!activeChats.includes(character.id)) {
        activeChats.push(character.id);
        localStorage.setItem('openlover_active_chats_v2', JSON.stringify(activeChats));
      }
    } catch (e) {
      console.error('Error tracking active chat:', e);
    }
  }, [character.id]);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });

    return () => unsubscribe();
  }, [chatId]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !auth.currentUser || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 1. Save User Message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        characterId: character.id,
        userId: auth.currentUser.uid,
        text: userMsg,
        sender: 'user',
        timestamp: serverTimestamp(),
      });

      // 2. Get AI Response
      const history = messages.slice(-10).map(m => ({ text: m.text, sender: m.sender }));
      const dummyVoice = { id: 'voice_aria', name: 'Aria', description: '', mannerism: '', langCode: 'es-ES', pitch: 1.0, rate: 1.0 };
      const aiResponse = await getAIResponse(character.name, character.personality, dummyVoice, history, userMsg);

      // 3. Save AI Message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        characterId: character.id,
        userId: auth.currentUser.uid,
        text: aiResponse,
        sender: 'ai',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={character.avatarUrl} 
          className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-transparent to-[#050505]" />
      </div>

      {/* Header */}
      <div className="p-4 glass-dark flex items-center gap-4 sticky top-0 z-20">
        <img 
          src={character.avatarUrl} 
          alt={character.name} 
          className="w-12 h-12 rounded-full border-2 border-purple-500/30 object-cover"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="text-white font-bold text-lg">{character.name}</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-emerald-500 font-medium">En línea</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative z-10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.4 }}
              src={character.avatarUrl} 
              className="w-32 h-32 rounded-full mb-6 grayscale" 
              referrerPolicy="no-referrer" 
            />
            <h3 className="text-zinc-400 text-xl font-serif italic mb-3">"{character.greeting}"</h3>
            <p className="text-zinc-600 text-sm max-w-xs">Inicia tu historia con {character.name}</p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-5 py-4 rounded-3xl text-[15px] leading-relaxed shadow-2xl",
                msg.sender === 'user' 
                  ? "bg-purple-600 text-white rounded-tr-none" 
                  : "glass-dark text-zinc-100 rounded-tl-none"
              )}>
                <div className="markdown-body">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
              <span className="text-[10px] text-zinc-500 mt-2 px-2 font-mono uppercase tracking-widest">
                {(() => {
                  if (!msg.timestamp) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  if (typeof msg.timestamp.toDate === 'function') {
                    return msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                })()}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-purple-400 text-xs font-medium ml-2 glass-dark px-4 py-2 rounded-full w-fit"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            {character.name} está escribiendo...
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 relative z-20">
        <form onSubmit={handleSend} className="relative flex items-center gap-3 max-w-5xl mx-auto">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Escribe un mensaje a ${character.name}...`}
              className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl px-8 py-5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all pr-14 shadow-2xl"
            />
            <button 
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-purple-400 transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-5 rounded-full bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-purple-500/40"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
