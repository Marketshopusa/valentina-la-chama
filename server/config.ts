import path from "path";

/**
 * Centralized runtime configuration derived from environment variables.
 * Import this instead of reading `process.env` directly across the server.
 */
export type StorageProviderName = "local" | "firebase";

function resolveStorageProvider(): StorageProviderName {
  const raw = (process.env.STORAGE_PROVIDER || "local").trim().toLowerCase();
  return raw === "firebase" ? "firebase" : "local";
}

const dataDir = path.resolve(process.env.DATA_DIR || "data");

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || "0.0.0.0",

  geminiApiKey: process.env.GEMINI_API_KEY || "",
  kreaApiKey: process.env.KREA_API_KEY || "",
  appUrl: process.env.APP_URL || "",

  storageProvider: resolveStorageProvider(),

  paths: {
    dataDir,
    usersDir: path.join(dataDir, "users"),
    appStateFile: path.join(dataDir, "app_state.json"),
    engineConfigFile: path.join(dataDir, "engine_config.json"),
    characterAnchorsFile: path.join(dataDir, "character_anchors.json"),
    publicDir: path.resolve("public"),
    uploadsDir: path.resolve("public", "uploads"),
    rootUploadsDir: path.resolve("uploads"),
    distDir: path.resolve("dist"),
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    databaseId: process.env.FIRESTORE_DATABASE_ID || "",
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "",
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  },
} as const;

export type AppConfig = typeof config;
