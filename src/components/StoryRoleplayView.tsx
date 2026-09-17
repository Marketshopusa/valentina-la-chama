import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Phone, PhoneOff, Mic, MicOff, 
  Send, Sparkles, Image as ImageIcon, Loader2, Maximize2, Scan, Settings, 
  User, Check, X, RefreshCw, Plus, Edit3, Cpu, ShieldCheck, Layers, Cloud,
  BookOpen, MessageSquareQuote, MessageSquare, Lock, Shield
} from 'lucide-react';
import { Persona, ConnectionStatus, Message, StoryScenario, CharacterAnchor, DecodedPromptSlots, CoherenceAnalysis } from '../types';
import { EditStoryModal } from './EditStoryModal';
import { ImageEngineModal } from './ImageEngineModal';
import { CoherenceInspectorModal } from './CoherenceInspectorModal';
import { CardVoicePickerModal } from './CardVoicePickerModal';
import { resolveVoiceProfile, sanitizeTextForSpeech } from '../utils/voices';
import { playVoice, stopAllSpeech } from '../utils/speechPlayer';
import { isAdminUser } from '../data/adminInitialData';

interface StoryRoleplayViewProps {
  scenario: StoryScenario;
  persona: Persona;
  currentMedia: string;
  messages: Message[];
  status: ConnectionStatus;
  isSpeaking: boolean;
  isMuted: boolean;
  micLevel: number;
  isTyping: boolean;
  autoSpeak: boolean;
  isNarrativeActive?: boolean;
  onToggleNarrative?: () => void;
  onSendMessage: (text: string) => void;
  onToggleMute: () => void;
  onToggleCall: () => void;
  onToggleAutoSpeak: () => void;
  onRestartStory: () => void;
  onBackToHistorias: () => void;
  onOpenCreateStory?: () => void;
  onOpenSettings: () => void;
  onSetCardMedia: (mediaUrl: string) => void;
  onUpdateScenario: (updated: StoryScenario, restartChat?: boolean) => void;
  onAttachSceneImage?: (messageId: string, imageUrl: string) => void;
  onSelectVoice?: (voiceId: string) => void;
  currentUser?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  onOpenAuthModal?: () => void;
}

export const StoryRoleplayView: React.FC<StoryRoleplayViewProps> = ({
  scenario,
  persona,
  currentMedia,
  messages,
  status,
  isSpeaking,
  isMuted,
  micLevel,
  isTyping,
  autoSpeak,
  isNarrativeActive = true,
  onToggleNarrative,
  onSendMessage,
  onToggleMute,
  onToggleCall,
  onToggleAutoSpeak,
  onRestartStory,
  onBackToHistorias,
  onOpenCreateStory,
  onOpenSettings,
  onSetCardMedia,
  onUpdateScenario,
  onAttachSceneImage,
  onSelectVoice,
  currentUser,
  onLogin,
  onLogout,
  onOpenAuthModal
}) => {
  const [inputText, setInputText] = useState('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [generatingMessageId, setGeneratingMessageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Stop speech when unmounting
  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  const handlePlayMessageAudio = async (m: Message) => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (playingMessageId === m.id) {
      stopAllSpeech();
      setPlayingMessageId(null);
      return;
    }
    stopAllSpeech();
    setPlayingMessageId(m.id);

    const cleanedText = sanitizeTextForSpeech(m.text, isNarrativeActive);
    if (!cleanedText) {
      setPlayingMessageId(null);
      return;
    }

    const currentVoice = resolveVoiceProfile(
      scenario.voiceStyle || persona.voice,
      scenario.development || scenario.synopsis,
      scenario.characterName || persona.name
    );

    await playVoice({
      text: cleanedText,
      voiceId: currentVoice.id,
      characterName: scenario.characterName || persona.name,
      voiceDirective: currentVoice.voiceInstruction,
      baseVoice: currentVoice.baseVoice,
      onStart: () => setPlayingMessageId(m.id),
      onEnd: () => setPlayingMessageId(null),
      onError: () => setPlayingMessageId(null)
    });
  };

  // In-Story Engine state
  const [isImageEngineOpen, setIsImageEngineOpen] = useState(false);
  const [inspectingMessage, setInspectingMessage] = useState<Message | null>(null);
  const [messageSlots, setMessageSlots] = useState<Record<string, DecodedPromptSlots>>({});
  const [messageCoherence, setMessageCoherence] = useState<Record<string, CoherenceAnalysis>>({});
  const [messageAnchor, setMessageAnchor] = useState<Record<string, CharacterAnchor>>({});

  // Framing mode: 'contain' = encuadre completo sin recortes, 'cover' = llenar pantalla
  const [mediaFit, setMediaFit] = useState<'contain' | 'cover'>(() => {
    return (localStorage.getItem('preferred_media_fit') as 'contain' | 'cover') || 'contain';
  });

  const toggleMediaFit = () => {
    setMediaFit(prev => {
      const next = prev === 'contain' ? 'cover' : 'contain';
      localStorage.setItem('preferred_media_fit', next);
      return next;
    });
  };

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  const isInCall = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING || status === ConnectionStatus.RECONNECTING || status === ConnectionStatus.RESETTING;
  const isCallActiveOrConnecting = isInCall || isConnecting;

  // Track call timer if connected
  useEffect(() => {
    let interval: any;
    if (isInCall) {
      interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    const textToSend = inputText.trim();
    if (!textToSend) return;
    onSendMessage(textToSend);
    setInputText('');
  };

  // Web Speech recognition for quick voice input in chat
  const handleToggleVoiceInput = () => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (isListeningMic) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListeningMic(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("El reconocimiento de voz en navegador no está soportado en este dispositivo. Puedes usar la llamada en vivo.");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningMic(true);
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
        }
        setIsListeningMic(false);
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition error:", e);
      setIsListeningMic(false);
    }
  };

  // Generate illustration for a specific scene message strictly within the chat bubble
  const handleIllustrateScene = async (msg: Message, forceLoRABoost = false) => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (generatingMessageId) return;
    setGeneratingMessageId(msg.id);

    const manName = scenario.userName || (scenario.userRole && scenario.userRole.toLowerCase() !== 'hombre' ? scenario.userRole : 'William');
    const womanName = scenario.characterName || persona.name || 'Gabriela';

    try {
      // Find the previous message to give full situational context (what the user just said or did)
      const msgIndex = messages.findIndex(m => m.id === msg.id);
      const previousMsg = msgIndex > 0 ? messages[msgIndex - 1] : undefined;

      const response = await fetch('/api/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneText: msg.text,
          previousText: previousMsg?.text || '',
          characterName: womanName,
          scenarioTitle: scenario.title,
          userRole: manName,
          userName: manName,
          characterRole: scenario.characterRole || 'mujer',
          referenceImage: currentMedia || scenario.coverImage || persona.defaultImage || '',
          characterDescription: scenario.development || persona.instruction || '',
          intensitySetting: 'intensa',
          customConfig: forceLoRABoost ? {
            targetLoRAWeight: 1.25,
            coherenceFeedbackLoopEnabled: true,
            minCoherenceThreshold: 80
          } : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          msg.sceneImage = data.imageUrl;
          msg.decodedSlots = data.decodedSlots;
          msg.coherenceResult = data.coherenceResult;
          setSceneImages(prev => ({ ...prev, [msg.id]: data.imageUrl }));
          if (data.decodedSlots) {
            setMessageSlots(prev => ({ ...prev, [msg.id]: data.decodedSlots }));
          }
          if (data.coherenceResult) {
            setMessageCoherence(prev => ({ ...prev, [msg.id]: data.coherenceResult }));
          }
          if (data.characterAnchor) {
            setMessageAnchor(prev => ({ ...prev, [msg.id]: data.characterAnchor }));
          }
          onAttachSceneImage?.(msg.id, data.imageUrl);
          return;
        }
      }
      
      // Resilient client-side fallback if server didn't provide image URL
      const seed = Math.floor(Math.random() * 899999) + 100000;
      const promptFallback = encodeURIComponent(`Ultra-sharp 8k UHD photograph of a heterosexual couple, strictly ONE adult man named ${manName} with short dark hair and ONE adult woman named ${womanName} with long dark wavy hair in an intimate bedroom, breathless embrace, hyper-detailed faces, tack-sharp eyes, in-focus, 8k, zero blur`);
      const negPrompt = encodeURIComponent("two women, two females, multiple women, lesbian, duplicate female, blurry, out of focus, soft focus, depth of field, haze, bokeh, distorted faces, low quality");
      const fallbackUrl = `https://image.pollinations.ai/prompt/${promptFallback}?width=1024&height=576&nologo=true&quality=high&negative_prompt=${negPrompt}&seed=${seed}`;
      msg.sceneImage = fallbackUrl;
      setSceneImages(prev => ({ ...prev, [msg.id]: fallbackUrl }));
      onAttachSceneImage?.(msg.id, fallbackUrl);
    } catch (err) {
      console.error("Failed to generate scene illustration:", err);
      // Even on network error, ensure user gets a sharp couple illustration
      const seed = Math.floor(Math.random() * 899999) + 100000;
      const promptFallback = encodeURIComponent(`Ultra-sharp 8k UHD photograph of a heterosexual couple, ONE man named ${manName} and ONE woman named ${womanName} in passionate embrace, tack-sharp focus, crystal clear, 8k, zero blur`);
      const negPrompt = encodeURIComponent("two women, two females, multiple women, lesbian, duplicate, blurry, out of focus, soft focus, depth of field, haze, low quality");
      const fallbackUrl = `https://image.pollinations.ai/prompt/${promptFallback}?width=1024&height=576&nologo=true&quality=high&negative_prompt=${negPrompt}&seed=${seed}`;
      msg.sceneImage = fallbackUrl;
      setSceneImages(prev => ({ ...prev, [msg.id]: fallbackUrl }));
      onAttachSceneImage?.(msg.id, fallbackUrl);
    } finally {
      setGeneratingMessageId(null);
    }
  };

  const fallbackPersonaImg = persona?.defaultImage || 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=1500';
  const [activeMediaUrl, setActiveMediaUrl] = useState<string>(currentMedia || fallbackPersonaImg);

  useEffect(() => {
    setActiveMediaUrl(currentMedia || fallbackPersonaImg);
  }, [currentMedia, fallbackPersonaImg]);

  const isVideo = typeof activeMediaUrl === 'string' && (
    activeMediaUrl.startsWith('data:video') || 
    activeMediaUrl.includes('video/') || 
    activeMediaUrl.includes('.mp4') || 
    activeMediaUrl.includes('.webm')
  );

  return (
    <div className="w-full h-full min-h-screen bg-[#0d0a14] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* TOP HEADER */}
      <header className="h-14 border-b border-white/5 bg-[#120e1c]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={onBackToHistorias}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs sm:text-sm font-medium cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Historias</span>
          </button>

          {onOpenCreateStory && (
            <button 
              onClick={() => {
                if (!currentUser && onOpenAuthModal) {
                  onOpenAuthModal();
                  return;
                }
                onOpenCreateStory();
              }}
              className="flex items-center gap-1.5 bg-[#d926a9]/90 hover:bg-[#c026d3] text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-pink-950/40 transition-all cursor-pointer active:scale-95"
              title="Crear Nueva Historia"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Historia</span>
              <span className="sm:hidden">Crear</span>
            </button>
          )}

          <span className="hidden md:inline text-zinc-700">|</span>

          <button 
            onClick={() => setIsEditingMetadata(true)}
            className="flex items-center gap-2 text-zinc-300 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/5 transition-all cursor-pointer"
            title="Editar parámetros y portada de la historia"
          >
            <Edit3 className="w-3 h-3 text-pink-400" />
            <span className="capitalize font-semibold text-pink-400 max-w-[130px] sm:max-w-[200px] truncate">{scenario.title}</span>
            <span className="text-zinc-500 text-[10px] hidden sm:inline">({scenario.characterRole})</span>
          </button>

          <button 
            onClick={() => setIsImageEngineOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-pink-950/40 hover:bg-pink-900/50 text-pink-300 px-3 py-1 rounded-full border border-pink-500/30 transition-all cursor-pointer shadow-sm shadow-pink-950/50"
            title="Configurar Motor In-Story (4 Pilares: Anclaje de Personaje, Decodificador NLP, Modelo Desbloqueado y Bucle de Coherencia)"
          >
            <Cpu className="w-3.5 h-3.5 text-pink-400" />
            <span className="font-semibold hidden sm:inline">Motor In-Story</span>
            <span className="sm:hidden font-semibold">Motor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Botón para Activar / Desactivar el Chat Escrito */}
        <button 
          onClick={() => setIsChatOpen(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95 ${
            isChatOpen 
              ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-pink-500/50 text-pink-200 shadow-sm' 
              : 'bg-zinc-800/80 hover:bg-zinc-700/80 border-white/10 text-zinc-300 hover:text-white'
          }`}
          title={isChatOpen ? "Ocultar chat escrito" : "Abrir chat escrito"}
        >
          <MessageSquare className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          <span className="inline">{isChatOpen ? 'Ocultar Chat' : 'Chat Escrito'}</span>
          {messages.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-mono">
              {messages.length}
            </span>
          )}
        </button>

        {/* Right header controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Auto-read toggle */}
          <button
            onClick={onToggleAutoSpeak}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              autoSpeak ? 'bg-purple-900/40 text-pink-400 border border-purple-500/30' : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
            title={autoSpeak ? "Voz automática activada" : "Voz automática desactivada"}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline text-[11px]">{autoSpeak ? 'Voz On' : 'Voz Off'}</span>
          </button>

          {/* Quick Voice Call Button */}
          <button
            onClick={() => {
              if (!currentUser && onOpenAuthModal) {
                onOpenAuthModal();
                return;
              }
              onToggleCall();
            }}
            disabled={isConnecting}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              isInCall 
                ? 'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-900/30' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md'
            }`}
            title={isInCall ? "Finalizar llamada" : "Conectar llamada de voz"}
          >
            {isInCall ? (
              <>
                <PhoneOff className="w-3.5 h-3.5" />
                <span className="font-mono">{formatTimer(callDuration)}</span>
              </>
            ) : isConnecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Conectando...</span>
              </>
            ) : (
              <>
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Llamada en Vivo</span>
              </>
            )}
          </button>

          {/* Cloud Synchronization Status / Profile Button */}
          <button
            onClick={currentUser ? onOpenSettings : (onOpenAuthModal || onOpenSettings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border ${
              currentUser
                ? isAdminUser(currentUser.email)
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 hover:bg-amber-900/60 shadow-md shadow-amber-950/50'
                  : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 shadow-sm'
                : 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-pink-500/40 text-pink-200 hover:from-pink-600/40 hover:to-purple-600/40'
            }`}
            title={currentUser ? (isAdminUser(currentUser.email) ? `👑 Administrador Master (${currentUser.email}) - Acceso Total` : `Perfil: ${currentUser.email || currentUser.displayName || 'Google'} (Sincronizado)`) : "Iniciar sesión o Registrar cuenta"}
          >
            {currentUser ? (
              <>
                {isAdminUser(currentUser.email) ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-300">
                      ADMIN MASTER
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-medium max-w-[100px] truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0] || 'Mi Perfil'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  </>
                )}
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="text-[11px] font-medium">Entrar / Registro</span>
              </>
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Ajustes de Personaje y Voz"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN DUAL-PANE CONTENT */}
      <main className="flex-1 w-full max-w-[1550px] mx-auto p-2 sm:p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden justify-center items-stretch relative">
        {/* CARD CONTAINER (On desktop: Right column order-2 or centered; On mobile: Full screen with optional bottom chat overlay) */}
        <div className={`
          flex flex-col shrink-0 w-full 
          ${isChatOpen ? 'sm:w-[440px] md:w-[480px] lg:w-[540px] xl:w-[580px] md:order-2' : 'sm:w-[480px] md:w-[540px] lg:w-[600px] xl:w-[640px] mx-auto'} 
          h-[calc(100vh-5rem)] max-h-[840px] 
          relative rounded-[28px] overflow-hidden 
          border border-white/10 shadow-2xl bg-zinc-950 select-none
        `}>
          {/* Card Media (Video or Image) */}
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
            {/* Ambient blurred backdrop so there are no empty black borders */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
              {isVideo ? (
                <video 
                  key={`bg-${activeMediaUrl}`}
                  src={activeMediaUrl}
                  autoPlay loop muted playsInline
                  className="w-full h-full object-cover blur-2xl opacity-40 scale-125 transition-all duration-700"
                />
              ) : (
                <img 
                  key={`bg-${activeMediaUrl}`}
                  src={activeMediaUrl}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover blur-2xl opacity-40 scale-125 transition-all duration-700"
                />
              )}
            </div>

            {/* Main Sharp Foreground Media: complete frame without clipping (object-contain) or expansive fill (object-cover) */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {isVideo ? (
                <video 
                  key={activeMediaUrl}
                  src={activeMediaUrl}
                  autoPlay loop muted playsInline
                  className={`w-full h-full ${mediaFit === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-700 ${isSpeaking ? 'scale-105' : 'scale-100'}`}
                />
              ) : (
                <img 
                  key={activeMediaUrl}
                  src={activeMediaUrl}
                  alt={scenario.title}
                  onError={() => {
                    if (activeMediaUrl !== fallbackPersonaImg) {
                      setActiveMediaUrl(fallbackPersonaImg);
                    }
                  }}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full ${mediaFit === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-700 ${isSpeaking ? 'scale-105' : 'scale-100'}`}
                />
              )}
            </div>

            {/* Subtle dark gradient overlay: completely fades out during call so user can delight in the full image or video */}
            <div className={`absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none transition-opacity duration-500 ${isCallActiveOrConnecting ? 'opacity-0' : 'opacity-100'}`} />
            <div className={`absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none transition-opacity duration-500 ${isCallActiveOrConnecting ? 'opacity-0' : 'opacity-100'}`} />
          </div>

          {/* Minimal Floating Call / Mic / Relato / Framing Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {/* Botón de Encuadre: Completo (100% visible sin recortes) vs Llenar */}
            <button
              type="button"
              onClick={toggleMediaFit}
              className={`w-9 h-9 rounded-full border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                mediaFit === 'contain'
                  ? 'bg-purple-600/80 hover:bg-purple-500 border-purple-400 text-white shadow-purple-950/60'
                  : 'bg-black/60 hover:bg-black/80 border-white/20 text-zinc-400 hover:text-white'
              }`}
              title={
                mediaFit === 'contain'
                  ? "Encuadre: COMPLETO (100% visible, sin recortes). Haz clic para llenar pantalla."
                  : "Encuadre: LLENAR PANTALLA (zoom). Haz clic para encuadre completo sin recortes."
              }
            >
              {mediaFit === 'contain' ? (
                <Scan className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-zinc-400" />
              )}
            </button>
            {/* Botón de Selección de Voz de la Tarjeta */}
            <button
              type="button"
              onClick={() => setIsVoicePickerOpen(true)}
              className="w-9 h-9 rounded-full border border-pink-500/50 bg-black/60 hover:bg-pink-600/80 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 text-pink-400 hover:text-white"
              title={`Voz del personaje: ${resolveVoiceProfile(scenario.voiceStyle || persona.voice).name}. Clic para cambiar o probar la voz.`}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Botón circular para Activar / Desactivar el Chat Escrito */}
            <button
              type="button"
              onClick={() => setIsChatOpen(prev => !prev)}
              className={`w-9 h-9 rounded-full border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isChatOpen
                  ? 'bg-[#c026d3]/80 hover:bg-[#c026d3] border-pink-400 text-white shadow-purple-950/60'
                  : 'bg-black/60 hover:bg-black/80 border-white/20 text-zinc-400 hover:text-white'
              }`}
              title={isChatOpen ? "Ocultar chat escrito" : "Abrir chat escrito"}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Relato circular toggle button: Tal cual como el botón de llamada y micrófono */}
            {onToggleNarrative && (
              <button
                type="button"
                onClick={onToggleNarrative}
                className={`w-9 h-9 rounded-full border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isNarrativeActive
                    ? 'bg-purple-600/80 hover:bg-purple-500 border-purple-400 text-white shadow-purple-950/60'
                    : 'bg-black/60 hover:bg-black/80 border-white/20 text-zinc-400 hover:text-white'
                }`}
                title={
                  isNarrativeActive
                    ? "Relato: ACTIVADO (con pensamientos y acciones). Haz clic para desactivarlo y pasar a conversación directa."
                    : "Relato: DESACTIVADO (conversación directa persona a persona). Haz clic para activar el relato con pensamientos."
                }
              >
                <BookOpen className={`w-4 h-4 ${isNarrativeActive ? 'text-white' : 'text-zinc-400'}`} />
              </button>
            )}

            {/* When in call, small mute/unmute mic toggle */}
            {isCallActiveOrConnecting && (
              <button 
                onClick={onToggleMute}
                className={`w-9 h-9 rounded-full border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isMuted 
                    ? 'bg-red-600/80 border-red-500 text-white animate-pulse' 
                    : 'bg-black/50 hover:bg-black/70 border-white/20 text-white/90'
                }`}
                title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-red-200" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Phone button: GREEN when in call (hover to hang up), RED when hung up (click to call) */}
            <button
              onClick={() => {
                if (!currentUser && onOpenAuthModal) {
                  onOpenAuthModal();
                  return;
                }
                onToggleCall();
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer group active:scale-95 border ${
                isInCall
                  ? 'bg-emerald-500 hover:bg-red-600 border-emerald-400/50 text-white shadow-emerald-950/60'
                  : 'bg-red-600/90 hover:bg-emerald-600 border-red-500/50 text-white shadow-red-950/60'
              }`}
              title={isInCall ? "En llamada (Click para colgar)" : "Iniciar llamada"}
            >
              {isInCall ? (
                <>
                  <Phone className="w-4 h-4 group-hover:hidden animate-pulse" />
                  <PhoneOff className="w-4 h-4 hidden group-hover:block" />
                </>
              ) : (
                <Phone className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Sound waves visualization when character speaks */}
          {isSpeaking && (
            <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-3 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.4s]" />
                <div className="w-1 h-4 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                <div className="w-1 h-3 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          )}

          {/* Card Bottom Content: ONLY VISIBLE WHILE NOT IN CALL (completely vanishes the instant call is initiated or active) */}
          {!isCallActiveOrConnecting && (
            <div className="absolute bottom-0 inset-x-0 z-10 p-5 sm:p-6 flex flex-col justify-end pointer-events-auto transition-all duration-300">
              {/* Story Title & Edit Action */}
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white capitalize drop-shadow-md truncate">
                  {scenario.title}
                </h2>
                <button
                  onClick={() => setIsEditingMetadata(true)}
                  className="p-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0"
                  title="Editar parámetros y portada de la historia"
                >
                  <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                </button>
              </div>

              {/* Synopsis / Description */}
              <p className="text-xs sm:text-sm text-zinc-300/90 mt-1.5 line-clamp-3 leading-relaxed drop-shadow">
                {scenario.synopsis}
              </p>

              {/* Metadata Tags */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">tú:</span>
                    <span className="font-semibold text-white uppercase tracking-wider">
                      {scenario.userRole || scenario.userName || 'willian'}
                    </span>
                  </div>
                  {scenario.isExplicit18 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#d926a9]/30 text-pink-300 text-[10px] font-bold border border-[#d926a9]/40 tracking-wider">
                      +18
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">personaje:</span>
                    <span className="font-semibold text-white/90 capitalize">
                      {scenario.characterRole || persona.name}
                    </span>
                  </div>
                  {scenario.storyType && (
                    <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                      {scenario.storyType}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">voz:</span>
                    <button
                      type="button"
                      onClick={() => setIsVoicePickerOpen(true)}
                      className="text-xs text-pink-300 hover:text-pink-200 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      title="Haz clic para cambiar la voz del personaje"
                    >
                      <Volume2 className="w-3 h-3 text-pink-400" />
                      <span>{resolveVoiceProfile(scenario.voiceStyle || persona.voice).name}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón flotante en móvil para reabrir el chat cuando está minimizado */}
          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="md:hidden absolute bottom-5 right-5 z-20 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-full shadow-2xl border border-white/20 active:scale-95 transition-all cursor-pointer shadow-purple-950/60"
              title="Abrir chat escrito"
            >
              <MessageSquare className="w-4 h-4 text-pink-200" />
              <span className="text-xs font-semibold">Abrir Chat</span>
              {messages.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] text-pink-200 font-mono">
                  {messages.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* WRITTEN CHAT PANEL: On desktop: LEFT column (order-1); On mobile: Bottom drawer over card (inferior) */}
        <div className={`
          ${isChatOpen ? 'flex' : 'hidden'} 
          fixed md:relative inset-x-0 bottom-0 z-40 
          h-[62vh] md:h-[calc(100vh-5rem)] max-h-[580px] md:max-h-[840px] 
          md:flex-1 md:max-w-[620px] md:order-1 
          flex-col bg-[#130f1e]/98 md:bg-[#130f1e]/90 backdrop-blur-2xl 
          rounded-t-[32px] md:rounded-[28px] border-t md:border border-purple-500/30 md:border-white/10 
          overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-300
        `}>
          {/* Chat Header */}
          <div className="p-3 sm:p-4 sm:px-6 border-b border-white/5 flex flex-col bg-[#171224] shrink-0">
            {/* Mobile drag handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2 md:hidden" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white capitalize tracking-tight flex items-center gap-2">
                  <span>{scenario.title}</span>
                  <span className="text-[10px] font-normal text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full hidden sm:inline">
                    Chat Escrito
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  Interacción narrativa en tiempo real
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {onToggleNarrative && (
                  <button
                    type="button"
                    onClick={onToggleNarrative}
                    className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                      isNarrativeActive
                        ? 'bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/30'
                        : 'bg-zinc-800/80 border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={isNarrativeActive ? "Modo Relato: Activado (con pensamientos y acciones). Haz clic para cambiar a conversación directa." : "Modo Conversación Directa: Activado. Haz clic para activar relato con pensamientos."}
                  >
                    {isNarrativeActive ? (
                      <>
                        <BookOpen className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="hidden sm:inline">Relato: ON</span>
                        <span className="sm:hidden">Relato</span>
                      </>
                    ) : (
                      <>
                        <MessageSquareQuote className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="hidden sm:inline">Directo</span>
                        <span className="sm:hidden">Directo</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={onRestartStory}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-medium px-2 sm:px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  title="Reiniciar la historia y limpiar la memoria"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reiniciar</span>
                </button>

                <button
                  onClick={onToggleAutoSpeak}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title="Alternar reproducción de voz"
                >
                  {autoSpeak ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                </button>

                {/* Botón para Ocultar / Minimizar el Chat */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Ocultar chat escrito"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages & Narrative Stream */}
          <div 
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth"
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';

              return (
                <div 
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {isUser ? (
                    /* User bubble: Vibrant magenta/fuchsia (Matches user screenshot) */
                    <div className="max-w-[88%] sm:max-w-[75%] bg-gradient-to-r from-[#c026d3] to-[#d92a8b] text-white p-4 rounded-2xl rounded-tr-sm shadow-md">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                        {m.text}
                      </p>
                      <div className="text-[10px] text-white/70 text-right mt-1.5 font-mono">
                        {formatTimestamp(m.timestamp)}
                      </div>
                    </div>
                  ) : (
                    /* AI / Character bubble: Dark slate/purple with italics for narrative + "Ilustrar esta escena" */
                    <div className="max-w-[92%] sm:max-w-[85%] bg-[#1a1528] border border-purple-500/20 text-zinc-200 p-4 sm:p-5 rounded-2xl rounded-tl-sm shadow-md">
                      {/* Formatted story text */}
                      <div className="text-sm sm:text-[14.5px] leading-relaxed whitespace-pre-wrap font-normal space-y-2">
                        {m.text.split('\n').map((paragraph, idx) => {
                          // Check if paragraph contains narrative action (*action*) or dialogue
                          return (
                            <p key={idx} className="leading-relaxed">
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>

                      {/* Timestamp */}
                      <div className="text-[10px] text-zinc-500 mt-2 font-mono">
                        {formatTimestamp(m.timestamp)}
                      </div>

                      {/* Illustration display if already generated for this message */}
                      {(sceneImages[m.id] || m.sceneImage) && (
                        <div className="mt-3 relative rounded-xl overflow-hidden border border-purple-500/30 group bg-black/40 shadow-lg">
                          <img 
                            src={sceneImages[m.id] || m.sceneImage} 
                            alt="Ilustración de la escena" 
                            className="w-full aspect-video max-h-80 object-cover transition-transform duration-500 group-hover:scale-102"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (!img.src.includes('seed=88421')) {
                                const charName = scenario.characterName || persona.name || 'Gabriela';
                                const fb = encodeURIComponent(`Ultra-sharp 8k UHD photograph of ${charName}, authentic portrait, tack-sharp eyes, natural skin texture, cinematic lighting, 8k resolution`);
                                const neg = encodeURIComponent("blurry, out of focus, distorted, ugly, low quality");
                                img.src = `https://image.pollinations.ai/prompt/${fb}?width=1024&height=576&nologo=true&quality=high&negative_prompt=${neg}&seed=88421`;
                              }
                            }}
                          />
                          {/* Interactive Coherence & Anchoring badge */}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                            <button
                              onClick={() => setInspectingMessage(m)}
                              className="px-2.5 py-1 rounded-full bg-black/80 hover:bg-black backdrop-blur-md border border-pink-500/40 text-[10px] text-pink-300 font-medium flex items-center gap-1.5 shadow transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Clic para auditar coherencia visual y correspondencia de la escena"
                            >
                              <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
                              <span>{messageCoherence[m.id]?.overallScore || m.coherenceResult?.overallScore || 95}% Coherencia · Fidelidad Escena</span>
                            </button>
                          </div>

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              onClick={() => setPreviewImage(sceneImages[m.id] || m.sceneImage!)}
                              className="px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs flex items-center gap-1 hover:bg-black/90 transition-all cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
                            <button
                              onClick={() => setInspectingMessage(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-600/90 backdrop-blur-md text-white text-xs flex items-center gap-1 hover:bg-purple-500 transition-all cursor-pointer font-medium"
                              title="Auditar fisionomía, fidelidad a la acción y slots NLP"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Auditar Coherencia</span>
                            </button>
                            <button
                              onClick={() => onSetCardMedia(sceneImages[m.id] || m.sceneImage!)}
                              className="px-2.5 py-1.5 rounded-lg bg-pink-600/90 backdrop-blur-md text-white text-xs flex items-center gap-1 hover:bg-pink-500 transition-all cursor-pointer font-medium"
                              title="Poner en la tarjeta izquierda (opcional)"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Tarjeta</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Loading skeleton placeholder while generating image */}
                      {generatingMessageId === m.id && !(sceneImages[m.id] || m.sceneImage) && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-pink-500/30 bg-pink-950/20 aspect-video flex flex-col items-center justify-center gap-2 animate-pulse p-4 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                          <p className="text-xs text-pink-300 font-medium">Ilustrando escena con Motor In-Story...</p>
                          <p className="text-[11px] text-zinc-400">Anclando identidad de {scenario.characterName || persona.name} y decodificando slots físicos</p>
                        </div>
                      )}

                      {/* Action buttons footer: "🔊 Escuchar voz" + "✨ Ilustrar esta escena" + Coherence Audit */}
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayMessageAudio(m)}
                            className={`text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer px-2.5 py-1 rounded-full border ${
                              playingMessageId === m.id
                                ? 'bg-pink-600/40 border-pink-500/70 text-pink-200 animate-pulse shadow-md shadow-pink-950'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                            }`}
                            title={playingMessageId === m.id ? "Detener reproducción de voz" : "Escuchar este mensaje con la voz asignada al personaje"}
                          >
                            {playingMessageId === m.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-pink-400" />
                                <span>Detener</span>
                                <span className="flex items-center gap-0.5 ml-0.5">
                                  <span className="w-1 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                  <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                  <span className="w-1 h-2 bg-pink-400 rounded-full animate-bounce" />
                                </span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                                <span>Escuchar voz</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleIllustrateScene(m)}
                            disabled={generatingMessageId === m.id}
                            className="text-xs text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {generatingMessageId === m.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                                <span className="italic">Ilustrando escena con IA...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                                <span>{(sceneImages[m.id] || m.sceneImage) ? 'Re-ilustrar' : 'Ilustrar escena'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {(sceneImages[m.id] || m.sceneImage) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setInspectingMessage(m)}
                              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Ver comparativa de fisionomía, scores y comandos NLP"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Auditar</span>
                            </button>
                            <span className="text-zinc-700">·</span>
                            <button
                              onClick={() => handleIllustrateScene(m, true)}
                              disabled={generatingMessageId === m.id}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              title="Regenerar escena con máxima fidelidad semántica a la acción narrada"
                            >
                              <RefreshCw className={`w-3 h-3 ${generatingMessageId === m.id ? 'animate-spin' : ''}`} />
                              <span>Regenerar escena</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Typing / Generating Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1a1528] border border-purple-500/20 text-zinc-400 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <span className="text-xs italic">El personaje está respondiendo...</span>
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Chat Input Bar (Matches user image) */}
          <div className="p-3 sm:p-4 border-t border-white/5 bg-[#171224] shrink-0">
            {/* Access Banner for Non-Authenticated Visitors */}
            {!currentUser && (
              <div 
                onClick={onOpenAuthModal}
                className="mb-2.5 p-2.5 bg-gradient-to-r from-purple-950/90 via-pink-950/90 to-purple-950/90 border border-pink-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-xl cursor-pointer hover:border-pink-400 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <p className="text-xs text-zinc-300">
                    <strong className="text-white font-semibold">Accede con tu Google o correo</strong> para chatear en vivo con la IA y guardar tu historia privada.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-[11px] font-bold rounded-xl shrink-0 transition-all shadow-md group-hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Entrar con Google
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-[#1c172b] border border-white/10 rounded-2xl px-3 py-2 focus-within:border-purple-500 transition-colors">
              <input 
                type="text"
                value={inputText}
                onClick={() => {
                  if (!currentUser && onOpenAuthModal) onOpenAuthModal();
                }}
                onFocus={() => {
                  if (!currentUser && onOpenAuthModal) onOpenAuthModal();
                }}
                onChange={(e) => {
                  if (!currentUser) {
                    if (onOpenAuthModal) onOpenAuthModal();
                    return;
                  }
                  setInputText(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={currentUser ? "Escribe tu mensaje..." : "Accede con Google o tu correo para chatear..."}
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none px-2 py-1"
              />

              {/* Voice dictation button */}
              <button
                onClick={handleToggleVoiceInput}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isListeningMic ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                title={isListeningMic ? "Detener dictado" : "Dictar mensaje por voz"}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send button (Vibrant purple/magenta) */}
              <button
                onClick={handleSend}
                disabled={!inputText.trim() && !!currentUser}
                className="px-4 py-2 bg-gradient-to-r from-[#c026d3] to-[#d92a8b] hover:from-[#d92a8b] hover:to-[#e11d48] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <img 
              src={previewImage} 
              alt="Escena ampliada" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => {
                onSetCardMedia(previewImage);
                setPreviewImage(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Usar como imagen de la tarjeta izquierda</span>
            </button>
          </div>
        </div>
      )}

      {/* CARD VOICE PICKER MODAL (Universal voice for call, chat & narration) */}
      <CardVoicePickerModal
        isOpen={isVoicePickerOpen}
        onClose={() => setIsVoicePickerOpen(false)}
        currentVoiceId={scenario.voiceStyle || persona.voice}
        characterName={scenario.characterName || persona.name}
        onSelectVoice={(voiceId) => {
          onSelectVoice?.(voiceId);
          if (onUpdateScenario) {
            onUpdateScenario({
              ...scenario,
              voiceStyle: voiceId
            });
          }
        }}
      />

      {/* SCENARIO EDIT MODAL (Full featured matching CreateStoryModal) */}
      <EditStoryModal
        isOpen={isEditingMetadata}
        onClose={() => setIsEditingMetadata(false)}
        scenario={scenario}
        onSave={(updated, restartChat) => {
          onUpdateScenario(updated, restartChat);
        }}
      />

      {/* IN-STORY IMAGE ENGINE CONFIGURATION MODAL (4 Pillars) */}
      <ImageEngineModal
        isOpen={isImageEngineOpen}
        onClose={() => setIsImageEngineOpen(false)}
        characterName={scenario.characterName || persona.name || 'Gabriela'}
        characterReferenceImage={currentMedia || scenario.coverImage || persona.defaultImage}
        characterDescription={scenario.development || persona.instruction}
        userRoleName={scenario.userName || (scenario.userRole && scenario.userRole.toLowerCase() !== 'hombre' ? scenario.userRole : 'William')}
      />

      {/* COHERENCE & NLP SLOTS INSPECTOR AUDIT MODAL */}
      {inspectingMessage && (
        <CoherenceInspectorModal
          isOpen={!!inspectingMessage}
          onClose={() => setInspectingMessage(null)}
          sceneImageUrl={sceneImages[inspectingMessage.id] || inspectingMessage.sceneImage || ''}
          referenceImageUrl={currentMedia || scenario.coverImage || persona.defaultImage}
          characterName={scenario.characterName || persona.name || 'Gabriela'}
          coherenceResult={messageCoherence[inspectingMessage.id] || inspectingMessage.coherenceResult}
          decodedSlots={messageSlots[inspectingMessage.id] || inspectingMessage.decodedSlots}
          characterAnchor={messageAnchor[inspectingMessage.id]}
          isRegenerating={generatingMessageId === inspectingMessage.id}
          onRegenerateBoosted={() => {
            handleIllustrateScene(inspectingMessage, true);
          }}
        />
      )}
    </div>
  );
};
export default StoryRoleplayView;
