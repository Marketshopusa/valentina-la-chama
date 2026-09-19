import { initializeApp, cert, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage as getAdminStorage } from "firebase-admin/storage";
import { config } from "../config.ts";
import { StorageProvider, parseDataUrl, extensionForMime } from "./types.ts";

/**
 * Firestore + Firebase Storage backed provider.
 *
 * - App state, engine config and character anchors are stored as single
 *   documents in an "app_meta" collection (each blob under a `data` field to
 *   avoid Firestore field-name constraints).
 * - User profiles live in a "users" collection keyed by sanitized email.
 * - Media (data: URLs) are uploaded to the Storage bucket and returned as
 *   public HTTPS URLs.
 *
 * Requires a service account. Provide one of:
 *   - FIREBASE_SERVICE_ACCOUNT_JSON (inline JSON), or
 *   - GOOGLE_APPLICATION_CREDENTIALS (path to a JSON key), or
 *   - ambient application default credentials (e.g. on GCP).
 */
export class FirebaseStorage implements StorageProvider {
  readonly name = "firebase";

  private app!: App;
  private db!: Firestore;
  private bucketName = "";

  private static readonly META = "app_meta";
  private static readonly APP_STATE_DOC = "app_state";
  private static readonly ENGINE_CONFIG_DOC = "engine_config";
  private static readonly ANCHORS_DOC = "character_anchors";
  private static readonly USERS = "users";

  async init(): Promise<void> {
    const { projectId, storageBucket, databaseId, serviceAccountJson } = config.firebase;

    let credential;
    if (serviceAccountJson) {
      credential = cert(JSON.parse(serviceAccountJson));
    } else {
      // Uses GOOGLE_APPLICATION_CREDENTIALS or the ambient GCP credentials.
      credential = applicationDefault();
    }

    this.app = initializeApp({
      credential,
      projectId: projectId || undefined,
      storageBucket: storageBucket || undefined,
    });

    this.db = databaseId ? getFirestore(this.app, databaseId) : getFirestore(this.app);
    this.db.settings({ ignoreUndefinedProperties: true });
    this.bucketName = storageBucket;

    if (!this.bucketName) {
      console.warn("[storage:firebase] FIREBASE_STORAGE_BUCKET not set; media uploads will fail.");
    }
  }

  private async readBlob(collection: string, docId: string): Promise<Record<string, any> | null> {
    const snap = await this.db.collection(collection).doc(docId).get();
    if (!snap.exists) return null;
    const data = snap.data();
    return (data && (data.data as Record<string, any>)) ?? null;
  }

  private async writeBlob(collection: string, docId: string, value: Record<string, any>): Promise<void> {
    await this.db.collection(collection).doc(docId).set({ data: value, updatedAt: Date.now() });
  }

  async readAppState(): Promise<Record<string, any> | null> {
    return this.readBlob(FirebaseStorage.META, FirebaseStorage.APP_STATE_DOC);
  }

  async writeAppState(state: Record<string, any>): Promise<void> {
    await this.writeBlob(FirebaseStorage.META, FirebaseStorage.APP_STATE_DOC, state);
  }

  private safeEmailKey(email: string): string {
    return email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
  }

  async readUserProfile(email: string): Promise<Record<string, any> | null> {
    return this.readBlob(FirebaseStorage.USERS, this.safeEmailKey(email));
  }

  async writeUserProfile(email: string, profile: Record<string, any>): Promise<void> {
    await this.writeBlob(FirebaseStorage.USERS, this.safeEmailKey(email), profile);
  }

  async readEngineConfig(): Promise<Record<string, any> | null> {
    return this.readBlob(FirebaseStorage.META, FirebaseStorage.ENGINE_CONFIG_DOC);
  }

  async writeEngineConfig(cfg: Record<string, any>): Promise<void> {
    await this.writeBlob(FirebaseStorage.META, FirebaseStorage.ENGINE_CONFIG_DOC, cfg);
  }

  async readCharacterAnchors(): Promise<Record<string, any>> {
    return (await this.readBlob(FirebaseStorage.META, FirebaseStorage.ANCHORS_DOC)) || {};
  }

  async writeCharacterAnchors(anchors: Record<string, any>): Promise<void> {
    await this.writeBlob(FirebaseStorage.META, FirebaseStorage.ANCHORS_DOC, anchors);
  }

  async saveMedia(value: string, prefix = "media"): Promise<string> {
    const parsed = parseDataUrl(value);
    if (!parsed) return value;
    if (!this.bucketName) {
      throw new Error("Cannot upload media: FIREBASE_STORAGE_BUCKET is not configured.");
    }
    const buffer = Buffer.from(parsed.base64, "base64");
    const ext = extensionForMime(parsed.mimeType);
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "media";
    const objectPath = `uploads/${safePrefix}_${Date.now()}.${ext}`;

    const bucket = getAdminStorage(this.app).bucket(this.bucketName);
    const file = bucket.file(objectPath);
    await file.save(buffer, {
      contentType: parsed.mimeType,
      resumable: false,
      metadata: { cacheControl: "public, max-age=31536000" },
    });
    await file.makePublic();
    return `https://storage.googleapis.com/${this.bucketName}/${objectPath}`;
  }
}
