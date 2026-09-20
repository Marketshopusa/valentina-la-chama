/**
 * Minimal app-state endpoints for Vercel (ephemeral / seed-only).
 * Full persistence remains on Docker / Firebase hosts.
 */
const SEED = {
  activeScenarioId: "presentacion_valentina",
  activeScenario: {
    id: "presentacion_valentina",
    title: "Conoce a tu persona ideal",
    synopsis: "Una charla íntima y cercana para dar forma a la voz, personalidad y encanto del personaje que tú elijas.",
    characterName: "Tu Persona Ideal",
    characterRole: "compañera",
    userRole: "invitado",
    userName: "William",
    storyType: "Presentación",
    isExplicit18: false,
    personaId: "persona_ideal",
    coverImage: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=1500",
    development: "Un personaje cálido, cercano y totalmente adaptable al acento, tono, carácter y nombre que tú le indiques.",
  },
  messages: [],
  scenarios: [],
  timestamp: Date.now(),
};

export default function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({ ...SEED, scenarios: [SEED.activeScenario], timestamp: Date.now() });
    return;
  }
  if (req.method === "POST") {
    // Acknowledge writes without durable disk on serverless
    const body = req.body || {};
    res.status(200).json({ success: true, state: { ...SEED, ...body, messages: body.messages || [], timestamp: Date.now() } });
    return;
  }
  res.status(405).json({ error: "Method not allowed" });
}
