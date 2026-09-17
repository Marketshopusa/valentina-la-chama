import React from 'react';
import { Settings, Phone, Trash2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Persona } from '../types';

interface LandingCardProps {
  persona: Persona;
  image: string;
  onConnect: () => void;
  onEdit: () => void;
  isLoading: boolean;
  error: boolean;
  errorMessage?: string | null;
  isReconnecting?: boolean;
}

const LandingCard: React.FC<LandingCardProps> = ({ persona, image, onConnect, onEdit, isLoading, error, errorMessage, isReconnecting }) => {
  const displayImage = image || persona?.defaultImage || 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=1500';
  const isVideo = typeof displayImage === 'string' && (displayImage.startsWith('data:video') || displayImage.includes('video/') || displayImage.includes('.mp4') || displayImage.includes('.webm'));

  return (
    <div className="absolute inset-0 bg-zinc-900 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-zinc-950 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none animate-pulse" />
      </div>

      <div className="absolute inset-0 z-0">
        {isVideo ? (
          <video key={displayImage} src={displayImage} autoPlay loop muted playsInline className="w-full h-full object-cover brightness-110 contrast-105" />
        ) : (
          <img key={displayImage} src={displayImage} className="w-full h-full object-cover brightness-110 contrast-105" alt={persona?.name || 'Valentina'} referrerPolicy="no-referrer" />
        )}
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      </div>

      <div className="absolute top-10 left-8 right-8 z-10 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[12px] font-black italic text-pink-500 tracking-[0.2em] drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">
            {persona?.id === 'caraquena' ? 'VALENTINA-AI' : 'FRIEND-CARD-AI'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">VE</span>
          <span className="text-[14px] font-black text-white uppercase tracking-tighter drop-shadow-md">{persona?.name || 'VALENTINA'}</span>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 z-20 px-8 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={onEdit}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white/80 active:scale-90 transition-all cursor-pointer"
          >
            <Settings className="w-5 h-5 text-white/80" />
          </button>

          <button 
            onClick={onConnect} 
            disabled={isLoading}
            className="flex-1 h-16 bg-gradient-to-r from-[#d92a8b] to-[#8e2de2] rounded-[30px] flex items-center justify-center gap-3 shadow-2xl shadow-pink-900/30 active:scale-95 transition-all group cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                {isReconnecting && <span className="text-white font-black text-[10px] uppercase tracking-widest">Reconectando...</span>}
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 text-white" />
                <span className="text-white font-black text-[11px] uppercase tracking-[0.2em]">Entrar en Vivo</span>
              </>
            )}
          </button>

          <button 
            onClick={async () => {
              if (confirm("¿Estás seguro de que quieres resetear la aplicación? Se borrará el historial local, configuración y caché.")) {
                try {
                  localStorage.clear();
                } catch (e) {
                  console.warn("localStorage clear call blocked:", e);
                }
                try {
                  if (window.indexedDB) {
                    indexedDB.deleteDatabase('valentina-db');
                    indexedDB.deleteDatabase('ValentinaMediaDB');
                  }
                } catch (e) {
                  console.warn("indexedDB delete call blocked:", e);
                }
                try {
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) await reg.unregister();
                  }
                } catch (e) {
                  console.warn("ServiceWorker unregister call blocked:", e);
                }
                try {
                  if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    for (const name of cacheNames) await caches.delete(name);
                  }
                } catch (e) {
                  console.warn("Caches deletion blocked:", e);
                }
                window.location.reload();
              }
            }}
            className="w-14 h-14 rounded-full bg-red-900/20 border border-red-500/30 backdrop-blur-xl flex items-center justify-center text-red-500/80 active:scale-90 transition-all cursor-pointer"
            title="Reset App"
          >
            <Trash2 className="w-5 h-5 text-red-500/85" />
          </button>

          <button 
            onClick={() => window.location.reload()}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white/80 active:scale-90 transition-all cursor-pointer"
            title="Reload"
          >
            <RefreshCw className="w-5 h-5 text-white/8" />
          </button>
        </div>
      </div>

      {error && (
        <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 text-center z-30 space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-red-600/90 backdrop-blur-md p-6 rounded-[30px] shadow-2xl border border-red-500/50">
            <AlertCircle className="w-8 h-8 text-white mx-auto mb-3 animate-bounce" />
            <p className="text-white font-black text-[11px] uppercase tracking-[0.2em] mb-2">Error de Conexión</p>
            <p className="text-white/80 text-[10px] leading-relaxed uppercase tracking-widest">
              {errorMessage || "El servicio no responde. Por favor, intenta de nuevo en unos momentos."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingCard;
