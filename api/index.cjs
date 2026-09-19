/**
 * Vercel serverless entry for all `/api/*` routes.
 * Reuses the same Express app as the Docker/Node server so Gemini chat, TTS,
 * and state endpoints work when the frontend is hosted on Vercel.
 */
const path = require("path");

let appPromise = null;

function loadApp() {
  if (!appPromise) {
    // dist/server.cjs is produced by `npm run build` (esbuild of server.ts).
    // Vercel sets VERCEL=1 so the bundle does not call listen().
    const serverModule = require(path.join(__dirname, "..", "dist", "server.cjs"));
    const createApp = serverModule.createApp || serverModule.exports?.createApp;
    if (typeof createApp !== "function") {
      throw new Error("createApp export missing from dist/server.cjs — run npm run build");
    }
    appPromise = createApp({ serveSpa: false });
  }
  return appPromise;
}

module.exports = async function handler(req, res) {
  const app = await loadApp();
  return app(req, res);
};
