import React, { useState, useRef } from 'react';
import { X, ImagePlus, Check, ChevronDown, Sparkles, Film, Trash2, Loader2 } from 'lucide-react';
import { StoryScenario, Persona } from '../types';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStory: (scenario: StoryScenario) => void;
  personas: Persona[];
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onCreateStory,
  personas
}) => {
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [userRole, setUserRole] = useState('hombre');
  const [aiCharacter, setAiCharacter] = useState('');
  const [storyType, setStoryType] = useState('Juego de Roles');
  const [isExplicit18, setIsExplicit18] = useState(true);
  const [development, setDevelopment] = useState('');
  const [voiceParam, setVoiceParam] = useState<string>('auto');
  
  // Media state (Image, GIF, Video)
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'gif'>('image');
  const [mediaName, setMediaName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const isVid = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
    const isGif = file.type === 'image/gif' || file.name.endsWith('.gif');
    
    setMediaType(isVid ? 'video' : isGif ? 'gif' : 'image');
    setMediaName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      setMediaUrl(result);
      // Persist to permanent server uploads folder immediately
      try {
        const uploadRes = await fetch('/api/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ media: result, scenarioId: `story_${Date.now()}` })
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            setMediaUrl(uploadData.url);
          }
        }
      } catch (uploadErr) {
        console.warn("Upload to /api/upload-media notice:", uploadErr);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert("Error al leer el archivo seleccionado.");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateCardImage = async () => {
    setIsGeneratingImage(true);
    try {
      let charName = "Valentina";
      let charRole = "personaje";
      if (aiCharacter.trim()) {
        const match = aiCharacter.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          charName = match[1].trim();
          charRole = match[2].trim();
        } else {
          charName = aiCharacter.trim();
        }
      }

      const res = await fetch('/api/generate-card-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: charName,
          characterRole: charRole,
          storyType,
          description: shortDescription || title
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setMediaUrl(data.imageUrl);
          setMediaType('image');
          setMediaName(`Portada IA: ${charName}`);
          return;
        }
      }
      throw new Error("No image returned");
    } catch (err) {
      console.error("Error generating card image:", err);
      const seed = Math.floor(Math.random() * 899999) + 100000;
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`Cinematic 35mm vertical portrait of beautiful alluring woman, 8k, photorealistic`)}?width=768&height=1152&nologo=true&model=flux&seed=${seed}`;
      setMediaUrl(fallbackUrl);
      setMediaType('image');
      setMediaName('Portada IA generada');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCreate = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert("Por favor ingresa un título para la historia.");
      return;
    }

    // Parse character name and role from aiCharacter input
    // e.g. "Valentina (hermanastra)" -> name: "Valentina", role: "hermanastra"
    let charName = "Valentina";
    let charRole = "personaje";

    if (aiCharacter.trim()) {
      const match = aiCharacter.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        charName = match[1].trim();
        charRole = match[2].trim();
      } else if (aiCharacter.includes('-')) {
        const parts = aiCharacter.split('-');
        charName = parts[0].trim();
        charRole = parts[1].trim();
      } else {
        charName = aiCharacter.trim();
        charRole = aiCharacter.trim();
      }
    }

    // Default cover if none uploaded
    const defaultCover = mediaUrl || personas[0]?.defaultImage || 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=1500';

    let finalDevelopment = development.trim();
    if (voiceParam && voiceParam !== 'auto') {
      const voiceLabels: Record<string, string> = {
        suave_tierna: 'Su voz es suave, tierna, dulce y angelical.',
        coqueta: 'Su voz es coqueta, pícara y seductora.',
        sensual: 'Su voz es sensual, cálida y aterciopelada.',
        susurrada: 'Su voz es susurrada al oído estilo ASMR íntimo.',
        juvenil: 'Su voz es juvenil, alegre y fresca.',
        pausada: 'Su voz es pausada, serena y madura.',
        masculina: 'Su voz es masculina, firme y varonil.'
      };
      if (voiceLabels[voiceParam]) {
        finalDevelopment = finalDevelopment ? `${finalDevelopment}\n[Parámetro de voz]: ${voiceLabels[voiceParam]}` : `[Parámetro de voz]: ${voiceLabels[voiceParam]}`;
      }
    }

    const now = Date.now();
    const newScenario: StoryScenario = {
      id: `story_${now}`,
      title: trimmedTitle.toLowerCase(),
      synopsis: shortDescription.trim() || `Una intensa historia de ${storyType.toLowerCase()} entre tú y ${charName}.`,
      characterName: charName,
      characterRole: charRole,
      userRole: userRole.trim() || 'hombre',
      userName: userRole.trim() || 'willian',
      storyType,
      isExplicit18,
      development: finalDevelopment,
      coverImage: defaultCover,
      personaId: personas[0]?.id || 'ven_ccs',
      initialPrompt: undefined,
      createdAt: now,
      updatedAt: now
    };

    onCreateStory(newScenario);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Modal Container matching screenshot styling exactly */}
      <div 
        id="modal-crear-nueva-historia"
        className="w-full max-w-[490px] bg-[#140e1f] border border-purple-500/20 rounded-[24px] shadow-2xl p-5 sm:p-7 text-white flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Crear Nueva Historia
          </h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-3.5 text-xs sm:text-sm">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 font-medium text-xs">
              Título
            </label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la historia"
              className="w-full bg-[#1b1528] border-2 border-[#d926a9] focus:border-[#f43f5e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-[0_0_12px_rgba(217,38,169,0.2)]"
              autoFocus
            />
          </div>

          {/* Descripción corta */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 font-medium text-xs">
              Descripción corta
            </label>
            <input 
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Una línea que enganche al lector"
              className="w-full bg-[#1b1528] border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Tu rol & Personaje IA (2 cols) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 font-medium text-xs">
                Tu rol
              </label>
              <input 
                type="text"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                placeholder="hombre"
                className="w-full bg-[#1b1528] border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 font-medium text-xs">
                Personaje IA
              </label>
              <input 
                type="text"
                value={aiCharacter}
                onChange={(e) => setAiCharacter(e.target.value)}
                placeholder="Nombre y rol del personaje"
                className="w-full bg-[#1b1528] border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Tipo & +18 Contenido explícito */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 font-medium text-xs">
                Tipo
              </label>
              <div className="relative">
                <select
                  value={storyType}
                  onChange={(e) => setStoryType(e.target.value)}
                  className="w-full appearance-none bg-[#1b1528] border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 pr-8 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="Juego de Roles" className="bg-[#140e1f] text-white">Juego de Roles</option>
                  <option value="Romance Apasionado" className="bg-[#140e1f] text-white">Romance</option>
                  <option value="Fantasía Prohibida" className="bg-[#140e1f] text-white">Fantasía</option>
                  <option value="Misterio & Suspenso" className="bg-[#140e1f] text-white">Suspenso</option>
                  <option value="Drama Personalizado" className="bg-[#140e1f] text-white">Drama</option>
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Switch +18 */}
            <div className="flex items-center gap-2.5 pb-1">
              <button
                type="button"
                onClick={() => setIsExplicit18(!isExplicit18)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                  isExplicit18 ? 'bg-[#7c3aed]' : 'bg-zinc-800'
                }`}
                role="switch"
                aria-checked={isExplicit18}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isExplicit18 ? 'translate-x-6' : 'translate-x-0'
                  }`} 
                />
              </button>
              <span className="text-xs font-semibold text-zinc-200 select-none">
                +18 Contenido explícito
              </span>
            </div>
          </div>

          {/* Parámetro de Voz del Personaje */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 font-medium text-xs flex items-center justify-between">
              <span>Parámetro y Tono de Voz</span>
              <span className="text-[10px] text-purple-400">Adaptable por orden</span>
            </label>
            <div className="relative">
              <select
                value={voiceParam}
                onChange={(e) => setVoiceParam(e.target.value)}
                className="w-full appearance-none bg-[#1b1528] border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 pr-8 text-sm text-white outline-none cursor-pointer"
              >
                <option value="auto" className="bg-[#140e1f] text-white">Adaptar automáticamente según lo que escribas en la orden 🎯</option>
                <option value="suave_tierna" className="bg-[#140e1f] text-white">Voz Suave, Tierna y Dulce 🍭</option>
                <option value="coqueta" className="bg-[#140e1f] text-white">Voz Coqueta y Seductora 💋</option>
                <option value="sensual" className="bg-[#140e1f] text-white">Voz Sensual y Cálida 🔥</option>
                <option value="susurrada" className="bg-[#140e1f] text-white">Voz Íntima Susurrada ASMR 🤫</option>
                <option value="juvenil" className="bg-[#140e1f] text-white">Voz Juvenil y Alegre 🎀</option>
                <option value="pausada" className="bg-[#140e1f] text-white">Voz Pausada y Serena ☕</option>
                <option value="masculina" className="bg-[#140e1f] text-white">Voz Masculina Firme y Serena 🎙️</option>
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Desarrollo (opcional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 font-medium text-xs">
              Desarrollo (opcional)
            </label>
            <textarea 
              rows={3}
              value={development}
              onChange={(e) => setDevelopment(e.target.value)}
              placeholder="Escribe tu historia..."
              className="w-full bg-[#1b1528] border border-white/10 focus:border-purple-500 rounded-xl p-3 text-sm text-white placeholder-zinc-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Agregar portada (imagen, gif o video) */}
          <div className="flex flex-col gap-2">
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,.gif"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!mediaUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isGeneratingImage}
                  className="py-3 px-3 rounded-xl border border-white/15 hover:border-pink-500/50 bg-[#191325] hover:bg-[#201830] transition-all flex items-center justify-center gap-2 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer active:scale-[0.99]"
                >
                  <ImagePlus className="w-4 h-4 text-pink-400" />
                  <span>{isUploading ? 'Cargando...' : 'Subir archivo'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateCardImage}
                  disabled={isUploading || isGeneratingImage}
                  className="py-3 px-3 rounded-xl border border-purple-500/40 hover:border-purple-400 bg-gradient-to-r from-purple-950/60 to-pink-950/60 hover:from-purple-900/60 hover:to-pink-900/60 transition-all flex items-center justify-center gap-2 text-pink-300 hover:text-white text-xs font-medium cursor-pointer active:scale-[0.99] shadow-md shadow-purple-950/40"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span>Generar con IA</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-pink-500/40 bg-black/40 flex items-center p-2 gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10">
                  {mediaType === 'video' ? (
                    <video src={mediaUrl} className="w-full h-full object-cover" muted autoPlay loop />
                  ) : (
                    <img src={mediaUrl} alt="Portada" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-xs">
                  <div className="text-white font-medium truncate">{mediaName || 'Portada personalizada'}</div>
                  <span className="text-[10px] text-pink-400 uppercase tracking-wider font-semibold">
                    {mediaType.toUpperCase()} CARGADO
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleGenerateCardImage}
                    disabled={isGeneratingImage}
                    className="p-1.5 text-pink-400 hover:text-pink-300 rounded-lg hover:bg-pink-950/40 text-xs cursor-pointer flex items-center gap-1"
                    title="Generar nueva foto con IA"
                  >
                    {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span className="text-[11px] hidden sm:inline">IA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 text-xs"
                    title="Cambiar archivo"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaUrl('');
                      setMediaName('');
                    }}
                    className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40"
                    title="Eliminar portada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons (Matches screenshot: Cancelar + Crear) */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-zinc-300 hover:text-white bg-[#1a1428] hover:bg-[#231b35] border border-white/10 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="px-6 py-2.5 rounded-xl bg-[#d926a9] hover:bg-[#c026d3] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-pink-900/30 active:scale-95 transition-all cursor-pointer"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
};
export default CreateStoryModal;
