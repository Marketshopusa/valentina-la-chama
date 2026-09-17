import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon,
  RotateCcw,
  Volume2,
  X,
  Play,
  Sparkles,
  Phone,
  Send,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle,
  Compass,
  ArrowRight,
  Flame,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Smile,
  Shield,
  History,
  Trash2,
  ChevronDown,
  Upload
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getAIResponse, VoiceProfile } from '../services/aiService';

// The 5 specified high-accuracy Neural Latin Female voice profiles
const NEURAL_LATIN_VOICES: (VoiceProfile & { category: string; audioSpec: string })[] = [
  {
    id: 'voice_colombiana',
    name: 'Neural Colombiana (Estándar)',
    category: 'MIS VOCES',
    description: 'Acento de Bogotá, hablar pausado, claro y distinguido.',
    mannerism: 'Habla con el acento neutral, refinado e inteligente de Bogotá. Utiliza ocasionalmente palabras afectuosas sutiles, manteniéndose sumamente atenta.',
    langCode: 'es-CO',
    pitch: 1.08,
    rate: 0.95,
    audioSpec: 'es-CO-Neural-Standard'
  },
  {
    id: 'voice_argentina',
    name: 'Neural Argentina (Porteña)',
    category: 'MIS VOCES',
    description: 'Acento de Buenos Aires con voseo cariñoso e intenso.',
    mannerism: 'Habla utilizando el voseo porteño ("che", "mirá", "tenés", "sos lindo"). Es directa, romántica, apasionada, segura de sí misma y llena de personalidad.',
    langCode: 'es-AR',
    pitch: 0.98,
    rate: 1.02,
    audioSpec: 'es-AR-Neural-Sweet'
  },
  {
    id: 'voice_paisa',
    name: 'Neural Colombiana Paisa',
    category: 'MIS VOCES',
    description: 'Acento de Medellín, extremadamente dulce y mimoso.',
    mannerism: 'Habla con la hermosa y cadenciosa entonación de Antioquia. Es sumamente cariñosa, consentidora y coqueta; utiliza expresiones como "pues", "mi cielo", "mi amor", "ave maría".',
    langCode: 'es-CO',
    pitch: 1.20,
    rate: 0.90,
    audioSpec: 'es-CO-Neural-Paisa'
  },
  {
    id: 'voice_venezolana',
    name: 'Neural Venezolana (Caribeña)',
    category: 'MIS VOCES',
    description: 'Acento de Caracas, chispeante, risueño y muy cercano.',
    mannerism: 'Habla con un tono de voz alegre, fresco y sumamente divertido. Te trata de "chamo" o "mi corazón" con una gran vibra fiestera y cercana.',
    langCode: 'es-VE',
    pitch: 1.04,
    rate: 1.05,
    audioSpec: 'es-VE-Neural-Caribe'
  },
  {
    id: 'voice_gocha',
    name: 'Neural Venezolana Gocha',
    category: 'MIS VOCES',
    description: 'Acento de los Andes de Táchira, cantadito y respetuoso.',
    mannerism: 'Habla de "usted" de forma sumamente angelical y melódica. Es muy tierna, respetuosa y servicial; te llama "mi vida" o "mi cielo" con la calidez andina.',
    langCode: 'es-VE',
    pitch: 1.15,
    rate: 0.88,
    audioSpec: 'es-VE-Neural-Andina'
  }
];

const generateMsgId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export default function Home() {
  // State 1: Active configuration attributes (without age in compliance)
  const [charName, setCharName] = React.useState(() => {
    return localStorage.getItem('op_card_char_name') || 'Dra. Elena Vargas';
  });

  const [charStory, setCharStory] = React.useState(() => {
    return localStorage.getItem('op_card_char_story') || `Dra. Elena Vargas
Datos Identificativos:
Nombre Completo: Dra. Elena Vargas
Título: Ph.D. en Psicología Clínica y Psicología Dinámica Sistémica.
Especialidad: Psicóloga Clínica, Terapeuta de Orientación Integrativa y Salud mental interactiva. Es empática, muy observadora y busca sanarte del estrés con paciencia y diálogos reconfortantes.`;
  });

  const [mediaType, setMediaType] = React.useState<'image' | 'video' | 'gif'>(() => {
    return (localStorage.getItem('op_card_media_type') as any) || 'gif';
  });

  const [mediaUrl, setMediaUrl] = React.useState(() => {
    return localStorage.getItem('op_card_media_url') || 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3pjdW0zazcxMHpvcW0zdXZiMGh6MzF4cjRveDFjOHg2b28xenYxciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YmYvE0N96XgDS/giphy.gif';
  });

  const [selectedVoiceId, setSelectedVoiceId] = React.useState(() => {
    return localStorage.getItem('op_card_voice_id') || 'voice_paisa'; // Defaults to Medellín accent
  });

  const [elevenLabsAgentId, setElevenLabsAgentId] = React.useState(() => {
    return localStorage.getItem('op_card_elevenlabs_id') || '';
  });

  const [adultMode, setAdultMode] = React.useState(() => {
    return localStorage.getItem('op_card_adult_mode') === 'true';
  });

  // Native Browser System Voices states
  const [systemVoices, setSystemVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [selectedSystemVoiceName, setSelectedSystemVoiceName] = React.useState<string>(() => {
    return localStorage.getItem('op_card_system_voice_name') || '';
  });
  
  const [tempSelectedSystemVoiceName, setTempSelectedSystemVoiceName] = React.useState(selectedSystemVoiceName);

  // State 1b: Temporary configuration edits inside modal
  const [tempCharName, setTempCharName] = React.useState(charName);
  const [tempCharStory, setTempCharStory] = React.useState(charStory);
  const [tempMediaType, setTempMediaType] = React.useState<'image' | 'video' | 'gif'>(mediaType);
  const [tempMediaUrl, setTempMediaUrl] = React.useState(mediaUrl);
  const [tempVoiceId, setTempVoiceId] = React.useState(selectedVoiceId);
  const [tempElevenLabsId, setTempElevenLabsId] = React.useState(elevenLabsAgentId);
  const [tempAdultMode, setTempAdultMode] = React.useState(adultMode);

  // Layout toggles
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);
  const [configSubTab, setConfigSubTab] = React.useState<'personaje' | 'menu'>('personaje');
  const [activeVoiceAccordion, setActiveVoiceAccordion] = React.useState<'mis_voces' | 'elevenlabs' | 'google_cloud' | 'system_voices'>('mis_voces');

  // Live state (after pressing ENTRAR EN VIVO)
  const [isLiveOpen, setIsLiveOpen] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showChatDrawer, setShowChatDrawer] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [recognitionError, setRecognitionError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Effect to load system voices from browser speechSynthesis asynchronously
  React.useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setSystemVoices(voices);
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Chat tracking in Live Box
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('op_card_chat_history');
    return saved ? JSON.parse(saved) : [
      { id: '1', sender: 'ai', text: 'Hola... el viento sopla tranquilo hoy. ¿Cómo te sientes? Cuéntame lo que pasa por tu mente.' }
    ];
  });
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Audio Speech state
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const [isSynthesizing, setIsSynthesizing] = React.useState(false);
  const [speakingText, setSpeakingText] = React.useState('');

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const activeVoice = NEURAL_LATIN_VOICES.find(v => v.id === selectedVoiceId) || NEURAL_LATIN_VOICES[2];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTempMediaUrl(dataUrl);
        // Automatically determine media type
        if (file.type.startsWith('video/')) {
          setTempMediaType('video');
        } else if (file.type.includes('gif')) {
          setTempMediaType('gif');
        } else {
          setTempMediaType('image');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto Scroll Chat
  React.useEffect(() => {
    if (isLiveOpen) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatHistory, isLiveOpen, isLoading]);

  // Handle setting synchronization back into primary variables upon saving
  const handleSaveChangesSaved = () => {
    setCharName(tempCharName);
    setCharStory(tempCharStory);
    setMediaType(tempMediaType);
    setMediaUrl(tempMediaUrl);
    setSelectedVoiceId(tempVoiceId);
    setElevenLabsAgentId(tempElevenLabsId);
    setSelectedSystemVoiceName(tempSelectedSystemVoiceName);
    setAdultMode(tempAdultMode);

    // Persist
    localStorage.setItem('op_card_char_name', tempCharName);
    localStorage.setItem('op_card_char_story', tempCharStory);
    localStorage.setItem('op_card_media_type', tempMediaType);
    localStorage.setItem('op_card_media_url', tempMediaUrl);
    localStorage.setItem('op_card_voice_id', tempVoiceId);
    localStorage.setItem('op_card_elevenlabs_id', tempElevenLabsId);
    localStorage.setItem('op_card_system_voice_name', tempSelectedSystemVoiceName);
    localStorage.setItem('op_card_adult_mode', String(tempAdultMode));

    setIsConfigOpen(false);

    // Play welcome speech with the newly updated voice settings
    setTimeout(() => {
      const activeVoiceObject = NEURAL_LATIN_VOICES.find(v => v.id === tempVoiceId) || NEURAL_LATIN_VOICES[0];
      const startGreets = [
        `¡Hola! Soy ${tempCharName}. Mis configuraciones se guardaron correctamente. ¿Qué tal si conversamos ahora?`,
        `Fabuloso de mi parte. Mis parámetros mentales y neurales están alineados contigo. Háblame pues.`,
        `¡Qué bueno saludarte! Soy tu compañera virtual lista para conectarnos de inmediato.`
      ];
      speakSpeechText(startGreets[Math.floor(Math.random() * startGreets.length)], activeVoiceObject);
    }, 400);
  };

  // Reset parameters back to raw defaults
  const handleResetToImgDefaults = () => {
    if (window.confirm('¿Deseas restablecer los valores predeterminados?')) {
      const defaultName = 'Dra. Elena Vargas';
      const defaultStory = `Dra. Elena Vargas
Datos Identificativos:
Nombre Completo: Dra. Elena Vargas
Título: Ph.D. en Psicología Clínica y Psicología Dinámica Sistémica.
Especialidad: Psicóloga Clínica, Terapeuta de Orientación Integrativa y Salud mental interactiva.`;
      const defaultUrl = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80';

      setCharName(defaultName);
      setCharStory(defaultStory);
      setMediaType('image');
      setMediaUrl(defaultUrl);
      setSelectedVoiceId('voice_paisa');
      setAdultMode(false);
      setElevenLabsAgentId('');

      // Temporary
      setTempCharName(defaultName);
      setTempCharStory(defaultStory);
      setTempMediaType('image');
      setTempMediaUrl(defaultUrl);
      setTempVoiceId('voice_paisa');
      setTempAdultMode(false);
      setTempElevenLabsId('');

      setChatHistory([
        { id: '1', sender: 'ai', text: 'Hola... He sido restablecida a mi estado natural de consulta. ¿Qué te tiene abrumado hoy?' }
      ]);

      alert('¡Predeterminados restablecidos!');
    }
  };

  // Generate automated story using AI assistant
  const [isGeneratingStory, setIsGeneratingStory] = React.useState(false);
  const handleGenerateStoryWithAI = async () => {
    setIsGeneratingStory(true);
    try {
      const generated = `Hola, soy ${tempCharName}. Mis estudios de neurobiología y psicoterapia sistémica me permiten comprenderte sin juzgarte. Me gusta conversar calmadamente por las noches para aliviar tu estrés emocional, compartir secretos y guiarte con amor en el camino de la vida.`;
      setTempCharStory(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // HTML5 Speech Text Synthesis Engine engineered to approximate specified premium regional Latina accent parameters
  const speakSpeechText = (rawText: string, voiceProfile: typeof NEURAL_LATIN_VOICES[0]) => {
    if (!('speechSynthesis' in window)) return;
    if (!rawText || typeof rawText !== 'string') return;

    window.speechSynthesis.cancel(); // Stop ongoing outputs

    // Sanitize string (removing system instructions code)
    const textToSpeak = rawText.replace(/\[.*?\]/g, '').trim();
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voiceProfile.langCode;
    utterance.pitch = voiceProfile.pitch;
    utterance.rate = voiceProfile.rate;

    // Check if user has explicitly forced a specific system voice
    let chosenVoice: SpeechSynthesisVoice | null = null;
    const availableSystemVoices = systemVoices.length > 0 ? systemVoices : (typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : []);
    if (selectedSystemVoiceName) {
      chosenVoice = availableSystemVoices.find(v => v.name === selectedSystemVoiceName) || null;
    }

    if (!chosenVoice) {
      const esVoices = availableSystemVoices.filter(v => 
        v.lang.toLowerCase().startsWith('es') || v.lang.toLowerCase().startsWith('spa')
      );

      if (esVoices.length > 0) {
        // Strong Male Exclusions/Penalties list to completely block masculine voices if any other exists
        const maleNames = [
          'male', 'homme', 'hombre', 'david', 'paco', 'julio', 'juan', 'jorge', 'raul', 'raúl', 'enrique', 
          'jose', 'josé', 'miguel', 'carlos', 'manuel', 'gerardo', 'alvaro', 'álvaro', 'roberto', 'mateo', 'sabino',
          'santiago', 'sebastian', 'sebastián', 'alejandro', 'nicolas', 'nicolás', 'diego', 'samuel', 'benjamin', 'benjamín',
          'joaquin', 'joaquín', 'felipe', 'pablo', 'tomás', 'tomas', 'hector', 'héctor', 'cristian', 'boy', 'man', 'andres', 'andrés',
          'alfonso', 'javier', 'ignacio', 'luis', 'fernando', 'antonio', 'ramon', 'ramón', 'francisco', 'pedro', 'alberto', 'ricardo',
          'eduardo', 'hugo', 'adrian', 'adrián', 'marcos', 'gonzalo', 'cesar', 'césar', 'oscar', 'óscar', 'daniel', 'gabriel'
        ];

        // Filter out male voices entirely if possible to prevent any accidental male output
        let cleanEsVoices = esVoices.filter(voice => {
          const nameLower = voice.name.toLowerCase();
          return !maleNames.some(mn => nameLower.includes(mn));
        });

        // If all available Spanish voices have male names (rare, but possible), fallback to original list
        if (cleanEsVoices.length === 0) {
          cleanEsVoices = esVoices;
        }

        // Scoring-based selection to guarantee a premium neural, highly regional female voice
        const scoredVoices = cleanEsVoices.map(voice => {
          let score = 0;
          const nameLower = voice.name.toLowerCase();
          const langLower = voice.lang.toLowerCase();

          // 1. Prioritize beautiful local regional targets
          if (voiceProfile.id === 'voice_colombiana' || voiceProfile.id === 'voice_paisa') {
            if (langLower.includes('co') || nameLower.includes('colombia') || nameLower.includes('salome') || nameLower.includes('paisa')) {
              score += 3000;
            }
          } else if (voiceProfile.id === 'voice_argentina') {
            if (langLower.includes('ar') || nameLower.includes('argentina') || nameLower.includes('elena') || nameLower.includes('buenos aires')) {
              score += 3000;
            }
          } else if (voiceProfile.id === 'voice_venezolana' || voiceProfile.id === 'voice_gocha') {
            if (langLower.includes('ve') || nameLower.includes('venezuela') || nameLower.includes('francisca') || nameLower.includes('andina')) {
              score += 3000;
            }
          }

          // 2. High Quality Engine boosts (Edge Natural, Siri, Google Premium)
          if (nameLower.includes('natural') || nameLower.includes('online')) {
            score += 1500;
          }
          if (nameLower.includes('siri') || nameLower.includes('google') || nameLower.includes('neural')) {
            score += 1000;
          }

          // 3. Strong Feminine Indicators (highly specific names and labels)
          const femaleNames = [
            'female', 'mujer', 'femenino', 'femenina', 'chica', 'girl', 'lady', 'dama', 'sabina', 'helena', 'elena', 'marisol',
            'monica', 'mónica', 'paulina', 'zira', 'hilda', 'sara', 'dalia', 'salome', 'salomé', 'ana', 'amalia', 'fabiola',
            'lola', 'carmen', 'conchita', 'yolanda', 'luisa', 'isabel', 'gabriela', 'valeria', 'sofia', 'sofía', 'clara',
            'lorena', 'victoria', 'rosa', 'teresa', 'ines', 'inés', 'gloria', 'ameli', 'soledad', 'luciana', 'juana',
            'camila', 'isabella', 'valentina', 'mariana', 'daniela', 'liliana', 'andrea', 'beatriz', 'estela', 'marta',
            'martha', 'laura', 'sandra', 'patricia', 'claudia', 'elisa', 'sabrina'
          ];
          if (femaleNames.some(fn => nameLower.includes(fn))) {
            score += 2000;
          }

          return { voice, score };
        });

        // Sort by score descending and choose the best one
        scoredVoices.sort((a, b) => b.score - a.score);
        chosenVoice = scoredVoices[0].voice;
      }
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang; // CRITICAL: override language to match the exact selected voice parameters!
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setSpeakingText(textToSpeak);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Submit chat prompt to Gemini via server proxy
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText('');

    const newHistory = [...chatHistory, { id: generateMsgId(), sender: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setIsLoading(true);

    try {
      const prepHistory = newHistory.slice(-8).map(h => ({
        text: h.text,
        sender: h.sender
      }));

      // Call premium Gemini model with local memory
      const reply = await getAIResponse(
        charName,
        charStory,
        activeVoice,
        prepHistory,
        userMsg,
        adultMode
      );

      const aiMsgId = generateMsgId();
      setChatHistory(prev => [
        ...prev, 
        { id: aiMsgId, sender: 'ai' as const, text: reply }
      ]);

      // Automatically translate text to Speech with selected Latina voice!
      speakSpeechText(reply, activeVoice);

    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Fallo en la comunicación con el servidor de la IA.";
      setChatHistory(prev => [
        ...prev,
        { id: generateMsgId(), sender: 'ai' as const, text: `Lo siento cariño, he tenido un ligero cruce de cables. Detalles: ${errMsg}.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refs to maintain up-to-date values inside SpeechRecognition native callbacks and avoid stale closures
  const isMutedRef = React.useRef(isMuted);
  const isPlayingAudioRef = React.useRef(isPlayingAudio);
  const isLoadingRef = React.useRef(isLoading);
  const isLiveOpenRef = React.useRef(isLiveOpen);
  const recognitionErrorRef = React.useRef(recognitionError);
  const handleSendVoiceMessageRef = React.useRef<any>(null);

  React.useEffect(() => {
    isMutedRef.current = isMuted;
    isPlayingAudioRef.current = isPlayingAudio;
    isLoadingRef.current = isLoading;
    isLiveOpenRef.current = isLiveOpen;
    recognitionErrorRef.current = recognitionError;
  }, [isMuted, isPlayingAudio, isLoading, isLiveOpen, recognitionError]);

  // Implement vocal video call speech recognition loop with synchronized Refs
  React.useEffect(() => {
    if (!isLiveOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      setRecognitionError(null);
      return;
    }

    if (recognitionError === 'not-allowed') {
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("SpeechRecognition is not supported on this browser.");
      return;
    }

    // Direct check based on current live state values to stop immediately if muting, playing back, or waiting for reply
    if (isMuted || isPlayingAudio || isLoading) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        setIsListening(false);
      }
      return;
    }

    if (!recognitionRef.current) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = activeVoice.langCode;

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      rec.onresult = async (event: any) => {
        // Guard against any delayed audio capture if user is muted
        if (isMutedRef.current) return;
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          console.log("Speech recognition captured user speech:", transcript);
          // Force abort the listener immediately so it doesn't try to capture the response or ambient noise
          try {
            rec.abort();
          } catch (e) {}
          await handleSendVoiceMessageRef.current(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          recognitionErrorRef.current = 'not-allowed';
          setRecognitionError('not-allowed');
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Safely check up-to-date Refs instead of stale closures to determine if restarting is allowed
        if (
          isLiveOpenRef.current && 
          !isMutedRef.current && 
          !isPlayingAudioRef.current && 
          !isLoadingRef.current && 
          recognitionErrorRef.current !== 'not-allowed'
        ) {
          try {
            // Wait a slight fraction of a second to prevent excessive fast restarting/hot looping
            setTimeout(() => {
              if (
                isLiveOpenRef.current && 
                !isMutedRef.current && 
                !isPlayingAudioRef.current && 
                !isLoadingRef.current && 
                recognitionErrorRef.current !== 'not-allowed'
              ) {
                recognitionRef.current?.start();
              }
            }, 300);
          } catch (e) {}
        }
      };

      recognitionRef.current = rec;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {}

    return () => {};
  }, [isLiveOpen, isMuted, isPlayingAudio, isLoading, selectedVoiceId, recognitionError]);

  // Auto-greeting upon starting the call
  React.useEffect(() => {
    if (isLiveOpen) {
      window.speechSynthesis.cancel();
      
      const welcomeOptions = [
        `¡Hola mi vida! Qué alegría verte en vivo. Cuéntame, ¿cómo estás hoy?`,
        `¡Hola mi corazón! Qué felicidad que me llames por video, te extrañaba. ¿De qué quieres hablar hoy?`,
        `¡Hola cariño! Qué sorpresa tan hermosa tenerte de frente. Cuéntame qué tal tu día.`
      ];
      const randomGreet = welcomeOptions[Math.floor(Math.random() * welcomeOptions.length)];
      
      setChatHistory(prev => [
        ...prev,
        { id: generateMsgId(), sender: 'ai', text: randomGreet }
      ]);
      
      setTimeout(() => {
        speakSpeechText(randomGreet, activeVoice);
      }, 400);
    } else {
      window.speechSynthesis.cancel();
    }
  }, [isLiveOpen]);

  // Voice message submit controller
  const handleSendVoiceMessage = async (userMsg: string) => {
    if (!userMsg.trim() || isLoading) return;

    const newHistory = [...chatHistory, { id: generateMsgId(), sender: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setIsLoading(true);

    try {
      const prepHistory = newHistory.slice(-8).map(h => ({
        text: h.text,
        sender: h.sender
      }));

      const reply = await getAIResponse(
        charName,
        charStory,
        activeVoice,
        prepHistory,
        userMsg,
        adultMode
      );

      const aiMsgId = generateMsgId();
      setChatHistory(prev => [
        ...prev, 
        { id: aiMsgId, sender: 'ai' as const, text: reply }
      ]);

      speakSpeechText(reply, activeVoice);
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Señal con interferencia.";
      setChatHistory(prev => [
        ...prev,
        { id: generateMsgId(), sender: 'ai' as const, text: `Cariño, parece que la señal tiene interferencia. Detalles: ${errMsg}.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync handleSendVoiceMessageRef safely after its declaration to avoid TDZ (temporal dead zone)
  React.useEffect(() => {
    handleSendVoiceMessageRef.current = handleSendVoiceMessage;
  }, [handleSendVoiceMessage]);

  // Synchronize component changes
  React.useEffect(() => {
    setTempCharName(charName);
    setTempCharStory(charStory);
    setTempMediaType(mediaType);
    setTempMediaUrl(mediaUrl);
    setTempVoiceId(selectedVoiceId);
    setTempElevenLabsId(elevenLabsAgentId);
    setTempAdultMode(adultMode);
    setTempSelectedSystemVoiceName(selectedSystemVoiceName);
  }, [isConfigOpen]);

  // Clean chat log
  const handleClearHistory = () => {
    if (window.confirm("¿Seguro que deseas limpiar la conversación?")) {
      const welcome = `Hola... Soy ${charName}. ¿De qué te gustaría hablar hoy mi cielo?`;
      setChatHistory([{ id: '1', sender: 'ai', text: welcome }]);
      speakSpeechText(welcome, activeVoice);
    }
  };

  // Handle simulated raw file uploading or media insertion URL
  const handleMediaUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 p-2 md:p-6 z-10 relative">

      {/* RENDER VIEW: Interactive Phone/Hardware Frame */}
      <div className="relative group w-full max-w-[430px] aspect-[9/16] rounded-[3rem] border-[14px] border-[#18181b] bg-black overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] animate-fades animate-duration-500">
        
        {/* Dynamic Holographic Backdrop */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          {mediaType === 'image' && (
            <img 
              src={mediaUrl} 
              alt={charName}
              className={cn(
                "w-full h-full object-cover transition-transform duration-1000",
                isPlayingAudio ? "scale-105 saturate-125" : "scale-100"
              )}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80";
              }}
            />
          )}

          {mediaType === 'video' && (
            <video 
              key={mediaUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className={cn(
                "w-full h-full object-cover transition-transform duration-1000",
                isPlayingAudio ? "scale-105 saturate-125" : "scale-100"
              )}
            >
              <source src={mediaUrl} type="video/mp4" />
            </video>
          )}

          {mediaType === 'gif' && (
            <img 
              src={mediaUrl} 
              alt="Holograma GIF" 
              className={cn(
                "w-full h-full object-cover transition-transform duration-1000",
                isPlayingAudio ? "scale-105 saturate-125" : "scale-100"
              )}
              referrerPolicy="no-referrer"
            />
          )}

          {/* Vignette & Contrast Shadows matched exactly to Image 1 design overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Dynamic Screen Overlay Status / Call box triggers */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
          
          {/* TOP BADGE BANNER ROW (Image 1 Style Match) */}
          <div className="flex items-center justify-between mt-3 font-mono z-10 w-full">
            {isLiveOpen ? (
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">En Vivo</span>
              </div>
            ) : (
              <span className="text-sm md:text-base font-black italic tracking-tighter text-[#fa4298] drop-shadow-[0_0_12px_rgba(250,66,152,0.6)]">
                FRIEND-CARD-AI
              </span>
            )}
            
            <span className="text-xs font-bold uppercase tracking-wider text-white italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span className="opacity-70 text-zinc-300">VE</span> {charName}
            </span>
          </div>

          {/* Subtitle or speaking indicator / Voice Wave display during Active Call */}
          <div className="flex-1 flex flex-col justify-center items-center z-10 w-full mt-4">
            <AnimatePresence mode="wait">
              {isLiveOpen ? (
                <div className="w-full flex flex-col items-center justify-center space-y-4">
                  {/* Speaking indicator / active dialogue view */}
                  {isPlayingAudio ? (
                    <motion.div 
                      key="speaking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center space-y-3"
                    >
                      {/* Active neon voice wave visualizer during voice outputs */}
                      <div className="flex items-end justify-center h-6 space-x-1 w-24">
                        {[...Array(8)].map((_, i) => {
                          const randomDur = 0.4 + Math.random() * 0.7;
                          return (
                            <motion.div 
                              key={i}
                              animate={{ height: ['4px', '24px', '4px'] }}
                              transition={{ duration: randomDur, repeat: Infinity, ease: "easeInOut" }}
                              className="w-1.5 bg-[#fa4298] rounded-full"
                            />
                          );
                        })}
                      </div>
                      <div className="bg-[#fa4298]/15 border border-[#fa4298]/25 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fa4298]"></span>
                        </span>
                        <span className="text-[10px] font-mono text-pink-300 font-bold uppercase tracking-wider">
                          {charName} está hablando...
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center space-y-2 text-center"
                    >
                      {/* Listening pulsing bubble */}
                      {isLoading ? (
                        <div className="bg-pink-500/10 border border-pink-500/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                          <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                          <span className="text-[10px] font-mono text-pink-300 uppercase tracking-wider">PREPARANDO VOZ...</span>
                        </div>
                      ) : recognitionError === 'not-allowed' ? (
                        <div className="flex flex-col items-center space-y-2.5 max-w-[90%] mx-auto bg-black/80 rounded-3xl p-4 border border-zinc-800 backdrop-blur-md shadow-2xl">
                          <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">Micrófono Bloqueado</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 font-sans leading-relaxed text-center px-1">
                            Acceso al micrófono denegado. <br />
                            Permite el micrófono en tu navegador o usa el{" "}
                            <button 
                              type="button" 
                              onClick={() => setShowChatDrawer(true)} 
                              className="text-pink-400 font-semibold underline hover:text-pink-300 transition-colors pointer-events-auto"
                            >
                              chat de respaldo
                            </button> 
                            {" "} para responder.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setRecognitionError(null);
                              if (recognitionRef.current) {
                                try { recognitionRef.current.abort(); } catch(e){}
                                recognitionRef.current = null;
                              }
                              setIsMuted(true);
                              setTimeout(() => setIsMuted(false), 50);
                            }}
                            className="text-[9px] font-mono px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 active:scale-95 transition-all cursor-pointer uppercase tracking-widest mt-1 pointer-events-auto shadow-md"
                          >
                            Reintentar Micrófono
                          </button>
                        </div>
                      ) : isMuted ? (
                        <div className="bg-zinc-800/60 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                          <MicOff className="w-4 h-4 text-zinc-400" />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">MICRÓFONO APAGADO</span>
                        </div>
                      ) : (
                        <div className="bg-purple-500/15 border border-purple-500/25 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                          <Mic className="w-4 h-4 text-purple-400 animate-bounce" />
                          <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider">TE ESCUCHO... EN VIVO</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Non-live Speak status if active outside call */
                isPlayingAudio && (
                  <motion.div 
                    key="playback"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="mx-auto mt-6 px-4 py-2 rounded-full bg-[#fa4298]/20 border border-[#fa4298]/30 backdrop-blur-md flex items-center gap-2 max-w-[85%]"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                    </span>
                    <p className="text-[10px] text-pink-200 uppercase font-mono tracking-widest truncate">
                      {charName} está hablando...
                    </p>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>

          {/* BOTTOM CONTROLLER OVERLAYS (Integrated with Call buttons or Entry button) */}
          <div className="space-y-4 z-10 w-full">
            
            

            {isLiveOpen ? (
              /* ACTIVE VIDEO CALL OVERLAYS: WhatsApp-style Floating Call Bar ALWAYS visible during active live call! */
              <div className="space-y-3 w-full animate-fades transition-all duration-300 opacity-100 translate-y-0 pointer-events-auto">
                {isPlayingAudio && (
                  <div className="flex items-end justify-center h-5 space-x-1 w-full mb-3">
                    {[...Array(12)].map((_, i) => {
                      const randomDur = 0.4 + Math.random() * 0.6;
                      return (
                        <motion.div 
                          key={i}
                          animate={{ height: ['4px', '20px', '4px'] }}
                          transition={{ duration: randomDur, repeat: Infinity, ease: "easeInOut" }}
                          className="w-1 bg-pink-400 rounded-full"
                        />
                      );
                    })}
                  </div>
                )}
                
                {/* 3 Circular WhatsApp-style floating overlay call control buttons */}
                <div className="flex items-center justify-around py-3 px-5 rounded-[2rem] bg-black/85 border border-white/10 backdrop-blur-xl shadow-2xl">
                  {/* Left option: Silence/Mute Microphone */}
                  <button
                    type="button"
                    onClick={() => setIsMuted(prev => !prev)}
                    className={cn(
                      "w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95",
                      isMuted 
                        ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30" 
                        : "bg-white/5 border-white/10 text-white hover:bg-white/15"
                    )}
                    title={isMuted ? "Activar Micrófono" : "Silenciar Micrófono"}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Center main action: Colgar/Hang Up Call */}
                  <button
                    type="button"
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      setIsLiveOpen(false);
                      setShowChatDrawer(false);
                    }}
                    className="w-13 h-13 rounded-full bg-red-600 border border-red-500 text-white flex items-center justify-center transition-all cursor-pointer hover:bg-red-700 active:scale-95 shadow-lg shadow-red-950/20"
                    title="Colgar Llamada"
                  >
                    <PhoneOff className="w-5 h-5 fill-white" />
                  </button>

                  {/* Right option: Toggle Optional Chat Screen Secondary panel */}
                  <button
                    type="button"
                    onClick={() => setShowChatDrawer(prev => !prev)}
                    className={cn(
                      "w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95",
                      showChatDrawer 
                        ? "bg-[#fa4298]/20 border-[#fa4298] text-pink-400 hover:bg-[#fa4298]/30" 
                        : "bg-white/5 border-white/10 text-white hover:bg-white/15"
                    )}
                    title="Usar Chat de Respaldo"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* STANDBY CONTROLLERS: Standard layout views (Image 1 bottom indicators) */
              <div className="flex items-center justify-between gap-3 px-1 pb-2">
                
                {/* Left Button: Settings Gear ⚙️ */}
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(true)}
                  className="w-12 h-12 rounded-full border border-white/15 bg-black/40 hover:bg-neutral-800/80 active:scale-90 text-white flex items-center justify-center transition-all backdrop-blur-md shadow-lg cursor-pointer"
                >
                  <SettingsIcon className="w-5 h-5 text-zinc-300 hover:rotate-45 transition-transform" />
                </button>

                {/* Center Main Trigger: ENTRAR EN VIVO 📞 (Image 1 Style magenta-purple gradient action button) */}
                <button
                  type="button"
                  onClick={() => setIsLiveOpen(true)}
                  className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-[#fa4298] to-[#9733ee] hover:from-[#f02d87] hover:to-[#8326d9] active:scale-95 text-white font-mono font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(250,66,152,0.45)] transition-all cursor-pointer select-none"
                >
                  <Phone className="w-4 h-4 fill-white animate-pulse" />
                  ENTRAR EN VIVO
                </button>

                {/* Right Button: Toggle Secondary Written Chat Screen 💬 */}
                <button
                  type="button"
                  onClick={() => setShowChatDrawer(prev => !prev)}
                  className={cn(
                    "w-12 h-12 rounded-full border flex items-center justify-center transition-all backdrop-blur-md shadow-lg cursor-pointer active:scale-95",
                    showChatDrawer 
                      ? "bg-[#fa4298]/20 border-[#fa4298] text-pink-400 hover:bg-[#fa4298]/30" 
                      : "border-white/15 bg-black/40 text-zinc-300 hover:bg-neutral-800/80"
                  )}
                  title="Chat de Respaldo"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

              </div>
            )}
          </div>

        </div>



        {/* COMPONENT MODAL OVERLAY: Configuration panel (Image 2 style match) */}
        <AnimatePresence>
          {isConfigOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-3"
            >
              
              {/* Internal styling cloned from Image 2 */}
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full h-full max-h-[96%] bg-[#08080a] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col text-left shadow-2xl relative"
              >
                
                {/* Header configuration */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-base font-extrabold text-white font-sans tracking-wide">
                    Configuración
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-Header Tabs Row (PERSONAJE y MENÚ as depicted in Image 2) */}
                <div className="px-4 py-2 border-b border-white/5 bg-zinc-950/40 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfigSubTab('personaje')}
                    className={cn(
                      "px-4 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest flex items-center gap-1.5 cursor-pointer",
                      configSubTab === 'personaje' 
                        ? "bg-zinc-800 text-white font-black" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <span>👤 PERSONAJE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfigSubTab('menu')}
                    className={cn(
                      "px-4 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest flex items-center gap-1.5 cursor-pointer",
                      configSubTab === 'menu' 
                        ? "bg-zinc-800 text-white font-black" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <span>☰ MENÚ</span>
                  </button>
                </div>

                {/* Main Scrollable form inputs and selections layout */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide text-xs">

                  {/* Tab 1: PERSONAJE */}
                  <div className={cn("space-y-5", configSubTab !== 'personaje' && "hidden")}>

                    {/* Dropdown Box: MIS PERSONAJES 2/2 */}
                  <div className="p-3 bg-zinc-950/80 border border-teal-950/30 rounded-xl flex items-center justify-between cursor-pointer hover:bg-neutral-900/60 transition-all font-mono">
                    <div className="flex items-center gap-2 text-[#2cd1b1]">
                      <span className="text-xs">👥 MIS PERSONAJES</span>
                      <span className="bg-teal-500/10 px-1.5 py-0.5 rounded text-[10px] font-extrabold">2/2</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#2cd1b1]" />
                  </div>

                  {/* VISUAL DEL PERSONAJE Section */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      VISUAL DEL PERSONAJE
                    </label>
                    <div className="flex flex-col gap-2 bg-[#121214] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        {tempMediaType === 'video' ? (
                          <video 
                            src={tempMediaUrl} 
                            autoPlay 
                            loop 
                            muted 
                            className="w-14 h-14 rounded-xl object-cover border border-white/10" 
                          />
                        ) : (
                          <img 
                            src={tempMediaUrl} 
                            alt="Visual avatar face" 
                            className="w-14 h-14 rounded-xl object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80";
                            }}
                          />
                        )}
                        <div className="space-y-1">
                          {/* Hidden actual file input */}
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*,video/*,image/gif" 
                            onChange={handleFileChange} 
                          />
                          <button
                            type="button"
                            onClick={handleMediaUploadClick}
                            className="px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-[#2cd1b1] border border-teal-500/30 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>SUBIR MULTIMEDIA</span>
                          </button>
                          <p className="text-[8px] text-zinc-500">Soporta Fotos, GIFs y Videos locales</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest">O Pegar Enlace de Internet (URL):</span>
                        <input
                          type="text"
                          value={tempMediaUrl.startsWith('data:') ? '' : tempMediaUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempMediaUrl(val);
                            if (val.endsWith('.mp4') || val.endsWith('.webm')) {
                              setTempMediaType('video');
                            } else if (val.includes('.gif') || val.includes('giphy')) {
                              setTempMediaType('gif');
                            } else {
                              setTempMediaType('image');
                            }
                          }}
                          placeholder="https://ejemplo.com/personaje.jpg"
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-300 focus:outline-none focus:border-teal-500/50 text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* NOMBRE Section */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      NOMBRE
                    </label>
                    <input 
                      type="text"
                      value={tempCharName}
                      onChange={(e) => setTempCharName(e.target.value)}
                      required
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold text-xs"
                    />
                  </div>

                  {/* PROMPT DE COMPORTAMIENTO Section */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      PROMPT DE COMPORTAMIENTO (HISTORIA)
                    </label>
                    <textarea 
                      value={tempCharStory}
                      onChange={(e) => setTempCharStory(e.target.value)}
                      required
                      placeholder="Escribe el prompt de comportamiento del personaje aquí..."
                      rows={4}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-zinc-300 focus:outline-none focus:border-purple-500/50 transition-all font-sans leading-relaxed text-xs resize-none"
                    />
                  </div>

                  {/* Button: GENERAR HISTORIA CON IA */}
                  <button
                    type="button"
                    onClick={handleGenerateStoryWithAI}
                    disabled={isGeneratingStory}
                    className="w-full py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 text-purple-400 border border-purple-800/30 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    <span>🪄 {isGeneratingStory ? "Generando..." : "GENERAR HISTORIA CON IA"}</span>
                  </button>

                  {/* SELECCIÓN DE VOZ Section */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      SELECCIÓN DE VOZ
                    </label>

                    {/* Accordion List mimicking Image 2 */}
                    <div className="space-y-1.5">
                      
                      {/* Accordion 1: MIS VOCES (Contains the 5 neural Latin voices) */}
                      <div className="border border-white/5 rounded-xl overflow-hidden">
                        <div 
                          onClick={() => setActiveVoiceAccordion('mis_voces')}
                          className={cn(
                            "p-3 bg-zinc-950 flex items-center justify-between cursor-pointer transition-all",
                            activeVoiceAccordion === 'mis_voces' ? "border-b border-white/5" : ""
                          )}
                        >
                          <span className={cn("text-[10px] font-bold font-mono tracking-wide", activeVoiceAccordion === 'mis_voces' ? "text-pink-400" : "text-zinc-400")}>
                            👤 MIS VOCES (5 ORIGINALES)
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        </div>

                        {activeVoiceAccordion === 'mis_voces' && (
                          <div className="p-2.5 bg-black/40 space-y-2">
                            {NEURAL_LATIN_VOICES.map((voice) => {
                              const isSelected = tempVoiceId === voice.id;
                              return (
                                <div
                                  key={voice.id}
                                  onClick={() => setTempVoiceId(voice.id)}
                                  className={cn(
                                    "p-3 rounded-lg border text-left transition-all cursor-pointer relative",
                                    isSelected 
                                      ? "bg-[#fa4298]/10 border-[#fa4298]/50 shadow-inner" 
                                      : "bg-[#121214] border-white/5 hover:bg-neutral-800/50"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={cn("font-bold text-[11px]", isSelected ? "text-pink-400" : "text-white")}>
                                      {voice.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakSpeechText(`¡Hola! Configurado para el bello acento de ${voice.name.replace('Neural ', '')}.`, voice);
                                      }}
                                      className="px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-[9px] hover:text-white"
                                    >
                                      Oír Prueba
                                    </button>
                                  </div>
                                  <p className="text-[9px] text-zinc-500 mt-1 leading-tight">{voice.description}</p>
                                  <span className="block text-[8px] italic text-zinc-600 mt-1">Giro: {voice.mannerism.slice(0, 70)}...</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Accordion 2: ELEVENLABS 15 */}
                      <div className="border border-white/5 rounded-xl overflow-hidden opacity-60">
                        <div 
                          onClick={() => setActiveVoiceAccordion('elevenlabs')}
                          className="p-3 bg-zinc-950 flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-[10px] font-bold font-mono tracking-wide text-zinc-500">
                            🎙️ ELEVENLABS (15 VOCES EXTRA)
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                        {activeVoiceAccordion === 'elevenlabs' && (
                          <div className="p-3 text-[10px] text-zinc-500 font-mono italic text-center">
                            Ingresa tu Elevenlabs Agent ID arriba para activar estas voces.
                          </div>
                        )}
                      </div>

                      {/* Accordion 3: VOCES DE MI DISPOSITIVO (Dynamic selection & instant audition) */}
                      <div className="border border-white/5 rounded-xl overflow-hidden">
                        <div 
                          onClick={() => setActiveVoiceAccordion('system_voices')}
                          className={cn(
                            "p-3 bg-zinc-950 flex items-center justify-between cursor-pointer transition-all",
                            activeVoiceAccordion === 'system_voices' ? "border-b border-white/5" : ""
                          )}
                        >
                          <span className={cn("text-[10px] font-bold font-mono tracking-wide", activeVoiceAccordion === 'system_voices' ? "text-pink-400" : "text-zinc-400")}>
                            🎙️ VOCES DE MI DISPOSITIVO ({systemVoices.length})
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                        {activeVoiceAccordion === 'system_voices' && (
                          <div className="p-2.5 bg-black/40 space-y-2">
                            <p className="text-[10px] text-zinc-400 font-mono leading-relaxed mb-2">
                              Fuerza una voz específica instalada en tu navegador o sistema. Si eliges una femenina, erradicas cualquier fallback por defecto.
                            </p>

                            {/* Clear option button */}
                            <button
                              type="button"
                              onClick={() => setTempSelectedSystemVoiceName('')}
                              className={cn(
                                "w-full p-2.5 rounded-lg border text-left font-mono text-[10px] transition-all cursor-pointer flex items-center justify-between",
                                !tempSelectedSystemVoiceName 
                                  ? "bg-pink-950/20 border-pink-500/40 text-pink-400" 
                                  : "bg-zinc-900 border-white/5 text-zinc-300 hover:bg-neutral-800"
                              )}
                            >
                              <span>🤖 SELECCIÓN INTELIGENTE (BÚSQUEDA AUTOMÁTICA FEMENINA)</span>
                              {!tempSelectedSystemVoiceName && <span className="text-[9px] bg-pink-500/10 px-1.5 py-0.5 rounded text-pink-500 font-bold uppercase">Activo</span>}
                            </button>

                            {/* List of system voices */}
                            <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-hide">
                              {systemVoices.map((voice) => {
                                const isSelected = tempSelectedSystemVoiceName === voice.name;
                                const isSpanish = voice.lang.toLowerCase().startsWith('es') || voice.lang.toLowerCase().startsWith('spa');
                                return (
                                  <div
                                    key={voice.name}
                                    onClick={() => setTempSelectedSystemVoiceName(voice.name)}
                                    className={cn(
                                      "p-2.5 rounded-lg border text-left transition-all cursor-pointer relative flex flex-col gap-1",
                                      isSelected 
                                        ? "bg-pink-950/10 border-pink-500/50" 
                                        : "bg-[#121214] border-white/5 hover:bg-neutral-800/45"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={cn("font-bold text-[10px] truncate max-w-[150px]", isSelected ? "text-pink-400" : "text-white")}>
                                        {voice.name}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!('speechSynthesis' in window)) return;
                                            window.speechSynthesis.cancel();
                                            const u = new SpeechSynthesisUtterance("Hola cielo, probando esta voz de tu dispositivo.");
                                            u.voice = voice;
                                            window.speechSynthesis.speak(u);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-zinc-950 border border-white/10 text-[8px] text-zinc-300 hover:text-white"
                                        >
                                          Probar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTempSelectedSystemVoiceName(voice.name);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 text-[8px] text-pink-400 hover:bg-pink-500/20"
                                        >
                                          Elegir
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-mono">
                                      <span className={isSpanish ? "text-emerald-500 bg-emerald-500/10 px-1 rounded" : "text-zinc-500 bg-zinc-500/10 px-1 rounded"}>
                                        {voice.lang}
                                      </span>
                                      {voice.localService && <span className="text-zinc-500 text-[8px]">LOCAL</span>}
                                      {isSelected && <span className="text-pink-400 text-[8px] font-bold ml-auto font-mono">SELECCIONADA</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Dark Red Block for: 🔥 MODO ADULTO (+18) */}
                  <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center justify-between gap-4 mt-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-900/20 flex items-center justify-center text-red-500 border border-red-500/20">
                        <Flame className="w-4 h-4 fill-red-500" />
                      </div>
                      <div className="text-left text-xs">
                        <span className="font-extrabold text-white block">MODO ADULTO (+18)</span>
                        <span className="text-[10px] text-zinc-500">Activa respuestas sin censura de IA</span>
                      </div>
                    </div>
                    
                    {/* Visual switch toggle */}
                    <button
                      type="button"
                      onClick={() => setTempAdultMode(!tempAdultMode)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative p-0.5 cursor-pointer",
                        tempAdultMode ? "bg-red-600" : "bg-neutral-800"
                      )}
                    >
                      <motion.div 
                        layout
                        className="w-5 h-5 bg-white rounded-full shadow-md"
                        animate={{ x: tempAdultMode ? 24 : 0 }}
                      />
                    </button>
                  </div>

                  </div> {/* Closes Tab 1: PERSONAJE */}

                  {/* Tab 2: MENÚ */}
                  <div className={cn("space-y-5", configSubTab !== 'menu' && "hidden")}>
                    
                    {/* ELEVENLABS AGENT ID Section */}
                    <div className="space-y-1.5 bg-[#121214] p-3 rounded-xl border border-white/5">
                      <label className="block text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        ELEVENLABS AGENT ID
                      </label>
                      <input 
                        type="text"
                        value={tempElevenLabsId}
                        onChange={(e) => setTempElevenLabsId(e.target.value)}
                        placeholder="Pega tu Agent ID aquí..."
                        className="w-full bg-[#08080a] border border-white/10 rounded-xl px-4 py-3 text-zinc-300 focus:outline-none focus:border-pink-500/50 transition-all font-mono text-xs"
                      />
                      <p className="text-[9px] text-zinc-600 leading-tight mt-1">Ingresa tu llave para habilitar respuestas de voz en tiempo real de ElevenLabs con clones avanzados.</p>
                    </div>

                    {/* CLEAN CHAT UTILITY */}
                    <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-950/10 flex items-center justify-center text-red-500 border border-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div className="text-left text-xs">
                          <span className="font-extrabold text-white block font-sans">REINICIAR MONÓLOGOS</span>
                          <span className="text-[10px] text-zinc-500">Elimina todo el historial escrito conversacional guardado.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="w-full py-2.5 rounded-xl bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-800/20 font-mono font-bold text-[10px] tracking-wider uppercase transition-all"
                      >
                        LIMPIAR CONVERSACIÓN
                      </button>
                    </div>

                    {/* RESTABLECER A VALORES INICIALES */}
                    <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 border border-white/5">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <div className="text-left text-xs">
                          <span className="font-extrabold text-white block font-sans">VALORES DE FÁBRICA</span>
                          <span className="text-[10px] text-zinc-500">Regresa la foto, nombre, voz e historial a los de fábrica.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfigOpen(false);
                          handleResetToImgDefaults();
                        }}
                        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 font-mono font-bold text-[10px] tracking-wider uppercase transition-all"
                      >
                        REVERTIR AHORA
                      </button>
                    </div>

                  </div>

                </div>

                {/* Bottom Turquoise Button stretched across exactly as pictured in Image 2 */}
                <div className="p-4 border-t border-white/5 bg-zinc-950/80">
                  <button
                    type="button"
                    onClick={handleSaveChangesSaved}
                    className="w-full py-4 rounded-xl bg-[#2cd1b1] hover:bg-[#25bca0] text-black font-black tracking-widest text-[11px] uppercase transition-all shadow-md active:scale-95 text-center cursor-pointer"
                  >
                    GUARDAR CAMBIOS
                  </button>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* SECONDARY DEPLOYABLE CARD PANEL (Elegant layout to right/left side without covering main card) */}
      <AnimatePresence>
        {isLiveOpen && showChatDrawer && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="w-full max-w-[410px] aspect-[9/16] rounded-[3rem] border-[14px] border-[#18181b] bg-[#0c0a0f] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.92)] flex flex-col justify-between z-20 relative animate-fades"
          >
            {/* Header of Secondary chat */}
            <div className="p-4 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  {mediaType === 'video' ? (
                    <video 
                      src={mediaUrl} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-8 h-8 rounded-full object-cover border border-pink-500/40" 
                    />
                  ) : (
                    <img 
                      src={mediaUrl} 
                      className="w-8 h-8 rounded-full object-cover border border-pink-500/40" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80";
                      }}
                    />
                  )}
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-black" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    Chat con {charName}
                  </h4>
                  <p className="text-[9px] text-[#fa4298] font-mono tracking-wider uppercase">RESPALDO DE VOZ • EN VIVO</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={handleClearHistory} 
                  title="Limpiar Conversación"
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowChatDrawer(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-all cursor-pointer"
                  title="Cerrar Chat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Body scrolling region */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/40 overflow-x-hidden flex flex-col scrollbar-none">
              <div className="mx-auto text-center my-1 select-none pointer-events-none">
                <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-600 bg-white/[0.02] px-2.5 py-1 rounded-full border border-white/5">
                  Conexión de Respaldo En Vivo
                </span>
              </div>

              {chatHistory.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[85%] rounded-[1.2rem] px-3.5 py-2.5 text-xs leading-relaxed transition-all",
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-[#fa4298] to-[#9733ee] text-white ml-auto rounded-tr-none shadow-md shadow-pink-900/10' 
                      : 'bg-zinc-900/80 border border-white/5 text-zinc-100 mr-auto rounded-tl-none'
                  )}
                >
                  <span className="block text-[8px] uppercase tracking-wider font-mono text-zinc-400 mb-0.5 opacity-80 text-left font-bold">
                    {msg.sender === 'user' ? 'Tú' : charName}
                  </span>
                  <p className="text-zinc-100 text-left whitespace-pre-wrap">{msg.text}</p>
                </motion.div>
              ))}

              {isLoading && (
                <div className="bg-zinc-900/60 border border-white/5 text-pink-400 mr-auto rounded-[1.2rem] rounded-tl-none px-3.5 py-2.5 text-xs flex items-center gap-2 max-w-[200px] animate-pulse">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 lowercase">escribiendo...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input typing panel */}
            <div className="p-3 bg-zinc-950/80 border-t border-white/5 backdrop-blur-md">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Escribe un mensaje de respaldo...`}
                  maxLength={350}
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/40 transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="bg-[#fa4298] hover:bg-pink-500 disabled:opacity-50 text-white font-bold p-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
