/**
 * Storage abstraction for all server-side persistence.
 *
 * Implementations provide raw read/write primitives for the app's persistent
 * data plus media persistence. Higher-level normalization/merge logic lives in
 * the callers (e.g. app-state merge in the state service), so a new backend only
 * has to implement plain get/put semantics.
 */
export interface StorageProvider {
  /** Human-readable backend name, e.g. "local" or "firebase". */
  readonly name: string;

  /** Prepare the backend (create directories, open connections, etc.). */
  init(): Promise<void>;

  /** Cross-device shared application state. Returns raw stored object or null. */
  readAppState(): Promise<Record<string, any> | null>;
  writeAppState(state: Record<string, any>): Promise<void>;

  /** Per-email user profile. `email` is the raw email; implementations sanitize as needed. */
  readUserProfile(email: string): Promise<Record<string, any> | null>;
  writeUserProfile(email: string, profile: Record<string, any>): Promise<void>;

  /** Image-engine configuration (raw stored object or null; caller merges defaults). */
  readEngineConfig(): Promise<Record<string, any> | null>;
  writeEngineConfig(config: Record<string, any>): Promise<void>;

  /** Character visual anchors, keyed by lowercase name and by id. */
  readCharacterAnchors(): Promise<Record<string, any>>;
  writeCharacterAnchors(anchors: Record<string, any>): Promise<void>;

  /**
   * Persist a base64 `data:` URL as a hosted asset and return its public URL.
   * If `value` is not a `data:` URL it is returned unchanged.
   * @param prefix base filename/key hint (sanitized by the implementation)
   */
  saveMedia(value: string, prefix?: string): Promise<string>;
}

/** Map a mime type to a file extension used for stored media. */
export function extensionForMime(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  return "jpg";
}

/** Parse a `data:<mime>;base64,<data>` URL into its parts, or null if not one. */
export function parseDataUrl(value: string): { mimeType: string; base64: string } | null {
  if (typeof value !== "string" || !value.startsWith("data:")) return null;
  const matches = value.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  return { mimeType: matches[1], base64: matches[2] };
}
