/**
 * User profile stub for Vercel — client also persists to Firestore.
 */
const memory = globalThis.__tpiUserProfiles || (globalThis.__tpiUserProfiles = new Map());

export default function handler(req, res) {
  if (req.method === "GET") {
    const email = String(req.query?.email || "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "email required" });
      return;
    }
    res.status(200).json({ user: memory.get(email) || null });
    return;
  }
  if (req.method === "POST") {
    const body = req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "email required" });
      return;
    }
    const prev = memory.get(email) || {};
    const next = { ...prev, ...body, email, updatedAt: Date.now() };
    memory.set(email, next);
    res.status(200).json({ success: true, user: next });
    return;
  }
  res.status(405).json({ error: "Method not allowed" });
}
