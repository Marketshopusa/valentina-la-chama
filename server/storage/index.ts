import { config } from "../config.ts";
import { StorageProvider } from "./types.ts";
import { LocalFileStorage } from "./localFileStorage.ts";

let instance: StorageProvider | null = null;

/**
 * Initialize and return the configured storage provider (idempotent).
 * Must be awaited during server startup before any request is served.
 */
export async function initStorage(): Promise<StorageProvider> {
  if (instance) return instance;

  let provider: StorageProvider;
  if (config.storageProvider === "firebase") {
    const { FirebaseStorage } = await import("./firebaseStorage.ts");
    provider = new FirebaseStorage();
  } else {
    provider = new LocalFileStorage();
  }

  await provider.init();
  instance = provider;
  console.log(`[storage] using "${provider.name}" storage provider`);
  return instance;
}

/**
 * Return the initialized storage provider. Falls back to a local provider if
 * called before {@link initStorage} (should not happen in normal startup flow).
 */
export function getStorage(): StorageProvider {
  if (!instance) {
    instance = new LocalFileStorage();
  }
  return instance;
}

export type { StorageProvider } from "./types.ts";
