import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Mic, MicOff, PhoneOff, AlertTriangle, Radio } from 'lucide-react';
import { Persona, ConnectionStatus } from '../types';

interface CharacterViewProps {
  name: string;
  persona: Persona;
  image: string;
  isSpeaking: boolean;
  isMuted: boolean;
  micLevel: number;
  onToggleMute: () => void;
  onHangUp: () => void;
  onOpenChat: () => void;
  onRetry?: () => void;
  status: ConnectionStatus;
}

const CharacterView: React.FC<CharacterViewProps> = ({ 
  name, persona, image, isSpeaking, isMuted, micLevel, onToggleMute, onHangUp, onOpenChat, status, onRetry 
}) => {
  const [timer, setTimer] = useState(0);
  const [hasError, setHasError] = useState(false);
  const isOverlayVisible = status === ConnectionStatus.CONNECTING || status === ConnectionStatus.RECONNECTING || status === ConnectionStatus.ERROR || status === ConnectionStatus.RESETTING;

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHasError(false);
  }, [image]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  const currentImage = (hasError ? persona?.defaultImage : image) || persona?.defaultImage || 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=1500';
  const isVideo = typeof currentImage === 'string' && (currentImage.startsWith('data:video') || currentImage.includes('video/') || currentImage.includes('.mp4') || currentImage.includes('.webm'));

  return (
    <div className="absolute inset-0 bg-zinc-950 overflow-hidden">
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isOverlayVisible ? 'opacity-75' : 'opacity-100'}`}>
        {isVideo ? (
          <video 
            key={currentImage} src={currentImage} autoPlay loop muted playsInline 
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover brightness-110 transition-transform duration-[4000ms] ${isSpeaking ? 'scale-110' : 'scale-100'}`}
          />
        ) : (
          <img 
            key={currentImage} src={currentImage} alt={name}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover brightness-110 transition-transform duration-[4000ms] ${isSpeaking ? 'scale-110' : 'scale-100'}`} 
          />
        )}
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-full flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            <span className="text-[12px] font-black uppercase tracking-tighter text-white">{name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onHangUp}
              className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Salir de Emergencia"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <span className="text-[12px] font-mono text-white/70">{formatTime(timer)}</span>
            </div>
          </div>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
          <button 
            onClick={onOpenChat} 
            className="w-14 h-14 rounded-full flex items-center justify-center border border-white/10 bg-black/20 text-white/70 backdrop-blur-xl active:scale-90 transition-all hover:bg-white/10 cursor-pointer"
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button 
            onClick={onToggleMute} 
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${isMuted ? 'bg-red-600/40 border-red-500 text-red-500 shadow-lg shadow-red-900/20' : 'bg-black/20 border-white/10 text-white/70 backdrop-blur-xl hover:bg-white/10'}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button 
            onClick={onHangUp} 
            className="w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-900/40 active:scale-95 transition-all cursor-pointer"
            title="Hang Up"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex flex-col gap-8 pointer-events-auto">
          <div className="flex justify-center items-end h-10 gap-1.5 px-10 mb-4 opacity-70">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 rounded-full transition-all duration-150 ${isSpeaking ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]' : 'bg-white/40'}`} 
                style={{ 
                  height: isSpeaking 
                    ? `${40 + Math.random() * 60}%` 
                    : `${8 + Math.min(92, (micLevel * (0.5 + Math.random())))}%`
                }} 
              />
            ))}
          </div>
        </div>
      </div>

      {isOverlayVisible && (
        <div className="absolute inset-0 bg-zinc-950/65 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-10 text-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
            {status === ConnectionStatus.ERROR ? (
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse mx-auto" />
            ) : (
              <Radio className="w-12 h-12 text-pink-500 animate-pulse mx-auto" />
            )}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black animate-ping ${status === ConnectionStatus.ERROR ? 'bg-red-600' : 'bg-pink-500'}`} />
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-black uppercase tracking-[0.3em] text-sm">
              {status === ConnectionStatus.ERROR ? 'Señal Interrumpida' : 
               status === ConnectionStatus.RESETTING ? 'Reiniciando...' : 'Conectando...'}
            </h3>
            <p className="text-white/40 text-[10px] uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
              {status === ConnectionStatus.ERROR 
                ? 'La conexión en vivo se ha perdido. Puedes intentar reconectar o usar el chat.' 
                : status === ConnectionStatus.RECONNECTING
                ? 'Señal Intermitente. Intentando recuperar la conexión...'
                : status === ConnectionStatus.RESETTING
                ? 'Limpiando memoria e historial para una nueva experiencia.'
                : 'Estableciendo conexión segura con Valentina. Por favor, espera...'}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            {status === ConnectionStatus.ERROR && (
              <div className="w-full space-y-2 pointer-events-auto">
                <button 
                  onClick={onRetry}
                  className="w-full py-4 bg-red-600/20 border border-red-500/40 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                >
                  Reintentar Llamada
                </button>
              </div>
            )}
            <button 
              onClick={onOpenChat}
              className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
            >
              Abrir Chat
            </button>
            <button 
              onClick={onHangUp}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterView;
