import React, { useState, useEffect } from 'react';
import { X, Volume2, Check, Sparkles, Music, Flame, User, Users, Play, Square } from 'lucide-react';
import { LISTA_VOCES, VoiceProfile, resolveVoiceProfile, DEFAULT_NARRATOR_VOICE_ID, DEFAULT_GUEST_VOICE_ID } from '../utils/voices';
import { playVoice, stopAllSpeech, unlockAudioContext } from '../utils/speechPlayer';

interface CardVoicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoiceId?: string;
  narratorVoiceId?: string;
  guestVoiceId?: string;
  characterName: string;
  onSelectVoice: (voiceId: string, narratorVoiceId?: string, guestVoiceId?: string) => void;
}

type VoiceTab = 'character' | 'narrator' | 'guest';

export const CardVoicePickerModal: React.FC<CardVoicePickerModalProps> = ({
  isOpen,
  onClose,
  currentVoiceId,
  narratorVoiceId,
  guestVoiceId,
  characterName,
  onSelectVoice
}) => {
  const [activeTab, setActiveTab] = useState<VoiceTab>('character');
  const [selectedCharVoice, setSelectedCharVoice] = useState<string>(currentVoiceId || 'Scarlett_HD');
  const [selectedNarratorVoice, setSelectedNarratorVoice] = useState<string>(narratorVoiceId || DEFAULT_NARRATOR_VOICE_ID);
  const [selectedGuestVoice, setSelectedGuestVoice] = useState<string>(guestVoiceId || DEFAULT_GUEST_VOICE_ID);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCharVoice(currentVoiceId || 'Scarlett_HD');
      setSelectedNarratorVoice(narratorVoiceId || DEFAULT_NARRATOR_VOICE_ID);
      setSelectedGuestVoice(guestVoiceId || DEFAULT_GUEST_VOICE_ID);
    }
  }, [isOpen, currentVoiceId, narratorVoiceId, guestVoiceId]);

  if (!isOpen) return null;

  const handlePreview = async (voice: VoiceProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    unlockAudioContext();

    if (playingVoiceId === voice.id) {
      stopAllSpeech();
      setPlayingVoiceId(null);
      return;
    }

    stopAllSpeech();
    setPlayingVoiceId(voice.id);

    let sampleText = `Hola amor... me fascina cuando me miras con esa picardía. Acércate despacio y siente cómo se me agita la respiración entrecortada mientras rozo tus labios...`;

    if (activeTab === 'narrator') {
      if (voice.id === 'Narradora_Intensa') {
        sampleText = `Se acerca a ti con la respiración agitada y una sonrisa pícara... susurra lentamente mientras roza tu cuello, haciendo que tu piel se estremezca con un escalofrío ardiente...`;
      } else if (voice.id === 'Narradora_Misterio') {
        sampleText = `Escúchame en la penumbra... cada caricia prohibida y cada respiración entrecortada hacen vibrar el aire con un magnetismo oscuro y seductor...`;
      } else if (voice.id === 'Narradora_Elegante') {
        sampleText = `Una tensión irresistible envolvía la habitación... su mirada se clavaba en ti mientras su respiración delataba el deseo contenido de entregarse por completo.`;
      } else {
        sampleText = `Se acerca lentamente a ti, sintiendo el calor vivo de tu respiración mientras roza con delicadeza tus labios, estremeciendo todo tu cuerpo.`;
      }
    } else if (activeTab === 'guest') {
      if (voice.id === 'Invitada_Coqueta') {
        sampleText = `¿Qué están haciendo ustedes dos aquí tan juntitos? Jeje... con esa respiración agitada y esas miradas cómplices, no me digan que empezaron sin mí...`;
      } else if (voice.id === 'Invitado_Varonil') {
        sampleText = `Buenas noches. Vaya atmósfera tan intensa tienen aquí... no pude evitar notar cómo el aire quema entre los dos.`;
      } else {
        sampleText = `¡Hola! Me uno a la escena con una sonrisa pícara y toda la disposición de subir la temperatura de la historia.`;
      }
    } else {
      if (voice.id === 'Scarlett_HD') {
        sampleText = `Hola amor... mírame a los ojos. Me fascinas tanto que la respiración se me entrecorta... acércate más y siente el fuego de mi piel entregándose a ti.`;
      } else if (voice.id === 'Luna_Sweet') {
        sampleText = `¡Hola mi cielo! Jeje... mira cómo se me escapa una risita pícara cuando me tocas así de cerquita... mmm, no te alejes nunca.`;
      } else if (voice.id === 'Aria_Calm') {
        sampleText = `Hola... siente la calma tibia y seductora de mi voz mientras el tiempo parece detenerse y nuestros pechos respiran al mismo compás.`;
      } else if (voice.id === 'Voz_Seductora') {
        sampleText = `Hola amor... ¿te gusta lo descarada y pícara que puedo ser cuando te susurro al oído con esta respiración agitada? Ven y compruébalo...`;
      } else if (voice.id === 'Voz_Sensual') {
        sampleText = `Hola cariño... siente el calor de mi voz recorriéndote lento, erizándote cada centímetro de piel con este susurro íntimo.`;
      } else if (voice.id === 'Voz_Dulce') {
        sampleText = `Hola mi amor... con una sonrisita tierna y pícara a la vez, te digo bajito al oído lo mucho que me encantas.`;
      }
    }

    await playVoice({
      text: sampleText,
      voiceId: voice.id,
      characterName: activeTab === 'character' ? characterName : undefined,
      voiceDirective: voice.voiceInstruction,
      baseVoice: voice.baseVoice,
      onStart: () => setPlayingVoiceId(voice.id),
      onEnd: () => setPlayingVoiceId(null),
      onError: () => setPlayingVoiceId(null)
    });
  };

  const handleSelectCurrentVoice = (voiceId: string) => {
    if (activeTab === 'character') {
      setSelectedCharVoice(voiceId);
    } else if (activeTab === 'narrator') {
      setSelectedNarratorVoice(voiceId);
    } else {
      setSelectedGuestVoice(voiceId);
    }
  };

  const handleSaveAndClose = () => {
    stopAllSpeech();
    setPlayingVoiceId(null);
    onSelectVoice(selectedCharVoice, selectedNarratorVoice, selectedGuestVoice);
    onClose();
  };

  const handleClose = () => {
    stopAllSpeech();
    setPlayingVoiceId(null);
    onClose();
  };

  // Filter voices based on tab focus for best user clarity
  const filteredVoices = LISTA_VOCES.filter((v) => {
    if (activeTab === 'narrator') {
      // Prioritize narrator and sensual voices
      return v.id.includes('Narrador') || v.id.includes('Sensual') || v.id.includes('Susurr') || v.id.includes('Aria') || v.id.includes('Pausada');
    }
    if (activeTab === 'guest') {
      return v.id.includes('Invitad') || v.id.includes('Masculin') || v.id.includes('Luna') || v.id.includes('Juvenil') || v.id.includes('Caribena');
    }
    // Character tab: character voices
    return !v.id.includes('Narrador');
  });

  // Current active ID for the current tab
  const currentTabActiveId = 
    activeTab === 'character' ? selectedCharVoice :
    activeTab === 'narrator' ? selectedNarratorVoice :
    selectedGuestVoice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl text-pink-400 border border-pink-500/30">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-serif tracking-tight">Voces de la Historia</h3>
              <p className="text-xs text-zinc-400">Dramatización multi-voz: protagonista, narradora y personajes invitados</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Role Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl my-3">
          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              setPlayingVoiceId(null);
              setActiveTab('character');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'character'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate">Protagonista</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              setPlayingVoiceId(null);
              setActiveTab('narrator');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'narrator'
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-600/30 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">Narradora Sensual</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              setPlayingVoiceId(null);
              setActiveTab('guest');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'guest'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">Invitados</span>
          </button>
        </div>

        {/* Tab Description Banner */}
        <div className="mb-3 px-3 py-2 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-start gap-2.5 text-xs">
          {activeTab === 'character' && (
            <>
              <User className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <p className="text-zinc-300 leading-snug">
                <strong className="text-pink-300">Voz de {characterName}:</strong> Diálogo hablado directo de la protagonista en primera persona (comillas). Recomendado: <span className="text-white font-medium">Scarlett HD</span>.
              </p>
            </>
          )}
          {activeTab === 'narrator' && (
            <>
              <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-zinc-300 leading-snug">
                <strong className="text-amber-300">Narradora Sensual e Intensa:</strong> Voz femenina envolvente y estremecedora para relatar miradas, caricias y la atmósfera que eriza la piel.
              </p>
            </>
          )}
          {activeTab === 'guest' && (
            <>
              <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-zinc-300 leading-snug">
                <strong className="text-purple-300">Personajes Secundarios / Invitados:</strong> Tercera voz automática cuando interviene otro personaje en la escena (ej. Sofía, Carlos, etc.).
              </p>
            </>
          )}
        </div>

        {/* Voice list */}
        <div className="flex-1 overflow-y-auto py-1 space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredVoices.map((voice) => {
            const isSelected = currentTabActiveId === voice.id;
            const isPlaying = playingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => handleSelectCurrentVoice(voice.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? activeTab === 'narrator'
                      ? 'bg-red-950/30 border-red-500/60 shadow-md shadow-red-500/10'
                      : activeTab === 'guest'
                        ? 'bg-purple-950/30 border-purple-500/60 shadow-md shadow-purple-500/10'
                        : 'bg-pink-950/30 border-pink-500/60 shadow-md shadow-pink-500/10'
                    : 'bg-zinc-800/40 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{voice.name}</h4>
                    {isSelected && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        activeTab === 'narrator'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : activeTab === 'guest'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                      }`}>
                        Seleccionada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">{voice.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handlePreview(voice, e)}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isPlaying
                        ? 'bg-pink-600 text-white border-pink-500 shadow-md animate-pulse'
                        : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700 hover:border-zinc-600'
                    }`}
                    title="Escuchar muestra"
                  >
                    {isPlaying ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? activeTab === 'narrator'
                        ? 'bg-red-500 border-red-400 text-white'
                        : activeTab === 'guest'
                          ? 'bg-purple-500 border-purple-400 text-white'
                          : 'bg-pink-500 border-pink-400 text-white'
                      : 'border-zinc-700 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary & Save */}
        <div className="pt-3 sm:pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-3">
            <span>🎭 <strong className="text-white">{resolveVoiceProfile(selectedCharVoice).name.split('·')[0].trim()}</strong></span>
            <span>🔥 <strong className="text-white">{resolveVoiceProfile(selectedNarratorVoice).name.split('·')[0].trim()}</strong></span>
            <span>👥 <strong className="text-white">{resolveVoiceProfile(selectedGuestVoice).name.split('·')[0].trim()}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-pink-600/20 active:scale-95"
            >
              Aplicar Voces
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
