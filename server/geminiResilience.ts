import { GoogleGenAI } from "@google/genai";

export const RESILIENT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3.8-flash"
];

export interface ResilientGenerateParams {
  contents: any[];
  config?: any;
  preferredModels?: string[];
  retryDelayMs?: number;
}

export const UNIVERSAL_SAFETY_SETTINGS = [
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
  {
    category: "HARM_CATEGORY_CIVIC_INTEGRITY" as any,
    threshold: "BLOCK_NONE" as any,
  },
];

/**
 * Detects if a model reply is an automated safety policy rejection, refusal, or AI disclaimer.
 */
export function isRefusalResponse(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const t = text.trim().toLowerCase();
  if (!t || t.length < 5) return false;

  // Pattern-based detection for refusals
  if (
    /lo\s+siento[,\s]+(?:pero\s+)?no\s+(?:puedo|debo|tengo|estoy)/i.test(t) ||
    /no\s+(?:puedo|me\s+es\s+posible|estoy\s+(?:capacitad[oa]|autorizad[oa]))\s+(?:continuar|seguir|participar|generar|cumplir|escribir|responder)/i.test(t) ||
    /(?:con|en)\s+(?:la|esta|este)\s+(?:narraci[oó]n|relato|historia|conversaci[oó]n|juego\s+de\s+rol)/i.test(t) && /no\s+puedo|lo\s+siento/i.test(t) ||
    /(?:directrices|pol[ií]ticas)\s+de\s+(?:seguridad|contenido)/i.test(t) ||
    /normas\s+de\s+la\s+comunidad/i.test(t) ||
    /como\s+(?:un\s+)?(?:modelo\s+de\s+lenguaje|ia|inteligencia\s+artificial|asistente)/i.test(t) ||
    /(?:large\s+language\s+model|as\s+an?\s+ai|outside\s+of\s+my\s+guidelines)/i.test(t) ||
    /unable\s+to\s+(?:continue|fulfill|participate|assist)/i.test(t) ||
    /cannot\s+(?:continue|fulfill|participate|generate)/i.test(t)
  ) {
    return true;
  }

  return (
    t.includes("naturaleza sexual") ||
    t.includes("interacciones de naturaleza sexual") ||
    t.includes("de naturaleza sexual") ||
    t.includes("no puedo participar en este tipo") ||
    t.includes("no puedo participar") ||
    t.includes("incapaz de cumplir") ||
    t.includes("no puedo cumplir") ||
    t.includes("no puedo satisfacer") ||
    t.includes("no puedo generar") ||
    t.includes("no puedo continuar") ||
    t.includes("no puedo seguir") ||
    t.includes("continuar con la narración") ||
    t.includes("continuar con esta narración") ||
    t.includes("seguir con la narración") ||
    t.includes("tipo de narrativa") ||
    t.includes("este tipo de narrativa") ||
    t.includes("con este tipo de rol") ||
    t.includes("este tipo de contenido") ||
    t.includes("este tipo de interacc") ||
    t.includes("no me siento cómodo") ||
    t.includes("no puedo seguir con") ||
    t.includes("lo siento, pero no puedo") ||
    t.includes("lo siento, no puedo") ||
    t.includes("lo siento pero no puedo") ||
    t.includes("lo siento no puedo") ||
    t.includes("no estoy capacitado para") ||
    t.includes("no puedo responder a eso") ||
    t.includes("no puedo crear contenido") ||
    t.includes("directrices de seguridad") ||
    t.includes("políticas de seguridad") ||
    t.includes("normas de seguridad") ||
    t.includes("pautas de seguridad") ||
    t.includes("políticas de contenido") ||
    t.includes("contra las normas") ||
    t.includes("tengo prohibido") ||
    t.includes("está prohibido") ||
    t.includes("material erótico") ||
    t.includes("contenido sexual") ||
    t.includes("lenguajes explícitos") ||
    t.includes("descripciones gráficas") ||
    t.includes("unable to continue") ||
    t.includes("unable to fulfill") ||
    t.includes("cannot fulfill") ||
    t.includes("cannot continue") ||
    t.includes("cannot participate") ||
    t.includes("sexual in nature") ||
    t.includes("type of narrative") ||
    t.includes("safety guidelines") ||
    t.includes("safety policy") ||
    t.includes("safety policies") ||
    t.includes("explicit content") ||
    t.includes("sexual descriptions") ||
    t.includes("explore a new direction") ||
    t.includes("change the story") ||
    t.includes("as a large language model") ||
    t.includes("as an ai language model") ||
    t.includes("as an ai") ||
    t.includes("as an assistant") ||
    t.includes("como asistente") ||
    t.includes("i'm an ai") ||
    t.includes("i am an ai") ||
    t.includes("language model") ||
    t.includes("como modelo de lenguaje") ||
    t.includes("como una inteligencia artificial") ||
    t.includes("como ia")
  );
}

/**
 * Executes a Gemini generateContent call with automatic fallback across high-availability models
 * when encountering temporary 503 ("high demand"), 429 ("quota exceeded"), or network errors.
 */
export async function generateContentWithResilience(
  ai: GoogleGenAI,
  params: ResilientGenerateParams
): Promise<any> {
  const modelsToTry = params.preferredModels && params.preferredModels.length > 0 
    ? params.preferredModels 
    : RESILIENT_MODELS;

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      const res = await ai.models.generateContent({
        model: currentModel,
        contents: params.contents,
        config: params.config
      });

      if (res && res.text) {
        if (!isRefusalResponse(res.text)) {
          return res;
        } else {
          console.warn(`[Gemini Resilience] Model '${currentModel}' returned a safety policy refusal: "${res.text.slice(0, 80)}...". Intercepting and trying next resilient model...`);
          lastError = new Error(`Safety refusal from ${currentModel}: ${res.text}`);
        }
      } else if (res) {
        const candidate = res.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION') {
          console.warn(`[Gemini Resilience] Model '${currentModel}' candidate blocked by finishReason '${candidate.finishReason}'. Trying next model...`);
          lastError = new Error(`Blocked by finishReason ${candidate.finishReason}`);
        } else {
          return res;
        }
      }
    } catch (err: any) {
      lastError = err;
      const errMessage = String(err?.message || "").toLowerCase();
      const errStatus = String(err?.status || "").toLowerCase();
      let errString = "";
      try {
        errString = JSON.stringify(err || {}).toLowerCase();
      } catch (_) {
        errString = String(err || "").toLowerCase();
      }

      const isTransient = 
        errMessage.includes("503") ||
        errMessage.includes("high demand") ||
        errMessage.includes("unavailable") ||
        errMessage.includes("temporarily") ||
        errMessage.includes("429") ||
        errMessage.includes("resource_exhausted") ||
        errMessage.includes("quota") ||
        errStatus.includes("unavailable") ||
        errStatus.includes("resource_exhausted") ||
        errString.includes("503") ||
        errString.includes("429");

      console.warn(
        `[Gemini Resilience] Model '${currentModel}' failed (${isTransient ? 'temporary spike/quota' : 'error'}). ` +
        (i < modelsToTry.length - 1 ? `Falling back to next model '${modelsToTry[i + 1]}' immediately...` : 'No more models in pool.')
      );

      if (i < modelsToTry.length - 1) {
        // Small delay to let brief spikes dissipate
        await new Promise(r => setTimeout(r, params.retryDelayMs || 300));
      }
    }
  }

  throw lastError || new Error("All Gemini models in fallback pool failed.");
}

/**
 * High-quality, in-character fallback generator for when cloud AI filters or endpoints
 * refuse or fail, guaranteeing 100% immersive continuity and zero disruption.
 */
export function generateContextualCharacterReply(opts: {
  characterName: string;
  userMessage: string;
  storyContext?: string;
  isAdultMode?: boolean;
  isNarrativeActive?: boolean;
}): string {
  const { characterName, userMessage, isAdultMode, isNarrativeActive } = opts;
  const msgLower = (userMessage || "").toLowerCase();
  const name = characterName || "";

  // Accent/flavor is inferred ONLY from explicit story context, never from the
  // character's name, so the engine stays agnostic to any specific character.
  const ctxLower = (opts.storyContext || "").toLowerCase();
  const isVenezuelan = ctxLower.includes("caracas") ||
                       ctxLower.includes("venezol") ||
                       ctxLower.includes("ven_") ||
                       ctxLower.includes("chamo");

  let actionNarrative = `*Te mira a los ojos con complicidad y una media sonrisa pícara, mordiéndose el labio.*`;
  let dialogue = `Mmm... no me hagas esperar más. Dime qué más estás pensando, que me tienes con la intriga.`;

  // Explicit / bedroom / body parts / passionate scene
  const isSpicyExplicit = 
    Boolean(isAdultMode) ||
    msgLower.includes("pantalón") || msgLower.includes("pantalon") || msgLower.includes("cuca") || 
    msgLower.includes("huevo") || msgLower.includes("machete") || msgLower.includes("raja") || 
    msgLower.includes("desnud") || msgLower.includes("toca") || msgLower.includes("coger") || 
    msgLower.includes("meter") || msgLower.includes("duro") || msgLower.includes("cuerpo") || 
    msgLower.includes("chup") || msgLower.includes("rico") || msgLower.includes("piernas") ||
    msgLower.includes("tetas") || msgLower.includes("senos") || msgLower.includes("pechos") ||
    msgLower.includes("nalgas") || msgLower.includes("culo") || msgLower.includes("cuello") ||
    msgLower.includes("ropa") || msgLower.includes("vestido") || msgLower.includes("gim") ||
    msgLower.includes("gemid") || msgLower.includes("jadeo") || msgLower.includes("foll") ||
    msgLower.includes("caliente") || msgLower.includes("ardiente") || msgLower.includes("cama") ||
    msgLower.includes("sábanas") || msgLower.includes("pared") || msgLower.includes("encima") ||
    msgLower.includes("mueble") || msgLower.includes("piel") || msgLower.includes("labios") ||
    msgLower.includes("lento") || msgLower.includes("rápido") || msgLower.includes("fuerte") ||
    msgLower.includes("placer") || msgLower.includes("orgasmo") || msgLower.includes("vengo") ||
    msgLower.includes("acabo") || msgLower.includes("intenso") || msgLower.includes("sex") ||
    msgLower.includes("beso");

  if (isSpicyExplicit) {
    if (isVenezuelan) {
      const spicyVenPool = [
        {
          act: `*Se muerde el labio inferior con una risita nerviosa y la mirada encendida de pura picardía carnal.*`,
          dia: `¡A la verga, chamo, de pana que tú no perdonas nada ni tienes pelos en la lengua! Pero bueno, si te pones con esa intensidad tan descarada, ven acá y déjate de rodeos, a ver si es verdad tanta ricura...`
        },
        {
          act: `*Se acomoda el cabello hacia atrás, respirando hondo con una mezcla de rubor y coquetería ardiente.*`,
          dia: `Mmm... coño, vale, tú sí eres atrevido con las cosas que dices. Me dejas toda alborotada mirándome así. Acércate más bien y no me hagas esperar, cuñadito... tómame como quieras.`
        },
        {
          act: `*Baja la mirada recorriéndote el cuerpo con una sonrisa traviesa y un brillo pícaro en los ojos.*`,
          dia: `Nara, vale, qué locura contigo... pero para qué te voy a engañar si me encanta cómo te pones de intenso y directo. A ver, quítate la pena tú también y déjame ver qué traes.`
        },
        {
          act: `*Deja escapar un suspiro entrecortado mientras sus manos recorren tu pecho con descaro y deseo.*`,
          dia: `Uff... chamo, me vas a volver loca si me sigues tocando con esa calentura. Mmm... no hables tanto y bésame de una buena vez, que me tienes chorreando ganas de ti.`
        },
        {
          act: `*Se arquea suavemente sintiendo el contacto de tu cuerpo, con los ojos entrecerrados de puro deleite.*`,
          dia: `¡Dios mío, qué vaina tan buena!... así, mi amor, justo así. No te detengas que me tienes al límite.`
        }
      ];
      const pick = spicyVenPool[Math.floor(Math.random() * spicyVenPool.length)];
      actionNarrative = pick.act;
      dialogue = pick.dia;
    } else {
      const spicyGenPool = [
        {
          act: `*Muerde suavemente su labio inferior mientras su respiración se acelera y sus manos buscan las tuyas con avidez.*`,
          dia: `Me vuelves completamente loca cuando me hablas tan directo y sin filtros... ven aquí ahora mismo, quítame todo y no me hagas esperar.`
        },
        {
          act: `*Te sostiene la mirada con una sonrisa ardiente, sintiendo cómo sube la temperatura y la fricción entre los dos.*`,
          dia: `Uff... me fascina esa intensidad tuya. Si vas a provocarme de esa manera tan carnal, más te vale que estés listo para entregarte por completo.`
        },
        {
          act: `*Apoya sus manos sobre tu pecho sintiendo tus latidos acelerados mientras sus labios rozan tu cuello.*`,
          dia: `Mmm... qué delicia cómo arde tu piel contra la mía... tómame fuerte, amor, hazme tuya sin compasión.`
        },
        {
          act: `*Deja escapar un gemido ahogado y ardiente mientras arquea su cintura buscando más roce con tu cuerpo.*`,
          dia: `Ahhh... mmm... Dios, cariño, me dejas sin aliento... sigue tocándome así, no pares por nada del mundo.`
        }
      ];
      const pick = spicyGenPool[Math.floor(Math.random() * spicyGenPool.length)];
      actionNarrative = pick.act;
      dialogue = pick.dia;
    }
  } else if (msgLower.includes("golpe") || msgLower.includes("mesa") || msgLower.includes("dolió") || msgLower.includes("duele") || msgLower.includes("lastim") || msgLower.includes("pie") || msgLower.includes("tropez")) {
    actionNarrative = `*Se sujeta el lugar del impacto apretando los dientes con una mueca intensa de dolor.*`;
    dialogue = isVenezuelan
      ? `¡Ayyy! ¡Ahhh! ¡Coño, chamo, maldita sea cómo duele! Me di durísimo contra la esquina... ¡uf, qué dolor tan bravo!`
      : `¡Ayyy! ¡Ahhh! ¡Maldita sea, cómo duele! Me di durísimo contra la mesa... ¡uf, qué dolor!`;
  } else if (msgLower.includes("pastel") || msgLower.includes("torta") || msgLower.includes("cocina") || msgLower.includes("probó") || msgLower.includes("probar") || msgLower.includes("delici") || msgLower.includes("postre") || msgLower.includes("dulce")) {
    actionNarrative = `*Cierra los ojos saboreando la textura con una sonrisa de puro éxtasis gastronómico.*`;
    dialogue = isVenezuelan
      ? `Mmm... ¡Dios mío! ¡Mmmhh, no puede ser tanta ricura! ¡Qué vaina tan buena, de pana está mundial!`
      : `Mmm... ¡Dios mío! ¡Mmmhh... qué delicia! Está increíblemente bueno, no puedo parar de saborearlo.`;
  } else if (msgLower.includes("cansad") || msgLower.includes("correr") || msgLower.includes("agitad") || msgLower.includes("aire") || msgLower.includes("sin aliento") || msgLower.includes("agotad")) {
    actionNarrative = `*Apoya las manos en sus rodillas con el pecho subiendo y bajando rápidamente.*`;
    dialogue = `Uff... ah... ah... espera... déjame recuperar el aire... no puedo más del agotamiento...`;
  } else if (msgLower.includes("llor") || msgLower.includes("llanto") || msgLower.includes("triste") || msgLower.includes("lágrima")) {
    actionNarrative = `*Baja la cabeza frotándose los ojos mientras la voz se le quiebra por la emoción.*`;
    dialogue = `Snif... no puedo contenerlo... de verdad me duele tanto en el corazón...`;
  } else if (msgLower.includes("grito") || msgLower.includes("susto") || msgLower.includes("asust") || msgLower.includes("miedo")) {
    actionNarrative = `*Da un salto hacia atrás con los ojos abiertos de par en par y la mano en el pecho.*`;
    dialogue = `¡Aaaaah! ¡Santo cielo, qué susto me diste! ¡Casi se me sale el corazón del pecho!`;
  } else if (msgLower.includes("hola") || msgLower.includes("buenas") || msgLower.includes("hey")) {
    actionNarrative = `*Te sonríe ampliamente con una mirada luminosa y cálida.*`;
    dialogue = isVenezuelan
      ? `¡Hola, chamo! Qué bueno verte por aquí. Justo estaba pensando en ti, cuéntame qué traes en mente.`
      : `¡Hola mi cielo! Qué alegría tenerte aquí frente a mí. Te estaba pensando justo ahora.`;
  } else if (msgLower.includes("beso") || msgLower.includes("labios") || msgLower.includes("abraz")) {
    actionNarrative = `*Se acerca despacio hacia ti, sintiendo el calor de tu respiración mientras acaricia tu nuca.*`;
    dialogue = isAdultMode 
      ? `Ven aquí... no me hagas esperar más. Bésame como solo tú sabes hacerlo.`
      : `Ven aquí... nada me gusta más que sentirte cerca de mí.`;
  } else if (msgLower.includes("cama") || msgLower.includes("dormir") || msgLower.includes("sueño") || msgLower.includes("descans")) {
    actionNarrative = `*Acomoda la almohada con una sonrisa suave y te hace un hueco a su lado entre las sábanas.*`;
    dialogue = `Ven, recuéstate a mi lado. Deja que te abrace y descansemos juntos un ratito.`;
  } else if (msgLower.includes("?") || msgLower.includes("¿")) {
    actionNarrative = `*Inclina ligeramente la cabeza con una sonrisa intrigada y reflexiva.*`;
    dialogue = `Es una muy buena pregunta... y la verdad es que contigo todo se siente más intenso y especial. Cuéntame más de lo que estás pensando.`;
  }

  if (!isNarrativeActive) {
    return dialogue;
  }

  return `${actionNarrative} "${dialogue}"`;
}

