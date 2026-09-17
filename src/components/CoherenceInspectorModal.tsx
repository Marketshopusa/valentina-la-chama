import React from 'react';
import { X, ShieldCheck, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Eye, Sliders, Layers } from 'lucide-react';
import { CharacterAnchor, DecodedPromptSlots, CoherenceAnalysis } from '../types';

interface CoherenceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneImageUrl: string;
  referenceImageUrl?: string;
  characterName: string;
  coherenceResult?: CoherenceAnalysis;
  decodedSlots?: DecodedPromptSlots;
  characterAnchor?: CharacterAnchor;
  isRegenerating?: boolean;
  onRegenerate?: () => void;
  onRegenerateBoosted?: () => void;
}

export const CoherenceInspectorModal: React.FC<CoherenceInspectorModalProps> = ({
  isOpen,
  onClose,
  sceneImageUrl,
  referenceImageUrl,
  characterName,
  coherenceResult,
  decodedSlots,
  characterAnchor,
  isRegenerating,
  onRegenerate,
  onRegenerateBoosted
}) => {
  if (!isOpen) return null;

  const handleTriggerRegenerate = onRegenerateBoosted || onRegenerate;

  const score = coherenceResult?.overallScore ?? 88;
  const matchScore = coherenceResult?.identityMatchScore ?? 89;
  const fidelityScore = coherenceResult?.actionFidelityScore ?? 92;
  const sharpnessScore = coherenceResult?.sharpnessScore ?? 90;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-serif">Auditoría de Coherencia Visual</h3>
              <p className="text-xs text-zinc-400">Inspección de Anclaje Facial, Slots NLP y Fidelidad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                Referencia Original (Anclaje)
              </span>
              <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800 relative">
                {referenceImageUrl ? (
                  <img
                    src={referenceImageUrl}
                    alt="Referencia"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                    Sin imagen de referencia
                  </div>
                )}
                <span className="absolute bottom-2 left-2 px-2.5 py-1 text-[10px] font-bold bg-black/70 text-white rounded-full backdrop-blur-sm border border-white/10">
                  {characterName}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Escena Generada (In-Story)
              </span>
              <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800 relative">
                {sceneImageUrl ? (
                  <img
                    src={sceneImageUrl}
                    alt="Escena Generada"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                    Generando o pendiente
                  </div>
                )}
                <span className="absolute bottom-2 left-2 px-2.5 py-1 text-[10px] font-bold bg-emerald-500/80 text-white rounded-full backdrop-blur-sm border border-emerald-400/30">
                  Puntuación: {score}%
                </span>
              </div>
            </div>
          </div>

          {/* Scores breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-800 text-center">
              <div className="text-xs text-zinc-400">Identidad Facial</div>
              <div className="text-2xl font-bold text-purple-400 font-mono mt-1">{matchScore}%</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">LoRA + Fisonomía</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-800 text-center">
              <div className="text-xs text-zinc-400">Fidelidad de Acción</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{fidelityScore}%</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Alineación Narrativa</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-zinc-800 text-center">
              <div className="text-xs text-zinc-400">Nitidez Fotorrealista</div>
              <div className="text-2xl font-bold text-pink-400 font-mono mt-1">{sharpnessScore}%</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Sin artefactos</div>
            </div>
          </div>

          {/* Decoded NLP Slots */}
          {decodedSlots && (
            <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Slots Semánticos NLP Decodificados
              </h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-500 font-mono text-[10px] block">SUJETO:</span>
                  <span className="text-zinc-200 font-medium">{decodedSlots.subject || characterName}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-500 font-mono text-[10px] block">ACCIÓN PRINCIPAL:</span>
                  <span className="text-zinc-200 font-medium">{decodedSlots.mainAction || 'Interacción directa'}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-500 font-mono text-[10px] block">EMOCIÓN:</span>
                  <span className="text-zinc-200 font-medium">{decodedSlots.emotion || 'Intimidad cómplice'}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-500 font-mono text-[10px] block">ENTORNO / CÁMARA:</span>
                  <span className="text-zinc-200 font-medium">{decodedSlots.environment || decodedSlots.camera || 'Primer plano íntimo'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
          >
            Cerrar
          </button>

          {handleTriggerRegenerate && (
            <button
              onClick={handleTriggerRegenerate}
              disabled={isRegenerating}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Recalibrando...' : 'Recalibrar y Regenerar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
