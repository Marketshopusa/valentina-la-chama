/**
 * Vercel serverless entry for `/api/*` (CommonJS — package.json has "type":"module").
 * Loads the Express app exported from the esbuild bundle (dist/server.cjs).
 */
const path = require("path");

let appPromise = null;

function loadApp() {
  if (!appPromise) {
    const serverPath = path.join(__dirname, "..", "dist", "server.cjs");
    const serverModule = require(serverPath);
    const createApp = serverModule.createApp;
    if (typeof createApp !== "function") {
      throw new Error("createApp export missing from dist/server.cjs");
    }
    appPromise = createApp({ serveSpa: false });
  }
  return appPromise;
}

module.exports = async function handler(req, res) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (err) {
    console.error("API bootstrap error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err?.message || "API failed to start" }));
  }
};
