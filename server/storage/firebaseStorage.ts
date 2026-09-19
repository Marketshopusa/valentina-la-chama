import { StorageProvider } from "./types.ts";

/**
 * Firestore + Firebase Storage backed provider.
 *
 * NOTE: This is a placeholder wired into the storage factory so that
 * STORAGE_PROVIDER=firebase resolves to a concrete class. The full
 * implementation (firebase-admin, Firestore documents, Storage uploads) is
 * added in a later phase; until then selecting this provider fails fast with a
 * clear message instead of silently losing data.
 */
export class FirebaseStorage implements StorageProvider {
  readonly name = "firebase";

  async init(): Promise<void> {
    throw new Error(
      "Firebase storage provider is not implemented yet. Set STORAGE_PROVIDER=local " +
        "or wait for the Firestore adapter phase.",
    );
  }

  async readAppState(): Promise<Record<string, any> | null> {
    throw new Error("FirebaseStorage not implemented");
  }
  async writeAppState(): Promise<void> {
    throw new Error("FirebaseStorage not implemented");
  }
  async readUserProfile(): Promise<Record<string, any> | null> {
    throw new Error("FirebaseStorage not implemented");
  }
  async writeUserProfile(): Promise<void> {
    throw new Error("FirebaseStorage not implemented");
  }
  async readEngineConfig(): Promise<Record<string, any> | null> {
    throw new Error("FirebaseStorage not implemented");
  }
  async writeEngineConfig(): Promise<void> {
    throw new Error("FirebaseStorage not implemented");
  }
  async readCharacterAnchors(): Promise<Record<string, any>> {
    throw new Error("FirebaseStorage not implemented");
  }
  async writeCharacterAnchors(): Promise<void> {
    throw new Error("FirebaseStorage not implemented");
  }
  async saveMedia(value: string): Promise<string> {
    throw new Error("FirebaseStorage not implemented");
  }
}
