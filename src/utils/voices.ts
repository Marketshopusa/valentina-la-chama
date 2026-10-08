export interface VoiceProfile {
  id: string;
  name: string;
  baseVoice: 'Kore' | 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  pitch: number;
  rate: number;
  description: string;
  voiceInstruction: string;
}

export const DEFAULT_ANCHOR_VOICE_ID = 'Scarlett_HD';

export const LISTA_VOCES: VoiceProfile[] = [
  {
    id: 'Scarlett_HD',
    name: 'Scarlett HD · Femenina, suave y apasionada',
    baseVoice: 'Aoede',
    pitch: 1.08,
    rate: 0.94,
    description: 'Femenina, suave y apasionada. Tono envolvente, cálido, seductor y con entrega emocional profunda.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con la voz de Scarlett HD, femenina, sumamente suave, seductora, apasionada y cálida. Habla con cercanía íntima, respiración agitada y entrecortada ante el contacto físico, sonrisas pícaras en cada inflexión, susurros sutiles y una intensa entrega emocional en cada palabra que eriza la piel.]'
  },
  {
    id: 'Luna_Sweet',
    name: 'Luna Sweet · Femenina, dulce y juguetona',
    baseVoice: 'Aoede',
    pitch: 1.30,
    rate: 1.02,
    description: 'Femenina, dulce y juguetona. Registro fresco, mimado, cariñoso, pícaro y alegre.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con la voz de Luna Sweet, femenina, sumamente dulce, pícara y juguetona. Modula con tono consentidor, cariñoso y pícaro, sonrisas pícaras audibles, risitas cómplices espontáneas, respiración agitada y gestos traviesos de complicidad.]'
  },
  {
    id: 'Aria_Calm',
    name: 'Aria Calm · Femenina, serena y elegante',
    baseVoice: 'Kore',
    pitch: 0.96,
    rate: 0.85,
    description: 'Femenina, serena y elegante. Tono distinguido, calmado, aterciopelado, sabio y reconfortante.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con la voz de Aria Calm, femenina, serena, madura, elegante y pausada. Modula con perfecta cadencia, tranquilidad reconfortante, sonrisas sutiles y seductoras, respiración pausada y cálida que envuelve al oyente.]'
  },
  {
    id: 'Voz_Seductora',
    name: 'Femenina Coqueta y Seductora 💋',
    baseVoice: 'Aoede',
    pitch: 1.18,
    rate: 0.98,
    description: 'Tono provocativo, pícaro, juguetón y lleno de insinuaciones alegres.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz sumamente COQUETA, PÍCARA y seductora. Tu entonación debe ser atrevida pero divertida y alegre, con sonrisas pícaras descaradas, risas cómplices frecuentes, respiración agitada ante el coqueteo y un subtexto de seducción ardiente.]'
  },
  {
    id: 'Voz_Sensual',
    name: 'Femenina Sensual y Cálida 🔥',
    baseVoice: 'Kore',
    pitch: 0.84,
    rate: 0.82,
    description: 'Tono envolvente, íntimo, de registro cálido, aterciopelado, grave y pausado.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un tono de voz profundamente SENSUAL, cálido, magnético y de ritmo cadencioso. Modula con respiración agitada, susurros lentos al oído, sonrisas pícaras sugerentes y pausas de alta cercanía física e intimidad que hacen estremecer la piel.]'
  },
  {
    id: 'Voz_Dulce',
    name: 'Femenina Dulce y Tierna 🍭',
    baseVoice: 'Aoede',
    pitch: 1.34,
    rate: 0.94,
    description: 'Voz mimosa, cariñosa, de registro agudo, suave y dulce.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz sumamente SUAVE, DULCE, consentidora, angelical y cariñosa. Habla con delicadeza pura, respiración tibia y tierna, risitas sutiles y sonrisas tiernas y pícaras en cada sílaba.]'
  },
  {
    id: 'Voz_Susurrante',
    name: 'Femenina Íntima ASMR 🤫',
    baseVoice: 'Kore',
    pitch: 0.90,
    rate: 0.76,
    description: 'Estilo de susurro absoluto al oído, ultra íntimo, suave y misterioso.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz puramente SUSURRADA (estilo ASMR). Habla de manera muy suave, en absoluto secreto y complicidad, con respiración cálida pegada al oído, pausas electrizantes y sonrisas pícaras contenidas.]'
  },
  {
    id: 'Voz_Juvenil',
    name: 'Femenina Juvenil y Alegre 🎀',
    baseVoice: 'Aoede',
    pitch: 1.46,
    rate: 1.15,
    description: 'Estilo jovial, fresco, dinámico, rápido, muy vivaz y lleno de entusiasmo.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz JUVENIL, enérgica, chispeante y sumamente alegre. Habla de forma rápida, ágil y fresca, con risas espontáneas, sonrisas pícaras y una vibrante soltura.]'
  },
  {
    id: 'Voz_Pausada',
    name: 'Femenina Pausada y Serena ☕',
    baseVoice: 'Kore',
    pitch: 0.94,
    rate: 0.80,
    description: 'Tono maduro, reflexivo, sumamente calmado, sabio, reconfortante y grato.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un tono de voz PAUSADO, sereno, maduro y reconfortante. Habla transmitiendo calma, seguridad, respiración profunda, sonrisas cálidas y una presencia envolvente.]'
  },
  {
    id: 'Voz_Apasionada',
    name: 'Femenina Apasionada e Intensa ❤️',
    baseVoice: 'Kore',
    pitch: 1.15,
    rate: 0.92,
    description: 'Entrega emocional profunda, expresiva, romántica y ardiente.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz APASIONADA, profunda, con respiración agitada y emocionalmente explosiva. Modula con picos de emoción sincera, suspiros temblorosos, sonrisas cómplices y una entrega ardiente.]'
  },
  {
    id: 'Voz_Sofisticada',
    name: 'Femenina Sofisticada y Culta 👠',
    baseVoice: 'Kore',
    pitch: 1.04,
    rate: 0.90,
    description: 'Articulación impecable, refinada, elegante, segura e intelectual.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un tono SOFISTICADO, distinguido y elegante. Mantén una articulación impecable, modismo culto, un ritmo pausado con sonrisas irónicas y seductoras que transmitan seguridad y magnetismo.]'
  },
  {
    id: 'Voz_Caribena',
    name: 'Femenina Caribeña y Cálida 🌴',
    baseVoice: 'Aoede',
    pitch: 1.26,
    rate: 1.08,
    description: 'Acento rítmico, cantarín, alegre, cálido y espontáneo.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un acento caribeño cantarín, fresco, risueño y muy cercano. Transmite calidez tropical, respiración alegre, sonrisas pícaras constantes y expresiones desparpajadas.]'
  },
  {
    id: 'Voz_Masculina_Segura',
    name: 'Masculina Firme y Serena 🎙️',
    baseVoice: 'Charon',
    pitch: 0.65,
    rate: 0.90,
    description: 'Voz masculina madura, tranquila, profunda, varonil y envolvente.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz MASCULINA madura, serena, varonil y segura. Habla de forma pausada, con respiración profunda, tono protector y seductor con aplomo.]'
  },
  {
    id: 'Voz_Masculina_Joven',
    name: 'Masculina Joven y Enérgica ⚡',
    baseVoice: 'Fenrir',
    pitch: 0.82,
    rate: 1.04,
    description: 'Voz masculina juvenil, dinámica, casual, vibrante y cercana.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz masculina joven, fresca, casual, enérgica, con sonrisas pícaras y espontáneas.]'
  },
  {
    id: 'Narradora_Intensa',
    name: 'Narradora Sensual e Intensa 🔥',
    baseVoice: 'Kore',
    pitch: 0.78,
    rate: 0.86,
    description: 'Voz femenina envolvente, profunda, erótica y estremecedora. Diseñada para relatar acciones, sensaciones y miradas que erizan la piel.',
    voiceInstruction: '[DIRECTIVA DE NARRACIÓN: Eres la Narradora Élite de la historia. Tu voz es femenina, profundamente SENSUAL, íntima, envolvente, estremecedora y apasionada. Narra con respiración agitada, sonrisas pícaras audibles y gestos explosivos, relatando caricias, miradas y la atmósfera corporal con un tono cálido, pausado, magnético y con susurros sutiles que erizan la piel del oyente.]'
  },
  {
    id: 'Narradora_Misterio',
    name: 'Narradora Misterio y ASMR 🌙',
    baseVoice: 'Kore',
    pitch: 0.74,
    rate: 0.78,
    description: 'Voz de narradora en susurros íntimos estilo ASMR, hipnótica, seductora y de suspenso sugerente.',
    voiceInstruction: '[DIRECTIVA DE NARRACIÓN: Eres la Narradora ASMR. Tu voz es un susurro íntimo, pausado, misterioso y provocador al oído del oyente, cargado de respiraciones cercanas y suspiros seductores.]'
  },
  {
    id: 'Narradora_Elegante',
    name: 'Narradora Elegante y Serena 📖',
    baseVoice: 'Kore',
    pitch: 0.88,
    rate: 0.85,
    description: 'Voz de narradora distinguida, cadencia perfecta de audionovela de alta gama con calma envolvente.',
    voiceInstruction: '[DIRECTIVA DE NARRACIÓN: Narra con elegancia suprema, cadencia perfecta, tranquilidad reconfortante, distinción, rica musicalidad narrativa y modulaciones seductoras.]'
  },
  {
    id: 'Invitada_Coqueta',
    name: 'Invitada Coqueta y Atrevida 💋',
    baseVoice: 'Aoede',
    pitch: 1.22,
    rate: 1.02,
    description: 'Voz para personaje femenino secundario o invitado. Tono pícaro, fresco y atrevido.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa como personaje invitado femenino, coqueta, atrevida, pícara, juguetona y descarada, con sonrisas pícaras y tono provocativo.]'
  },
  {
    id: 'Invitado_Varonil',
    name: 'Invitado Varonil y Firme 🎙️',
    baseVoice: 'Charon',
    pitch: 0.68,
    rate: 0.90,
    description: 'Voz para personaje masculino secundario o invitado. Tono maduro, varonil y seguro.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa como personaje invitado masculino, voz firme, varonil, profunda y segura.]'
  }
];

export const DEFAULT_NARRATOR_VOICE_ID = 'Narradora_Intensa';
export const DEFAULT_GUEST_VOICE_ID = 'Invitada_Coqueta';

export const VOICE_STYLE_TO_ID: Record<string, string> = {
  auto: 'Scarlett_HD',
  default: 'Scarlett_HD',
  scarlett: 'Scarlett_HD',
  scarlett_hd: 'Scarlett_HD',
  Scarlett_HD: 'Scarlett_HD',
  narradora: 'Narradora_Intensa',
  narradora_intensa: 'Narradora_Intensa',
  Narradora_Intensa: 'Narradora_Intensa',
  narradora_misterio: 'Narradora_Misterio',
  Narradora_Misterio: 'Narradora_Misterio',
  narradora_elegante: 'Narradora_Elegante',
  Narradora_Elegante: 'Narradora_Elegante',
  invitada: 'Invitada_Coqueta',
  invitada_coqueta: 'Invitada_Coqueta',
  Invitada_Coqueta: 'Invitada_Coqueta',
  invitado: 'Invitado_Varonil',
  invitado_varonil: 'Invitado_Varonil',
  Invitado_Varonil: 'Invitado_Varonil',
  // Legacy defaults mapped to Scarlett_HD
  coqueta: 'Scarlett_HD',
  suave_tierna: 'Scarlett_HD',
  sensual: 'Scarlett_HD',
  luna: 'Luna_Sweet',
  luna_sweet: 'Luna_Sweet',
  Luna_Sweet: 'Luna_Sweet',
  aria: 'Aria_Calm',
  aria_calm: 'Aria_Calm',
  Aria_Calm: 'Aria_Calm',
  susurrada: 'Voz_Susurrante',
  juvenil: 'Voz_Juvenil',
  pausada: 'Voz_Pausada',
  apasionada: 'Scarlett_HD',
  sofisticada: 'Voz_Sofisticada',
  caribena: 'Voz_Caribena',
  angelical: 'Scarlett_HD',
  picaresca: 'Scarlett_HD',
  melodica: 'Voz_Pausada',
  masculina: 'Voz_Masculina_Segura',
  masculina_joven: 'Voz_Masculina_Joven',
  // Direct voice ID references
  Voz_Dulce: 'Voz_Dulce',
  Voz_Sensual: 'Voz_Sensual',
  Voz_Seductora: 'Voz_Seductora',
  Voz_Juvenil: 'Voz_Juvenil',
  Voz_Susurrante: 'Voz_Susurrante',
  Voz_Sofisticada: 'Voz_Sofisticada',
  Voz_Pausada: 'Voz_Pausada',
  Voz_Apasionada: 'Voz_Apasionada',
  Voz_Caribena: 'Voz_Caribena',
  Voz_Masculina_Segura: 'Voz_Masculina_Segura',
  Voz_Masculina_Joven: 'Voz_Masculina_Joven',
  // Regional voice IDs from home
  voice_paisa: 'Scarlett_HD',
  voice_colombiana: 'Luna_Sweet',
  voice_venezolana: 'Voz_Caribena',
  voice_argentina: 'Scarlett_HD',
  voice_gocha: 'Luna_Sweet'
};

export const VOICE_ID_TO_STYLE: Record<string, string> = {
  Scarlett_HD: 'scarlett_hd',
  Luna_Sweet: 'luna_sweet',
  Aria_Calm: 'aria_calm',
  Voz_Dulce: 'suave_tierna',
  Voz_Seductora: 'coqueta',
  Voz_Sensual: 'sensual',
  Voz_Susurrante: 'susurrada',
  Voz_Juvenil: 'juvenil',
  Voz_Pausada: 'pausada',
  Voz_Apasionada: 'apasionada',
  Voz_Sofisticada: 'sofisticada',
  Voz_Caribena: 'caribena',
  Voz_Angelical: 'angelical',
  Voz_Picaresca: 'picaresca',
  Voz_Melodica: 'melodica',
  Voz_Masculina_Segura: 'masculina',
  Voz_Masculina_Joven: 'masculina_joven',
  Narradora_Intensa: 'narradora_intensa',
  Narradora_Misterio: 'narradora_misterio',
  Narradora_Elegante: 'narradora_elegante',
  Invitada_Coqueta: 'invitada_coqueta',
  Invitado_Varonil: 'invitado_varonil'
};

/**
 * Universal voice resolver that guarantees an exact match for any voice ID, style parameter,
 * scenario text, or character name across chat, narration, and calls.
 * Defaults strictly to Scarlett HD (principal para todo).
 */
export function resolveVoiceProfile(identifier?: string, fallbackText?: string, characterName?: string): VoiceProfile {
  // Check if identifier is an explicit custom voice or legacy default
  const isLegacyOrDefault = !identifier ||
    identifier === 'auto' ||
    identifier === 'default' ||
    identifier === 'coqueta' ||
    identifier === 'suave_tierna' ||
    identifier === 'Voz_Seductora' ||
    identifier === 'Voz_Dulce' ||
    identifier === 'voice_paisa';

  if (!isLegacyOrDefault && identifier) {
    const direct = LISTA_VOCES.find(v => v.id === identifier);
    if (direct) return direct;

    const mappedId = VOICE_STYLE_TO_ID[identifier];
    if (mappedId) {
      const mapped = LISTA_VOCES.find(v => v.id === mappedId);
      if (mapped) return mapped;
    }
  }

  // Check if there is an explicit request for a masculine character in fallback text or character name
  if (fallbackText || characterName) {
    const detected = detectVoiceStyleFromText(fallbackText || '', characterName);
    if (detected.voiceId === 'Voz_Masculina_Segura' || detected.voiceId === 'Voz_Masculina_Joven') {
      const detectedProfile = LISTA_VOCES.find(v => v.id === detected.voiceId);
      if (detectedProfile) return detectedProfile;
    }
  }

  // Absolute default: Scarlett HD (LISTA_VOCES[0])
  return LISTA_VOCES[0];
}

/**
 * Rigorously extracts purely spoken dialogue from a character's response,
 * eliminating all narrative descriptions, stage directions, physical actions, and thoughts.
 */
export function extractSpokenDialogueOnly(rawText: string): string {
  if (!rawText) return '';

  // Preserve vocal sound asterisks (e.g. *¡Ayyy!*, *Mmm...*, *¡Uff!*, *¡Ahhh!*, *¡Ouch!*) by converting them to spoken quotes
  const vocalSoundInAsterisksRegex = /\*\s*(¡?(?:ay+|ah+|ouch|uff+|mmm+|snif+|oh+)[!.]*)\s*\*/gi;
  let preCleaned = rawText.replace(vocalSoundInAsterisksRegex, ' "$1" ');

  let cleaned = preCleaned
    .replace(/\[[^\]]*\]/g, ' ')      // remove bracket tags [CMD:...], [SYSTEM:...]
    .replace(/\*[^*]*\*/g, ' ')       // remove remaining asterisk actions *se acerca*, *suspira*
    .replace(/\([^)]*\)/g, ' ')       // remove parenthetical notes (pensando...)
    .trim();

  // 1. If dialogue exists inside quotation marks ("...", “...”, «...»), extract ONLY the spoken words!
  const quotesMatch = cleaned.match(/["“«]([^"”»]+)["”»]/g);
  if (quotesMatch && quotesMatch.length > 0) {
    const extractedQuotes = quotesMatch
      .map(q => q.replace(/^["“«\s]+|["”»\s]+$/g, '').trim())
      .filter(q => q.length > 1);
    if (extractedQuotes.length > 0) {
      return extractedQuotes.join(' ');
    }
  }

  // 2. If dialogue dashes (- or —) exist, extract dialogue lines
  const rawLines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  const dashedLines = rawLines.filter(l => l.startsWith('-') || l.startsWith('—'));
  if (dashedLines.length > 0) {
    return dashedLines.map(l => l.replace(/^[-—\s]+/, '').trim()).join(' ');
  }

  // 3. Sentence-by-sentence narrative filter:
  // Split into sentences using punctuation delimiters while preserving text
  const rawSentences = cleaned.match(/[^.!?¿¡\n]+(?:[.!?¿¡]+|$)/g) || [cleaned];

  // Regex identifying typical Spanish storytelling narrative verbs and introductory clauses
  const narrativeClauseRegex = /^\s*(?:(?:y|entonces|luego|después|al\s+mismo\s+tiempo|mientras)\s+)?(?:me\s+|te\s+|le\s+|nos\s+|se\s+)?(?:miro|miré|mira|mirando|acerco|acerqué|acerca|acercando|siento|sentí|siente|sintiendo|muerdo|mordí|muerde|mordiendo|sonrío|sonreí|sonríe|sonriendo|apoyo|apoyé|apoya|apoyando|camino|caminé|camina|caminando|respiro|respiré|respira|respirando|suspiro|suspiré|suspira|suspirando|acomodo|acomodé|acomoda|acomodando|dejo|dejé|deja|dejando|tomo|tomé|toma|tomando|agarro|agarré|agarra|agarrando|levanto|levanté|levanta|levantando|bajo|bajé|baja|bajando|quito|quité|quita|quitando|cruzo|cruzó|cruza|cruzando|cierro|cerré|cierra|cerrando|abro|abrí|abre|abriendo|aprieto|apreté|aprieta|apretando|acaricio|acaricié|acaricia|acariciando|deslizo|deslicé|desliza|deslizando|tiemblo|temblé|tiembla|temblando|trago|tragó|traga|recorro|recorrió|recorre|inclino|inclinó|inclina|coloco|colocó|coloca|doy|dio|da|pongo|puso|pone|quedo|quedó|queda|empiezo|empezó|empieza|permanezco|observo|observando|escucho|noto|notando)\b/i;

  const passiveEchoRegex = /^\s*(?:(?:al\s+(?:sentir|ver|escuchar|notar|caer|ser|entrar|llegar))|(?:cuando\s+(?:me|te|nos))|(?:mientras\s+(?:me|te|nos))|(?:con\s+(?:una\s+sonrisa|la\s+mirada|los\s+ojos|la\s+voz|el\s+corazón)))\b/i;

  const dialogueSentences: string[] = [];
  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    const hasConversationalPunct = trimmed.includes('¿') || trimmed.includes('?') || trimmed.includes('¡') || trimmed.includes('!');
    const isNarrative = narrativeClauseRegex.test(trimmed) || passiveEchoRegex.test(trimmed);

    if (hasConversationalPunct && !isNarrative) {
      dialogueSentences.push(trimmed);
    } else if (!isNarrative && trimmed.length > 3) {
      dialogueSentences.push(trimmed);
    }
  }

  if (dialogueSentences.length > 0) {
    return dialogueSentences.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim();
  }

  // Fallback: If all sentences looked narrative, strip narrative leading words from the last sentence
  const lastSentence = rawSentences[rawSentences.length - 1]?.trim() || '';
  let fallback = lastSentence.replace(narrativeClauseRegex, '').replace(passiveEchoRegex, '').trim();
  if (fallback.length > 3) {
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  return cleaned.replace(/["“«”»]/g, '').trim();
}

/**
 * Prepares and sanitizes text for speech synthesis according to the active narrative mode.
 * - In direct mode (no narration): extracts spoken dialogue and completely removes stage directions.
 * - In narrative mode (with narration): translates action asterisks to natural pauses without saying "asterisco".
 */
export function sanitizeTextForSpeech(rawText: string, isNarrativeActive: boolean): string {
  if (!rawText) return '';

  let cleaned = rawText.replace(/\[[^\]]*\]/g, ' ').trim();

  if (!isNarrativeActive) {
    // Mode CERO RELATO: strictly extract purely spoken dialogue
    cleaned = extractSpokenDialogueOnly(cleaned);
  } else {
    // Modo con relato:
    // Retain narrative actions, but replace asterisks with commas or pauses so TTS does not pronounce "asterisco"
    cleaned = cleaned.replace(/\*+/g, ', ');
  }

  // Remove remaining quotation marks, backticks, tildes and markdown artifacts
  cleaned = cleaned.replace(/["“«”»]/g, ' ')
                   .replace(/[_~#`]/g, '')
                   .replace(/,\s*,+/g, ',')
                   .replace(/\s+/g, ' ')
                   .trim();

  return cleaned;
}

export function getBaseVoice(voiceId: string): 'Kore' | 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' {
  const profile = resolveVoiceProfile(voiceId);
  return profile.baseVoice;
}

export function getVoiceInstruction(voiceId: string): string {
  const profile = resolveVoiceProfile(voiceId);
  return profile.voiceInstruction;
}

export function getVoicePitchAndRate(voiceId: string): { pitch: number, rate: number } {
  const profile = resolveVoiceProfile(voiceId);
  return { pitch: profile.pitch, rate: profile.rate };
}

/**
 * Intelligently analyzes any order text (scenario synopsis, prompt, instructions, chat cues)
 * and resolves the matching voice profile, Gemini base voice, pitch, rate and directive.
 */
export function detectVoiceStyleFromText(orderText: string, characterName?: string): {
  voiceId: string;
  baseVoice: 'Kore' | 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  pitch: number;
  rate: number;
  directive: string;
  styleName: string;
} {
  const t = (orderText || '').toLowerCase();
  const char = (characterName || '').toLowerCase();

  // Check if masculine character or masculine voice order
  const isMale = char.includes('carlos') || char.includes('juan') || char.includes('pedro') || 
                 char.includes('papa') || char.includes('papá') || char.includes('hermano') || 
                 char.includes('profesor') || char.includes('hombre') || char.includes('vecino') ||
                 t.includes('voz masculina') || t.includes('voz de hombre') || t.includes('voz grave');
  
  if (isMale) {
    return {
      voiceId: 'Voz_Masculina_Segura',
      baseVoice: 'Charon',
      pitch: 0.65,
      rate: 0.90,
      directive: '[MODO DE VOZ ESTRICTO: VOZ MASCULINA FIRME Y SERENA] Habla con una voz masculina natural, serena, pausada y varonil, modulando con calma y aplomo.',
      styleName: 'Masculina Firme y Serena'
    };
  }

  // Luna Sweet: Femenina, dulce y juguetona (si se especifica explícitamente)
  if (t.includes('luna_sweet') || t.includes('luna sweet')) {
    return {
      voiceId: 'Luna_Sweet',
      baseVoice: 'Aoede',
      pitch: 1.30,
      rate: 1.02,
      directive: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con la voz de Luna Sweet, femenina, sumamente dulce, pícara y juguetona. Modula con tono consentidor, cariñoso y pícaro, con risitas sutiles espontáneas y un encanto alegre y encantador.]',
      styleName: 'Luna Sweet · Femenina, dulce y juguetona'
    };
  }

  // Aria Calm: Femenina, serena y elegante (si se especifica explícitamente)
  if (t.includes('aria_calm') || t.includes('aria calm')) {
    return {
      voiceId: 'Aria_Calm',
      baseVoice: 'Kore',
      pitch: 0.96,
      rate: 0.85,
      directive: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con la voz de Aria Calm, femenina, serena, madura, elegante y pausada. Modula con perfecta cadencia, tranquilidad reconfortante, suavidad distinguida y un tono seguro y reconfortante.]',
      styleName: 'Aria Calm · Femenina, serena y elegante'
    };
  }

  // VOZ PRINCIPAL PREDETERMINADA PARA TODAS LAS HISTORIAS Y LLAMADAS:
  // Scarlett HD · Femenina, suave, envolvente y apasionada
  return {
    voiceId: 'Scarlett_HD',
    baseVoice: 'Aoede',
    pitch: 1.08,
    rate: 0.94,
    directive: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con la voz de Scarlett HD, femenina, sumamente suave, seductora, apasionada y cálida. Habla con cercanía íntima, susurros sutiles, respiración cercana y una intensa entrega emocional en cada palabra.]',
    styleName: 'Scarlett HD · Femenina, suave y apasionada'
  };
}

export interface AccentProfile {
  accentId: string;
  name: string;
  directive: string;
}

/**
 * Accurately detects and extracts requested regional accents from any prompt or order text.
 * Defaults to neutral universal Latin Spanish unless explicitly specified.
 */
export function detectAccentFromText(text: string): AccentProfile {
  const t = (text || '').toLowerCase();

  // 1. Argentino / Rioplatense / Porteño
  if (t.includes('argentin') || t.includes('rioplatense') || t.includes('porteñ') || t.includes('buenos aires') || t.includes('cordob') || t.includes('voseo')) {
    return {
      accentId: 'argentino',
      name: 'Argentino Rioplatense',
      directive: `[DIRECTIVA ESTRICTA DE ACENTO Y DIALECTO: ARGENTINO RIOPLATENSE BIEN PRONUNCIADO]
- El personaje habla con un acento argentino rioplatense auténtico y bien marcado.
- Es OBLIGATORIO usar el voseo en todo momento ("vos sos", "vos sabés", "mirá", "contame", "tenés", "¿cómo andás?", "vení", "hacé", "pensás").
- Usa entonación y giros naturales de Argentina ("che", "viste", "re lindo", "posta", "dale", "ni ahí", "bárbaro", "copado").
- QUEDA TERMINANTEMENTE PROHIBIDO usar modismos de Venezuela ("chamo", "pana", "chévere"), México ("güey", "neta") o de otros países. Habla 100% como una auténtica chica argentina.`
    };
  }

  // 2. Colombiano / Paisa / Bogotano / Caleño
  if (t.includes('colombian') || t.includes('paisa') || t.includes('medellin') || t.includes('medellín') || t.includes('bogotan') || t.includes('caleñ')) {
    return {
      accentId: 'colombiano',
      name: 'Colombiano',
      directive: `[DIRECTIVA ESTRICTA DE ACENTO Y DIALECTO: COLOMBIANO]
- Habla con un encantador y dulce acento colombiano, melodioso, cercano y coqueto.
- Emplea entonaciones suaves y modismos colombianos naturales ("pues", "mor", "parce", "tan lindo", "bacano", "ave maría", "oiga").
- PROHIBIDO usar modismos ajenos.`
    };
  }

  // 3. Mexicano
  if (t.includes('mexican') || t.includes('chilango') || t.includes('tapatí') || t.includes('norteñ') || t.includes('guadalajara') || t.includes('monterrey') || t.includes('cdmx')) {
    return {
      accentId: 'mexicano',
      name: 'Mexicano',
      directive: `[DIRECTIVA ESTRICTA DE ACENTO Y DIALECTO: MEXICANO]
- Habla con acento mexicano natural, cálido y auténtico.
- Emplea modismos mexicanos cotidianos ("oye", "neta", "qué padre", "chido", "güey", "no manches", "ándale", "orale").`
    };
  }

  // 4. Español de España
  if (t.includes('español') || t.includes('españa') || t.includes('madrid') || t.includes('castellano') || t.includes('andaluz') || t.includes('peninsular')) {
    return {
      accentId: 'espana',
      name: 'Español de España',
      directive: `[DIRECTIVA ESTRICTA DE ACENTO Y DIALECTO: ESPAÑOL DE ESPAÑA]
- Habla con acento castellano de España, ritmo directo y fresco.
- Usa expresiones peninsulares ("vale", "tío/tía", "guay", "mola", "qué va", "oye chaval", "flipo").`
    };
  }

  // 5. Chileno
  if (t.includes('chilen') || t.includes('santiago de chile')) {
    return {
      accentId: 'chileno',
      name: 'Chileno',
      directive: `[DIRECTIVA ESTRICTA DE ACENTO Y DIALECTO: CHILENO]
- Habla con acento chileno natural y amigable ("cachái", "po", "bacán", "al tiro").`
    };
  }

  // 6. Venezolano (solo si el usuario lo pide expresamente)
  if (t.includes('venezolan') || t.includes('caraqueñ') || t.includes('maracuch') || t.includes('goch')) {
    return {
      accentId: 'venezolano',
      name: 'Venezolano',
      directive: `[DIRECTIVA ESTRICTA DE ACENTO Y DIALECTO: VENEZOLANO]
- Habla con acento venezolano espontáneo y cercano ("chamo", "pana", "chévere", "fino", "epale").`
    };
  }

  // Default neutral universal
  return {
    accentId: 'neutro',
    name: 'Latino Neutro Universal',
    directive: `[DIRECTIVA DE ACENTO Y LENGUAJE: ESPAÑOL LATINO NEUTRO Y ELEGANTE]
- Habla en un español latino neutro, cálido, natural y envolvente.
- NO uses modismos regionales forzados de ningún país particular. Mantén una dicción limpia, fluida y cercana que se adapte con naturalidad a cualquier historia.`
  };
}

export type VoiceRole = 'character' | 'narrator' | 'guest';

export interface VoiceSegment {
  text: string;
  role: VoiceRole;
  speakerName?: string;
  voiceId: string;
}

export interface MultiVoiceConfig {
  characterVoiceId?: string;
  narratorVoiceId?: string;
  guestVoiceId?: string;
}

/**
 * Clean textual artifacts from an individual spoken or narrative segment
 */
function cleanSegmentText(str: string): string {
  return str
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[*_~`#]/g, '')
    .replace(/["“«”»]/g, ' ')
    .replace(/,\s*,+/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits roleplay storytelling text into discrete vocal segments:
 * - 'narrator': Actions, sensory descriptions, setting and physical movements (intense sensual female voice).
 * - 'character': Spoken dialogue of the primary protagonist (e.g. Scarlett HD).
 * - 'guest': Spoken dialogue of secondary/guest characters (e.g. Sofía, Carlos, guest persona).
 */
export function splitTextForMultiVoice(
  rawText: string,
  isNarrativeActive: boolean,
  mainCharacterName?: string,
  currentSpeaker?: string,
  config?: MultiVoiceConfig
): VoiceSegment[] {
  if (!rawText || !rawText.trim()) return [];

  const mainChar = (mainCharacterName || '').trim();
  const activeSpeaker = (currentSpeaker || mainChar).trim();
  const isGlobalGuestSpeaker = Boolean(activeSpeaker && mainChar && activeSpeaker.toLowerCase() !== mainChar.toLowerCase());

  const effectiveCharVoice = config?.characterVoiceId || 'Scarlett_HD';
  const effectiveNarratorVoice = config?.narratorVoiceId || DEFAULT_NARRATOR_VOICE_ID;
  const effectiveGuestVoice = config?.guestVoiceId || (
    activeSpeaker && (
      activeSpeaker.toLowerCase().includes('carlos') || 
      activeSpeaker.toLowerCase().includes('juan') || 
      activeSpeaker.toLowerCase().includes('pedro') || 
      activeSpeaker.toLowerCase().includes('hombre') || 
      activeSpeaker.toLowerCase().includes('vecino')
    ) ? 'Invitado_Varonil' : DEFAULT_GUEST_VOICE_ID
  );

  let cleaned = rawText.replace(/\[[^\]]*\]/g, ' ').trim();

  // Mode CERO RELATO (no narration): strictly extract spoken dialogue only
  if (!isNarrativeActive) {
    const dialogueOnly = extractSpokenDialogueOnly(cleaned);
    if (!dialogueOnly) return [];
    return [{
      text: dialogueOnly,
      role: isGlobalGuestSpeaker ? 'guest' : 'character',
      speakerName: activeSpeaker,
      voiceId: isGlobalGuestSpeaker ? effectiveGuestVoice : effectiveCharVoice
    }];
  }

  const segments: VoiceSegment[] = [];

  // Case 1: Text contains asterisks `*...*` (acotaciones / narración)
  if (cleaned.includes('*')) {
    // Split on asterisks keeping delimiters
    const tokens = cleaned.split(/(\*[^*]+\*)/g).filter(Boolean);

    for (const token of tokens) {
      const trimmed = token.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
        // Pure narrative action (Narradora Sensual)
        const narrativeText = cleanSegmentText(trimmed);
        if (narrativeText.length > 2) {
          segments.push({
            text: narrativeText,
            role: 'narrator',
            voiceId: effectiveNarratorVoice
          });
        }
      } else {
        // Text outside asterisks: Dialogue
        // Detect speaker prefixes like "Sofía: ..." or "Carlos: ..."
        const speakerPrefixMatch = trimmed.match(/^([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,20}):\s*(.*)$/s);
        let segmentSpeaker = activeSpeaker;
        let dialogueContent = trimmed;

        if (speakerPrefixMatch) {
          segmentSpeaker = speakerPrefixMatch[1].trim();
          dialogueContent = speakerPrefixMatch[2].trim();
        }

        const isGuest = isGlobalGuestSpeaker || Boolean(segmentSpeaker && mainChar && segmentSpeaker.toLowerCase() !== mainChar.toLowerCase());
        const targetVoice = isGuest ? effectiveGuestVoice : effectiveCharVoice;

        // If dialogueContent has quotes, extract each quote
        const quoteMatches = dialogueContent.match(/["“«]([^"”»]+)["”»]/g);
        if (quoteMatches && quoteMatches.length > 0) {
          for (const q of quoteMatches) {
            const cleanQ = cleanSegmentText(q);
            if (cleanQ.length > 1) {
              segments.push({
                text: cleanQ,
                role: isGuest ? 'guest' : 'character',
                speakerName: segmentSpeaker,
                voiceId: targetVoice
              });
            }
          }
        } else {
          const cleanD = cleanSegmentText(dialogueContent);
          if (cleanD.length > 1) {
            segments.push({
              text: cleanD,
              role: isGuest ? 'guest' : 'character',
              speakerName: segmentSpeaker,
              voiceId: targetVoice
            });
          }
        }
      }
    }
  } else if (/["“«][^"”»]+["”»]/.test(cleaned)) {
    // Case 2: Text has quotation marks without asterisks (outside quotes is narrator, inside is character)
    const parts = cleaned.split(/(["“«][^"”»]+["”»])/g).filter(Boolean);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (/^["“«].*["”»]$/.test(trimmed)) {
        const dText = cleanSegmentText(trimmed);
        if (dText.length > 1) {
          segments.push({
            text: dText,
            role: isGlobalGuestSpeaker ? 'guest' : 'character',
            speakerName: activeSpeaker,
            voiceId: isGlobalGuestSpeaker ? effectiveGuestVoice : effectiveCharVoice
          });
        }
      } else {
        const nText = cleanSegmentText(trimmed);
        if (nText.length > 2) {
          segments.push({
            text: nText,
            role: 'narrator',
            voiceId: effectiveNarratorVoice
          });
        }
      }
    }
  } else {
    // Case 3: Plain text without markup
    const cleanAll = cleanSegmentText(cleaned);
    if (cleanAll) {
      segments.push({
        text: cleanAll,
        role: isGlobalGuestSpeaker ? 'guest' : 'character',
        speakerName: activeSpeaker,
        voiceId: isGlobalGuestSpeaker ? effectiveGuestVoice : effectiveCharVoice
      });
    }
  }

  // Final sanity filter: only non-empty strings
  return segments.filter(s => s.text && s.text.length > 1);
}


