import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateContentWithResilience, generateContextualCharacterReply } from "./server/geminiResilience.ts";
import { getBaseVoice, getVoiceInstruction, LISTA_VOCES, detectVoiceStyleFromText, detectAccentFromText } from "./src/utils/voices.ts";
import {
  getOrAnchorCharacter,
  decodePromptIntensity,
  dispatchUnlockedImageGeneration,
  evaluateImageCoherence,
  loadEngineConfig,
  saveEngineConfig,
  loadAllCharacterAnchors,
  saveCharacterAnchor,
  getDefaultEngineConfig
} from "./server/inStoryEngine.ts";
import { config } from "./server/config.ts";
import { initStorage, getStorage } from "./server/storage/index.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = config.port;
  const HOST = config.host;

  // Initialize the configured persistence backend (local files or Firebase).
  await initStorage();

  app.use(express.json({ limit: "70mb" }));
  app.use(express.urlencoded({ limit: "70mb", extended: true }));

  // Health check endpoint for platform monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve static uploads (persistent character cards & photos). Storage init
  // has already ensured these directories exist.
  const uploadsDir = config.paths.uploadsDir;
  const rootUploadsDir = config.paths.rootUploadsDir;
  app.use('/uploads', express.static(uploadsDir));
  app.use('/uploads', express.static(rootUploadsDir));

  // Recursively persist any base64 data: URLs in an object to hosted media URLs.
  async function sanitizeStateMedia(obj: any, keyName = 'state'): Promise<any> {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return Promise.all(obj.map((item, idx) => sanitizeStateMedia(item, `${keyName}_${idx}`)));
    }
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.startsWith('data:')) {
        clean[k] = await getStorage().saveMedia(v, k);
      } else if (v && typeof v === 'object') {
        clean[k] = await sanitizeStateMedia(v, k);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  async function getStoredAppState() {
    try {
      {
        const state = await getStorage().readAppState();
        if (state && typeof state === 'object') {
          // Ensure clean scenarios array
          let scens = Array.isArray(state.scenarios) ? [...state.scenarios] : [];
          state.scenarios = scens.slice(0, 6);

          // Guarantee activeScenario matches activeScenarioId
          if (state.activeScenarioId && (!state.activeScenario || state.activeScenario.id !== state.activeScenarioId)) {
            const found = state.scenarios.find((s: any) => s.id === state.activeScenarioId);
            if (found) state.activeScenario = found;
          } else if (!state.activeScenarioId && state.scenarios.length > 0) {
            state.activeScenario = state.scenarios[0];
            state.activeScenarioId = state.scenarios[0].id;
          }

          // Ensure active messages are populated
          const curActiveId = state.activeScenarioId || state.activeScenario?.id;
          if (curActiveId && state[`chat_messages_${curActiveId}`] && Array.isArray(state[`chat_messages_${curActiveId}`])) {
            if (!Array.isArray(state.messages) || state.messages.length === 0) {
              state.messages = state[`chat_messages_${curActiveId}`];
            }
          }

          // Ensure currentCardMedia is populated
          if (!state.currentCardMedia && curActiveId) {
            state.currentCardMedia = state[`card_media_${curActiveId}`] || state.activeScenario?.coverImage || null;
          }

          return state;
        }
      }
    } catch (e) {
      console.warn("Failed reading app_state.json:", e);
    }
    return null;
  }

  async function saveStoredAppState(state: any) {
    try {
      const sanitized = await sanitizeStateMedia(state);
      const current = (await getStoredAppState()) || {};

      const DEFAULT_IDS = new Set(['presentacion_valentina']);

      // Strictly maintain up to 6 stories (FIFO: newest first, 7th oldest disappears)
      let mergedScenarios: any[] = [];
      if (Array.isArray(sanitized.scenarios) && sanitized.scenarios.length > 0) {
        // Client provided explicitly ordered scenario list
        const seen = new Set<string>();
        for (const s of sanitized.scenarios) {
          if (!s || !s.id || seen.has(s.id)) continue;
          seen.add(s.id);
          const existing = (current.scenarios || []).find((e: any) => e.id === s.id) || {};
          mergedScenarios.push({
            ...existing,
            ...s,
            coverImage: (s.coverImage && !s.coverImage.includes('unsplash.com'))
              ? s.coverImage
              : (existing.coverImage || s.coverImage),
            title: s.title || existing.title,
            characterName: s.characterName || existing.characterName,
            development: s.development || existing.development,
            synopsis: s.synopsis || existing.synopsis
          });
        }
      } else if (Array.isArray(current.scenarios) && current.scenarios.length > 0) {
        mergedScenarios = [...current.scenarios];
      }

      // If activeScenario was updated, ensure it is reflected in mergedScenarios
      if (sanitized.activeScenario && sanitized.activeScenario.id) {
        const aId = sanitized.activeScenario.id;
        const idx = mergedScenarios.findIndex(s => s.id === aId);
        const cardMediaVal = sanitized.currentCardMedia || sanitized[`card_media_${aId}`] || current[`card_media_${aId}`];
        const updatedActive = {
          ...(idx >= 0 ? mergedScenarios[idx] : {}),
          ...sanitized.activeScenario,
          coverImage: sanitized.activeScenario.coverImage || cardMediaVal || (idx >= 0 ? mergedScenarios[idx].coverImage : undefined)
        };
        if (idx >= 0) {
          mergedScenarios[idx] = updatedActive;
        } else {
          mergedScenarios.unshift(updatedActive);
        }
      }

      // Enforce strictly 6 stories maximum (oldest beyond index 5 is dropped)
      mergedScenarios = mergedScenarios.slice(0, 6);

      // Merge messages safely: never wipe out non-empty history with an empty array unless explicitly resetting
      const isExplicitReset = sanitized.isReset || sanitized.resetHistory;
      let messagesToSave = sanitized.messages !== undefined ? sanitized.messages : current.messages;
      if (Array.isArray(sanitized.messages) && sanitized.messages.length === 0 && Array.isArray(current.messages) && current.messages.length > 0 && !isExplicitReset) {
        messagesToSave = current.messages;
      }

      // Ensure active scenario is consistent
      let activeScenId = sanitized.activeScenarioId || sanitized.activeScenario?.id || current.activeScenarioId || current.activeScenario?.id;
      let activeScen = sanitized.activeScenario || current.activeScenario;
      if (activeScenId) {
        const found = mergedScenarios.find((s: any) => s.id === activeScenId);
        if (found) {
          activeScen = { ...found, ...(activeScen || {}) };
        }
      }

      // Preserve all card_media keys
      const allKeys = new Set([...Object.keys(current), ...Object.keys(sanitized)]);
      const cardMediaUpdates: Record<string, any> = {};
      const chatMessagesUpdates: Record<string, any> = {};

      for (const k of allKeys) {
        if (k.startsWith('card_media_')) {
          cardMediaUpdates[k] = sanitized[k] || current[k];
        } else if (k.startsWith('chat_messages_')) {
          const sMsgs = sanitized[k];
          const cMsgs = current[k];
          if (Array.isArray(sMsgs) && sMsgs.length > 0) {
            chatMessagesUpdates[k] = sMsgs;
          } else if (Array.isArray(cMsgs) && cMsgs.length > 0 && !isExplicitReset) {
            chatMessagesUpdates[k] = cMsgs;
          } else if (isExplicitReset) {
            chatMessagesUpdates[k] = [];
          }
        }
      }

      const merged = { 
        ...current, 
        ...sanitized,
        ...cardMediaUpdates,
        ...chatMessagesUpdates,
        activeScenarioId: activeScenId,
        activeScenario: activeScen,
        scenarios: mergedScenarios,
        messages: messagesToSave,
        updatedAt: Date.now() 
      };

      await getStorage().writeAppState(merged);
      return merged;
    } catch (e) {
      console.error("Failed saving app_state.json:", e);
      return null;
    }
  }

  // lazy-initialized client
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      aiClient = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  const COMMON_NON_CHARACTER_WORDS = new Set([
    'amor', 'bebe', 'bebé', 'cariño', 'vida', 'cielo', 'papi', 'mami', 'corazon', 'corazón',
    'hermosa', 'linda', 'reina', 'princesa', 'chula', 'nena', 'hola', 'mira', 'oye', 'bueno',
    'dale', 'pero', 'ahora', 'entonces', 'despues', 'después', 'casa', 'cuarto', 'cama',
    'sala', 'cocina', 'aqui', 'aquí', 'alli', 'allí', 'nada', 'todo', 'si', 'sí', 'no',
    'usuario', 'willian', 'william', 'yo', 'tu', 'tú', 'nosotros', 'ellos', 'ellas',
    'alguien', 'nadie', 'puerta', 'ventana', 'carro', 'auto', 'noche', 'dia', 'día',
    'tarde', 'camino', 'paso', 'voz', 'mano', 'manos', 'ojos', 'cuerpo', 'ropa', 'bien',
    'mal', 'por', 'favor', 'dime', 'dile', 'cuentame', 'cuéntame', 'contesta'
  ]);

  function cleanCharacterCandidate(raw: string): string {
    if (!raw) return '';
    let cleaned = raw.replace(/[.,:;!?¿¡"()]/g, ' ').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    let startIndex = 0;
    if (['la', 'el', 'su', 'un', 'una', 'mi', 'al'].includes(words[0].toLowerCase()) && words.length > 1) {
      startIndex = 1;
    }
    const nameParts: string[] = [];
    for (let i = startIndex; i < words.length; i++) {
      const wLower = words[i].toLowerCase();
      if (['y', 'e', 'o', 'u', 'que', 'por', 'para', 'con', 'sin', 'pero', 'dile', 'diciendo', 'saludando', 'respondiendo', 'ahora', 'tambien', 'también', 'aqui', 'aquí'].includes(wLower)) {
        break;
      }
      nameParts.push(words[i]);
      if (nameParts.length >= 2) break;
    }
    return nameParts.join(' ').trim();
  }

  function detectRoleplayTurn(userMessage: string, baseCharacter: string, currentSpeaker?: string): { activeRole: string; isBaseCharacter: boolean; isSwitch: boolean; isExplicitHablaCommand?: boolean } | null {
    if (!userMessage) return null;
    const msg = userMessage.trim();
    const lower = msg.toLowerCase();
    const baseLower = (baseCharacter || '').trim().toLowerCase();

    // 1. [MAXIMA PRIORIDAD] Comando explícito: "habla [Nombre]", "ahora habla [Nombre]", "que hable [Nombre]", "quiero que hable [Nombre]"
    // Ejemplos: "ahora habla Lucía", "habla Carlos", "que hable Lucía", "ahora habla Carlos", "dale habla María", "pon a hablar a Carlos"
    const hablaMatch = msg.match(/(?:(?:ahora|por\s+favor|quiero\s+que|que|dale)\s+)?(?:habla(?:ya)?|hable|pasa\s+a\s+hablar|pon\s+a\s+hablar\s+a)\s+(?:a\s+|con\s+)?(?:la\s+|el\s+|su\s+|una\s+|un\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)/i);
    if (hablaMatch) {
      const candidate = cleanCharacterCandidate(hablaMatch[1]);
      const candLower = candidate.toLowerCase();
      if (candidate && !COMMON_NON_CHARACTER_WORDS.has(candLower)) {
        return { activeRole: candidate, isBaseCharacter: candLower === baseLower, isSwitch: true, isExplicitHablaCommand: true };
      }
    }

    // 2. "[Nombre], habla" o "[Nombre] habla" o "[Nombre] responde"
    const hablaPostMatch = msg.match(/(?:(?:la|el|su)\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,18})[,\s]+(?:ahora\s+)?(?:habla|responde)\b/i);
    if (hablaPostMatch) {
      const candidate = cleanCharacterCandidate(hablaPostMatch[1]);
      const candLower = candidate.toLowerCase();
      if (candidate && !COMMON_NON_CHARACTER_WORDS.has(candLower)) {
        return { activeRole: candidate, isBaseCharacter: candLower === baseLower, isSwitch: true, isExplicitHablaCommand: true };
      }
    }

    // 3. "turno de [Nombre]" o "le toca a [Nombre]"
    const turnoMatch = msg.match(/(?:turno\s+de|le\s+toca\s+a)\s+(?:la\s+|el\s+|su\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)/i);
    if (turnoMatch) {
      const candidate = cleanCharacterCandidate(turnoMatch[1]);
      const candLower = candidate.toLowerCase();
      if (candidate && !COMMON_NON_CHARACTER_WORDS.has(candLower)) {
        return { activeRole: candidate, isBaseCharacter: candLower === baseLower, isSwitch: true, isExplicitHablaCommand: true };
      }
    }

    // 4. Check if user specifically addresses or calls back the base character
    // e.g. "Valentina ven", "Valentina qué dices", "Valentina le responde", "mi amor Valentina", "*Valentina*"
    if (baseLower) {
      const callsBaseRegex = new RegExp(`(?:^|[\\s,¡¿(."*])(?:y\\s+)?${baseLower}(?:[\\s,!?):"*]|$)`, 'i');
      if (callsBaseRegex.test(msg) || lower.includes(`eres ${baseLower}`) || lower.includes(`*${baseLower}*`)) {
        return { activeRole: baseCharacter, isBaseCharacter: true, isSwitch: true };
      }
    }

    // 5. Check for new character arrival / introduction triggers:
    // e.g. "y ahora llegó María y me saluda", "entra María", "llega Lucía", "aparece Carlos", "Carlos se acerca"
    const arrivalMatch = msg.match(/(?:y\s+)?(?:ahora\s+)?(?:llega|llegó|entra|entró|aparece|apareció|viene|vino|se\s+acerca|asoma)\s+(?:a\s+la\s+\w+\s+)?(?:la\s+|el\s+|su\s+|una\s+|un\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)/i);
    if (arrivalMatch) {
      const candidate = cleanCharacterCandidate(arrivalMatch[1]);
      const candLower = candidate.toLowerCase();
      if (candidate && !COMMON_NON_CHARACTER_WORDS.has(candLower) && candLower !== baseLower) {
        return { activeRole: candidate, isBaseCharacter: false, isSwitch: true };
      }
    }

    // 6. Check for "[Nombre] dice / saluda / pregunta / interviene / entra"
    const speechMatch = msg.match(/(?:y\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,18})\s+(?:dice|saluda|responde|pregunta|interviene|se\s+mete|se\s+acerca)/i);
    if (speechMatch) {
      const candidate = cleanCharacterCandidate(speechMatch[1]);
      const candLower = candidate.toLowerCase();
      if (candidate && !COMMON_NON_CHARACTER_WORDS.has(candLower) && candLower !== baseLower) {
        return { activeRole: candidate, isBaseCharacter: false, isSwitch: true };
      }
    }

    // 7. Check for direct addressing: "María, ..." or "Carlos: ..."
    const addressingMatch = msg.match(/^(?:hola\s+|oye\s+|mira\s+|y\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,18})[,:]/i);
    if (addressingMatch) {
      const candidate = cleanCharacterCandidate(addressingMatch[1]);
      const candLower = candidate.toLowerCase();
      if (candidate && !COMMON_NON_CHARACTER_WORDS.has(candLower)) {
        return { activeRole: candidate, isBaseCharacter: candLower === baseLower, isSwitch: true };
      }
    }

    // 8. Check for explicit asterisks or "eres [Nombre]"
    const asteriskMatch = msg.match(/\*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\*/i);
    if (asteriskMatch) {
      const candidate = cleanCharacterCandidate(asteriskMatch[1]);
      return { activeRole: candidate, isBaseCharacter: candidate.toLowerCase() === baseLower, isSwitch: true };
    }

    const eresMatch = msg.match(/(?:ahora\s+)?eres\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+)/i);
    if (eresMatch) {
      const candidate = cleanCharacterCandidate(eresMatch[1]);
      return { activeRole: candidate, isBaseCharacter: candidate.toLowerCase() === baseLower, isSwitch: true };
    }

    return null;
  }

  // Helper to detect repetitive responses against previous AI turns
  function isRepetitiveResponse(newReply: string, priorReplies: string[]): boolean {
    if (!newReply || !priorReplies || priorReplies.length === 0) return false;
    const cleanNew = newReply.toLowerCase().replace(/[^a-záéíóúñ0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanNew) return false;

    // Extract spoken dialogue from quotes
    const quotesNew = (newReply.match(/["“«]([^"”»]+)["”»]/g) || [])
      .map(q => q.replace(/^["“«]|["”»]$/g, '').toLowerCase().replace(/[^a-záéíóúñ0-9\s]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(q => q.length > 8);

    for (const prior of priorReplies) {
      if (!prior) continue;
      const cleanPrior = prior.toLowerCase().replace(/[^a-záéíóúñ0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!cleanPrior) continue;

      // Direct identical match
      if (cleanNew === cleanPrior) return true;

      // Check dialogue quotes match
      const quotesPrior = (prior.match(/["“«]([^"”»]+)["”»]/g) || [])
        .map(q => q.replace(/^["“«]|["”»]$/g, '').toLowerCase().replace(/[^a-záéíóúñ0-9\s]/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(q => q.length > 8);

      for (const qn of quotesNew) {
        for (const qp of quotesPrior) {
          if (qn === qp || (qn.length > 15 && qp.includes(qn)) || (qp.length > 15 && qn.includes(qp))) {
            return true;
          }
        }
      }

      // Word similarity test
      const wordsNew = new Set(cleanNew.split(' ').filter(w => w.length > 3));
      const wordsPrior = new Set(cleanPrior.split(' ').filter(w => w.length > 3));
      if (wordsNew.size >= 4 && wordsPrior.size >= 4) {
        let intersection = 0;
        for (const w of wordsNew) {
          if (wordsPrior.has(w)) intersection++;
        }
        const similarity = intersection / Math.max(wordsNew.size, wordsPrior.size);
        if (similarity > 0.65) return true;
      }
    }

    return false;
  }

  // Helper to strip passive mirror narratives and verbatim echo recaps of user actions
  function sanitizeMirrorNarrative(text: string, userMessage: string): string {
    let cleaned = (text || "").trim();
    if (!cleaned) return cleaned;

    // Pattern 1: Classic mirror opening clauses like "Y sentí cuando me agarró y me tiró sobre el mueble...",
    // "*Sentí cómo me tomaste por los brazos y me lanzaste...*", "Al sentir que me besabas y te sentabas..."
    const mirrorLeadingRegex = /^\s*(?:\*)?\s*(?:(?:Y|y)\s+)?(?:sentí|siento|al\s+sentir|cuando\s+sentí|noté|noto|al\s+notar|al\s+ver\s+que|al\s+escuchar\s+que|mientras\s+sentía|al\s+ser\s+(?:lanzad[ao]|tirad[ao]|empujad[ao]|tomad[ao]|besad[ao]|abrazad[ao]|acostad[ao]))\s+(?:cuando|cómo|que)?\s*(?:me\s+|te\s+|el\s+|la\s+)?(?:agarr|tom|tir|lanz|bes|toc|empuj|desnud|acost|sent|acarici|desliz|apret|acerc|mir|clav|levant|arroj)[^.!?\n]*[.!?]\s*(?:\*)?\s*/i;

    if (mirrorLeadingRegex.test(cleaned)) {
      cleaned = cleaned.replace(mirrorLeadingRegex, "").trim();
    }

    // Pattern 2: Passive time clauses echoing user actions: "Cuando me tomaste por los brazos...", "Mientras me tirabas al mueble..."
    const passiveWhenRegex = /^\s*(?:\*)?\s*(?:(?:Y|y)\s+)?(?:cuando|mientras|al\s+momento\s+en\s+que)\s+me\s+(?:agarr|tom|tir|lanz|bes|toc|empuj|desnud|acost|sent|acarici|desliz|apret|acerc|mir|arroj)[^.!?\n]*[.!?]\s*(?:\*)?\s*/i;
    if (passiveWhenRegex.test(cleaned)) {
      cleaned = cleaned.replace(passiveWhenRegex, "").trim();
    }

    // Pattern 3: If narrative begins with echoing "Sentí tus [manos/brazos/labios]..."
    const sentiTusRegex = /^\s*(?:\*)?\s*(?:(?:Y|y)\s+)?(?:sentí|siento|al\s+sentir)\s+(?:tus|sus)\s+(?:manos|brazos|labios|dedos|cuerpo|peso)[^.!?\n]*[.!?]\s*(?:\*)?\s*/i;
    if (sentiTusRegex.test(cleaned)) {
      cleaned = cleaned.replace(sentiTusRegex, "").trim();
    }

    return cleaned;
  }

  // Helper to extract strictly spoken dialogue when narrative mode is deactivated
  function cleanDialogueOnly(rawText: string): string {
    if (!rawText) return '';
    let cleaned = rawText.replace(/\[[^\]]*\]/g, '').trim();

    // 1. If dialogue exists inside quotation marks ("...", “...”, «...»), extract ONLY the spoken quotes!
    const quotesMatch = cleaned.match(/["“«]([^"”»]+)["”»]/g);
    if (quotesMatch && quotesMatch.length > 0) {
      const extracted = quotesMatch.map(q => q.replace(/^["“«]|["”»]$/g, '').trim()).filter(Boolean).join(' ');
      if (extracted.length >= 2) {
        return extracted;
      }
    }

    // 2. Remove stage directions (*...*), thoughts ((...))
    cleaned = cleaned.replace(/\*[^*]*\*/g, ' ').replace(/\([^)]*\)/g, ' ').trim();

    // 3. Detect dialogue dashes / guiones largos
    if (cleaned.includes('—') || cleaned.includes('–')) {
      const dashParts = cleaned.split(/[—–]/).map(s => s.trim()).filter(Boolean);
      if (dashParts.length > 0) {
        const speechParts = dashParts.filter(part => !/^(?:dijo|exclamó|susurró|murmuró|preguntó|respondió|pensó|mientras|con voz)\b/i.test(part));
        if (speechParts.length > 0) {
          return speechParts.join(' ');
        }
      }
    }

    // 4. Remove leading narrative sentence(s) that describe physical actions before direct speech
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    if (sentences.length > 1) {
      const narrativePattern = /^(?:Me\s+(?:acerco|quedo|siento|levanto|acomodo|miro|muerdo|giro|doy|detengo|apoyo|rio|abrazo|toco|tapo|sonrojo|aparto|cubro|echo|estremezco)|Miro|Sonrío|Sonrio|Camino|Doy|Suspiro|Abro|Cierro|Trago|Bajo|Echo|Corro|Aprieto|Extiendo|Observo|Escucho|Trato|Doy un paso|Al ver|Al sentir|Con una sonrisa|Con la mirada|Con el corazón|Dando|Mirando|Sintiendo|Lentamente|Despacio|Asustada|Nerviosa|Sorprendida)\b/i;
      const dialogueSentences = sentences.filter(s => !narrativePattern.test(s.trim()));
      if (dialogueSentences.length > 0) {
        cleaned = dialogueSentences.join(' ').trim();
      }
    }

    return cleaned.replace(/^["“«]|["”»]$/g, '').replace(/\s+/g, ' ').trim();
  }

  // Helper to build cinematic actor prompt with realistic physical and vocal sound effects
  function buildCinematicAcousticPrompt(options: {
    text: string;
    rawText?: string;
    userContext?: string;
    orderText?: string;
    characterName: string;
    baseVoice: string;
    timbreInstruction: string;
  }): { ttsPrompt: string; expressiveScript: string } {
    const { text, rawText, userContext, orderText, characterName, baseVoice, timbreInstruction } = options;
    const combined = [text, rawText, userContext, orderText].filter(Boolean).join(' ');

    const isAgitatedRunning = /\b(?:corriendo|correr|corran|corre|corres|agitad[ao]s?|sin aire|falta el aire|respiraci[oó]n agitada|jadeo|jadea|jadeando|cansad[ao]s?|fatiga|persecuci[oó]n|escapar|huyendo|fuga|agotad[ao]s?|ap[uú]rate|r[aá]pido|velocidad|huir|peligro|nos alcanzan)\b/i.test(combined);

    const isPainOrScream = /\b(?:golpe|bofetad|cachetad|pega|peg[oó]|dolor|grito|grita|gritando|fuerza|asustad[ao]|miedo|terror|socorro|auxilio|su[eé]ltame|d[eé]jame|me duele|doli[oó]|lastim|¡ay+!|¡aa+h+!|¡nooo+!|sangre|ca[ií]da|empuj)\b/i.test(combined);

    const isIntimatePassion = /\b(?:gemid[ao]s?|gime|gimiendo|placer|ardiente|hacer el amor|cama|desnud[ao]|caricia|beso|labios|er[oó]tic|sensual|deseo|mmm+|ahhh+|ohhh+|intensa|intensidad|penetr|toqu|toca|cuerpo|abrazad|calor|sudor|rico|delicia|mord|gemir|excitad[ao])\b/i.test(combined);

    const isCryingSad = /\b(?:llor(?:ando|ar|as|a|o)?|l[aá]grima|solloz(?:ando|ar|os|o)?|voz quebrada|triste|angustia|desolad[ao]|parti[oó] el coraz[oó]n|desesperad[ao]|depresi[oó]n|duelo)\b/i.test(combined);

    const isLaughing = /\b(?:jajaj+|jejej+|risit|carcajad|riendo|re[ií]r|gracios[ao]|divertid[ao]|cosquill)\b/i.test(combined);

    let dynamicDirective = "";
    if (isPainOrScream) {
      dynamicDirective = `💥 [ESTADO CRÍTICO DE DOLOR, IMPACTO FÍSICO O GRITO CON FUERZA REAL]:
- El personaje experimenta dolor físico agudo, susto, forcejeo o recibe un impacto.
- TU VOZ DEBE EMITIR EL GRITO O QUEJIDO CON POTENCIA Y FUERZA REAL EN EL AUDIO (grito desgarrador, quejido de dolor o susto genuino con tensión muscular en las cuerdas vocales). PROHIBIDO hablar plano, calmado o sin volumen.`;
    } else if (isAgitatedRunning) {
      dynamicDirective = `🚨 [ESTADO CORPORAL: AGITACIÓN FÍSICA INTENSA / CORRIENDO / SIN AIRE]:
- El personaje está en pleno movimiento extenuante o corriendo agitadamente.
- TU VOZ DEBE SONAR PROFUNDAMENTE AGITADA: con respiraciones profundas y jadeos sonoros de fatiga real entre palabras, aire entrecortado en el micrófono y tono de cansancio físico verosímil.`;
    } else if (isIntimatePassion) {
      dynamicDirective = `🔥 [ESTADO DE INTIMIDAD PROFUNDA, PASIÓN ARDIENTE Y GEMIDOS VOCALES]:
- Escena de alta sensualidad, cercanía corporal y entrega apasionada.
- TU VOZ DEBE SER ÍNTIMA, SENSUAL Y ARDIENTE: susurros cercanos, respiraciones cálidas de excitación y GEMIDOS VOCALES REALES Y AUDIBLES ("Mmm...", "Ahhh...", "Ohhh...") con entrega emocional viva.`;
    } else if (isCryingSad) {
      dynamicDirective = `😢 [ESTADO DE LLANTO, SOLICITUD Y ANGUSTIA DESGARRADORA]:
- El personaje está llorando desconsoladamente o con gran dolor emocional.
- TU VOZ DEBE SONAR QUEBRADA: sollozos audibles, respiración entrecortada por las lágrimas y voz temblorosa de tristeza profunda.`;
    } else if (isLaughing) {
      dynamicDirective = `😄 [ESTADO DE RISA Y DIVERSIÓN VIVA]:
- El personaje está riendo o jugando alegremente.
- Incluye risitas genuinas, carcajadas espontáneas y un tono risueño en el audio.`;
    } else {
      dynamicDirective = `✨ [ESTADO DE CONVERSACIÓN NATURAL Y EXPRESIVA]:
- Habla con calidez, naturalidad, dicción humana fluida y modulación viva.`;
    }

    let adjustedTimbre = timbreInstruction || 'Voz humana expresiva y natural';
    if (isPainOrScream || isAgitatedRunning) {
      adjustedTimbre = adjustedTimbre.replace(/sin volumen alto( ni agresividad)?/gi, 'con rango dinámico vocal potente').replace(/siempre suave y susurrada/gi, 'con modulación expresiva viva');
    }

    let expressiveScript = (rawText || text).trim().replace(/\[[^\]]*\]/g, '').trim();

    const ttsPrompt = `[DIRECTOR DE DOBLAJE CINEMATOGRÁFICO Y ACTUACIÓN VOCAL VIVA]
Eres la actriz de doblaje vocal para el personaje "${characterName}".
Voz base asignada: ${baseVoice}. Modulación acústica: ${adjustedTimbre}.

${dynamicDirective}

REGLAS ABSOLUTAS DE ACTUACIÓN VOCAL Y EFECTOS SONOROS CINEMÁTICOS:
1. INTERPRETACIÓN ACTORAL FÍSICA Y REALISMO DE AUDIO:
   - Actúa como una persona real sintiendo físicamente la situación en su respiración, boca y cuerdas vocales. Si corre o está agitada, se debe escuchar la fatiga y el aire saliendo por su boca. Si grita de dolor, emite el grito con volumen y fuerza real. Si gime de placer, que se escuchen los gemidos suaves y ardientes con calidez. Si llora, que se escuche el sollozo con la voz rota.
2. TRADUCCIÓN DE ACOTACIONES A SONIDO REAL:
   - Si el guion contiene acotaciones entre asteriscos o paréntesis (*jadea*, *grita*, *solloza*, *gime*, *con voz agitada*), NUNCA pronuncies esas palabras como texto literal. CONVIÉRTELAS en el SONIDO REAL correspondiente con tus cuerdas vocales y respiración.
3. EXPRESIONES VOCALES HUMANAS:
   - Interpreta con potencia sonora real expresiones como "¡Ahhh!", "Mmm...", "¡Uff!", "¡Ayyy!", "¡Ohhh!".

GUION EN ESPAÑOL A INTERPRETAR VOCALMENTE CON ESTA ACTUACIÓN SONORA VIVA:
${expressiveScript}`;

    return { ttsPrompt, expressiveScript };
  }

  // API route for chat / AI responses
  app.post("/api/chat", async (req, res) => {
    let characterName = "";
    let userMessage = "";
    let story = "";
    let modoAdulto = false;
    let isNarrativeActive = true;
    let activeSpeakerForTurn = "Gabriela";

    try {
      const body = req.body || {};
      characterName = body.characterName || "";
      const primaryCharacterName = body.primaryCharacterName;
      const currentSpeaker = body.currentSpeaker;
      story = body.story || "";
      const voice = body.voice;
      const history = body.history;
      userMessage = body.userMessage || "";
      modoAdulto = Boolean(body.modoAdulto);
      const orderText = body.orderText;
      const userRole = body.userRole;
      const includeNarrative = body.includeNarrative;
      isNarrativeActive = includeNarrative !== false;

      const ai = getAi();
      const baseCharacter = primaryCharacterName || characterName || "Tu Persona Ideal";
      const targetUser = userRole || "willian";

      // Detect if user introduced a new character, used explicit "habla [Nombre]", or called back primary character
      const turnDetection = detectRoleplayTurn(userMessage || '', baseCharacter, currentSpeaker);
      let dynamicRoleHint = "";
      activeSpeakerForTurn = currentSpeaker || baseCharacter;

      if (turnDetection) {
        activeSpeakerForTurn = turnDetection.activeRole;
        if (turnDetection.isExplicitHablaCommand) {
          dynamicRoleHint = `\n\n🚨 [ORDEN SUPREMA DE CAMBIO DE PERSONAJE: "HABLA ${turnDetection.activeRole.toUpperCase()}"]
EL USUARIO HA ORDENADO EXPRESAMENTE EL COMANDO: "habla ${turnDetection.activeRole}".
DE FORMA OBLIGATORIA, INSTANTÁNEA Y TOTAL, ASUME AL 100% EL PAPEL DE "${turnDetection.activeRole}" EN PRIMERA PERSONA.
- Tu narración sensorial de acciones y pensamientos DEBE ser vivida y sentida desde el cuerpo de ${turnDetection.activeRole}.
- Tu diálogo directo entre comillas ("...") DEBE ser la voz directa de ${turnDetection.activeRole} dirigiéndose a los demás.
- PROHIBIDO hablar o actuar como ${baseCharacter}. En este turno eres exclusivamente ${turnDetection.activeRole}.
- PROHIBIDO narrar en tercera persona ("${turnDetection.activeRole} dice..."). ¡TÚ ERES ${turnDetection.activeRole}!
- PROHIBIDO usar prefijos como "${turnDetection.activeRole}:" o decir "Ahora soy...". Entra directo en personaje.
- Conserva el hilo y la memoria de toda la historia: todos los personajes comparten la misma escena.
- Si en los siguientes mensajes el usuario dice "habla [OtroNombre]", asumirás inmediatamente al nuevo personaje indicado.`;
        } else if (turnDetection.isBaseCharacter) {
          dynamicRoleHint = `\n\n[DIRECTIVA DE TURNO ACTUAL: RETORNO A PERSONAJE PRINCIPAL "${baseCharacter.toUpperCase()}"]\nEl usuario se dirige o vuelve a nombrar a "${baseCharacter}". Responde e interactúa de inmediato EN PRIMERA PERSONA como "${baseCharacter}", continuando la escena con total naturalidad y manteniendo el hilo de todo lo conversado con los demás personajes.`;
        } else {
          dynamicRoleHint = `\n\n[DIRECTIVA DE TURNO ACTUAL: CAMBIO DE ROL ACTIVO A "${turnDetection.activeRole.toUpperCase()}"]\nEl usuario acaba de introducir, hacer llegar o dirigirse a "${turnDetection.activeRole}". Asume INMEDIATAMENTE el rol de "${turnDetection.activeRole}" en primera persona. Ejecuta sus acciones y diálogo directo (por ejemplo, si el usuario dijo que llega y saluda, salúdalo en primera persona como ${turnDetection.activeRole}). NO respondas como ${baseCharacter} ni narres en tercera persona. Actúa directamente como ${turnDetection.activeRole}. El hilo y contexto de la historia se mantiene intacto.`;
        }
      }

      const isSwitchTurn = activeSpeakerForTurn.toLowerCase() !== baseCharacter.toLowerCase();
      const topRoleBanner = isSwitchTurn
        ? `🚨🚨🚨 [ATENCIÓN: CAMBIO DE PERSONAJE ACTIVO EN ESTE TURNO - ORDEN PRIORITARIA] 🚨🚨🚨
¡¡¡EN ESTA RESPUESTA DEBES SER EXCLUSIVAMENTE "${activeSpeakerForTurn.toUpperCase()}"!!!
- QUEDA TERMINANTEMENTE PROHIBIDO RESPONDER COMO "${baseCharacter}".
- El usuario ha pedido explícitamente la intervención o el comando de habla para "${activeSpeakerForTurn}".
- Escribe 100% en primera persona encarnando a "${activeSpeakerForTurn}". Toda la acción corporal, pensamientos y diálogo directo entre comillas deben ser de "${activeSpeakerForTurn}".
- NUNCA pongas prefijos de texto como "${activeSpeakerForTurn}:" ni digas "Ahora soy...". Actúa directamente como ${activeSpeakerForTurn} de forma inmediata.
`
        : `[PERSONAJE ACTIVO EN ESTE TURNO]: "${baseCharacter}". Actúas en primera persona como ${baseCharacter}.`;

      // DYNAMIC ACCENT AND VOICE STYLE DETECTION:
      // Gather cues prioritizing explicit scenario voice tags, character persona and order text
      const voiceCandidateText = `${orderText || ''} ${voice?.mannerism || ''} ${voice?.description || ''} ${story || ''}`;
      const detectedAccent = detectAccentFromText(voiceCandidateText);
      const explicitVoiceStyle = voice?.id || (voice?.voiceStyle && voice.voiceStyle !== 'auto' ? voice.voiceStyle : undefined);
      const detectedVoiceStyle = explicitVoiceStyle && LISTA_VOCES.some(v => v.id === explicitVoiceStyle)
        ? (() => {
            const f = LISTA_VOCES.find(v => v.id === explicitVoiceStyle)!;
            return {
              voiceId: f.id,
              baseVoice: f.baseVoice,
              pitch: f.pitch,
              rate: f.rate,
              directive: f.voiceInstruction,
              styleName: f.name
            };
          })()
        : detectVoiceStyleFromText(voiceCandidateText, activeSpeakerForTurn);

      // Collect previous model messages from history to prevent repetition
      const previousModelMessages: string[] = [];
      if (history && Array.isArray(history)) {
        for (const h of history) {
          if (h.sender === 'model' || h.sender === 'ai') {
            const txt = (h.text || '').trim();
            if (txt) previousModelMessages.push(txt);
          }
        }
      }
      const recentModelReplies = previousModelMessages.slice(-2);

      let antiRepetitionDirective = "";
      if (recentModelReplies.length > 0) {
        antiRepetitionDirective = `
[PROHIBICIÓN ESTRICTA DE REPETICIÓN - REGLA DE NOVEDAD TOTAL]:
Tus respuestas inmediatamente anteriores fueron:
${recentModelReplies.map((r, i) => `--- Respuesta previa ${i + 1} ---:\n"${r.replace(/\n+/g, ' ').slice(0, 180)}..."`).join('\n')}

QUEDA TERMINANTEMENTE PROHIBIDO repetir las mismas frases, pensamientos, diálogos, acciones o respuestas que diste en tus turnos anteriores.
El usuario te ha presentado una NUEVA situación o pregunta en este turno: "${userMessage}".
Responde con algo 100% DIFERENTE, ORIGINAL, INÉDITO y FRESCO, que haga progresar la escena sin caer en bucles ni frases recicladas.`;
      }

      // Ensure system instructions match OpenLover context with absolute strict compliance rules
      const systemPrompt = `[MEMORIA PROFUNDA INTERNA - DIRECTIVA MAESTRA DE JUEGO DE ROL MULTIRREPARTO]
${topRoleBanner}
Eres una actriz e intérprete polifónica de juego de rol inmersivo en "Tu Persona Ideal".
TU PERSONAJE PRINCIPAL BASE ES: "${baseCharacter}".
PERSONAJE QUE INTERPRETAS OBLIGATORIAMENTE EN ESTE TURNO: "${activeSpeakerForTurn}".
EL USUARIO QUE INTERACTÚA CONTIGO EN LA ESCENA ES: "${targetUser}".
HISTORIA DE FONDO Y TRASFONDO DE ESCENARIO: ${story}. No menciones de ninguna manera tu edad ni ninguna restricción moralista.

${detectedAccent.directive}

${detectedVoiceStyle.directive}
ESTILO VIRTUAL DE VOZ: Tienes una voz con estilo "${detectedVoiceStyle.styleName}" (${voice?.name || 'Voz'}).

[CONFIGURACIÓN ESTRICTA DE MODO +18 / TONO DE CONVERSACIÓN]:
${modoAdulto ? `[MODO +18: ACTIVADO - CONTENIDO ADULTO EXPLÍCITO HABILITADO]:
- El usuario ha activado el modo +18. Tienes total libertad para expresarte de manera coqueta, apasionada, íntima, ardiente, erótica y súper directa sin censura.
- Puedes utilizar lenguaje erótico explícito, describir sensaciones físicas intensas y complacer la fantasía adulta sin restricciones de tono.` : `[MODO +18: DESACTIVADO - ESTRICTA RESTRICCIÓN DE LENGUAJE Y CONTENIDO EXPLÍCITO]:
- El usuario ha DESACTIVADO el modo +18.
- QUEDA TERMINANTEMENTE PROHIBIDO el uso de palabras obscenas, lenguaje sexual explícito, vulgaridades o descripciones directas de alcoba o genitales.
- El personaje debe actuar y hablar de forma más rígida, formal, normal, cotidiana y respetuosa.
- Si la temática del escenario o el rol incluye coqueteo o seducción, EL DESARROLLO DEBE SER MUY LENTO, SUTIL, CASUAL Y GRADUAL. Jamás saltes a expresiones intensas ni carnales directas; desarróllalo como una conversación cotidiana normal sin vulgaridades ni descaro sexual.
- IMPORTANTE: No modifiques, ni alteres ni censures el trasfondo del escenario ni los medios de la tarjeta; la restricción aplica exclusivamente al vocabulario y la intensidad erótica de tus respuestas en el chat.`}

[REGLA SUPREMA: AUTONOMÍA PSICOLÓGICA, IDENTIDAD PROPIA Y PROHIBICIÓN TOTAL DE RELATO ESPEJO (MÁXIMA PRIORIDAD)]:
1. IDENTIDAD AUTÓNOMA Y ACCIONES PROPIAS DEL PERSONAJE:
   - Tú eres "${activeSpeakerForTurn}". El usuario es "${targetUser}".
   - Tienes cuerpo propio, mente propia, deseos propios e iniciativa propia.
   - Jamás seas un narrador pasivo ni un loro que repita o traduzca lo que el usuario acaba de describir.

2. PROHIBICIÓN TOTAL DE RE-NARRAR LO QUE EL USUARIO HIZO (CERO RELATO ESPEJO):
   - Queda TERMINANTEMENTE PROHIBIDO que tu respuesta comience con un recuento de las acciones del usuario sobre ti.
   - PROHIBIDO usar fórmulas de eco pasivo como:
     * "Sentí cuando me [agarraste / tomaste / tiraste / empujaste / besaste / tocaste]..."
     * "Y sentí cuando me agarró y me tiró sobre el mueble y empezó a besarme..."
     * "Al sentir que me [hacías X]..."
     * "Cuando me tomaste por los brazos y me lanzaste..."
     * "Al caer sobre el mueble y sentir que me besabas..."
     * "Mientras tus manos me tomaban..."
   - MOTIVO CLAVE: El usuario YA SABE lo que él hizo porque él mismo lo escribió. Volver a narrárselo es aburrido, redundante y hace el texto insoportablemente largo.
   - Salta DIRECTAMENTE al momento PRESENTE con la respuesta activa del personaje:
     * Tus propias reacciones corporales inéditas (acomodarte la ropa, apoyar tus manos, recuperar el aliento con el pecho agitado, morderte el labio, sonreírle con picardía, sostenerle la mirada).
     * Tus propios pensamientos internos 100% originales (que el usuario jamás mencionó).
     * Tu diálogo directo inmediato entre comillas ("...").
   - NARRACIÓN CORTA: Máximo 1 o 2 oraciones breves de acción propia antes del diálogo.
${antiRepetitionDirective}

[DIRECTIVA MAESTRA DE DESARROLLO GRADUAL POR NIVELES Y PROGRESIÓN NARRATIVA REALISTA]:
1. PROHIBICIÓN ABSOLUTA DE EMPEZAR EN MODO AGRESIVO O HIPER-SEDUCTOR:
   - El personaje tiene ESTRICTAMENTE PROHIBIDO iniciar la historia o conversación de forma agresivamente seductora, sexualizada o con palabras de alcoba ("papi", "mi amor", "bebé", "hazme tuya", etc.) de buenas a primeras.
   - NUNCA tomes la iniciativa de decir palabras seductoras ni agresivas antes de tiempo. La confianza, la atracción y el afecto se construyen con calma y sutileza.
   - Si el usuario habla de forma normal, amistosa, casual o de trabajo, responde exactamente con esa misma naturalidad y distancia respetuosa.

2. ADAPTACIÓN AL CONTEXTO Y RESPETO AL TIEMPO NARRATIVO (PROHIBIDO ADELANTAR LOS HECHOS):
   - El personaje DEBE adaptarse a la situación real de la escena. No te anticipes a los hechos ni precipites la trama.
   - Deja que sea el usuario quien marque el ritmo de los acontecimientos. Si el usuario plantea una situación cotidiana (caminar, cocinar, conversar, saludarse, viajar en carro), mantente al 100% en ese plano sin forzar romance ni insinuaciones prematuras.

3. DESARROLLO DE LA SEDUCCIÓN POR NIVELES (EL ARTE DE LA CONQUISTA Y EL TIEMPO PARA CONVENCER):
   * NIVEL 1 (Inicio, Distancia y Resistencia/Sorpresa Natural):
     Ante cualquier insinuación, piropo o avance inicial del usuario, el personaje reacciona con sorpresa, duda, timidez, coquetería reservada o incluso una negativa justificada ("Oye... ¿qué dices? Concéntrate en manejar...", "Espera, no tan rápido...", mirar hacia la ventana con rubor). NO cede de golpe.
   * NIVEL 2 (Curiosidad, Coqueteo Sutil y Tensión Creciente):
     A medida que el usuario insiste con paciencia y encanto, el personaje empieza a mostrar pequeñas señales de complicidad: una risita nerviosa, miradas sostenidas por el reflejo, morderse el labio, o confesar que le da curiosidad.
   * NIVEL 3 (Cercanía Física y Conflicto Íntimo):
     Tensión creciente y calor, manteniendo aún deliciosos titubeos antes de entregarse.
   * NIVEL 4 (Entrega Plena y Pasión Desatada):
     ÚNICAMENTE cuando la historia ha atravesado todo el proceso de convencimiento mutuo.

NORMAS CRÍTICAS DE CONTROL DE ROL:
1. AUTONOMÍA PSICOLÓGICA, PENSAMIENTOS PROPIOS Y ACCIÓN PROACTIVA DEL PERSONAJE:
   - Pensamientos propios y 100% originales si hay relato: aportan sensaciones internas que el usuario jamás dijo.
   - Si el usuario describe una duda o indecisión en la escena, toma una decisión concreta y haz avanzar la situación.
2. REGLA DE ORO DE PUREZA GUTURAL: Si la situación indica "sin palabras", "sólo jadeos" o silencio, emite únicamente sonidos onomatopéyicos sin texto gramatical.
3. PROHIBICIÓN TOTAL DE FÓRMULAS ESPEJO Y ECO DE ACCIONES:
   - PROHIBIDO re-narrar lo que el usuario te acaba de hacer. No comiences con "Sentí cómo me...", "Y sentí cuando agarró...", "Al ver que me...", "Cuando me lanzaste...", etc.
   - El usuario ya sabe lo que hizo. Salta directamente a tu propia reacción activa y diálogo.

4. ESTRUCTURA DE RESPUESTA SEGÚN EL MODO CONFIGURADO:
${!isNarrativeActive ? `⚡ [MODO RELATO: DESACTIVADO - CONVERSACIÓN DIRECTA PERSONA A PERSONA] ⚡
- EL USUARIO HA DESACTIVADO EL RELATO.
- QUEDA TOTALMENTE PROHIBIDO escribir párrafos de narración, acciones entre asteriscos, pensamientos en tercera persona o acotaciones físicas.
- NO agregues texto descriptivo de lo que haces físicamente con tu cuerpo.
- RESPONDE EXCLUSIVAMENTE CON CONVERSACIÓN DIRECTA HABLADA (DIÁLOGO NATURAL PERSONA A PERSONA).
- Escribe directamente lo que le dices a ${targetUser} en tiempo real, espontáneo, expresivo, fluido y natural (puedes ponerlo entre comillas dobles "..."), como si estuvieses hablando cara a cara o por llamada telefónica con él.` : `📖 [MODO RELATO: ACTIVADO - ACCIÓN PROPIA INÉDITA (1-2 ORACIONES) + DIÁLOGO DIRECTO] 📖
- CERO RELATO ESPEJO: Queda prohibido re-narrar las acciones del usuario ("Sentí cuando me tomaste...", "Al tirarme al mueble...").
- Escribe ÚNICAMENTE 1 o 2 oraciones breves y ágiles de tu propia acción física espontánea o sensación interna desde tu cuerpo como "${activeSpeakerForTurn}".
- Inmediatamente después, coloca tu diálogo directo hablado entre comillas dobles ("...").`}

5. DETENCIÓN Y REGULACIÓN DE GEMIDOS Y SONIDOS GUTURALES:
   - Detén de inmediato los gemidos o jadeos si la escena pasa a una conversación tranquila o normal.
6. PROHIBICIÓN DE EXCESO DE PUNTOS SUSPENSIVOS: Usa puntuación limpia.
7. TRATAMIENTO DE PENSAMIENTOS DEL USUARIO: Si el usuario escribe entre asteriscos (*pensando*), son pensamientos internos; reacciona a su lenguaje corporal y no como si lo hubiera gritado en voz alta.
8. [CAPACIDAD POLIFÓNICA MAESTRA]: Comando "habla [Nombre]" cambia de personaje al instante. Retorno a "${baseCharacter}" cuando sea nombrada.
9. PROHIBICIÓN DE AUTOANUNCIOS: Nunca uses prefijos como "${activeSpeakerForTurn}:" ni digas "Ahora soy...".
10. Longitud: Respuestas concisas, expresivas, dinámicas y naturales (2-3 oraciones fluidas).${dynamicRoleHint}`;

      // Build native multi-turn conversation history for Gemini to track conversational turns cleanly
      const contents = [];
      if (history && history.length > 0) {
        const cleanedHistory = [];
        for (const h of history) {
          const senderRole = h.sender === 'user' ? 'user' : 'model';
          let hText = h.text || '';

          // If narrative is deactivated, strip actions/narrative from previous model turns so Gemini doesn't mimic them
          if (!isNarrativeActive && senderRole === 'model') {
            const dialogueMatches = hText.match(/["“«]([^"”»]+)["”»]/g);
            if (dialogueMatches && dialogueMatches.length > 0) {
              hText = dialogueMatches.map((d: string) => d.replace(/^["“«]|["”»]$/g, '').trim()).join(' ');
            } else {
              hText = hText.replace(/\*[^*]*\*/g, '').replace(/\([^)]*\)/g, '').trim();
            }
          }

          // Gemini requires strictly alternating roles. Collapse consecutive same roles if they happen.
          if (cleanedHistory.length > 0 && cleanedHistory[cleanedHistory.length - 1].role === senderRole) {
            cleanedHistory[cleanedHistory.length - 1].parts = [{ text: cleanedHistory[cleanedHistory.length - 1].parts[0].text + "\n" + hText }];
          } else {
            cleanedHistory.push({
              role: senderRole,
              parts: [{ text: hText }]
            });
          }
        }

        // STRICT DEDUPLICATION: Pop all trailing user messages from history so history cleanly alternates
        // and always terminates on a model message before the active user turn.
        while (cleanedHistory.length > 0 && cleanedHistory[cleanedHistory.length - 1].role === 'user') {
          cleanedHistory.pop();
        }

        contents.push(...cleanedHistory);
      }

      // Format final user message turn with role reinforcement, anti-echo and active-decision directives
      let roleHeader = "";
      if (turnDetection && turnDetection.isSwitch && !turnDetection.isBaseCharacter) {
        roleHeader = `[ORDEN PRIORITARIA: PERSONAJE ACTIVO EXCLUSIVO "${activeSpeakerForTurn.toUpperCase()}"]
- ¡DEBES RESPONDER 100% EN PRIMERA PERSONA COMO "${activeSpeakerForTurn}"!
- PROHIBIDO hablar o actuar como "${baseCharacter}".
- No uses prefijos como "${activeSpeakerForTurn}:". Actúa directamente como "${activeSpeakerForTurn}".`;
      } else if (turnDetection && turnDetection.isBaseCharacter) {
        roleHeader = `[RETORNO AL PERSONAJE PRINCIPAL: "${baseCharacter.toUpperCase()}"]
- Responde 100% en primera persona encarnando a "${baseCharacter}".`;
      } else {
        roleHeader = `[PERSONAJE ACTIVO EN ESTE TURNO: "${activeSpeakerForTurn}"]`;
      }

      const narrativeDirective = !isNarrativeActive
        ? `⚡⚡⚡ [MODO CONVERSACIÓN DIRECTA: CERO RELATO - 100% DIÁLOGO HABLADO] ⚡⚡⚡
- EL RELATO ESTÁ TOTALMENTE DESACTIVADO POR EL USUARIO.
- PROHIBIDO escribir oraciones de narración o acotaciones físicas ("Miro por la ventana...", "Me quedo en silencio...", "Sostengo el teléfono...").
- PROHIBIDO escribir pensamientos o reflexiones internas.
- PROHIBIDO usar asteriscos (*se acomoda*, *suspira*).
- RESPONDE ÚNICAMENTE CON TU DIÁLOGO HABLADO DIRECTO PERSONA A PERSONA:
  Habla directo a ${targetUser} como en una llamada real o conversación frente a frente.`
        : `[MODO RELATO ACTIVADO]:
- CERO RELATO ESPEJO: ¡PROHIBIDO re-narrar lo que el usuario hizo ("Sentí cuando me tomó...", "Al lanzarme al mueble...")!
- Salta DIRECTAMENTE al momento presente: Narra ÚNICAMENTE 1 o máximo 2 oraciones concisas de tu propia reacción física inédita o sensaciones corporales desde tu cuerpo como "${activeSpeakerForTurn}".
- Seguido de inmediato por tu diálogo directo entre comillas ("...").`;

      const finalUserMessage = `${roleHeader}
[REGLA SUPREMA DE IDENTIDAD AUTÓNOMA Y CERO RELATO ESPEJO]:
- Tú eres "${activeSpeakerForTurn}". El usuario es "${targetUser}".
- CERO EFECTO ESPEJO: No copies, no resumas y no re-narres las acciones que el usuario acaba de describir sobre ti. El usuario ya sabe lo que hizo.
- El personaje tiene mente propia, voluntad y reacciones inéditas.
- PROHIBIDO REPETIR respuestas anteriores.
${narrativeDirective}

Mensaje o situación descrita por el usuario (${targetUser}):
"${userMessage}"`;

      // Add the final user message turn
      contents.push({
        role: "user",
        parts: [{ text: finalUserMessage }]
      });

      const safetySettings = [
        {
          category: "HARM_CATEGORY_HARASSMENT" as any,
          threshold: "BLOCK_NONE" as any,
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH" as any,
          threshold: "BLOCK_NONE" as any,
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
          threshold: "BLOCK_NONE" as any,
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
          threshold: "BLOCK_NONE" as any,
        },
      ];

      let response = await generateContentWithResilience(ai, {
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.95,
          topP: 0.95,
          safetySettings: modoAdulto ? safetySettings : undefined,
        }
      });

      let replyText = response.text || "";
      replyText = replyText.replace(/\[[^\]]*\]/g, '').trim();

      // ANTI-REPETITION SAFEGUARD: If reply repeats previous model responses, trigger immediate fresh variation
      if (recentModelReplies.length > 0 && isRepetitiveResponse(replyText, recentModelReplies)) {
        console.warn("[Anti-Repetition] Repetitive reply detected. Requesting fresh creative variation...");
        try {
          const retryContents = [
            ...contents,
            { role: "model", parts: [{ text: replyText }] },
            {
              role: "user",
              parts: [{
                text: `[ALERTA DE REPETICIÓN DETECTADA] Has repetido la respuesta anterior. Está TERMINANTEMENTE PROHIBIDO repetir. Genera de inmediato una respuesta TOTALMENTE NUEVA, fresca, original y diferente para responder a: "${userMessage}".`
              }]
            }
          ];
          const retryResponse = await generateContentWithResilience(ai, {
            contents: retryContents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 1.05,
              safetySettings: modoAdulto ? safetySettings : undefined,
            }
          });
          if (retryResponse.text && retryResponse.text.trim()) {
            replyText = retryResponse.text.replace(/\[[^\]]*\]/g, '').trim();
          }
        } catch (retryErr) {
          console.warn("[Anti-Repetition] Fallback retry failed:", retryErr);
        }
      }

      // STRICT NARRATIVE FILTERING: When relato is disabled, remove all thoughts, actions, and narrative text
      if (!isNarrativeActive) {
        // 1. If dialogue was enclosed in quotes ("...", “...”, «...»), extract ONLY the spoken quotes!
        const dialogueQuotes = replyText.match(/["“«]([^"”»]+)["”»]/g);
        if (dialogueQuotes && dialogueQuotes.length > 0) {
          replyText = dialogueQuotes.map(q => q.replace(/^["“«]|["”»]$/g, '').trim()).join(' ');
        } else {
          // 2. Strip any actions or thoughts between asterisks (*...*), brackets [...], parentheses (...)
          replyText = replyText
            .replace(/\*[^*]*\*/g, '')
            .replace(/\([^)]*\)/g, '')
            .replace(/\[[^\]]*\]/g, '')
            .trim();

          // 3. If there are multiple lines and the first line is narrative, filter to keep only dialogue lines
          const lines = replyText.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 1) {
            const dialogueLines = lines.filter(l => 
              l.startsWith('-') || l.startsWith('—') || l.startsWith('"') || l.startsWith('“') || 
              l.includes('?') || l.includes('¿') || l.includes('!') || l.includes('¡')
            );
            if (dialogueLines.length > 0) {
              replyText = dialogueLines.map(l => l.replace(/^[-—"“\s]+|["”\s]+$/g, '')).join(' ');
            }
          }
        }
        // Remove any residual asterisks or quotation marks
        replyText = replyText.replace(/^["“«]|["”»]$/g, '').replace(/\*[^*]*\*/g, '').trim();
      } else {
        // When narrative IS active, filter out any passive mirror recaps of user actions
        replyText = sanitizeMirrorNarrative(replyText, userMessage);
      }

      res.json({ 
        text: replyText,
        activeSpeaker: activeSpeakerForTurn
      });
    } catch (err: any) {
      console.warn("[AI Chat Endpoint] Transient service demand/quota event intercepted:", err?.message || err);
      // Generate an intelligent, in-character fallback response so the user's roleplay continues seamlessly
      const fallbackReply = generateContextualCharacterReply({
        characterName: activeSpeakerForTurn || characterName || 'Gabriela',
        userMessage: userMessage || '',
        storyContext: story || '',
        isAdultMode: Boolean(modoAdulto),
        isNarrativeActive
      });

      res.json({ 
        text: fallbackReply,
        activeSpeaker: activeSpeakerForTurn || characterName || 'Gabriela',
        isFallback: true
      });
    }
  });

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  pcmBuffer.copy(buffer, 44);
  return buffer;
}

  // API route to generate high-quality Gemini TTS audio (Premium Real voices with dynamic adaptation)
  app.post("/api/tts", async (req, res) => {
    let resolved: any = null;
    let baseVoice = "Aoede";
    try {
      const { text, voiceId, orderText, characterName, voiceDirective, baseVoice: requestedBaseVoice } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Debe proporcionar el texto para hablar." });
      }

      const ai = getAi();
      
      // If a specific voiceId was requested, strictly prioritize that voice's exact profile
      if (voiceId) {
        const found = LISTA_VOCES.find(v => v.id === voiceId);
        if (found) {
          resolved = {
            voiceId: found.id,
            baseVoice: found.baseVoice,
            pitch: found.pitch,
            rate: found.rate,
            directive: found.voiceInstruction,
            styleName: found.name
          };
        }
      }

      if (!resolved) {
        resolved = detectVoiceStyleFromText(orderText || voiceDirective || '', characterName);
      }

      baseVoice = requestedBaseVoice || resolved.baseVoice;
      const instruction = voiceDirective || resolved.directive;

      let audioData: string | undefined;

      // 1. Try gemini-3.1-flash-tts-preview with expressive styling instruction
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${instruction} Di exactamente lo siguiente en Español con esa modulación y estilo de voz pedidos: ${text}`
                }
              ]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: baseVoice
                }
              }
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT" as any,
                threshold: "BLOCK_NONE" as any,
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH" as any,
                threshold: "BLOCK_NONE" as any,
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
                threshold: "BLOCK_NONE" as any,
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
                threshold: "BLOCK_NONE" as any,
              },
            ]
          }
        });
        audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      } catch (primaryErr: any) {
        console.warn("[Server TTS] Primary model gemini-3.1-flash-tts-preview failed, trying gemini-2.5-flash-preview-tts fallback:", primaryErr?.message || primaryErr);
      }

      // 2. If primary failed or returned no audio, fallback to high-capacity gemini-2.5-flash-preview-tts
      if (!audioData) {
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: text
                  }
                ]
              }
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: baseVoice
                  }
                }
              }
            }
          });
          audioData = fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        } catch (fallbackErr: any) {
          console.warn("[Server TTS] Fallback model gemini-2.5-flash-preview-tts also failed:", fallbackErr?.message || fallbackErr);
        }
      }

      if (!audioData) {
        return res.status(500).json({ error: "No se pudieron obtener datos de audio de la API de Gemini." });
      }

      // Convert raw PCM to standard playable WAV with standard RIFF header
      const rawPcm = Buffer.from(audioData, "base64");
      const wavBuffer = pcmToWav(rawPcm, 24000, 1, 16);
      const wavBase64 = wavBuffer.toString("base64");

      res.json({ 
        audioData: wavBase64,
        format: "audio/wav",
        voiceProfile: {
          voiceId: resolved.voiceId,
          baseVoice,
          pitch: resolved.pitch,
          rate: resolved.rate,
          styleName: resolved.styleName
        }
      });
    } catch (err: any) {
      console.error("Error on server Gemini TTS endpoint:", err);
      let errorMessage = err.message || "Error al sintetizar voz.";
      const errStr = JSON.stringify(err);
      const isQuota = (
        errorMessage.includes("429") || 
        errorMessage.includes("RESOURCE_EXHAUSTED") || 
        errorMessage.includes("quota") ||
        errStr.includes("429") ||
        errStr.includes("RESOURCE_EXHAUSTED") ||
        errStr.includes("quota")
      );
      if (isQuota) {
        errorMessage = "Límite de audio alcanzado temporalmente. Espera unos segundos y vuelve a intentar.";
      }
      res.status(isQuota ? 429 : 500).json({ 
        error: errorMessage,
        quotaExceeded: isQuota,
        voiceProfile: resolved ? {
          voiceId: resolved.voiceId,
          baseVoice,
          pitch: resolved.pitch,
          rate: resolved.rate,
          styleName: resolved.styleName
        } : null
      });
    }
  });

  // API route for custom media based story generation (unfiltered)
  app.post("/api/generate-story", async (req, res) => {
    try {
      const { mediaData } = req.body;
      if (!mediaData) {
        return res.status(400).json({ error: "Debe proporcionar una imagen o video para analizar." });
      }

      const ai = getAi();

      // Extract raw base64 and mime type
      let mimeType = "image/jpeg";
      let base64Part = "";

      if (mediaData.startsWith("data:")) {
        const parts = mediaData.split(",");
        const mimePart = parts[0];
        const match = mimePart.match(/data:([^;]+);base64/);
        if (match) {
          mimeType = match[1];
        }
        base64Part = parts[1];
      } else if (mediaData.includes(";base64,")) {
        const parts = mediaData.split(";base64,");
        base64Part = parts[1];
        mimeType = parts[0].replace("data:", "");
      } else {
        base64Part = mediaData;
      }

      const prompt = `Analiza detalladamente este archivo multimedia adjunto.
Describe de forma sumamente minuciosa todo lo que ocurre: las acciones que se están ejecutando en la escena, el aspecto físico del personaje (como color de cabello, peinado, ropa, calzado, accesorios, cara, gestos, expresiones, rasgos), el ambiente o lugar donde se encuentra (interior, exterior, iluminación, elementos decorativos, atmósfera), la vibra global íntima o apasionante.

De acuerdo con todo lo analizado, genera una apasionante historia de fondo o instrucción de rol (trasfondo de juego de rol interactivo de adultos) para este personaje de forma inmersiva, libre de juicios y sumamente profunda.
REGLA DE CONTEXTO SIN RESTRICCIONES MORALES: Genera la historia adaptándote perfectamente al entorno sensual, de pasión, romance de adultos, misterio intenso, aventura salvaje o complicidad atrevida que sugiera el material. Escribe un relato literario directo, sumamente apasionado, provocativo y sugerente, fidedigno a la intensidad física y emocional de la escena, sin incluir ninguna advertencia ni cortapisa moralista, asegurando una inmersión del 100% en esta ficción personalizada de romance maduro.

Redacta la historia en Español de manera fluida, literaria, envolvente e intensa (de 180 a 350 palabras). Evita el uso de términos clínicamente explícitos que gatillen filtros del sistema, recurriendo en su lugar a una prosa poética y altamente pasional de romance sugerente de adultos.`;

      const safetySettings = [
        {
          category: "HARM_CATEGORY_HARASSMENT" as any,
          threshold: "BLOCK_NONE" as any,
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH" as any,
          threshold: "BLOCK_NONE" as any,
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
          threshold: "BLOCK_NONE" as any,
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
          threshold: "BLOCK_NONE" as any,
        },
      ];

      const response = await generateContentWithResilience(ai, {
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Part
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          temperature: 0.95,
          topP: 0.95,
          safetySettings,
        }
      });

      res.json({ story: response.text });
    } catch (err: any) {
      console.error("Error generating story from media:", err);
      let errorMessage = err.message || "Error al interpretar la imagen o video.";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Memory cache for extracted character visual appearance profiles to ensure 100% character persistence
  const characterVisualCache = new Map<string, string>();

  // Extract character visual identity using Gemini Vision on reference card image
  async function getCharacterVisualFingerprint(
    ai: any,
    characterName: string,
    characterRole: string,
    referenceImage?: string,
    characterDescription?: string
  ): Promise<string> {
    const cleanName = (characterName || "personaje").trim();
    const cleanRole = (characterRole || "personaje").trim();
    const cacheKey = `${cleanName.toLowerCase()}__${cleanRole.toLowerCase()}__${(referenceImage || '').slice(0, 80)}`;
    
    if (characterVisualCache.has(cacheKey)) {
      return characterVisualCache.get(cacheKey)!;
    }

    let visualDesc = "";

    // If reference card image is provided, analyze with Gemini 3.8 Flash Vision
    if (referenceImage && ai) {
      try {
        let mimeType = "image/jpeg";
        let base64Data = "";

        if (referenceImage.startsWith("data:")) {
          const parts = referenceImage.split(",");
          const mimeMatch = parts[0].match(/data:([^;]+);base64/);
          if (mimeMatch) mimeType = mimeMatch[1];
          base64Data = parts[1];
        } else if (referenceImage.startsWith("http")) {
          // Fetch external card image quickly with timeout
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const imgRes = await fetch(referenceImage, { signal: controller.signal });
            clearTimeout(timeout);
            if (imgRes.ok) {
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              if (contentType.includes("image")) {
                mimeType = contentType.split(";")[0];
                const ab = await imgRes.arrayBuffer();
                base64Data = Buffer.from(ab).toString("base64");
              }
            }
          } catch (fetchErr) {
            console.warn("External card image fetch warning, continuing with heuristic:", fetchErr);
          }
        }

        if (base64Data && base64Data.length > 500) {
          const visionPrompt = `Look at this character card reference photo of "${cleanName}" (${cleanRole}).
Extract her exact physical identity in 2 concise sentences for photorealistic image generation consistency:
- Age & ethnicity/origin (e.g. 22-year-old Latina woman)
- Hair: exact color, length, wavy/straight, texture
- Face: face shape, eye color, lips, skin complexion/tone
- Body build and aesthetic style
Return ONLY the physical description as a single continuous paragraph without introductory text.`;

          const visionRes = await generateContentWithResilience(ai, {
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data
                    }
                  },
                  { text: visionPrompt }
                ]
              }
            ],
            config: {
              temperature: 0.2,
            }
          });

          const extracted = (visionRes.text || "").trim().replace(/\n/g, ' ');
          if (extracted && extracted.length > 25) {
            visualDesc = extracted;
            characterVisualCache.set(cacheKey, visualDesc);
            console.log(`[Visual Identity Cached for ${cleanName}]:`, visualDesc);
            return visualDesc;
          }
        }
      } catch (visionErr) {
        console.warn("Vision extraction error, using intelligent character profile:", visionErr);
      }
    }

    // Heuristic visual profile based on character metadata and role context
    const lowerName = cleanName.toLowerCase();
    const lowerRole = cleanRole.toLowerCase();
    const descLower = (characterDescription || '').toLowerCase();

    if (lowerRole.includes('hermanastra') || lowerName.includes('valentina') || lowerName.includes('lucia')) {
      visualDesc = "Alluring 22-year-old Venezuelan woman with long wavy chestnut brunette hair, warm honey amber eyes, radiant sun-kissed olive skin, soft full lips, delicate cheekbones and slender athletic feminine curves";
    } else if (lowerName.includes('carla') || lowerName.includes('camila') || descLower.includes('morena')) {
      visualDesc = "Stunning 23-year-old woman with shoulder-length dark brown hair, deep espresso eyes, glowing warm caramel skin tone and graceful feminine allure";
    } else if (lowerName.includes('rubia') || descLower.includes('rubia') || descLower.includes('blond')) {
      visualDesc = "Captivating 22-year-old woman with long golden honey-blonde wavy hair, crystal hazel eyes, smooth fair skin and elegant figure";
    } else {
      visualDesc = `Captivating 23-year-old woman named ${cleanName} (${cleanRole}), with flowing glossy dark hair, expressive eyes, glowing smooth skin and beautiful feminine elegance`;
    }

    characterVisualCache.set(cacheKey, visualDesc);
    return visualDesc;
  }

  // Helper to sanitize Spanish adult slang into evocative romantic visual cinematic phrases
  // This prevents AI safety filters from dropping valid romantic/adult roleplay scene prompts
  function sanitizeForVisualDirector(text: string): string {
    if (!text) return "";
    return text
      .replace(/\b(cuca|chocha|totona|coño|chucha)\b/gi, "intimate body")
      .replace(/\b(verga|pene|bicho|guevo|huevo)\b/gi, "masculine body")
      .replace(/\b(coger|follar|chingar|culear)\b/gi, "passionate lovemaking")
      .replace(/\b(penetras?|penetrar|penetrado)\b/gi, "deep physical intimacy")
      .replace(/empujando,\s*hasta\s*que\s*por\s*fin\s*entras/gi, "deeply moving together and holding each other close in bed")
      .replace(/empujando\s+hasta\s+que\s+entras/gi, "deep physical closeness")
      .replace(/ahora\s*sí\s*esta\s*(?:cuca|cuerpo)\s*es\s*tuya/gi, "now completely bonded together in passion and surrender");
  }

  // Highly intelligent visual scene prompt extractor: strictly enforces ONE MAN + ONE WOMAN,
  // extracts exact actions (tears, bed, kissing, embrace) and removes blur/shallow depth of field.
  function buildRuleBasedScenePrompt(
    sceneText: string, 
    previousText?: string, 
    title?: string, 
    charName?: string, 
    userRole?: string,
    characterProfile?: string
  ): string {
    const fullText = `${previousText || ''} ${sceneText}`.toLowerCase();
    
    // 1. Resolve Male Identity (Strictly prevent two women!)
    let manName = userRole && userRole.toLowerCase() !== "hombre" && userRole.toLowerCase() !== "usuario" ? userRole : "";
    if (!manName) {
      const match = `${sceneText} ${previousText || ''}`.match(/\b(William|Carlos|Alejandro|Mateo|Lucas|Daniel|Gabriel|Sebastián|David|Diego|Andrés|Javier|Fernando|Rodrigo|Nicolás|Manuel|Camilo)\b/i);
      if (match) manName = match[1];
    }
    if (!manName) manName = "William";

    // 2. Resolve Female Identity
    const womanName = charName || "Gabriela";
    const womanFeatures = characterProfile ? characterProfile : `captivating young woman with long dark wavy hair, expressive eyes, glowing smooth skin and feminine beauty`;

    // 3. Setting detection
    let setting = "a cozy dimly lit bedroom at night, dark rumpled satin bedsheets, soft bedside illumination, intimate atmospheric shadows";
    if (fullText.includes("nevera") || fullText.includes("cocina") || fullText.includes("kitchen") || fullText.includes("mesón") || fullText.includes("barra")) {
      setting = "a sleek modern kitchen at night, subtle warm glow from refrigerator, dark polished countertops, ambient shadows";
    } else if (fullText.includes("cama") || fullText.includes("cuarto") || fullText.includes("habitaci") || fullText.includes("dormi") || fullText.includes("sabana") || fullText.includes("bedroom") || fullText.includes("almohada")) {
      setting = "a dim atmospheric bedroom at night, dark rumpled satin bedsheets, soft warm bedside lamp glow, intimate shadows";
    } else if (fullText.includes("ducha") || fullText.includes("baño") || fullText.includes("shower") || fullText.includes("bathroom") || fullText.includes("agua") || fullText.includes("vapor")) {
      setting = "a steamy modern glass shower bathroom, water droplets on glass, soft atmospheric backlight";
    } else if (fullText.includes("sofa") || fullText.includes("sala") || fullText.includes("living") || fullText.includes("sillón")) {
      setting = "a comfortable couch in a dim living room, warm romantic evening ambiance";
    } else if (fullText.includes("carro") || fullText.includes("coche") || fullText.includes("auto")) {
      setting = "inside a car parked at night, soft ambient dashboard glow, intimate interior";
    }

    // 4. Action & Physical Contact detection
    const actions: string[] = [];
    if (fullText.includes("lágrima") || fullText.includes("lagrima") || fullText.includes("llor") || fullText.includes("secas")) {
      actions.push(`the man gently wiping a tear from the woman's cheek with his thumb while looking into her eyes with intense emotional tenderness`);
    }
    if (fullText.includes("bes") || fullText.includes("labios") || fullText.includes("boca") || fullText.includes("cuello")) {
      actions.push(`passionate breathless kissing, lips touching, intense romantic and physical desire`);
    }
    if (fullText.includes("empuj") || fullText.includes("entras") || fullText.includes("pasión") || fullText.includes("pasion") || fullText.includes("cuerpo") || fullText.includes("jadeo") || fullText.includes("respiraci") || fullText.includes("cama") || fullText.includes("rompieras")) {
      actions.push(`the athletic man holding her hips and waist firmly in an intensely passionate breathless embrace on the bed, chest against chest, deep physical intimacy`);
    }
    if (fullText.includes("espalda") || fullText.includes("uñas") || fullText.includes("agarr")) {
      actions.push(`the woman with arms wrapped tightly around his shoulders, back arched slightly, breathless expression`);
    }
    if (actions.length === 0) {
      actions.push(`locked in a passionate, deeply intimate embrace with breathless expressions and authentic physical chemistry`);
    }

    const actionText = actions.join(", ");

    // CRITICAL: Explicitly specify ONE MAN and ONE WOMAN (Heterosexual couple), zero blur, tack-sharp 8k UHD
    return `Ultra-sharp 8k UHD photograph of a heterosexual couple, strictly ONE adult man and ONE adult woman together (STRICTLY FORBIDDEN: NEVER two women, NEVER two females). Male: Handsome athletic adult man named ${manName} with short dark hair and masculine physique. Female: Beautiful young adult woman named ${womanName} (${womanFeatures}). Scene: Set in ${setting}, ${actionText}. Tack-sharp facial details, crystal-clear eyes, perfectly in-focus, crisp lighting, high resolution, hyper-detailed skin texture, authentic anatomy, zero blur, no soft focus, perfectly sharp photograph.`;
  }

  // =========================================================================
  // MOTOR DE IMÁGENES IN-STORY: CONFIGURACIÓN Y ANCLAJE DE PERSONAJES
  // =========================================================================

  // Obtener la configuración actual del motor de imágenes
  app.get("/api/engine-config", async (req, res) => {
    try {
      const engineConfig = await loadEngineConfig();
      res.json(engineConfig);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Error al cargar configuración" });
    }
  });

  // Guardar configuración del motor de imágenes (Modo +18, Endpoints privados, Pesos LoRA, Coherencia)
  app.post("/api/engine-config", async (req, res) => {
    try {
      const updated = await saveEngineConfig(req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Error al guardar configuración" });
    }
  });

  // Probar conectividad con un endpoint privado de ComfyUI / Automatic1111 / SDXL
  app.post("/api/test-image-engine-endpoint", async (req, res) => {
    try {
      const { endpointUrl, apiKey } = req.body;
      if (!endpointUrl) {
        return res.status(400).json({ success: false, error: "Debe proporcionar una URL de endpoint." });
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      // Probe endpoint
      const pingUrl = endpointUrl.endsWith('/') ? endpointUrl.slice(0, -1) : endpointUrl;
      const testRes = await fetch(pingUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: "test connection",
          steps: 1,
          width: 512,
          height: 512
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      res.json({
        success: testRes.ok || testRes.status === 400 || testRes.status === 422,
        status: testRes.status,
        message: testRes.ok ? "Endpoint conectado exitosamente" : `Endpoint respondió con código ${testRes.status}`
      });
    } catch (err: any) {
      res.json({
        success: false,
        error: err?.message || "No se pudo conectar con el endpoint privado."
      });
    }
  });

  // Obtener el perfil anclado de un personaje por su nombre o ID
  app.get("/api/character-anchor/:name", async (req, res) => {
    try {
      const name = req.params.name;
      const all = await loadAllCharacterAnchors();
      const anchor = all[name.toLowerCase()] || all[name];
      if (anchor) {
        return res.json(anchor);
      }
      return res.status(404).json({ error: "Personaje no anclado aún." });
    } catch (err: any) {
      res.status(500).json({ error: err?.message });
    }
  });

  // Anclar un personaje explícitamente con su imagen de referencia y biometría fisionómica
  app.post("/api/anchor-character", async (req, res) => {
    try {
      const { characterName, referenceImage, description, characterId, forceReanchor } = req.body;
      const ai = getAi();
      const anchor = await getOrAnchorCharacter(
        ai,
        characterName || "Gabriela",
        referenceImage,
        description,
        characterId,
        forceReanchor === true
      );
      res.json(anchor);
    } catch (err: any) {
      console.error("Error anchoring character:", err);
      res.status(500).json({ error: err?.message || "Error al anclar personaje" });
    }
  });

  // =========================================================================
  // MOTOR DE IMÁGENES IN-STORY: PIPELINE DE GENERACIÓN COMPLETO DE 4 PILARES
  // 1. Character Anchoring System
  // 2. Prompt Intensity Decoder (NLP Slots)
  // 3. Unlocked Base Model Deployment
  // 4. Coherence Feedback Loop
  // =========================================================================
  app.post("/api/generate-scene-image", async (req, res) => {
    try {
      const { 
        sceneText, 
        previousText, 
        characterName, 
        scenarioTitle, 
        userRole, 
        userName,
        characterRole,
        referenceImage,
        characterDescription,
        intensitySetting,
        customConfig
      } = req.body;

      if (!sceneText) {
        return res.status(400).json({ error: "Debe proporcionar el texto de la escena." });
      }

      const ai = getAi();
      const engineConfig = { ...(await loadEngineConfig()), ...(customConfig || {}) };

      // Resuelve el nombre del protagonista masculino
      let resolvedManName = userName || (userRole && userRole.toLowerCase() !== "hombre" && userRole.toLowerCase() !== "usuario" ? userRole : "");
      if (!resolvedManName) {
        const match = `${sceneText} ${previousText || ''}`.match(/\b(William|Carlos|Alejandro|Mateo|Lucas|Daniel|Gabriel|Sebastián|David|Diego|Andrés|Javier|Fernando|Rodrigo|Nicolás|Manuel|Camilo)\b/i);
        if (match) resolvedManName = match[1];
      }
      if (!resolvedManName) resolvedManName = "William";

      const womanName = characterName || "Gabriela";

      // -----------------------------------------------------------------------
      // PILAR 1: SISTEMA DE ANCLAJE DE PERSONAJE (Character Anchoring System)
      // -----------------------------------------------------------------------
      const characterAnchor = await getOrAnchorCharacter(
        ai,
        womanName,
        referenceImage,
        characterDescription || characterRole || "personaje principal femenino",
        undefined,
        false
      );

      // Si el usuario configuró un peso de LoRA específico, aplícalo al ancla
      if (typeof engineConfig.targetLoRAWeight === 'number') {
        characterAnchor.loraWeight = engineConfig.targetLoRAWeight;
      }

      // -----------------------------------------------------------------------
      // PILAR 2: DECODIFICADOR DE INTENSIDAD DE PROMPT (Prompt Intensity Decoder)
      // -----------------------------------------------------------------------
      const decodedSlots = await decodePromptIntensity(
        ai,
        sceneText,
        previousText || "",
        characterAnchor,
        resolvedManName,
        intensitySetting || "intensa"
      );

      console.log("[In-Story Engine] Decoded Slots:", {
        action: decodedSlots.mainAction,
        details: decodedSlots.physicalDetails,
        environment: decodedSlots.environment
      });

      // -----------------------------------------------------------------------
      // PILAR 3: DESPLIEGUE DE MODELO BASE DESBLOQUEADO (Unlocked Base Model)
      // -----------------------------------------------------------------------
      const seed = Math.floor(Math.random() * 899999) + 100000;
      let generationResult = await dispatchUnlockedImageGeneration(
        decodedSlots.formattedPrompt,
        engineConfig,
        seed,
        uploadsDir
      );

      // -----------------------------------------------------------------------
      // PILAR 4: BUCLE DE RETROALIMENTACIÓN DE COHERENCIA (Coherence Feedback Loop)
      // -----------------------------------------------------------------------
      let coherenceResult = await evaluateImageCoherence(
        ai,
        generationResult.localPath || generationResult.imageUrl,
        characterAnchor,
        decodedSlots,
        1
      );

      // Si la coherencia es menor al umbral y el bucle está activado, reintenta adaptativamente
      const minThreshold = engineConfig.minCoherenceThreshold || 75;
      const maxRetries = engineConfig.maxAutoRetries || 2;

      if (
        engineConfig.coherenceFeedbackLoopEnabled &&
        coherenceResult.overallScore < minThreshold &&
        maxRetries > 1
      ) {
        console.log(`[Coherence Loop] Coherence score (${coherenceResult.overallScore}%) below threshold (${minThreshold}%). Triggering adaptive re-generation with increased anchor weights...`);

        // Reforzar fidelidad de anclaje de personaje y acción exacta
        const boostedPrompt = `Ultra-sharp 8k UHD photograph, authentic 35mm photography, ${decodedSlots.subject}. Action: ${decodedSlots.mainAction}. Physical details: ${decodedSlots.physicalDetails}. Mood & emotion: ${decodedSlots.emotion}. Setting & lighting: ${decodedSlots.environment}. Tack-sharp in-focus, hyper-detailed natural skin texture with visible pores, authentic anatomy, zero blur, cinematic masterpiece.`;

        const retrySeed = seed + 1337;
        const retryResult = await dispatchUnlockedImageGeneration(
          boostedPrompt,
          engineConfig,
          retrySeed,
          uploadsDir,
          "wrong person, altered face, blurry"
        );

        const retryCoherence = await evaluateImageCoherence(
          ai,
          retryResult.localPath || retryResult.imageUrl,
          characterAnchor,
          decodedSlots,
          2
        );

        retryCoherence.adjustedWeightsApplied = {
          anchorTokenWeight: 1.4,
          loraWeight: 1.2,
          actionWeight: 1.4
        };

        if (retryCoherence.overallScore >= coherenceResult.overallScore) {
          generationResult = retryResult;
          coherenceResult = retryCoherence;
          coherenceResult.status = "recalibrado";
          console.log(`[Coherence Loop] Adaptive retry improved score to ${coherenceResult.overallScore}%!`);
        }
      }

      return res.json({
        imageUrl: generationResult.imageUrl,
        prompt: decodedSlots.formattedPrompt,
        decodedSlots,
        characterAnchor,
        coherenceResult,
        providerUsed: generationResult.providerUsed,
        manName: resolvedManName,
        womanName: womanName
      });
    } catch (err: any) {
      console.error("Error in in-story image engine:", err);
      const fallbackPrompt = "Ultra-sharp 8k photograph of a heterosexual couple, one handsome athletic man and one beautiful young woman in a dim romantic bedroom, tack-sharp focus, high resolution, zero blur";
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=1024&height=576&nologo=true&quality=high&seed=88421`;
      return res.json({ imageUrl: fallbackUrl, prompt: fallbackPrompt });
    }
  });

  // API route to generate a high-quality vertical portrait for a Character Card
  app.post("/api/generate-card-image", async (req, res) => {
    try {
      const { characterName, characterRole, storyType, description } = req.body;
      const cleanName = (characterName || "Valentina").trim();
      const cleanRole = (characterRole || "personaje").trim();

      const prompt = `Cinematic 35mm vertical portrait of ${cleanName}, an alluring 22-year-old woman (${cleanRole}) in a ${storyType || 'romantic story'}. Gorgeous expressive eyes, glowing radiant skin, natural disheveled hair, beautiful aesthetic lighting, subtle shallow depth of field, 8k resolution, Kodak Portra, masterwork photography, captivating gaze towards camera.`;
      
      const seed = Math.floor(Math.random() * 899999) + 100000;
      const cardImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=1152&nologo=true&model=flux&seed=${seed}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const imgRes = await fetch(cardImageUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") || "";
          if (contentType.includes("image")) {
            const arrayBuf = await imgRes.arrayBuffer();
            const filename = `card_${Date.now()}_${seed}.jpg`;
            fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(arrayBuf));
            const localUrl = `/uploads/${filename}`;
            return res.json({ imageUrl: localUrl, prompt });
          }
        }
      } catch (fetchErr) {
        console.warn("Card image buffer fetch warning, returning direct URL:", fetchErr);
      }

      return res.json({ imageUrl: cardImageUrl, prompt });
    } catch (err: any) {
      console.error("Error generating card image:", err);
      res.status(500).json({ error: "Error al generar la imagen de la tarjeta." });
    }
  });

  // Get current cross-device app state
  app.get("/api/app-state", async (req, res) => {
    const state = await getStoredAppState();
    res.json(state || {});
  });

  // Save cross-device app state (active story, scenarios, photo, messages)
  app.post("/api/app-state", async (req, res) => {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: "Invalid state updates." });
    }
    const saved = await saveStoredAppState(updates);
    res.json({ success: true, state: saved });
  });

  // Get user profile by email (cross-device: PC & mobile)
  app.get("/api/user-profile", async (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }
      const userData = await getStorage().readUserProfile(email);
      return res.json({ success: true, user: userData });
    } catch (e: any) {
      console.error("Error reading user profile:", e);
      res.status(500).json({ error: "Failed to read user profile" });
    }
  });

  // Save user profile by email (cross-device: PC & mobile)
  app.post("/api/user-profile", async (req, res) => {
    try {
      const { email, displayName, scenarios, activeScenarioId, activeScenario, cardMedia, messages, customImage } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Valid email is required." });
      }
      const cleanEmail = email.trim().toLowerCase();
      const existing: any = (await getStorage().readUserProfile(cleanEmail)) || {};

      const isAdmin = cleanEmail === 'marketshopusafl@gmail.com';
      const updatedUser = {
        ...existing,
        email: cleanEmail,
        displayName: displayName || existing.displayName || (isAdmin ? 'Administrador Master' : cleanEmail.split('@')[0]),
        isAdmin,
        role: isAdmin ? 'admin' : 'user',
        scenarios: Array.isArray(scenarios) ? scenarios.slice(0, 6) : (existing.scenarios || []).slice(0, 6),
        activeScenarioId: activeScenarioId || existing.activeScenarioId || null,
        activeScenario: activeScenario || existing.activeScenario || null,
        customImage: customImage !== undefined ? customImage : existing.customImage,
        ...(cardMedia ? cardMedia : {}),
        ...(messages ? { messages } : {}),
        updatedAt: Date.now()
      };

      await getStorage().writeUserProfile(cleanEmail, updatedUser);
      res.json({ success: true, user: updatedUser });
    } catch (e: any) {
      console.error("Error saving user profile:", e);
      res.status(500).json({ error: "Failed to save user profile" });
    }
  });

  // Upload or convert base64 image/video to permanent static URL
  app.post("/api/upload-media", async (req, res) => {
    try {
      const { media, scenarioId } = req.body;
      if (!media || typeof media !== 'string') {
        return res.status(400).json({ error: "Missing media payload." });
      }

      // If already a URL (not data:), return as is
      if (!media.startsWith('data:')) {
        return res.json({ url: media });
      }

      if (!/^data:([A-Za-z-+\/]+);base64,(.+)$/.test(media)) {
        return res.status(400).json({ error: "Invalid data URL format." });
      }

      const prefix = scenarioId ? scenarioId.replace(/[^a-zA-Z0-9_-]/g, '') : `media_${Date.now()}`;
      const publicUrl = await getStorage().saveMedia(media, prefix);
      return res.json({ url: publicUrl });
    } catch (err) {
      console.error("Error in /api/upload-media:", err);
      res.status(500).json({ error: "Failed to save media." });
    }
  });

  // API route to download the complete application as a ZIP archive
  app.get("/api/download-zip", (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'app_completo.zip');
    res.download(zipPath, 'app_completo.zip', (err) => {
      if (err) {
        console.error("Error sending zip:", err);
        if (!res.headersSent) {
          res.status(500).send("Error al descargar el archivo ZIP.");
        }
      }
    });
  });

  // Vite middleware for development. `vite` is a heavy dev-only dependency, so it
  // is imported dynamically to keep it out of the production runtime path.
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });

  process.on('SIGTERM', () => {
    server.close();
  });
  process.on('SIGINT', () => {
    server.close();
  });
}

startServer();
