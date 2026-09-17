import React, { useState } from 'react';
import { X, BookOpen, Plus, Play, Sparkles, User, Flame, Trash2, Film } from 'lucide-react';
import { StoryScenario, Persona } from '../types';
import { CreateStoryModal } from './CreateStoryModal';

interface StorySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: StoryScenario[];
  activeScenarioId: string;
  onSelectScenario: (scenario: StoryScenario) => void;
  onCreateScenario: (newScenario: StoryScenario) => void;
  personas: Persona[];
  onDeleteScenario?: (id: string) => Promise<void> | void;
  currentUser?: any;
  onOpenAuthModal?: () => void;
}

const isVideoMedia = (url?: string) => {
  if (!url) return false;
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video/') || url.startsWith('data:video');
};

export const StorySelectorModal: React.FC<StorySelectorModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onCreateScenario,
  personas,
  onDeleteScenario
}) => {
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  if (isCreating) {
    return (
      <CreateStoryModal
        isOpen={true}
        onClose={() => setIsCreating(false)}
        onCreateStory={(newScen) => {
          onCreateScenario(newScen);
          setIsCreating(false);
          onClose();
        }}
        personas={personas}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#141021] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 flex items-center justify-center shadow-lg">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Catálogo de Historias & Roleplay</h2>
              <p className="text-xs text-zinc-400">Guarda hasta 6 historias (FIFO: la más antigua cede su lugar a la más nueva)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Historias Activas ({scenarios.length}/6)
              </span>
              {scenarios.length >= 6 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                  Cupo lleno (FIFO activo)
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-3.5 py-1.5 rounded-xl bg-pink-600/90 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Historia</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scenarios.map((scen) => {
              const isActive = scen.id === activeScenarioId;
              const hasVideo = isVideoMedia(scen.coverImage);

              return (
                <div 
                  key={scen.id}
                  onClick={() => {
                    onSelectScenario(scen);
                    onClose();
                  }}
                  className={`
                    group relative rounded-2xl overflow-hidden border p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between
                    ${isActive 
                      ? 'border-pink-500 bg-pink-950/20 shadow-lg shadow-pink-900/20' 
                      : 'border-white/10 bg-zinc-900/60 hover:border-purple-500/50 hover:bg-zinc-900/90'}
                  `}
                >
                  <div>
                    {scen.coverImage && (
                      <div className="h-32 -mx-4 -mt-4 mb-3 overflow-hidden relative bg-black/50">
                        {hasVideo ? (
                          <video 
                            src={scen.coverImage} 
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <img 
                            src={scen.coverImage} 
                            alt={scen.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141021] via-[#141021]/30 to-transparent pointer-events-none" />
                        {hasVideo && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-pink-300 font-medium flex items-center gap-1 pointer-events-none">
                            <Film className="w-3 h-3" />
                            <span>Video</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-white capitalize text-sm group-hover:text-pink-400 transition-colors truncate">
                        {scen.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-bold uppercase">
                            Activa
                          </span>
                        )}
                        {onDeleteScenario && scenarios.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`¿Estás seguro de eliminar la historia "${scen.title}"?`)) {
                                onDeleteScenario(scen.id);
                              }
                            }}
                            className="p-1 rounded-lg bg-black/50 hover:bg-rose-600/80 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            title="Eliminar historia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {scen.synopsis}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>tú: <b className="text-white">{scen.userName || 'willian'}</b></span>
                    <span>rol: <b className="text-pink-300">{scen.characterRole}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default StorySelectorModal;
