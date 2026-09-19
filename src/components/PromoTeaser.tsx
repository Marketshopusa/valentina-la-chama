import React from 'react';
import { Phone, Flame, Globe, LogIn } from 'lucide-react';

interface PromoTeaserProps {
  /** Primary CTA — must open Google auth (no guest bypass). */
  onEnter: () => void;
  onGoogleLogin?: () => void;
  onOpenAuthModal?: () => void;
  personaName?: string;
  personaImage?: string;
  /** True when a real Google account is already signed in. */
  isAuthenticated?: boolean;
}

const PromoTeaser: React.FC<PromoTeaserProps> = ({ 
  onEnter, 
  onGoogleLogin,
  onOpenAuthModal,
  isAuthenticated = false,
  personaName = 'Tu Persona Ideal', 
  personaImage = 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=1500' 
}) => {
  return (
    <div className="absolute inset-0 bg-zinc-950 flex flex-col justify-between p-6 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-pink-600/20 blur-[80px]" />
        <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-purple-600/25 blur-[100px]" />
        <img 
          src={personaImage} 
          className="absolute inset-0 w-full h-full object-cover opacity-60 brightness-[0.7] contrast-105 select-none pointer-events-none" 
          alt={personaName}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/20" />
      </div>

      <div className="relative z-10 flex justify-between items-center pt-4">
        <span className="bg-red-600/80 border border-red-500/30 text-[10px] font-black uppercase tracking-[0.2em] text-white px-3 py-1 rounded-full backdrop-blur-md shadow-[0_0_12px_rgba(220,38,38,0.4)]">
          🔥 Publicidad Interactiva
        </span>
        <span className="text-white/40 font-black text-xs tracking-widest uppercase">
          V1.8 LIVE
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center mt-auto mb-6">
        <h1 className="font-serif text-5xl italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)] select-none">
          Tu Persona Ideal
        </h1>
        <p className="text-pink-500 text-[11px] uppercase font-black tracking-[0.28em] mt-2 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]">
          Crea tu historia, tu aventura y tu persona ideal
        </p>

        <p className="text-zinc-300 text-sm mt-4 max-w-[280px] leading-relaxed drop-shadow-sm font-medium">
          Chatea por texto o <span className="text-white font-extrabold underline decoration-pink-500">llama en tiempo real</span> con la primera IA de rol libre con acento 100% regional.
        </p>

        <div className="mt-6 flex flex-col gap-2 w-full max-w-[320px]">
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] backdrop-blur-md px-4 py-3 rounded-2xl text-left hover:bg-white/[0.07] transition-all">
            <div className="w-8 h-8 rounded-xl bg-pink-600/20 text-pink-500 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
              <Phone className="w-4 h-4 text-pink-500" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-pink-400">Llamadas en Vivo</p>
              <p className="text-[10px] text-zinc-400 leading-tight">Voz de baja latencia con inflexión humana.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] backdrop-blur-md px-4 py-3 rounded-2xl text-left hover:bg-white/[0.07] transition-all">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
              <Flame className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-purple-400">Rol Libre Inmersivo</p>
              <p className="text-[10px] text-zinc-400 leading-tight">Personalidad reactiva y libre sin filtros molestos.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] backdrop-blur-md px-4 py-3 rounded-2xl text-left hover:bg-white/[0.07] transition-all">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
              <Globe className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-red-400">Jerga y Sabor local</p>
              <p className="text-[10px] text-zinc-400 leading-tight">Habla de tú a tú con expresiones auténticas.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full mb-4">
        <button 
          onClick={() => {
            if (isAuthenticated) {
              onEnter();
              return;
            }
            if (onGoogleLogin) onGoogleLogin();
            else if (onOpenAuthModal) onOpenAuthModal();
            else onEnter();
          }}
          className="relative w-full py-4 bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs text-white shadow-[0_0_25px_rgba(219,39,119,0.45)] transition-all transform active:scale-95 flex items-center justify-center gap-3 select-none cursor-pointer group"
        >
          {isAuthenticated ? (
            <>
              <span>Entrar a la Tarjeta</span>
              <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-4 h-4 bg-white rounded-full p-0.5" alt="" />
              <span>Entrar con Google</span>
            </>
          )}
        </button>

        {!isAuthenticated && (
          <p className="mt-3 text-center text-[10px] text-white/35 uppercase tracking-widest">
            Debes registrarte o iniciar sesión con Google para continuar
          </p>
        )}
      </div>
    </div>
  );
};

export default PromoTeaser;
