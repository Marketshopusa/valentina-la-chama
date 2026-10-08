import React, { useState, useRef, useEffect } from 'react';
import { X, ImagePlus, Check, ChevronDown, Sparkles, Film, Trash2, Loader2, Volume2, VolumeX, Plus, Video, Flame, User, Users, Play, Square } from 'lucide-react';
import { StoryScenario, Persona } from '../types';
import { playVoice, stopAllSpeech, unlockAudioContext } from '../utils/speechPlayer';
import { DEFAULT_NARRATOR_VOICE_ID, DEFAULT_GUEST_VOICE_ID, resolveVoiceProfile } from '../utils/voices';
import { isVideoUrl } from '../utils/mediaUtils';

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
  const [voiceParam, setVoiceParam] = useState<string>('scarlett_hd');
  const [narratorVoiceId, setNarratorVoiceId] = useState<string>(DEFAULT_NARRATOR_VOICE_ID);
  const [guestVoiceId, setGuestVoiceId] = useState<string>(DEFAULT_GUEST_VOICE_ID);
  const [voiceTab, setVoiceTab] = useState<'character' | 'narrator' | 'guest'>('character');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  
  // Media slots state (Up to 6 videos/images for sequential carousel)
  const [mediaSlots, setMediaSlots] = useState<string[]>(['', '', '', '', '', '']);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      let finalUrl = result;
      try {
        const uploadRes = await fetch('/api/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ media: result })
        });
        if (uploadRes.ok) {
          const upData = await uploadRes.json();
          if (upData.url) {
            finalUrl = upData.url;
          }
        }
      } catch (e) {
        console.warn("Upload to server failed, using local DataURL:", e);
      }
      setMediaSlots(prev => {
        const updated = [...prev];
        updated[activeSlotIndex] = finalUrl;
        return updated;
      });
      setIsUploading(false);
      // Automatically advance focus to the next empty slot if available
      const nextEmpty = mediaSlots.findIndex((s, idx) => idx > activeSlotIndex && !s);
      if (nextEmpty !== -1) {
        setActiveSlotIndex(nextEmpty);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert("Error al leer el archivo seleccionado.");
    };
    reader.readAsDataURL(file);
    // Reset file input so user can re-select the same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateCardImage = async () => {
    setIsGeneratingImage(true);
    try {
      let charName = "Personaje";
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
          setMediaSlots(prev => {
            const updated = [...prev];
            updated[activeSlotIndex] = data.imageUrl;
            return updated;
          });
          return;
        }
      }
      throw new Error("No image returned");
    } catch (err) {
      console.error("Error generating card image:", err);
      const seed = Math.floor(Math.random() * 899999) + 100000;
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`Cinematic 35mm vertical portrait of beautiful alluring woman, 8k, photorealistic`)}?width=768&height=1152&nologo=true&model=flux&seed=${seed}`;
      setMediaSlots(prev => {
        const updated = [...prev];
        updated[activeSlotIndex] = fallbackUrl;
        return updated;
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleTestVoice = async (targetVoiceId?: string) => {
    unlockAudioContext();
    const effectiveVoiceId = targetVoiceId || (
      voiceTab === 'character' ? voiceParam :
      voiceTab === 'narrator' ? narratorVoiceId :
      guestVoiceId
    );

    if (playingVoiceId === effectiveVoiceId) {
      stopAllSpeech();
      setPlayingVoiceId(null);
      return;
    }

    stopAllSpeech();
    setPlayingVoiceId(effectiveVoiceId);

    const profile = resolveVoiceProfile(effectiveVoiceId);
    let sampleText = "Hola amor... me fascina cuando me miras con esa picardía... acércate despacio y siente cómo se me agita la respiración...";

    if (voiceTab === 'narrator' || effectiveVoiceId.includes('Narrador')) {
      sampleText = "Se acerca a ti con la respiración agitada y una sonrisa pícara... susurra lentamente mientras roza tu cuello, haciendo que tu piel se estremezca...";
    } else if (voiceTab === 'guest' || effectiveVoiceId.includes('Invitad')) {
      sampleText = "¿Qué están haciendo ustedes dos aquí tan juntitos? Jeje... no me digan que empezaron sin mí...";
    } else if (effectiveVoiceId === 'Luna_Sweet') {
      sampleText = "¡Hola corazón! Jeje... mira cómo se me escapa una risita pícara cuando me tienes tan cerquita...";
    } else if (effectiveVoiceId === 'Aria_Calm') {
      sampleText = "Hola... siente la calma y la calidez de mi voz mientras el tiempo parece detenerse entre los dos.";
    }

    const charName = aiCharacter || 'personaje';

    await playVoice({
      text: sampleText,
      voiceId: profile.id,
      characterName: charName,
      voiceDirective: profile.voiceInstruction,
      baseVoice: profile.baseVoice,
      onStart: () => setPlayingVoiceId(effectiveVoiceId),
      onEnd: () => setPlayingVoiceId(null),
      onError: () => setPlayingVoiceId(null)
    });
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert("Por favor ingresa un título para la historia.");
      return;
    }

    // Parse character name and role from aiCharacter input
    // e.g. "Laura (hermanastra)" -> name: "Laura", role: "hermanastra"
    let charName = "Personaje";
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

    const storyId = `story_${Date.now()}`;
    const uploadedSlots: string[] = [];
    for (let i = 0; i < mediaSlots.length; i++) {
      let slotMedia = mediaSlots[i];
      if (slotMedia && slotMedia.startsWith('data:')) {
        try {
          const uploadRes = await fetch('/api/upload-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ media: slotMedia, scenarioId: storyId })
          });
          if (uploadRes.ok) {
            const upData = await uploadRes.json();
            if (upData.url) slotMedia = upData.url;
          }
        } catch (e) {
          console.warn("Upload failed, keeping media:", e);
        }
      }
      if (slotMedia) {
        uploadedSlots.push(slotMedia);
      }
    }

    let finalCover = uploadedSlots[0] || personas[0]?.defaultImage || '';
    const finalMediaList = uploadedSlots.length > 0 ? uploadedSlots : (finalCover ? [finalCover] : []);

    let finalDevelopment = development.trim();
    const chosenVoice = voiceParam || 'scarlett_hd';
    const voiceLabels: Record<string, string> = {
      scarlett_hd: 'Su voz es Scarlett HD: femenina, suave, seductora y apasionada.',
      luna_sweet: 'Su voz es Luna Sweet: femenina, dulce, juguetona y mimada.',
      aria_calm: 'Su voz es Aria Calm: femenina, serena, pausada y elegante.',
      coqueta: 'Su voz es coqueta, pícara y seductora.',
      sensual: 'Su voz es sensual, cálida y aterciopelada.',
      suave_tierna: 'Su voz es suave, tierna, dulce y delicada.',
      susurrada: 'Su voz es susurrada al oído estilo ASMR íntimo.',
      juvenil: 'Su voz es juvenil, alegre y fresca.',
      pausada: 'Su voz es pausada, serena y madura.',
      apasionada: 'Su voz es apasionada, ardiente, romántica y profundamente expresiva.',
      sofisticada: 'Su voz es sofisticada, culta, distinguida y elegante.',
      caribena: 'Su voz es caribeña, alegre, cálida y musical.',
      masculina: 'Su voz es masculina, firme y varonil.',
      masculina_joven: 'Su voz es masculina joven, fresca, enérgica y casual.'
    };
    if (voiceLabels[chosenVoice]) {
      finalDevelopment = finalDevelopment ? `${finalDevelopment}\n[Parámetro de voz]: ${voiceLabels[chosenVoice]}` : `[Parámetro de voz]: ${voiceLabels[chosenVoice]}`;
    }

    const newScenario: StoryScenario = {
      id: storyId,
      title: trimmedTitle,
      synopsis: shortDescription.trim() || `Una intensa historia de ${storyType.toLowerCase()} entre tú y ${charName}.`,
      characterName: charName,
      characterRole: charRole,
      userRole: userRole.trim() || 'hombre',
      userName: userRole.trim() || 'willian',
      storyType,
      isExplicit18,
      development: finalDevelopment,
      voiceStyle: chosenVoice,
      narratorVoiceId: narratorVoiceId,
      guestVoiceId: guestVoiceId,
      coverImage: finalCover,
      mediaList: finalMediaList,
      personaId: personas[0]?.id || 'ven_ccs',
      initialPrompt: undefined
    };

    try {
      localStorage.setItem(`scenario_voice_${storyId}`, chosenVoice);
      localStorage.setItem(`scenario_narrator_${storyId}`, narratorVoiceId);
      localStorage.setItem(`scenario_guest_${storyId}`, guestVoiceId);
      localStorage.setItem('op_card_voice_id', chosenVoice);
      localStorage.setItem('character_selected_voice', chosenVoice);
      localStorage.setItem('op_card_narrator_voice_id', narratorVoiceId);
      localStorage.setItem('op_card_guest_voice_id', guestVoiceId);
    } catch (e) {}

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

          {/* Configuración y Orquestación Multi-Voz de la Historia */}
          <div className="flex flex-col gap-2.5 bg-[#171124] p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-zinc-200 font-semibold text-xs flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-pink-400" />
                <span>Voces de la Historia (Dramatización Multi-Voz)</span>
              </label>
              <span className="text-[10px] text-pink-400 font-mono">3 Roles Disponibles</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Configura y cambia cuando quieras la voz de la protagonista, la narradora sensual (eriza la piel) y los personajes secundarios o invitados.
            </p>

            {/* Selector de pestañas de voz */}
            <div className="flex items-center gap-1.5 p-1 bg-[#120d1c] border border-white/5 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  stopAllSpeech();
                  setPlayingVoiceId(null);
                  setVoiceTab('character');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  voiceTab === 'character'
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
                  setVoiceTab('narrator');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  voiceTab === 'narrator'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md shadow-red-600/30 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
                  setVoiceTab('guest');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  voiceTab === 'guest'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="truncate">Invitados</span>
              </button>
            </div>

            {/* Explicación de la pestaña activa */}
            <div className="px-3 py-2 rounded-xl bg-black/30 border border-white/5 text-[11px] text-zinc-300">
              {voiceTab === 'character' && (
                <p>🎭 <strong>Diálogo de la Protagonista:</strong> Voz para el diálogo hablado entre comillas ("...") con expresiones ardientes, sonrisas pícaras y susurros íntimos.</p>
              )}
              {voiceTab === 'narrator' && (
                <p>🔥 <strong>Narradora Sensual e Intensa:</strong> Relata las acotaciones, caricias, miradas y respiración agitada para hacer estremecer la piel del oyente.</p>
              )}
              {voiceTab === 'guest' && (
                <p>👥 <strong>Personajes Secundarios / Invitados:</strong> Tercera voz asignada automáticamente cuando interviene otro personaje en la escena (ej. Sofía o Carlos).</p>
              )}
            </div>

            {/* Dropdown del rol activo + botón Probar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                {voiceTab === 'character' && (
                  <select
                    value={voiceParam}
                    onChange={(e) => setVoiceParam(e.target.value)}
                    className="w-full appearance-none bg-[#1b1528] border border-white/10 focus:border-pink-500 rounded-xl px-3.5 py-2.5 pr-8 text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="scarlett_hd">Scarlett HD · Femenina, suave y apasionada (Recomendada)</option>
                    <option value="luna_sweet">Luna Sweet · Femenina, dulce y juguetona</option>
                    <option value="aria_calm">Aria Calm · Femenina, serena y elegante</option>
                    <option value="coqueta">Voz Coqueta y Seductora 💋</option>
                    <option value="sensual">Voz Sensual y Cálida 🔥</option>
                    <option value="suave_tierna">Voz Suave, Tierna y Dulce 🍭</option>
                    <option value="susurrada">Voz Íntima Susurrada ASMR 🤫</option>
                    <option value="juvenil">Voz Juvenil y Alegre 🎀</option>
                    <option value="pausada">Voz Pausada y Serena ☕</option>
                    <option value="apasionada">Voz Apasionada y Ardiente ❤️</option>
                    <option value="sofisticada">Voz Sofisticada y Culta 👠</option>
                    <option value="caribena">Voz Caribeña y Alegre 🌴</option>
                    <option value="masculina">Voz Masculina Firme y Serena 🎙️</option>
                    <option value="masculina_joven">Voz Masculina Joven y Enérgica ⚡</option>
                  </select>
                )}

                {voiceTab === 'narrator' && (
                  <select
                    value={narratorVoiceId}
                    onChange={(e) => setNarratorVoiceId(e.target.value)}
                    className="w-full appearance-none bg-[#1b1528] border border-white/10 focus:border-red-500 rounded-xl px-3.5 py-2.5 pr-8 text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="Narradora_Intensa">Narradora Sensual e Intensa 🔥 (Recomendada: eriza la piel)</option>
                    <option value="Narradora_Misterio">Narradora Misterio y ASMR 🌙 (Susurros provocadores)</option>
                    <option value="Narradora_Elegante">Narradora Elegante y Serena 📖 (Cadencia de audionovela)</option>
                    <option value="Voz_Sensual">Voz Sensual y Cálida 🔥</option>
                    <option value="Voz_Susurrante">Voz Íntima ASMR 🤫</option>
                  </select>
                )}

                {voiceTab === 'guest' && (
                  <select
                    value={guestVoiceId}
                    onChange={(e) => setGuestVoiceId(e.target.value)}
                    className="w-full appearance-none bg-[#1b1528] border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 pr-8 text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="Invitada_Coqueta">Invitada Coqueta y Atrevida 💋 (Femenina pícara)</option>
                    <option value="Invitado_Varonil">Invitado Varonil y Firme 🎙️ (Masculina madura)</option>
                    <option value="Luna_Sweet">Luna Sweet · Femenina juguetona</option>
                    <option value="Voz_Juvenil">Voz Juvenil y Alegre 🎀</option>
                    <option value="Voz_Masculina_Joven">Masculina Joven y Enérgica ⚡</option>
                    <option value="Voz_Caribena">Femenina Caribeña 🌴</option>
                  </select>
                )}
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Botón para probar la voz */}
              <button
                type="button"
                onClick={() => handleTestVoice()}
                title={playingVoiceId ? "Detener prueba" : "Escuchar muestra con respiración agitada y tono seductor"}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                  playingVoiceId
                    ? 'bg-pink-600 text-white border-pink-500 shadow-md animate-pulse'
                    : 'bg-[#1b1528] border-white/10 hover:border-pink-500/50 text-zinc-300 hover:text-white'
                }`}
              >
                {playingVoiceId ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
            </div>

            {/* Resumen de configuración de voces */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400 pt-1 border-t border-white/5">
              <span>🎭 Protagonista: <strong className="text-white">{resolveVoiceProfile(voiceParam).name.split('·')[0].trim()}</strong></span>
              <span>🔥 Narradora: <strong className="text-white">{resolveVoiceProfile(narratorVoiceId).name.split('·')[0].trim()}</strong></span>
              <span>👥 Invitados: <strong className="text-white">{resolveVoiceProfile(guestVoiceId).name.split('·')[0].trim()}</strong></span>
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

          {/* Carrusel de Medios (Hasta 6 videos/imágenes para secuencia de película) */}
          <div className="flex flex-col gap-2.5 bg-[#171124] p-3 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-zinc-200 font-semibold text-xs flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-pink-400" />
                <span>Película / Carrusel (6 Videos o Imágenes)</span>
              </label>
              <span className="text-[10px] text-pink-300 font-medium bg-pink-950/60 px-2 py-0.5 rounded-full border border-pink-500/30">
                {mediaSlots.filter(Boolean).length}/6 listos
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Agrega hasta 6 videos o fotos. Correrán como una película en carrusel rotativo continuo (termina uno, inicia el otro con su tiempo correspondiente y vuelve al primero).
            </p>

            {/* Selector interactivo de las 6 ranuras */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const item = mediaSlots[idx];
                const isSelected = activeSlotIndex === idx;
                const isVid = isVideoUrl(item);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlotIndex(idx)}
                    className={`relative rounded-xl p-1 flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer aspect-square overflow-hidden group ${
                      isSelected
                        ? 'border-pink-500 bg-pink-950/50 ring-2 ring-pink-500/60 shadow-lg shadow-pink-950/60'
                        : item
                        ? 'border-white/15 bg-black/40 hover:border-pink-500/40'
                        : 'border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] hover:border-pink-500/30'
                    }`}
                  >
                    {item ? (
                      <>
                        {isVid ? (
                          <video src={item} muted autoPlay loop playsInline className="w-full h-full object-cover rounded-lg absolute inset-0 opacity-80" />
                        ) : (
                          <img src={item} alt="" className="w-full h-full object-cover rounded-lg absolute inset-0 opacity-80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 flex flex-col items-center justify-between p-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-pink-600 text-white' : 'bg-black/80 text-zinc-200'}`}>
                            {idx === 0 ? '1 (Portada)' : `Video ${idx + 1}`}
                          </span>
                          <span className="text-[8px] text-pink-300 font-bold uppercase tracking-wider drop-shadow">
                            {isVid ? '🎬 Video' : '🖼️ Foto'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-zinc-400 group-hover:text-pink-300 transition-colors">
                        <Plus className="w-4 h-4 text-pink-400/80 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-semibold text-center leading-tight">
                          {idx === 0 ? '+ Portada' : `+ Clip ${idx + 1}`}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Controles para la ranura actualmente seleccionada */}
            <div className="pt-2 border-t border-white/5">
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime,.gif"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!mediaSlots[activeSlotIndex] ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span className="font-medium text-pink-300">
                      Configurando: Ranura {activeSlotIndex + 1} {activeSlotIndex === 0 ? '(Portada Principal)' : `(Clip / Escena ${activeSlotIndex + 1})`}
                    </span>
                    <span className="text-zinc-500 text-[10px]">Sin asignar</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isGeneratingImage}
                      className="py-2.5 px-3 rounded-xl border border-white/15 hover:border-pink-500/50 bg-[#120c1d] hover:bg-[#1f1530] transition-all flex items-center justify-center gap-2 text-zinc-200 hover:text-white text-xs font-medium cursor-pointer active:scale-[0.99]"
                    >
                      <ImagePlus className="w-4 h-4 text-pink-400" />
                      <span>{isUploading ? 'Cargando...' : 'Subir Video / Foto'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateCardImage}
                      disabled={isUploading || isGeneratingImage}
                      className="py-2.5 px-3 rounded-xl border border-purple-500/40 hover:border-purple-400 bg-gradient-to-r from-purple-950/60 to-pink-950/60 hover:from-purple-900/60 hover:to-pink-900/60 transition-all flex items-center justify-center gap-2 text-pink-300 hover:text-white text-xs font-medium cursor-pointer active:scale-[0.99] shadow-md shadow-purple-950/40"
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
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-pink-500/40 bg-black/60 flex items-center p-2.5 gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 relative">
                    {isVideoUrl(mediaSlots[activeSlotIndex]) ? (
                      <video src={mediaSlots[activeSlotIndex]} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                    ) : (
                      <img src={mediaSlots[activeSlotIndex]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <div className="text-white font-semibold truncate">
                      Escena {activeSlotIndex + 1}: {activeSlotIndex === 0 ? 'Portada Principal' : `Clip ${activeSlotIndex + 1}`}
                    </div>
                    <span className="text-[10px] text-pink-400 uppercase tracking-wider font-semibold">
                      {isVideoUrl(mediaSlots[activeSlotIndex]) ? '🎬 VIDEO MP4 / WEBM' : '🖼️ IMAGEN / GIF'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleGenerateCardImage}
                      disabled={isGeneratingImage}
                      className="p-1.5 text-pink-400 hover:text-pink-300 rounded-lg hover:bg-pink-950/40 text-xs cursor-pointer flex items-center gap-1 border border-pink-500/20"
                      title="Generar nueva foto con IA para esta ranura"
                    >
                      {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 text-zinc-300 hover:text-white rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium cursor-pointer"
                      title="Cambiar archivo en esta ranura"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaSlots(prev => {
                          const updated = [...prev];
                          updated[activeSlotIndex] = '';
                          return updated;
                        });
                      }}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40 cursor-pointer"
                      title="Eliminar de esta ranura"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
