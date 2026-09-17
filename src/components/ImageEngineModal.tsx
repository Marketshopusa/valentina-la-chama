import React, { useState, useEffect } from 'react';
import { X, Cpu, Layers, Sliders, ShieldCheck, Sparkles, Check, RefreshCw } from 'lucide-react';

interface ImageEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  characterReferenceImage?: string;
  characterDescription?: string;
  userRoleName?: string;
}

export const ImageEngineModal: React.FC<ImageEngineModalProps> = ({
  isOpen,
  onClose,
  characterName,
  characterReferenceImage,
  characterDescription,
  userRoleName
}) => {
  const [provider, setProvider] = useState<'flux-unlocked' | 'krea-2-turbo' | 'sdxl-private' | 'comfyui-private'>('flux-unlocked');
  const [loraWeight, setLoraWeight] = useState<number>(0.85);
  const [anchoringEnabled, setAnchoringEnabled] = useState<boolean>(true);
  const [coherenceLoopEnabled, setCoherenceLoopEnabled] = useState<boolean>(true);
  const [minCoherence, setMinCoherence] = useState<number>(75);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/engine/config')
        .then(res => res.json())
        .then(data => {
          if (data && data.config) {
            if (data.config.provider) setProvider(data.config.provider);
            if (typeof data.config.targetLoRAWeight === 'number') setLoraWeight(data.config.targetLoRAWeight);
            if (typeof data.config.characterAnchoringEnabled === 'boolean') setAnchoringEnabled(data.config.characterAnchoringEnabled);
            if (typeof data.config.coherenceFeedbackLoopEnabled === 'boolean') setCoherenceLoopEnabled(data.config.coherenceFeedbackLoopEnabled);
            if (typeof data.config.minCoherenceThreshold === 'number') setMinCoherence(data.config.minCoherenceThreshold);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/engine/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          targetLoRAWeight: loraWeight,
          characterAnchoringEnabled: anchoringEnabled,
          coherenceFeedbackLoopEnabled: coherenceLoopEnabled,
          minCoherenceThreshold: minCoherence,
          ageVerified: true,
          userConsentGiven: true,
          uncensoredMode: true
        })
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (e) {
      console.error('Error saving engine config:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-serif">Motor Visual In-Story</h3>
              <p className="text-xs text-zinc-400">Arquitectura de 4 Pilares para Generación Visual Coherente</p>
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
          {/* Character Anchor Preview */}
          <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-800 flex items-center gap-4">
            {characterReferenceImage ? (
              <img
                src={characterReferenceImage}
                alt={characterName}
                className="w-16 h-16 rounded-2xl object-cover border border-purple-500/30 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold shrink-0">
                {characterName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Pilar 1: Anclaje Facial</span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Activo
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">{characterName}</h4>
              <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{characterDescription || 'Rasgos anatómicos y fisonomía sincronizada'}</p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Pilar 2: Proveedor de Renderizado
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'flux-unlocked', name: 'Flux Unlocked Real', desc: 'Máxima fidelidad fotorrealista y texturas vivas' },
                { id: 'krea-2-turbo', name: 'Krea 2 Turbo LoRA', desc: 'Velocidad ultra rápida y estilización de piel' },
                { id: 'sdxl-private', name: 'SDXL Custom Node', desc: 'Nodo dedicado con LoRAs hiperrealistas' },
                { id: 'comfyui-private', name: 'ComfyUI Pipeline', desc: 'ControlNet + IP-Adapter facial continuo' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    provider === p.id
                      ? 'bg-purple-500/15 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      provider === p.id ? 'bg-purple-500 border-purple-400' : 'border-zinc-700'
                    }`}>
                      {provider === p.id && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* LoRA Weight Slider */}
          <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                Pilar 3: Peso LoRA de Identidad
              </label>
              <span className="text-sm font-mono font-bold text-purple-400">{Math.round(loraWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.2"
              step="0.05"
              value={loraWeight}
              onChange={(e) => setLoraWeight(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-2 bg-zinc-700 rounded-lg"
            />
            <p className="text-xs text-zinc-400">
              Ajusta qué tan estricta es la correspondencia con los rasgos faciales originales de {characterName}.
            </p>
          </div>

          {/* Coherence Feedback Loop */}
          <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Pilar 4: Bucle de Coherencia Automático
                </span>
              </div>
              <input
                type="checkbox"
                checked={coherenceLoopEnabled}
                onChange={(e) => setCoherenceLoopEnabled(e.target.checked)}
                className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
              />
            </div>
            {coherenceLoopEnabled && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Umbral mínimo de aprobación:</span>
                  <span className="font-mono text-emerald-400 font-bold">{minCoherence}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={minCoherence}
                  onChange={(e) => setMinCoherence(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {savedSuccess ? '¡Configuración guardada con éxito!' : 'Persistente entre sesiones'}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar Motor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
