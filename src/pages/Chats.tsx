import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, getDocs, onSnapshot, query, where, doc, getDoc, orderBy, limit, handleFirestoreError, OperationType } from '../firebase';
import { Character, ChatMessage } from '../types';
import { auth } from '../firebase';
import { MessageSquare, Calendar, ChevronRight, MessageCircle, Heart, Flame, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ChatSession {
  character: Character;
  lastMessage?: ChatMessage;
  unread?: boolean;
}

export default function Chats() {
  const navigate = useNavigate();
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState<Character[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchChats = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Read active chat character IDs from localStorage
        const activeIdsStr = localStorage.getItem('openlover_active_chats_v2') || '[]';
        const activeIds = JSON.parse(activeIdsStr) as string[];

        // Also fetch all characters for name/avatar lookup
        const charQuery = query(collection(db, 'characters'));
        const charSnap = await getDocs(charQuery);
        const allChars = charSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));

        if (activeIds.length === 0) {
          if (isMounted) {
            setSuggestions(allChars.slice(0, 3));
            setLoading(false);
          }
          return;
        }

        const activeChars = allChars.filter(c => activeIds.includes(c.id));
        const sessionList: ChatSession[] = [];

        // For each character with an active session, fetch the last message
        for (const char of activeChars) {
          const currentUid = auth.currentUser?.uid;
          if (!currentUid) break;
          const chatId = [currentUid, char.id].sort().join('_');
          const lastMsgQuery = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(1)
          );

          const lastMsgSnap = await getDocs(lastMsgQuery);
          let lastMessage: ChatMessage | undefined;
          if (!lastMsgSnap.empty) {
            const firstDoc = lastMsgSnap.docs[0];
            lastMessage = { id: firstDoc.id, ...firstDoc.data() } as ChatMessage;
          }

          sessionList.push({
            character: char,
            lastMessage,
            unread: false
          });
        }

        // Sort by last message timestamp (most recent first)
        sessionList.sort((a, b) => {
          const timeA = a.lastMessage?.timestamp?.toDate?.()?.getTime() || 0;
          const timeB = b.lastMessage?.timestamp?.toDate?.()?.getTime() || 0;
          return timeB - timeA;
        });

        if (isMounted) {
          setSessions(sessionList);
          setSuggestions(allChars.filter(c => !activeIds.includes(c.id)).slice(0, 3));
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading chat list:', error);
        if (isMounted) setLoading(false);
      }
    };

    fetchChats();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium">Buscando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-12 pt-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-purple-600/10 rounded-2xl border border-purple-500/20 text-purple-400">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white font-serif">Mis Conversaciones</h1>
            <p className="text-zinc-400 mt-1">Sigue explorando historias y fantasías íntimas.</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-12 rounded-[2rem] text-center border border-white/5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-400 border border-purple-500/30">
                <MessageCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white">No hay chats activos todavía</h2>
              <p className="text-zinc-400 max-w-md mx-auto mb-8 text-base">
                ¿Aún no has dado el primer paso? Descubre la personalidad ideal que te está esperando y comienza una emocionante charla.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-600/30 active:scale-95"
              >
                Conocer Compañeros
              </button>
            </motion.div>

            {suggestions.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-100 px-2 font-serif italic">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Te recomendamos iniciar con
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {suggestions.map((char) => (
                    <div 
                      key={char.id}
                      onClick={() => navigate(`/chat/${char.id}`)}
                      className="glass hover:bg-white/5 border border-white/5 rounded-3xl p-5 cursor-pointer flex flex-col items-center text-center group transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <img 
                        src={char.avatarUrl} 
                        alt={char.name}
                        className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all shadow-lg"
                        referrerPolicy="no-referrer"
                      />
                      <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{char.name}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1 h-8 leading-normal">{char.description}</p>
                      <span className="text-[11px] font-bold text-purple-400 mt-4 uppercase tracking-widest bg-purple-500/10 px-4 py-1.5 rounded-full flex items-center gap-1">
                        Chatear
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <motion.div
                key={session.character.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/chat/${session.character.id}`)}
                className="glass-dark hover:bg-white/5 border border-white/5 hover:border-purple-500/20 p-5 rounded-[2rem] flex items-center gap-5 cursor-pointer transition-all duration-300 group shadow-lg"
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={session.character.avatarUrl} 
                    alt={session.character.name} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#050505] rounded-full shadow-lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                      {session.character.name}
                    </h3>
                    {session.lastMessage?.timestamp && (
                      <span className="text-xs text-zinc-500 font-mono">
                        {(() => {
                          const date = typeof session.lastMessage.timestamp.toDate === 'function' 
                            ? session.lastMessage.timestamp.toDate() 
                            : new Date();
                          return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        })()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 truncate pr-4">
                    {session.lastMessage ? (
                      <span className={cn(session.lastMessage.sender === 'user' ? 'text-zinc-500' : 'text-zinc-300')}>
                        {session.lastMessage.sender === 'user' ? 'Tú: ' : ''}{session.lastMessage.text}
                      </span>
                    ) : (
                      <span className="italic text-purple-400/70 font-semibold">{session.character.greeting}</span>
                    )}
                  </p>
                </div>

                <div className="flex-shrink-0 text-zinc-600 group-hover:text-purple-400 transition-colors px-2">
                  <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
