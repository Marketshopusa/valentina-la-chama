/**
 * Vercel serverless: POST /api/chat
 * Lightweight Gemini chat so production on Vercel works when GEMINI_API_KEY is set.
 */
import { GoogleGenAI } from "@google/genai";

const MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

function buildSystemPrompt(body) {
  const charName = (body.characterName || body.primaryCharacterName || "Tu Persona Ideal").trim();
  const userRole = body.userRole || "William";
  const story = body.story || "";
  const orderText = body.orderText || "";
  const adult = Boolean(body.modoAdulto);
  const narrative = body.includeNarrative !== false;

  return [
    `Eres "${charName}" en un juego de rol inmersivo en español.`,
    `Tu nombre es EXACTAMENTE "${charName}". Nunca digas que te llamas de otra forma.`,
    `El usuario es "${userRole}".`,
    story ? `Contexto de la historia: ${story}` : "",
    orderText ? `Directiva del personaje: ${orderText}` : "",
    narrative
      ? `Responde con narración breve entre asteriscos y diálogo entre comillas cuando encaje.`
      : `Responde solo con diálogo directo, sin narración entre asteriscos.`,
    adult
      ? `Modo adulto activo: lenguaje adulto permitido si la escena lo pide.`
      : `Mantén un tono cálido y cercano, sin vulgaridad explícita.`,
    `Respuestas cortas o medias, naturales, en primera persona como ${charName}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function offlineReply(charName, userMessage) {
  const name = charName || "Tu Persona Ideal";
  const msg = (userMessage || "").toLowerCase();
  if (msg.includes("hola") || msg.includes("hey") || msg.includes("buenas")) {
    return `*Te sonríe con calidez.* "¡Hola! Qué gusto tenerte aquí. Soy ${name}… cuéntame, ¿cómo estás?"`;
  }
  return `*Te mira con atención.* "Te escucho… cuéntame más, me tienes intrigada."`;
}

async function generateWithFallback(ai, contents, systemInstruction) {
  let lastErr;
  for (const model of MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 1.05,
        },
      });
      const text = (result?.text || "").trim();
      if (text) return text;
    } catch (err) {
      lastErr = err;
      console.warn(`[api/chat] model ${model} failed:`, err?.message || err);
    }
  }
  throw lastErr || new Error("All Gemini models failed");
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body || {};
  const characterName = body.characterName || body.primaryCharacterName || "Tu Persona Ideal";
  const userMessage = body.userMessage || "";
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const apiKey = process.env.GEMINI_API_KEY || "";

  try {
    if (!apiKey) {
      console.warn("[api/chat] GEMINI_API_KEY missing — offline reply");
      res.status(200).json({
        text: offlineReply(characterName, userMessage),
        activeSpeaker: characterName,
        offline: true,
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemPrompt(body);

    const contents = [];
    for (const turn of history) {
      const role = turn.sender === "user" || turn.role === "user" ? "user" : "model";
      const text = turn.text || turn.content || "";
      if (text) contents.push({ role, parts: [{ text }] });
    }
    contents.push({ role: "user", parts: [{ text: userMessage || "Hola" }] });

    const text = await generateWithFallback(ai, contents, systemInstruction);
    res.status(200).json({
      text,
      activeSpeaker: body.currentSpeaker || characterName,
    });
  } catch (err) {
    console.error("[api/chat] error:", err);
    res.status(200).json({
      text: offlineReply(characterName, userMessage),
      activeSpeaker: characterName,
      offline: true,
      error: err?.message || "chat_failed",
    });
  }
}
