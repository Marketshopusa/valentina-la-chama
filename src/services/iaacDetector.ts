/**
 * IAAC - Módulo de Inmersión Auditiva por Contexto
 * Motor de Detección de Eventos Físicos Narrativos (FR-01, FR-03)
 */

export interface IAACEventDefinition {
  eventType: string;
  name: string;
  technicalDescription: string;
  defaultIntensity: number;
  patterns: RegExp[];
  intensityModifiers?: {
    high: RegExp[];
    low: RegExp[];
  };
}

export interface DetectedIAACEvent {
  eventType: string;
  intensity: number;
  matchedText: string;
  timestamp: number;
  index: number;
}

export const IAAC_LAUNCH_EVENTS: Record<string, IAACEventDefinition> = {
  // 1. Nalgada, Azote y Palmada sobre Carne/Piel
  body_slap_spank: {
    eventType: 'body_slap_spank',
    name: 'Nalgada y Azote Físico',
    technicalDescription: 'Impacto acústico percusivo de piel contra piel (nalgada, azote, palmada firme).',
    defaultIntensity: 9,
    patterns: [
      /nalgad(a|as)/i,
      /le\s+d(a|ió|io|ieron)\s+una\s+nalgada/i,
      /recib(e|ió|io)\s+una\s+nalgada/i,
      /azot(e|es|ar|ó|o|aron)/i,
      /le\s+d(a|ió|io)\s+un\s+azote/i,
      /palmad(a|as)/i,
      /le\s+d(a|ió|io)\s+una\s+palmada/i,
      /le\s+peg(ó|o)\s+una\s+palmada/i,
      /palmoteo/i,
      /spank(ing)?/i,
      /slap/i,
      /suen(a|ó)\s+(muy\s+)?(duro|fuerte|seco)/i,
      /son(ó|o)\s+(muy\s+)?(duro|fuerte|seco)/i,
      /impacto\s+en\s+su\s+trasero/i,
      /golpe\s+en\s+las\s+nalgas/i,
    ],
    intensityModifiers: {
      high: [/muy\s+duro/i, /fuerte/i, /con\s+fuerza/i, /ardiente/i, /marcad(a|o)/i, /roja/i, /sonor(a|o)/i],
      low: [/suave(mente)?/i, /leve/i, /juguetona/i, /despacio/i]
    }
  },

  // 2. Grito Intenso o Reacción Vocal Aguda
  intense_vocal_reaction: {
    eventType: 'intense_vocal_reaction',
    name: 'Grito o Reacción Vocal Intensa',
    technicalDescription: 'Sonido de exclamación vocal aguda, grito sonoro de sorpresa, queja o intensidad.',
    defaultIntensity: 8,
    patterns: [
      /grit(ó|o)\s+(con\s+)?(intensidad|fuerza|dolor|sorpresa|furia|desesperaci[oó]n)/i,
      /grit(ar|ó|o|ando|aron)/i,
      /solt(ó|o)\s+un\s+grito/i,
      /dio\s+un\s+grito/i,
      /un\s+grito\s+agudo/i,
      /alarid(o|os)/i,
      /chill(ar|ó|o|ido|idos)/i,
      /chilló/i,
      /exclam(ar|ó|o)\s+con\s+fuerza/i,
      /chillido\s+agudo/i,
      /screamed/i,
      /shrieked/i,
      /cried\s+out/i,
    ],
    intensityModifiers: {
      high: [/fuerte/i, /agudo/i, /desgarrador/i, /con\s+fuerza/i, /intenso/i, /desesperad(o|a)/i],
      low: [/ahogad(o|a)/i, /sordo/i, /apagad(o|a)/i, /leve/i]
    }
  },

  // 3. Ahogamiento, Atragantamiento y Asfixia Faríngea
  choking_gag_sound: {
    eventType: 'choking_gag_sound',
    name: 'Ahogamiento y Atragantamiento',
    technicalDescription: 'Espasmo faríngeo de aire atrapado, tos ahogada y asfixia momentánea por comida o líquido.',
    defaultIntensity: 8,
    patterns: [
      /ahog(ar|arse|ó|o|ando|amiento|aba)/i,
      /se\s+ahog(ó|o)/i,
      /atragant(ar|arse|ó|o|ando|amiento|aba)/i,
      /se\s+atragant(ó|o)/i,
      /sonido\s+al\s+ahogar(se)?/i,
      /le\s+falt(ó|o)\s+el\s+aire/i,
      /falta\s+de\s+aire/i,
      /asfixi(ar|arse|ó|o|ando|amiento|aba)/i,
      /tos\s+ahogada/i,
      /tosi(ó|o)\s+ahogad(a|o)/i,
      /comiendo\s+algo\s+y\s+te\s+ahogas/i,
      /choking/i,
      /gag(ged|ging)?/i,
      /gasping\s+for\s+air/i,
    ],
    intensityModifiers: {
      high: [/desesperad(o|a)/i, /severo/i, /fuerte/i, /tos\s+violenta/i, /sin\s+respirar/i],
      low: [/leve/i, /pequeño/i, /carraspeo/i]
    }
  },

  // 4. Sensación de Vomitar y Arcadas
  retching_nausea_sound: {
    eventType: 'retching_nausea_sound',
    name: 'Sensación de Vomitar y Arcada',
    technicalDescription: 'Sonido gutural y visceral de arcada estomacal profunda y náusea.',
    defaultIntensity: 8,
    patterns: [
      /arcad(a|as)/i,
      /dio\s+(una|varias)\s+arcadas?/i,
      /sensaci[oó]n\s+de\s+vomitar/i,
      /ganas\s+de\s+vomitar/i,
      /vomit(ar|ó|o|ando)/i,
      /n[aá]usea(s)?/i,
      /nauseabund(o|a)/i,
      /devolver\s+el\s+est[oó]mago/i,
      /revolver\s+el\s+est[oó]mago/i,
      /retching/i,
      /dry\s+heaves?/i,
      /gag\s+reflex/i,
    ],
    intensityModifiers: {
      high: [/profund(a|o)/i, /incontrolable/i, /fuerte/i, /violenta/i],
      low: [/leve/i, /sensaci[oó]n/i, /apenas/i]
    }
  },

  // 5. Llanto Suave, Agudo y Sollozos
  crying_weeping_sound: {
    eventType: 'crying_weeping_sound',
    name: 'Llanto y Sollozos',
    technicalDescription: 'Vibrato de sollozos humanos, gemidos de aflicción y llanto suave o agudo con lágrimas.',
    defaultIntensity: 7,
    patterns: [
      /llant(o|os)/i,
      /llor(ar|ó|o|ando|aba|iqueo)/i,
      /solloz(o|os|ar|ó|o|ando|aba)/i,
      /rompi[oó]\s+en\s+llanto/i,
      /llanto\s+(suave|agudo|desconsolado|silencioso|amargo|fuerte)/i,
      /dar\s+por\s+un\s+llanto/i,
      /l[aá]grimas\s+(brotaban|ca[ií]an|resbalaban)/i,
      /se\s+puso\s+a\s+llorar/i,
      /llorique(o|ar|ó)/i,
      /sniffling/i,
      /crying/i,
      /weeping/i,
      /sobbing/i,
    ],
    intensityModifiers: {
      high: [/agudo/i, /desconsolad(o|a)/i, /amargamente/i, /fuerte/i, /inconsolable/i],
      low: [/suave/i, /silencioso/i, /apenas/i, /pequeño/i, /leve/i]
    }
  },

  // 6. Respiración Extremadamente Agitada y Jadeo Fuerte
  heavy_panting_breath: {
    eventType: 'heavy_panting_breath',
    name: 'Respiración Extremadamente Agitada',
    technicalDescription: 'Jadeos rítmicos acelerados de aire ingresando y saliendo de los pulmones con fatiga/agitación.',
    defaultIntensity: 8,
    patterns: [
      /respiraci[oó]n\s+(extremadamente\s+)?(agitada|acelerada|entrecortada|pesada|fuerte)/i,
      /agit(arse|ó|o|ada|ado|ad[ií]sima|ad[ií]simo)/i,
      /se\s+agit[oó]\s+demasiado/i,
      /jade(o|os|ar|ó|o|ando|aba)/i,
      /jadeante(s)?/i,
      /sin\s+aliento/i,
      /falta\s+el\s+aire\s+por\s+correr/i,
      /corres\s+y\s+te\s+agitas/i,
      /corri[oó]\s+y\s+se\s+agit[oó]/i,
      /pecho\s+sub[ií]a\s+y\s+bajaba\s+r[aá]pido/i,
      /aire\s+entrecortado/i,
      /panting/i,
      /heavy\s+breathing/i,
      /breathless/i,
      /out\s+of\s+breath/i,
    ],
    intensityModifiers: {
      high: [/extremadamente/i, /fren[eé]tic(o|a)/i, /desesperad(o|a)/i, /profund(o|a)/i, /sin\s+aliento/i],
      low: [/leve(mente)?/i, /suave/i, /recuperando/i]
    }
  },

  // 7. Succión y Chupar (boca, paleta, interacción húmeda)
  intimate_mouth_interaction: {
    eventType: 'intimate_mouth_interaction',
    name: 'Succión y Contacto Bucal',
    technicalDescription: 'Sonido de succión húmeda, chasquido de labios, paleta o contacto oral lubricado.',
    defaultIntensity: 8,
    patterns: [
      /chup(ar|ó|o|ando|a)/i,
      /chupando\s+(una\s+)?paleta/i,
      /paleta/i,
      /succi[oó]n/i,
      /succionar/i,
      /succiona/i,
      /lam(er|ió|io|iendo|e)/i,
      /lami[oó]\s+con\s+avidez/i,
      /bes[oó]\s+con\s+pasi[oó]n/i,
      /beso\s+(apasionado|h[uú]medo|voraz|profundo|urgente|intenso)/i,
      /bes[aá]ndol[oa]\s+con\s+pasi[oó]n/i,
      /bes[aá]ndol[oa]\s+con\s+desesperaci[oó]n/i,
      /unir\s+(sus\s+)?labios/i,
      /sus\s+labios\s+se\s+(encontraron|fundieron|unieron)/i,
      /chup[oó]\s+(su\s+|sus\s+)?(labio|labios|boca|cuello)/i,
      /mordisque[oó]\s+(su\s+|sus\s+)?(labio|labios)/i,
      /beso\s+h[uú]medo\s+y\s+profundo/i,
      /sucking/i,
      /licking/i,
      /lollipop/i,
      /wet\s+kiss/i,
    ],
    intensityModifiers: {
      high: [/fuerte/i, /avidez/i, /h[uú]medo/i, /voraz(mente)?/i, /profundo/i, /ardiente/i, /salvaje/i],
      low: [/suave(mente)?/i, /delicad(o|a)/i, /tierno/i, /apenas/i, /rozando/i]
    }
  },

  // 8. Masticar y Comer
  chewing_eating_sound: {
    eventType: 'chewing_eating_sound',
    name: 'Masticación y Comer',
    technicalDescription: 'Crujido y masticación de alimentos en la boca.',
    defaultIntensity: 6,
    patterns: [
      /comiendo\s+algo/i,
      /comi(ó|o|endo)/i,
      /mastic(ar|ó|o|ando)/i,
      /mordi(ó|o|endo)\s+un\s+trozo/i,
      /bocado/i,
      /trag(ar|ó|o|ando)/i,
      /eating/i,
      /chewing/i,
    ],
    intensityModifiers: {
      high: [/crujiente/i, /r[aá]pido/i, /voraz/i],
      low: [/despacio/i, /poco\s+a\s+poco/i, /suave/i]
    }
  },

  // 9. Impacto contra Pared o Superficie
  impact_body_surface: {
    eventType: 'impact_body_surface',
    name: 'Impacto Corporal contra Superficie',
    technicalDescription: 'Sonido de impacto seco de cuerpo o manos contra superficie dura (pared/muro/suelo).',
    defaultIntensity: 8,
    patterns: [
      /manos\s+contra\s+la\s+pared/i,
      /contra\s+la\s+pared/i,
      /contra\s+el\s+muro/i,
      /contra\s+el\s+tabique/i,
      /contra\s+el\s+yeso/i,
      /apoy(ó|o|a)\s+(sus\s+)?manos\s+en\s+la\s+pared/i,
      /estamp(ar|ó|o|ado|ada|aron)\s+contra/i,
      /empuj(ar|ó|o|ado|ada)\s+contra\s+(la\s+pared|el\s+muro)/i,
      /arrincon(ar|ó|o|ado|ada)\s+contra\s+(la\s+pared|el\s+muro)/i,
      /golpe(ar|ó|o|ado|ada)\s+contra\s+(la\s+pared|el\s+muro)/i,
      /la\s+tomó\s+contra\s+la\s+pared/i,
      /lo\s+tomó\s+contra\s+la\s+pared/i,
      /prens(ar|ó|o|ado|ada)\s+contra\s+(la\s+pared|el\s+muro)/i,
      /aplast(ar|ó|o|ado|ada)\s+contra\s+(la\s+pared|el\s+muro)/i,
      /choc(ar|ó|o)\s+su\s+cuerpo\s+contra/i,
      /against\s+the\s+wall/i,
      /slammed\s+into\s+the\s+wall/i,
      /pinned\s+against\s+the\s+wall/i,
    ],
    intensityModifiers: {
      high: [/con\s+fuerza/i, /violenta(mente)?/i, /salvaje(mente)?/i, /furiosa(mente)?/i, /bruscamente/i, /seco/i, /duro/i],
      low: [/suave(mente)?/i, /despacio/i, /lento/i, /levemente/i]
    }
  },

  // 10. Secuencia Rítmica de Impactos
  rhythmic_impact_sequence: {
    eventType: 'rhythmic_impact_sequence',
    name: 'Secuencia Rítmica de Impactos',
    technicalDescription: 'Secuencia rítmica de impactos continuos piel contra piel.',
    defaultIntensity: 8,
    patterns: [
      /una\s+y\s+otra\s+vez/i,
      /le\s+dio\s+con\s+fuerza[,\s]+una\s+y\s+otra\s+vez/i,
      /ritmo\s+(acelerado|fren[eé]tico|implacable|constante|salvaje)/i,
      /impactos\s+r[ií]tmicos/i,
      /golpes\s+continuos/i,
      /embestidas\s+(continuas|r[ií]tmicas|fuertes)/i,
      /fricci[oó]n\s+y\s+choque/i,
      /golpeteo\s+(r[ií]tmico|incesante|constante)/i,
      /cadencia\s+r[ií]tmica/i,
      /comp[aá]s\s+de\s+impactos/i,
      /piel\s+contra\s+piel/i,
      /choque\s+de\s+cuerpos/i,
      /rhythmically/i,
      /again\s+and\s+again/i,
      /skin\s+against\s+skin/i,
    ],
    intensityModifiers: {
      high: [/desenfrenad(o|a)/i, /r[aá]pido/i, /fren[eé]tico/i, /con\s+fuerza/i, /sin\s+tregua/i, /acelerad(o|a)/i],
      low: [/lento/i, /pausad(o|a)/i, /despacio/i, /acompasad(o|a)/i]
    }
  },

  // 11. Secuencia de Caída Corporal
  body_fall_sequence: {
    eventType: 'body_fall_sequence',
    name: 'Secuencia de Caída Corporal',
    technicalDescription: 'Secuencia de jadeo corto seguido de golpe sordo de cuerpo sobre suelo/cama.',
    defaultIntensity: 7,
    patterns: [
      /se\s+desplom[oó]\s+en\s+el\s+suelo/i,
      /se\s+desplom[oó]/i,
      /cay[oó]\s+(al|en\s+el)\s+suelo/i,
      /se\s+derrumb[oó]\s+(al|en\s+el)\s+suelo/i,
      /cay[oó]\s+pesadamente/i,
      /su\s+cuerpo\s+cay[oó]/i,
      /se\s+dej[oó]\s+caer/i,
      /perdi[oó]\s+el\s+equilibrio\s+y\s+cay[oó]/i,
      /desmay(arse|[oó])\s+en\s+el\s+piso/i,
      /impacto\s+sordo\s+al\s+caer/i,
      /collapsed\s+to\s+the\s+floor/i,
      /fell\s+to\s+the\s+ground/i,
      /dropped\s+to\s+the\s+floor/i,
    ],
    intensityModifiers: {
      high: [/pesad(o|a)/i, /con\s+fuerza/i, /de\s+golpe/i, /violentamente/i, /estrepitosamente/i],
      low: [/suave(mente)?/i, /poco\s+a\s+poco/i, /despacio/i, /rendid(o|a)/i]
    }
  },

  // 12. Portazo con Resonancia
  slam_door: {
    eventType: 'slam_door',
    name: 'Portazo con Resonancia',
    technicalDescription: 'Sonido de madera cerrándose con fuerza, con eco.',
    defaultIntensity: 8,
    patterns: [
      /cerr[oó]\s+la\s+puerta\s+de\s+un\s+portazo/i,
      /portazo/i,
      /dio\s+un\s+portazo/i,
      /azot[oó]\s+la\s+puerta/i,
      /cerr[oó]\s+con\s+fuerza\s+la\s+puerta/i,
      /la\s+puerta\s+se\s+cerr[oó]\s+de\s+golpe/i,
      /cerr[oó]\s+de\s+golpe\s+la\s+puerta/i,
      /estruendo\s+de\s+la\s+puerta/i,
      /slammed\s+the\s+door/i,
      /door\s+slammed\s+shut/i,
    ],
    intensityModifiers: {
      high: [/fuerte/i, /furios(o|a)/i, /con\s+rabia/i, /con\s+violencia/i, /estremeci/i],
      low: [/golpe\s+seco/i, /apenas/i, /cerrar\s+firme/i]
    }
  },

  // 13. Pasos Apresurados o Carrera
  footsteps_run_surface: {
    eventType: 'footsteps_run_surface',
    name: 'Carrera sobre Superficie',
    technicalDescription: 'Secuencia de pasos rápidos sobre superficie.',
    defaultIntensity: 7,
    patterns: [
      /corri[oó]\s+por\s+el\s+pasillo/i,
      /ech[oó]\s+a\s+correr/i,
      /corriendo\s+apresurada(mente)?/i,
      /pasos\s+r[aá]pidos/i,
      /pasos\s+apresurados/i,
      /corri[oó]\s+desesperada(mente)?/i,
      /pasos\s+veloces\s+sobre\s+el\s+piso/i,
      /huir\s+corriendo/i,
      /corriendo\s+a\s+toda\s+prisa/i,
      /pies\s+resonaban\s+mientras\s+corr[ií]a/i,
      /ran\s+down\s+the\s+hallway/i,
      /running\s+footsteps/i,
      /rushed\s+footsteps/i,
    ],
    intensityModifiers: {
      high: [/desesperad(o|a)/i, /a\s+toda\s+velocidad/i, /a\s+toda\s+prisa/i, /veloz/i, /desbocad(o|a)/i],
      low: [/ligero/i, /trotando/i, /moderado/i]
    }
  }
};

/**
 * Escanea un texto narrativo o de chat y detecta los eventos IAAC presentes (FR-01)
 */
export function scanTextForAudioEvents(text: string): DetectedIAACEvent[] {
  if (!text || typeof text !== 'string') return [];

  const detected: DetectedIAACEvent[] = [];
  const lower = text.toLowerCase();

  for (const [key, eventDef] of Object.entries(IAAC_LAUNCH_EVENTS)) {
    for (const pattern of eventDef.patterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        // Calculate dynamic intensity
        let intensity = eventDef.defaultIntensity;

        // Extract surrounding context (up to 60 characters around match)
        const start = Math.max(0, match.index - 30);
        const end = Math.min(text.length, match.index + match[0].length + 30);
        const contextSnippet = text.slice(start, end);

        if (eventDef.intensityModifiers) {
          for (const highPatt of eventDef.intensityModifiers.high) {
            if (highPatt.test(contextSnippet)) {
              intensity = Math.min(10, intensity + 2);
              break;
            }
          }
          for (const lowPatt of eventDef.intensityModifiers.low) {
            if (lowPatt.test(contextSnippet)) {
              intensity = Math.max(1, intensity - 3);
              break;
            }
          }
        }

        // Avoid adding duplicate detection of the exact same event type within close proximity
        const existsNearby = detected.some(
          d => d.eventType === key && Math.abs(d.index - match.index!) < 80
        );

        if (!existsNearby) {
          detected.push({
            eventType: key,
            intensity,
            matchedText: match[0],
            timestamp: Date.now(),
            index: match.index
          });
        }
        break; // matched this event definition, continue to other event definitions
      }
    }
  }

  // Sort by appearance in text
  return detected.sort((a, b) => a.index - b.index);
}
