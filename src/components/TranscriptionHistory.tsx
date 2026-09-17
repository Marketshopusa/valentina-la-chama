import React, { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import { Message } from '../types';

interface TranscriptionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (text: string) => void;
  personaName: string;
  isTyping?: boolean;
  onClearHistory?: () => void;
}

const TranscriptionHistory: React.FC<TranscriptionHistoryProps> = ({ 
  isOpen, onClose, messages, onSendMessage, personaName, isTyping, onClearHistory 
}) => {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen, isTyping]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 w-full sm:max-w-[320px] bg-black/40 backdrop-blur-xl z-[101] transition-transform duration-500 flex flex-col border-r border-white/10 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-white/5 flex items-center justify-between bg-transparent">
          <div className="flex flex-col">
            <h2 className="font-bold uppercase tracking-widest text-white/50 text-[10px] font-mono">Chat: {personaName}</h2>
            {onClearHistory && messages.length > 0 && (
              <button onClick={onClearHistory} className="text-[8px] text-red-500 font-black uppercase tracking-tighter hover:underline text-left cursor-pointer font-mono">Limpiar Memoria</button>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-lg ${m.sender === 'user' ? 'bg-red-600/80 backdrop-blur-sm text-white rounded-br-none' : 'bg-black/40 backdrop-blur-md text-white/90 rounded-bl-none border border-white/10'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-black/40 backdrop-blur-md text-white/50 p-3 rounded-2xl rounded-bl-none border border-white/10 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-white/10 p-10 text-center">
              <MessageSquare className="w-12 h-12 text-white/10 mb-4 mx-auto animate-pulse" />
              <p className="uppercase tracking-[0.3em] text-[10px] font-black font-mono">Historial de la conversación</p>
            </div>
          )}
        </div>

        <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-transparent border-t border-white/5">
          <div className="flex gap-2">
            <input 
              type="text" value={text} onChange={(e) => setText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe algo..." 
              className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 text-base sm:text-sm text-white focus:border-red-500 outline-none shadow-inner"
            />
            <button onClick={handleSend} className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all shadow-xl cursor-pointer">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TranscriptionHistory;
