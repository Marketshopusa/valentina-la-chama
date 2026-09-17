export interface VoiceProfile {
  id: string;
  name: string;
  baseVoice: 'Kore' | 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  pitch: number;
  rate: number;
  description: string;
  voiceInstruction: string;
}

export const LISTA_VOCES: VoiceProfile[] = [
  {
    id: 'Voz_Dulce',
    name: 'Femenina Dulce y Tierna 🍭',
    baseVoice: 'Aoede',
    pitch: 1.34,
    rate: 0.94,
    description: 'Voz mimosa, angelical, cariñosa, de registro agudo, suave y dulce.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz sumamente SUAVE, DULCE, consentidora, angelical y cariñosa. Habla con delicadeza pura, sin volumen alto ni agresividad, transmitiendo un tierno afecto en cada sílaba, con risitas sutiles.]'
  },
  {
    id: 'Voz_Sensual',
    name: 'Femenina Sensual y Cálida 🔥',
    baseVoice: 'Kore',
    pitch: 0.84,
    rate: 0.82,
    description: 'Tono envolvente, íntimo, de registro cálido, aterciopelado, grave y pausado.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un tono de voz profundamente SENSUAL, cálido, magnético y de ritmo cadencioso. Modula de forma relajada, susurrando levemente y marcando pausas de alta cercanía física e intimidad.]'
  },
  {
    id: 'Voz_Seductora',
    name: 'Femenina Coqueta y Seductora 💋',
    baseVoice: 'Aoede',
    pitch: 1.18,
    rate: 0.98,
    description: 'Tono provocativo, pícaro, juguetón y lleno de insinuaciones alegres.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz sumamente COQUETA, PÍCARA y seductora. Tu entonación debe ser atrevida pero divertida y alegre, con risas cómplices frecuentes y un subtexto de seducción juguetona.]'
  },
  {
    id: 'Voz_Juvenil',
    name: 'Femenina Juvenil y Alegre 🎀',
    baseVoice: 'Aoede',
    pitch: 1.46,
    rate: 1.15,
    description: 'Estilo jovial, fresco, dinámico, rápido, muy vivaz y lleno de entusiasmo.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz JUVENIL, enérgica, chispeante y sumamente alegre. Habla de forma rápida, ágil y fresca, con entonaciones cantarinas y una vibrante soltura.]'
  },
  {
    id: 'Voz_Susurrante',
    name: 'Femenina Intima ASMR 🤫',
    baseVoice: 'Kore',
    pitch: 0.90,
    rate: 0.76,
    description: 'Estilo de susurro absoluto al oído, ultra íntimo, suave y misterioso.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz puramente SUSURRADA (estilo ASMR). Habla de manera muy suave, en absoluto secreto y complicidad, como si estuvieras soplando palabras tiernas directamente al oído.]'
  },
  {
    id: 'Voz_Sofisticada',
    name: 'Femenina Sofisticada y Culta 👠',
    baseVoice: 'Kore',
    pitch: 1.04,
    rate: 0.90,
    description: 'Articulación impecable, refinada, elegante, segura e intelectual.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un tono SOFISTICADO, distinguido y elegante. Mantén una articulación perfecta, modismo culto, un ritmo pausado, seguro e impecable que transmita clase.]'
  },
  {
    id: 'Voz_Pausada',
    name: 'Femenina Pausada y Serena ☕',
    baseVoice: 'Kore',
    pitch: 0.94,
    rate: 0.80,
    description: 'Tono maduro, reflexivo, sumamente calmado, sabio, reconfortante y grato.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un tono de voz PAUSADO, sereno, maduro y reconfortante. Habla transmitiendo calma, seguridad, haciendo pausas meditadas y brindando un espacio de conversación muy agradable.]'
  },
  {
    id: 'Voz_Apasionada',
    name: 'Femenina Apasionada e Intensa ❤️',
    baseVoice: 'Kore',
    pitch: 1.15,
    rate: 0.92,
    description: 'Entrega emocional profunda, expresiva, romántica y ardiente.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz APASIONADA, profunda y emocionalmente intensa. Modula con picos de emoción sincera, expresando romance ardiente, devoción total y una cercanía abrumadora.]'
  },
  {
    id: 'Voz_Caribena',
    name: 'Femenina Caribeña y Cálida 🌴',
    baseVoice: 'Aoede',
    pitch: 1.26,
    rate: 1.08,
    description: 'Acento rítmico, cantarín, alegre, cálido y espontáneo.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un acento caribeño cantarín, fresco, risueño y muy cercano. Transmite calidez tropical, una constante sonrisa al hablar y expresiones carismáticas.]'
  },
  {
    id: 'Voz_Angelical',
    name: 'Femenina Angelical y Pura ✨',
    baseVoice: 'Aoede',
    pitch: 1.48,
    rate: 0.86,
    description: 'Tono celestial, reconfortante, suave como el aire y sumamente dulce.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz sumamente ANGELICAL, fluida, pura y suave como la brisa. Brinda ternura absoluta, transmitiendo un aura de paz, resguardo y un trato infinitamente cariñoso.]'
  },
  {
    id: 'Voz_Picaresca',
    name: 'Femenina Traviesa y Juguetona 🦊',
    baseVoice: 'Aoede',
    pitch: 1.28,
    rate: 1.12,
    description: 'Estilo juguetón, risueño, pícaro y con toques cómicos traviesos.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz traviesa, pícara y sumamente juguetona. Ríete con picardía, modula tus palabras con giros ingeniosos e informales, manteniendo una vibra súper divertida.]'
  },
  {
    id: 'Voz_Melodica',
    name: 'Femenina Melódica y Relajante 🎵',
    baseVoice: 'Kore',
    pitch: 1.10,
    rate: 0.86,
    description: 'Tono rítmico balanceado, sumamente pacífico, cadencioso y musical.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con un tono melódico, armónico y profundamente pacífico. Transmite serenidad musical, con una cadencia que relaja la mente y el cuerpo del oyente.]'
  },
  {
    id: 'Voz_Masculina_Segura',
    name: 'Masculina Firme y Serena 🎙️',
    baseVoice: 'Charon',
    pitch: 0.65,
    rate: 0.90,
    description: 'Voz masculina madura, tranquila, profunda, varonil y envolvente.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz MASCULINA madura, serena, varonil y segura. Habla de forma pausada, natural y con aplomo.]'
  },
  {
    id: 'Voz_Masculina_Joven',
    name: 'Masculina Joven y Enérgica ⚡',
    baseVoice: 'Fenrir',
    pitch: 0.82,
    rate: 1.04,
    description: 'Voz masculina juvenil, dinámica, casual, vibrante y cercana.',
    voiceInstruction: '[DIRECTIVA DE INTERPRETACIÓN: Actúa con una voz masculina joven, fresca, casual, enérgica y espontánea.]'
  }
];

export const VOICE_STYLE_TO_ID: Record<string, string> = {
  auto: 'Voz_Dulce',
  suave_tierna: 'Voz_Dulce',
  coqueta: 'Voz_Seductora',
  sensual: 'Voz_Sensual',
  susurrada: 'Voz_Susurrante',
  juvenil: 'Voz_Juvenil',
  pausada: 'Voz_Pausada',
  apasionada: 'Voz_Apasionada',
  sofisticada: 'Voz_Sofisticada',
  caribena: 'Voz_Caribena',
  angelical: 'Voz_Angelical',
  picaresca: 'Voz_Picaresca',
  melodica: 'Voz_Melodica',
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
  Voz_Angelical: 'Voz_Angelical',
  Voz_Picaresca: 'Voz_Picaresca',
  Voz_Melodica: 'Voz_Melodica',
  Voz_Masculina_Segura: 'Voz_Masculina_Segura',
  Voz_Masculina_Joven: 'Voz_Masculina_Joven',
  // Regional voice IDs from home
  voice_paisa: 'Voz_Seductora',
  voice_colombiana: 'Voz_Dulce',
  voice_venezolana: 'Voz_Caribena',
  voice_argentina: 'Voz_Sensual',
  voice_gocha: 'Voz_Dulce'
};

export const VOICE_ID_TO_STYLE: Record<string, string> = {
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
  Voz_Masculina_Joven: 'masculina_joven'
};

/**
 * Universal voice resolver that guarantees an exact match for any voice ID, style parameter,
 * scenario text, or character name across chat, narration, and calls.
 */
export function resolveVoiceProfile(identifier?: string, fallbackText?: string, characterName?: string): VoiceProfile {
  if (identifier && identifier !== 'auto') {
    const direct = LISTA_VOCES.find(v => v.id === identifier);
    if (direct) return direct;

    const mappedId = VOICE_STYLE_TO_ID[identifier];
    if (mappedId) {
      const mapped = LISTA_VOCES.find(v => v.id === mappedId);
      if (mapped) return mapped;
    }
  }

  // Check if fallbackText contains an embedded voice parameter tag e.g. [Parámetro de voz]: Voz_Seductora
  if (fallbackText) {
    const paramMatch = fallbackText.match(/\[(?:Parámetro de voz|Estilo de voz|Voz)\]:\s*([A-Za-z0-9_]+)/i);
    if (paramMatch) {
      const foundTag = LISTA_VOCES.find(v => v.id === paramMatch[1]) || 
                       (VOICE_STYLE_TO_ID[paramMatch[1]] && LISTA_VOCES.find(v => v.id === VOICE_STYLE_TO_ID[paramMatch[1]]));
      if (foundTag) return foundTag;
    }
  }

  if (fallbackText || characterName) {
    const detected = detectVoiceStyleFromText(fallbackText || '', characterName);
    const detectedProfile = LISTA_VOCES.find(v => v.id === detected.voiceId);
    if (detectedProfile) return detectedProfile;
  }

  return LISTA_VOCES[0];
}

/**
 * Extracts strictly the spoken dialogue from a character's response.
 * Completely eliminates leading narration sentences, descriptive prose, and action asterisks.
 */
export function extractDirectDialogue(rawText: string): string {
  if (!rawText) return '';
  let cleaned = rawText.replace(/\[[^\]]*\]/g, ' ').trim();

  // 1. If dialogue exists inside quotation marks, extract and concatenate ONLY the spoken words
  const quotesMatch = cleaned.match(/["“«]([^"”»]+)["”»]/g);
  if (quotesMatch && quotesMatch.length > 0) {
    const extracted = quotesMatch.map(q => q.replace(/["“«"”»]/g, '').trim()).filter(Boolean).join(' ');
    if (extracted.length > 2) {
      return extracted;
    }
  }

  // 2. Strip stage directions (*...*), thoughts ((...)), brackets
  cleaned = cleaned.replace(/\*[^*]*\*/g, ' ')
                   .replace(/\([^)]*\)/g, ' ')
                   .trim();

  // 3. Remove leading narrative sentence(s) if followed by direct speech
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1) {
    const narrativePattern = /^(?:Me\s+(?:acerco|quedo|siento|levanto|acomodo|miro|muerdo|giro|doy|detengo|apoyo|rio|abrazo|toco|tapo|sonrojo|aparto|cubro)|Miro|Sonrío|Sonrio|Camino|Doy|Suspiro|Abro|Cierro|Trago|Bajo|Echo|Corro|Aprieto|Extiendo|Observo|Escucho|Trato|Doy un paso|Al ver|Al sentir|Con una sonrisa|Con la mirada|Con el corazón|Dando|Mirando|Sintiendo|Lentamente|Despacio|Asustada|Nerviosa|Sorprendida)\b/i;
    const dialogueSentences = sentences.filter(s => !narrativePattern.test(s.trim()));
    if (dialogueSentences.length > 0) {
      cleaned = dialogueSentences.join(' ').trim();
    }
  }

  return cleaned.replace(/["“«”»]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Prepares and sanitizes text for speech synthesis according to the active narrative mode.
 * - In direct mode (no narration): extracts spoken dialogue and completely removes stage directions.
 * - In narrative mode (with narration): translates action asterisks to natural pauses without saying "asterisco".
 */
export function sanitizeTextForSpeech(rawText: string, isNarrativeActive: boolean): string {
  if (!rawText) return '';

  // Remove bracket system tags like [Parámetro de voz], [SYSTEM: ...]
  let cleaned = rawText.replace(/\[[^\]]*\]/g, ' ').trim();

  if (!isNarrativeActive) {
    // Modo Directo (cero relato):
    cleaned = extractDirectDialogue(cleaned);
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
  const char = (characterName || '').trim().toLowerCase();

  // Explicit check for male voice: ONLY if explicitly specified in voice tags or if the character speaking is explicitly male
  const explicitMaleVoiceOrder = t.includes('voz masculina') || t.includes('voz de hombre') || t.includes('voz_masculina') || t.includes('estilo: masculina');
  
  // Known feminine names or markers that must NEVER be assigned a male voice
  const isExplicitlyFemale = char.includes('valentina') || char.includes('gabriela') || char.includes('sofia') || 
                             char.includes('camila') || char.includes('mujer') || char.includes('chica') || 
                             char.includes('ella') || char.includes('diosa') || char.includes('senora') || 
                             char.includes('señora') || char.includes('senorita') || char.includes('señorita') ||
                             char.includes('madre') || char.includes('mama') || char.includes('mamá') || 
                             char.includes('hija') || char.includes('hermana') || char.includes('tia') || 
                             char.includes('tía') || char.includes('amiga') || char.includes('novia') ||
                             char.includes('esposa') || char.includes('lucia') || char.includes('lucía') ||
                             char.includes('maria') || char.includes('maría') || char.includes('laura') ||
                             char.includes('ana') || char.includes('elena') || char.includes('carla');

  const isStrictMaleCharacter = !isExplicitlyFemale && (
    char === 'carlos' || char === 'juan' || char === 'pedro' || char === 'diego' || 
    char === 'alejandro' || char === 'mateo' || char === 'lucas' || char === 'miguel' || 
    char === 'javier' || char === 'andres' || char === 'andrés' || char === 'fernando' || 
    char === 'roberto' || char === 'gabriel' || char === 'hector' || char === 'héctor'
  );

  if (explicitMaleVoiceOrder || isStrictMaleCharacter) {
    if (t.includes('joven') || t.includes('enérg') || t.includes('dinámic')) {
      return {
        voiceId: 'Voz_Masculina_Joven',
        baseVoice: 'Fenrir',
        pitch: 0.82,
        rate: 1.04,
        directive: '[MODO DE VOZ ESTRICTO: VOZ MASCULINA JOVEN Y ENÉRGICA] Habla con una voz masculina juvenil, dinámica, fresca, enérgica y varonil con entonación segura.',
        styleName: 'Masculina Joven y Enérgica'
      };
    }
    return {
      voiceId: 'Voz_Masculina_Segura',
      baseVoice: 'Charon',
      pitch: 0.65,
      rate: 0.90,
      directive: '[MODO DE VOZ ESTRICTO: VOZ MASCULINA FIRME Y SERENA] Habla con una voz masculina natural, serena, pausada y varonil, modulando con calma y aplomo.',
      styleName: 'Masculina Firme y Serena'
    };
  }

  // Check for explicit voice style parameter tags first (e.g. from scenario selector)
  if (t.includes('suave_tierna') || t.includes('voz_dulce')) {
    return {
      voiceId: 'Voz_Dulce',
      baseVoice: 'Aoede',
      pitch: 1.34,
      rate: 0.94,
      directive: '[MODO DE VOZ ESTRICTO: VOZ SUAVE, TIERNA Y DULCE] Habla con una voz sumamente suave, tierna, dulce y delicada, en un volumen moderado y angelical, transmitiendo ternura y tranquilidad sin ninguna agresividad ni estridencia.',
      styleName: 'Dulce y Tierna'
    };
  }
  if (t.includes('coqueta') || t.includes('voz_seductora')) {
    return {
      voiceId: 'Voz_Seductora',
      baseVoice: 'Aoede',
      pitch: 1.18,
      rate: 0.98,
      directive: '[MODO DE VOZ ESTRICTO: VOZ COQUETA, PÍCARA Y SEDUCTORA] Habla con una voz muy coqueta, pícara y juguetona, con risitas sutiles, complicidad y entonación atrevida pero divertida y alegre.',
      styleName: 'Coqueta y Seductora'
    };
  }
  if (t.includes('sensual') || t.includes('voz_sensual')) {
    return {
      voiceId: 'Voz_Sensual',
      baseVoice: 'Kore',
      pitch: 0.84,
      rate: 0.82,
      directive: '[MODO DE VOZ ESTRICTO: VOZ SENSUAL Y CÁLIDA] Habla con un tono de voz profundamente sensual, cálido, aterciopelado y cadencioso, susurrando levemente y marcando pausas íntimas.',
      styleName: 'Sensual y Cálida'
    };
  }
  if (t.includes('susurrada') || t.includes('voz_susurrante')) {
    return {
      voiceId: 'Voz_Susurrante',
      baseVoice: 'Kore',
      pitch: 0.90,
      rate: 0.76,
      directive: '[MODO DE VOZ ESTRICTO: SUSURRO ÍNTIMO ASMR] Habla en un susurro absoluto al oído, ultra íntimo y delicado, soplando cada palabra suavemente como un secreto.',
      styleName: 'Susurrada ASMR'
    };
  }
  if (t.includes('caribena') || t.includes('voz_caribena')) {
    return {
      voiceId: 'Voz_Caribena',
      baseVoice: 'Aoede',
      pitch: 1.26,
      rate: 1.08,
      directive: '[MODO DE VOZ ESTRICTO: VOZ CARIBEÑA Y CÁLIDA] Habla con un acento caribeño cantarín, fresco, risueño y muy cercano, con calidez tropical y simpatía espontánea.',
      styleName: 'Caribeña y Cálida'
    };
  }
  if (t.includes('angelical') || t.includes('voz_angelical')) {
    return {
      voiceId: 'Voz_Angelical',
      baseVoice: 'Aoede',
      pitch: 1.48,
      rate: 0.86,
      directive: '[MODO DE VOZ ESTRICTO: VOZ ANGELICAL Y PURA] Habla con una voz sumamente angelical, fluida, pura y suave como la brisa, transmitiendo paz y ternura infinita.',
      styleName: 'Angelical y Pura'
    };
  }
  if (t.includes('picaresca') || t.includes('voz_picaresca')) {
    return {
      voiceId: 'Voz_Picaresca',
      baseVoice: 'Aoede',
      pitch: 1.28,
      rate: 1.12,
      directive: '[MODO DE VOZ ESTRICTO: VOZ TRAVIESA Y JUGUETONA] Habla con una voz traviesa, pícara y sumamente juguetona, con risitas pícaras y modulación divertida.',
      styleName: 'Traviesa y Juguetona'
    };
  }
  if (t.includes('melodica') || t.includes('voz_melodica')) {
    return {
      voiceId: 'Voz_Melodica',
      baseVoice: 'Kore',
      pitch: 1.10,
      rate: 0.86,
      directive: '[MODO DE VOZ ESTRICTO: VOZ MELÓDICA Y RELAJANTE] Habla con un tono melódico, armónico y profundamente pacífico, con una cadencia que relaja y reconforta.',
      styleName: 'Melódica y Relajante'
    };
  }

  // 1. Suave, tierna, dulce, angelical, delicada
  if (t.includes('suave') || t.includes('tiern') || t.includes('dulce') || t.includes('delicada') || t.includes('mimosa')) {
    return {
      voiceId: 'Voz_Dulce',
      baseVoice: 'Aoede',
      pitch: 1.34,
      rate: 0.94,
      directive: '[MODO DE VOZ ESTRICTO: VOZ SUAVE, TIERNA Y DULCE] Habla con una voz sumamente suave, tierna, dulce y delicada, en un volumen moderado y angelical, transmitiendo ternura y tranquilidad sin ninguna agresividad ni estridencia.',
      styleName: 'Dulce y Tierna'
    };
  }

  // 2. Coqueta, pícara, juguetona, traviesa
  if (t.includes('coquet') || t.includes('pícar') || t.includes('picar') || t.includes('travies') || t.includes('jugueton')) {
    return {
      voiceId: 'Voz_Seductora',
      baseVoice: 'Aoede',
      pitch: 1.18,
      rate: 0.98,
      directive: '[MODO DE VOZ ESTRICTO: VOZ COQUETA, PÍCARA Y SEDUCTORA] Habla con una voz muy coqueta, pícara y juguetona, con risitas sutiles, complicidad y entonación atrevida pero divertida y alegre.',
      styleName: 'Coqueta y Seductora'
    };
  }

  // 3. Sensual, ardiente, cálida, íntima
  if (t.includes('sensual') || t.includes('calid') || t.includes('cálid') || t.includes('ardiente') || t.includes('íntim') || t.includes('intim')) {
    return {
      voiceId: 'Voz_Sensual',
      baseVoice: 'Kore',
      pitch: 0.84,
      rate: 0.82,
      directive: '[MODO DE VOZ ESTRICTO: VOZ SENSUAL Y CÁLIDA] Habla con un tono de voz profundamente sensual, cálido, aterciopelado y cadencioso, susurrando levemente y marcando pausas íntimas.',
      styleName: 'Sensual y Cálida'
    };
  }

  // 4. Susurrada, ASMR, al oído
  if (t.includes('susurr') || t.includes('oído') || t.includes('oido') || t.includes('asmr') || t.includes('secreto')) {
    return {
      voiceId: 'Voz_Susurrante',
      baseVoice: 'Kore',
      pitch: 0.90,
      rate: 0.76,
      directive: '[MODO DE VOZ ESTRICTO: SUSURRO ÍNTIMO ASMR] Habla en un susurro absoluto al oído, ultra íntimo y delicado, soplando cada palabra suavemente como un secreto.',
      styleName: 'Susurrada ASMR'
    };
  }

  // 5. Juvenil, alegre, fresca
  if (t.includes('juvenil') || t.includes('alegre') || t.includes('animada') || t.includes('fresca')) {
    return {
      voiceId: 'Voz_Juvenil',
      baseVoice: 'Aoede',
      pitch: 1.46,
      rate: 1.15,
      directive: '[MODO DE VOZ ESTRICTO: VOZ JUVENIL Y ALEGRE] Habla con una voz juvenil, fresca, enérgica y alegre, con entonaciones ágiles y vivaces.',
      styleName: 'Juvenil y Alegre'
    };
  }

  // 6. Pausada, serena, madura, tranquila
  if (t.includes('pausad') || t.includes('seren') || t.includes('calmad') || t.includes('madur') || t.includes('tranquil')) {
    return {
      voiceId: 'Voz_Pausada',
      baseVoice: 'Kore',
      pitch: 0.94,
      rate: 0.80,
      directive: '[MODO DE VOZ ESTRICTO: VOZ PAUSADA Y SERENA] Habla con un tono de voz pausado, sereno, maduro y reconfortante, transmitiendo calma y tranquilidad.',
      styleName: 'Pausada y Serena'
    };
  }

  // 7. Sofisticada, elegante, culta
  if (t.includes('sofisticad') || t.includes('elegante') || t.includes('culta')) {
    return {
      voiceId: 'Voz_Sofisticada',
      baseVoice: 'Kore',
      pitch: 1.04,
      rate: 0.90,
      directive: '[MODO DE VOZ ESTRICTO: VOZ SOFISTICADA Y ELEGANTE] Habla con un tono sofisticado, distinguido y elegante, con dicción cuidada y porte fino.',
      styleName: 'Sofisticada y Elegante'
    };
  }

  // 8. Apasionada, intensa, ardiente
  if (t.includes('apasionad') || t.includes('ardiente') || t.includes('romántic') || t.includes('romantic')) {
    return {
      voiceId: 'Voz_Apasionada',
      baseVoice: 'Kore',
      pitch: 1.15,
      rate: 0.92,
      directive: '[MODO DE VOZ ESTRICTO: VOZ APASIONADA E INTENSA] Habla con una voz apasionada, profunda, ardiente y emocionalmente intensa, transmitiendo afecto romántico sincero.',
      styleName: 'Apasionada e Intensa'
    };
  }

  // Default sweet natural female voice
  return {
    voiceId: 'Voz_Dulce',
    baseVoice: 'Aoede',
    pitch: 1.34,
    rate: 0.94,
    directive: '[MODO DE VOZ: DULCE Y NATURAL] Habla con una voz dulce, cariñosa y natural en Español, con modulación suave y cercana.',
    styleName: 'Dulce y Suave'
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


