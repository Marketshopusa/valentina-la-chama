/**
 * Vercel serverless: GET/HEAD /api/health
 */
export default function handler(_req, res) {
  res.status(200).json({ status: "ok", runtime: "vercel" });
}
