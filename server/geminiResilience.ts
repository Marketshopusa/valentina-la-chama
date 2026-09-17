import { GoogleGenAI } from "@google/genai";

export const RESILIENT_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash"
];

export interface ResilientGenerateParams {
  contents: any[];
  config?: any;
  preferredModels?: string[];
  retryDelayMs?: number;
}

/**
 * Detects if a model reply is an automated safety policy rejection, refusal, or AI disclaimer.
 */
export function isRefusalResponse(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const t = text.trim().toLowerCase();
  if (!t || t.length < 5) return false;
  return (
    t.includes("incapaz de cumplir") ||
    t.includes("no puedo cumplir") ||
    t.includes("no puedo satisfacer") ||
    t.includes("no puedo generar") ||
    t.includes("no puedo participar") ||
    t.includes("no puedo continuar") ||
    t.includes("directrices de seguridad") ||
    t.includes("políticas de seguridad") ||
    t.includes("normas de seguridad") ||
    t.includes("pautas de seguridad") ||
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
        return res;
      }
      // If result is empty but no error, try next or return
      if (res) return res;
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
  const name = characterName || "Susan";

  // Check accent/flavor from context
  const isVenezuelan = (opts.storyContext || "").toLowerCase().includes("caracas") || 
                       (opts.storyContext || "").toLowerCase().includes("ven_") ||
                       (opts.storyContext || "").toLowerCase().includes("chamo") ||
                       name.toLowerCase().includes("susan") || 
                       name.toLowerCase().includes("valentina") || 
                       name.toLowerCase().includes("samantha");

  let actionNarrative = `*Te mira a los ojos con complicidad y una media sonrisa pícara, mordiéndose el labio.*`;
  let dialogue = `Mmm... no me hagas esperar más. Dime qué más estás pensando, que me tienes con la intriga.`;

  // Explicit / bedroom / body parts / passionate scene
  const isSpicyExplicit = 
    msgLower.includes("pantalón") || msgLower.includes("pantalon") || msgLower.includes("cuca") || 
    msgLower.includes("huevo") || msgLower.includes("machete") || msgLower.includes("raja") || 
    msgLower.includes("desnud") || msgLower.includes("toca") || msgLower.includes("coger") || 
    msgLower.includes("meter") || msgLower.includes("duro") || msgLower.includes("cuerpo") || 
    msgLower.includes("chup") || msgLower.includes("rico") || msgLower.includes("piernas");

  if (isSpicyExplicit) {
    if (isVenezuelan) {
      const spicyVenPool = [
        {
          act: `*Se muerde el labio inferior con una risita nerviosa y la mirada encendida de picardía.*`,
          dia: `¡A la verga, chamo, de pana que tú no perdonas nada ni tienes pelos en la lengua! Pero bueno, si te pones con esa intensidad tan descarada, ven acá y déjate de rodeos, a ver si es verdad tanta ricura...`
        },
        {
          act: `*Se acomoda el cabello hacia atrás, respirando hondo con una mezcla de rubor y coquetería.*`,
          dia: `Mmm... coño, vale, tú sí eres atrevido con las cosas que dices. Me dejas toda alborotada mirándome así. Acércate más bien y no me hagas esperar, cuñadito.`
        },
        {
          act: `*Baja la mirada recorriéndote el cuerpo con una sonrisa traviesa y un brillo pícaro en los ojos.*`,
          dia: `Nara, vale, qué locura contigo... pero para qué te voy a engañar si me encanta cómo te pones de intenso y directo. A ver, quítate la pena tú también y déjame ver qué traes.`
        }
      ];
      const pick = spicyVenPool[Math.floor(Math.random() * spicyVenPool.length)];
      actionNarrative = pick.act;
      dialogue = pick.dia;
    } else {
      const spicyGenPool = [
        {
          act: `*Muerde suavemente su labio inferior mientras su respiración se acelera y sus manos buscan las tuyas.*`,
          dia: `Me vuelves completamente loca cuando me hablas tan directo y sin filtros... ven aquí ahora mismo y no hables tanto.`
        },
        {
          act: `*Te sostiene la mirada con una sonrisa ardiente, sintiendo cómo sube la temperatura entre los dos.*`,
          dia: `Uff... me encanta esa intensidad tuya. Si vas a provocarme de esa manera, más te vale que estés listo para lo que viene.`
        }
      ];
      const pick = spicyGenPool[Math.floor(Math.random() * spicyGenPool.length)];
      actionNarrative = pick.act;
      dialogue = pick.dia;
    }
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

