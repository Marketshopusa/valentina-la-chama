import React, { useState } from 'react';
import { X, Volume2, Check, Sparkles, Music } from 'lucide-react';
import { LISTA_VOCES, VoiceProfile } from '../utils/voices';
import { playVoice, stopAllSpeech } from '../utils/speechPlayer';

interface CardVoicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoiceId?: string;
  characterName: string;
  onSelectVoice: (voiceId: string) => void;
}

export const CardVoicePickerModal: React.FC<CardVoicePickerModalProps> = ({
  isOpen,
  onClose,
  currentVoiceId,
  characterName,
  onSelectVoice
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreview = async (voice: VoiceProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoiceId === voice.id) {
      stopAllSpeech();
      setPlayingVoiceId(null);
      return;
    }

    stopAllSpeech();
    setPlayingVoiceId(voice.id);

    const sampleText = `Hola, soy ${characterName}. Me encanta estar aquí contigo.`;
    await playVoice({
      text: sampleText,
      voiceId: voice.id,
      characterName,
      voiceDirective: voice.voiceInstruction,
      baseVoice: voice.baseVoice,
      onStart: () => setPlayingVoiceId(voice.id),
      onEnd: () => setPlayingVoiceId(null),
      onError: () => setPlayingVoiceId(null)
    });
  };

  const handleClose = () => {
    stopAllSpeech();
    setPlayingVoiceId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 rounded-2xl text-pink-400 border border-pink-500/20">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-serif">Voz de {characterName}</h3>
              <p className="text-xs text-zinc-400">Selecciona el tono e interpretación para llamadas y narración</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {LISTA_VOCES.map((voice) => {
            const isSelected = currentVoiceId === voice.id;
            const isPlaying = playingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => {
                  onSelectVoice(voice.id);
                  handleClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-pink-500/15 border-pink-500/50 shadow-lg shadow-pink-500/10'
                    : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{voice.name}</h4>
                    {isSelected && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-300 rounded-full border border-pink-500/30">
                        Activa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{voice.description}</p>
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
                    <Music className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                  </button>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected ? 'bg-pink-500 border-pink-400 text-white' : 'border-zinc-700 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
