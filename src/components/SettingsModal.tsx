import React, { useRef, useState, useEffect } from 'react';
import { X, Key, Upload, Trash, XCircle, Sparkles, Volume2, Square, Play, Flame, User, Users } from 'lucide-react';
import { Persona } from '../types';
import { LISTA_VOCES } from '../utils/voices';
import { playVoice, stopAllSpeech } from '../utils/speechPlayer';
import { 
  triggerContextualSound, 
  getIAACVolume, 
  setIAACVolume, 
  isIAACMuted, 
  setIAACMuted 
} from '../services/iaacAudioEngine';

interface SettingsModalProps {
  onClose: () => void;
  currentPersona: Persona;
  onUpdateSettings: (p: Persona) => void;
  onImageUpload: (img: string | null) => void;
  personas: Persona[];
  currentCustomImage: string | null;
  onClearHistory: () => void;
  userEmail?: string;
  onLogout?: () => void;
  onLogin?: () => void;
  onOpenAuthModal?: () => void;
  onForceSync?: () => void;
  onPushLocalStateToServer?: () => void;
  onExportBackupJson?: () => void;
  onImportBackupJson?: (data: any) => Promise<boolean> | boolean;
  customApiKey: string;
  onApiKeyChange: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, currentPersona, onUpdateSettings, onImageUpload, personas, currentCustomImage, onClearHistory, userEmail, onLogout, customApiKey, onApiKeyChange 
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentCustomImage);
  const [instr, setInstr] = useState(currentPersona.instruction);
  const [name, setName] = useState(currentPersona.name);
  const [desc, setDesc] = useState(currentPersona.description);
  const [selectedVoice, setSelectedVoice] = useState<Persona['voice']>(currentPersona.voice || 'Scarlett_HD');
  const [selectedNarratorVoice, setSelectedNarratorVoice] = useState<string>(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('op_card_narrator_voice_id')) || 'Narradora_Intensa';
  });
  const [selectedGuestVoice, setSelectedGuestVoice] = useState<string>(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('op_card_guest_voice_id')) || 'Invitada_Coqueta';
  });
  const [settingsVoiceTab, setSettingsVoiceTab] = useState<'character' | 'narrator' | 'guest'>('character');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(currentPersona.id);
  const [isCustom, setIsCustom] = useState<boolean>(currentPersona.isCustom || false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [iaacVol, setIaacVolState] = useState<number>(() => Math.round(getIAACVolume() * 100));
  const [iaacMuted, setIaacMutedState] = useState<boolean>(() => isIAACMuted());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Sync state if currentPersona changes (e.g. from selecting a different base character)
  useEffect(() => {
    setSelectedPersonaId(currentPersona.id);
    setInstr(currentPersona.instruction);
    setName(currentPersona.name);
    setDesc(currentPersona.description);
    setSelectedVoice(currentPersona.voice);
    setIsCustom(currentPersona.isCustom || false);
  }, [currentPersona]);

  // Clean speech synthesis and audio context on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (e) {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const handlePlayPreview = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation(); // Avoid triggering card selection when clicking preview button
    
    // Stop any ongoing speech synthesis or audio contexts
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) {}
      activeSourceRef.current = null;
    }

    if (playingPreviewId === voiceId) {
      setPlayingPreviewId(null);
      return;
    }

    setPlayingPreviewId(voiceId);

    // Prepare custom test text based on style
    let sampleText = "Hola cariño, así de hermosa suena mi voz.";
    if (voiceId === 'Narradora_Intensa') {
      sampleText = "Se acerca a ti con una mirada penetrante y susurra lentamente mientras roza tu cuello, haciendo que tu piel se estremezca...";
    } else if (voiceId === 'Narradora_Misterio') {
      sampleText = "Escúchame en la oscuridad... cada caricia y cada respiración se quedan suspendidas en el aire...";
    } else if (voiceId === 'Narradora_Elegante') {
      sampleText = "La noche caía sobre la ciudad mientras una tensión incontrolable envolvía cada rincón de la habitación.";
    } else if (voiceId === 'Invitada_Coqueta') {
      sampleText = "¿Qué están haciendo ustedes dos aquí tan juntitos? No me digan que empezaron sin mí...";
    } else if (voiceId === 'Invitado_Varonil') {
      sampleText = "Buenas noches. Espero no estar interrumpiendo nada importante por aquí.";
    } else if (voiceId === 'Scarlett_HD') {
      sampleText = "Hola amor... así se escucha mi voz Scarlett HD, suave, envolvente y apasionada para ti.";
    } else if (voiceId === 'Luna_Sweet') {
      sampleText = "¡Hola corazón! Así suena mi voz Luna Sweet, dulce, pícara y juguetona.";
    } else if (voiceId === 'Aria_Calm') {
      sampleText = "Hola. Te habla Aria Calm, con una modulación serena, elegante, pausada y reconfortante.";
    } else if (voiceId === 'Voz_Juvenil') {
      sampleText = "¡Hola hola! Qué alegría saludarte, mira lo alegre y fresca que se escucha mi voz juvenil.";
    } else if (voiceId === 'Voz_Sensual') {
      sampleText = "Hola cariño... así suena mi voz... cálida, profunda y muy íntima para nosotros.";
    } else if (voiceId === 'Voz_Dulce') {
      sampleText = "Hola mi amor, qué lindo poder hablar contigo... ¿viste lo dulce y tierna que es mi voz?";
    } else if (voiceId === 'Voz_Pausada') {
      sampleText = "Hola... un gusto saludarte. Me encanta hablar con esta cadencia tranquila y sofisticada.";
    } else if (voiceId === 'Voz_Seductora') {
      sampleText = "Hola cielo... ¿te gusta mi estilo de voz atrevido y coqueto? Seguro te va a encantar.";
    } else if (voiceId === 'Voz_Susurrante') {
      sampleText = "Hola... acércate un poco más... así puedo hablarte en secreto al oído con mi voz susurrada.";
    } else if (voiceId === 'Voz_Sofisticada') {
      sampleText = "Hola, es un auténtico placer. Esta es mi modulación elegante, culta y distinguida.";
    } else if (voiceId === 'Voz_Apasionada') {
      sampleText = "Hola amor de mi vida... así suena mi voz... con toda la entrega emocional de mi ser.";
    } else if (voiceId === 'Voz_Caribena') {
      sampleText = "¡Epale mi corazón! Mira esta vibra tropical con tanta calidez, con la sonrisa en la boca al hablar.";
    } else if (voiceId === 'Voz_Angelical') {
      sampleText = "Hola mi cielo... así de reconfortante, pura y suave es mi tonada angelical para ti.";
    } else if (voiceId === 'Voz_Picaresca') {
      sampleText = "¡Hola! Jeje... ¿a que no te esperabas que tuviera esta linda voz sumamente traviesa?";
    } else if (voiceId === 'Voz_Melodica') {
      sampleText = "Hola... respira hondo conmigo. Disfruta de esta melodía de paz y absoluta calma.";
    }

    // 1. Prioritize robust, high-fidelity Gemini TTS audio playback
    try {
      await playVoice({
        text: sampleText,
        voiceId,
        onStart: () => setPlayingPreviewId(voiceId),
        onEnd: () => setPlayingPreviewId(null),
        onError: () => setPlayingPreviewId(null)
      });
    } catch (err) {
      console.warn("Audio preview failed:", err);
      setPlayingPreviewId(null);
    }
  };

  const handleGenerateStoryFromMedia = async () => {
    if (!preview) return;
    setIsGeneratingStory(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mediaData: preview })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo interpretar el archivo multimedia. Inténtalo de nuevo.");
      }
      const data = await response.json();
      if (data.story) {
        setInstr(data.story);
      } else {
        throw new Error("No se pudo generar la historia.");
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Error al conectar con la IA.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  useEffect(() => {
    setPreview(currentCustomImage);
  }, [currentCustomImage]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 50 * 1024 * 1024) {
        alert("Archivo muy pesado. Máximo 50MB.");
        return;
      }
      const r = new FileReader();
      r.onloadend = () => {
        const result = r.result as string;
        setPreview(result);
        onImageUpload(result);
      };
      r.readAsDataURL(f);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('op_card_voice_id', selectedVoice);
      localStorage.setItem('op_card_narrator_voice_id', selectedNarratorVoice);
      localStorage.setItem('op_card_guest_voice_id', selectedGuestVoice);
    } catch (e) {}

    onUpdateSettings({
      id: selectedPersonaId,
      name,
      description: desc,
      instruction: instr,
      voice: selectedVoice,
      isCustom: isCustom,
      defaultImage: personas.find(p => p.id === selectedPersonaId)?.defaultImage || ''
    });
    onClose();
  };

  const resetInstruction = () => {
    const defaultPersona = personas.find(p => p.id === selectedPersonaId);
    if (defaultPersona) {
      setInstr(defaultPersona.instruction);
      setName(defaultPersona.name);
      setDesc(defaultPersona.description);
      setSelectedVoice(defaultPersona.voice);
      setIsCustom(false);
    }
  };

  const handleResetAll = () => {
    onClearHistory();
    onImageUpload(null);
    setPreview(null);
    const defaultPersona = personas.find(p => p.id === selectedPersonaId);
    if (defaultPersona) {
      onUpdateSettings(defaultPersona);
    }
    window.location.reload();
  };

  const isVideo = preview?.startsWith('data:video') || preview?.includes('video/') || preview?.toLowerCase().endsWith('.mp4') || preview?.toLowerCase().endsWith('.webm');

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border-t sm:border border-white/10 w-full sm:max-w-lg rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[90dvh] pb-10">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div className="flex flex-col">
            <h2 className="font-serif text-2xl italic uppercase text-red-600 tracking-tighter">Personalizar IA</h2>
            <span className="text-[10px] text-white/20 font-black tracking-widest uppercase">Modo Editor de Rol</span>
          </div>
          <div className="flex items-center gap-3">
            {userEmail && (
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Cuenta Activa</span>
                <span className="text-[10px] text-white/60 font-bold">{userEmail}</span>
              </div>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {userEmail && (
          <div className="sm:hidden flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Sincronizando con</span>
              <span className="text-[10px] text-white/60 font-bold">{userEmail}</span>
            </div>
            <button 
              onClick={onLogout}
              className="px-3 py-1 bg-red-600/10 text-red-500 text-[10px] font-black uppercase rounded-lg border border-red-600/20 cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        <section className="space-y-4 p-4 bg-red-600/5 border border-red-600/10 rounded-3xl">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-red-500 uppercase tracking-widest block font-mono">Llave API Personal (Opcional)</label>
            <Key className="w-4 h-4 text-red-500/40" />
          </div>
          <p className="text-[9px] text-white/40 leading-relaxed font-mono">Si los créditos gratuitos se agotan, pega aquí tu propia API Key de Google AI Studio para seguir usando la voz.</p>
          <div className="relative">
            <input 
              type="password"
              value={customApiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-red-600/50 outline-none"
              placeholder="Pega tu llave aquí..."
            />
            {customApiKey && (
              <button 
                onClick={() => onApiKeyChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* Sistema de Expresiones, Gemidos y Sonidos Físicos (IAAC) */}
        <section className="space-y-4 p-4 bg-pink-600/5 border border-pink-500/20 rounded-3xl">
          <div className="flex justify-between items-start gap-3">
            <div>
              <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest block font-mono">
                Expresiones, Gemidos y Efectos Físicos (IAAC)
              </label>
              <p className="text-[9px] text-white/50 font-mono mt-0.5 leading-relaxed">
                Efectos foley y vocalizaciones automáticas generadas durante momentos íntimos, caricias y acciones físicas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextMuted = !iaacMuted;
                setIaacMutedState(nextMuted);
                setIAACMuted(nextMuted);
              }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer shrink-0 ${
                !iaacMuted 
                  ? 'bg-pink-600/20 text-pink-300 border border-pink-500/40 shadow-sm shadow-pink-500/10' 
                  : 'bg-white/5 text-white/30 border border-white/10'
              }`}
            >
              {!iaacMuted ? '🔊 ACTIVADOS' : '🔇 SILENCIADOS'}
            </button>
          </div>

          <div className="space-y-1.5 bg-black/30 p-3 rounded-2xl border border-white/5">
            <div className="flex justify-between text-[10px] text-white/60 font-mono">
              <span>Volumen de Gemidos y Sonidos Físicos</span>
              <span className="text-pink-400 font-bold">{iaacVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={iaacVol}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setIaacVolState(v);
                setIAACVolume(v / 100);
              }}
              className="w-full accent-pink-500 bg-white/10 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          <div>
            <span className="text-[9px] text-white/40 uppercase tracking-widest block font-mono mb-2">Probar Efectos Inmediatos:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => triggerContextualSound('gemidos_suspiros', 8)}
                className="px-3 py-2.5 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 rounded-2xl text-[10px] text-pink-200 font-semibold transition-all text-left flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="text-sm">💋</span>
                <span>Gemido de Placer</span>
              </button>
              <button
                type="button"
                onClick={() => triggerContextualSound('body_slap_spank', 9)}
                className="px-3 py-2.5 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 rounded-2xl text-[10px] text-pink-200 font-semibold transition-all text-left flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="text-sm">👋</span>
                <span>Nalgada / Azote</span>
              </button>
              <button
                type="button"
                onClick={() => triggerContextualSound('intimate_mouth_interaction', 8)}
                className="px-3 py-2.5 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 rounded-2xl text-[10px] text-pink-200 font-semibold transition-all text-left flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="text-sm">👅</span>
                <span>Beso y Succión</span>
              </button>
              <button
                type="button"
                onClick={() => triggerContextualSound('heavy_panting_breath', 8)}
                className="px-3 py-2.5 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 rounded-2xl text-[10px] text-pink-200 font-semibold transition-all text-left flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="text-sm">💨</span>
                <span>Jadeo Agitado</span>
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block font-mono">Fondo Visual (Imagen/Video)</label>
          <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/5 relative flex items-center justify-center shadow-inner group">
            {preview ? (
              isVideo ? <video key={preview} src={preview} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img key={preview} src={preview} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="text-white/10 text-center uppercase tracking-widest text-[10px] font-black">Fondo Predeterminado</div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex-1 h-14 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all cursor-pointer" id="change-file-btn">
              <Upload className="w-4 h-4" /> Cambiar Archivo
            </button>
            <button onClick={() => { setPreview(null); onImageUpload(null); }} className="w-14 h-14 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-600/20 transition-all cursor-pointer" id="delete-file-btn">
              <Trash className="w-4 h-4" />
            </button>
          </div>

          {preview && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button 
                type="button"
                onClick={handleGenerateStoryFromMedia}
                disabled={isGeneratingStory}
                className={`w-full h-14 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-950/20 ${isGeneratingStory ? 'opacity-50 cursor-not-allowed' : ''}`}
                id="generate-history-ai-btn"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingStory ? 'animate-spin text-amber-300' : ''}`} />
                {isGeneratingStory ? 'Analizando Media y Creando Historia...' : '🪄 Generar Historia de la Img/Vid (IA)'}
              </button>
              {generationError && (
                <p className="text-[10px] font-mono text-red-400 bg-red-950/20 border border-red-900/50 p-3 rounded-xl leading-relaxed" id="generation-error-msg">
                  ⚠️ {generationError}
                </p>
              )}
            </div>
          )}

          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,video/*" />
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block font-mono">Identidad del Personaje</label>
            <button onClick={resetInstruction} className="text-[8px] font-black text-red-600 uppercase tracking-widest hover:underline cursor-pointer font-mono">Restablecer Todo</button>
          </div>
          <div className="space-y-3">
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-red-600/50 outline-none"
              placeholder="Nombre del personaje..."
            />
            <input 
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white/70 text-xs font-medium focus:border-red-600/50 outline-none"
              placeholder="Descripción corta..."
            />
          </div>
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mt-4 font-mono">Instrucciones de Rol (Historia)</label>
          <textarea 
            value={instr}
            onChange={(e) => setInstr(e.target.value)}
            className="w-full h-40 bg-black/50 border border-white/5 rounded-2xl p-4 text-white/80 text-sm font-medium focus:border-red-600/50 focus:outline-none transition-all resize-none shadow-inner"
            placeholder="Escribe cómo quieres que se comporte..."
          />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block font-mono">Voces y Dramatización de IA</label>
            <p className="text-[9px] text-zinc-500 leading-relaxed font-mono">
              Configura las 3 voces del sistema: diálogo de la protagonista, relato de la narradora sensual (eriza la piel) y personajes secundarios o invitados.
            </p>
          </div>

          {/* Voice Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => {
                stopAllSpeech();
                setPlayingPreviewId(null);
                setSettingsVoiceTab('character');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                settingsVoiceTab === 'character'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Protagonista</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopAllSpeech();
                setPlayingPreviewId(null);
                setSettingsVoiceTab('narrator');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                settingsVoiceTab === 'narrator'
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md shadow-red-600/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Narradora Sensual</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopAllSpeech();
                setPlayingPreviewId(null);
                setSettingsVoiceTab('guest');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                settingsVoiceTab === 'guest'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Invitados</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {LISTA_VOCES.filter(v => {
              if (settingsVoiceTab === 'narrator') {
                return v.id.includes('Narrador') || v.id.includes('Sensual') || v.id.includes('Susurr') || v.id.includes('Aria') || v.id.includes('Pausada');
              }
              if (settingsVoiceTab === 'guest') {
                return v.id.includes('Invitad') || v.id.includes('Masculin') || v.id.includes('Luna') || v.id.includes('Juvenil') || v.id.includes('Caribena');
              }
              return !v.id.includes('Narrador');
            }).map((v) => {
              const currentActiveId = 
                settingsVoiceTab === 'character' ? selectedVoice :
                settingsVoiceTab === 'narrator' ? selectedNarratorVoice :
                selectedGuestVoice;

              const isSelected = currentActiveId === v.id;
              const isPlaying = playingPreviewId === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    if (settingsVoiceTab === 'character') {
                      setSelectedVoice(v.id);
                    } else if (settingsVoiceTab === 'narrator') {
                      setSelectedNarratorVoice(v.id);
                    } else {
                      setSelectedGuestVoice(v.id);
                    }
                  }}
                  className={`p-3 rounded-2xl text-left border cursor-pointer transition-all flex flex-col justify-between min-h-[110px] select-none ${
                    isSelected 
                      ? settingsVoiceTab === 'narrator'
                        ? 'bg-red-600/15 border-red-500 text-white shadow-md shadow-red-600/10'
                        : settingsVoiceTab === 'guest'
                          ? 'bg-purple-600/15 border-purple-500 text-white shadow-md shadow-purple-600/10'
                          : 'bg-pink-600/15 border-pink-500 text-white shadow-md shadow-pink-600/10'
                      : 'bg-[#121214]/50 border-white/5 text-white/80 hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider font-mono leading-tight ${isSelected ? 'text-pink-400' : 'text-white'}`}>
                        {v.name}
                      </span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-[9px] text-[#8e8e93] line-clamp-2 mt-1 leading-normal font-sans">
                      {v.description}
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={(e) => handlePlayPreview(e, v.id)}
                    className={`mt-2 py-1.5 px-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono shrink-0 w-full active:scale-95 ${
                      isPlaying 
                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' 
                        : isSelected
                          ? 'bg-pink-600/20 text-pink-400 hover:bg-pink-600/30'
                          : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current" />
                        Detener
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        Probar Voz
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block font-mono">Seleccionar Personaje Base</label>
          <div className="grid grid-cols-2 gap-2">
            {personas.map(p => (
              <div 
                key={p.id} 
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedPersonaId(p.id);
                  setInstr(p.instruction);
                  setName(p.name);
                  setDesc(p.description);
                  setSelectedVoice(p.voice);
                  setIsCustom(false);
                }} 
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all active:scale-95 ${selectedPersonaId === p.id ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                <div className={`text-[10px] font-black uppercase tracking-widest font-mono ${selectedPersonaId === p.id ? 'text-red-500' : 'text-white/70'}`}>{p.name}</div>
                <div className="text-[8px] text-white/20 uppercase mt-1 line-clamp-1 font-mono">{p.description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <button 
            onClick={onClearHistory}
            className="h-14 border border-white/5 bg-white/5 hover:text-red-500 rounded-2xl text-[10px] font-black uppercase transition-all cursor-pointer font-mono"
          >
            Borrar Historial
          </button>
          <button 
            onClick={handleResetAll}
            className="h-14 border border-red-600/20 bg-red-600/5 hover:bg-red-600/10 text-red-500 rounded-2xl text-[10px] font-black uppercase transition-all cursor-pointer font-mono"
          >
            Restablecer Todo
          </button>
        </section>

        <button onClick={handleSave} className="w-full h-16 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl active:scale-95 transition-all sticky bottom-0 cursor-pointer font-mono">
          GUARDAR CAMBIOS
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
