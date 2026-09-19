import fs from "fs";
import path from "path";
import { config } from "../config.ts";
import { StorageProvider, parseDataUrl, extensionForMime } from "./types.ts";

/**
 * Local filesystem storage. Preserves the app's original on-disk behavior:
 * JSON files under the data directory and media under public/uploads (with a
 * redundant copy under the repo-root uploads/). Suitable for any host with a
 * persistent disk (VPS, Docker volume, Cloud Run with a mounted volume).
 */
export class LocalFileStorage implements StorageProvider {
  readonly name = "local";

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async init(): Promise<void> {
    this.ensureDir(config.paths.dataDir);
    this.ensureDir(config.paths.usersDir);
    this.ensureDir(config.paths.uploadsDir);
    this.ensureDir(config.paths.rootUploadsDir);
  }

  private readJsonFile(filePath: string): any | null {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (e) {
      console.warn(`Failed reading ${path.basename(filePath)}:`, e);
    }
    return null;
  }

  private writeJsonFile(filePath: string, data: any): void {
    this.ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async readAppState(): Promise<Record<string, any> | null> {
    return this.readJsonFile(config.paths.appStateFile);
  }

  async writeAppState(state: Record<string, any>): Promise<void> {
    this.writeJsonFile(config.paths.appStateFile, state);
  }

  private safeUserFile(email: string): string {
    const safeEmail = email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
    return path.join(config.paths.usersDir, `user_${safeEmail}.json`);
  }

  async readUserProfile(email: string): Promise<Record<string, any> | null> {
    return this.readJsonFile(this.safeUserFile(email));
  }

  async writeUserProfile(email: string, profile: Record<string, any>): Promise<void> {
    this.writeJsonFile(this.safeUserFile(email), profile);
  }

  async readEngineConfig(): Promise<Record<string, any> | null> {
    return this.readJsonFile(config.paths.engineConfigFile);
  }

  async writeEngineConfig(cfg: Record<string, any>): Promise<void> {
    this.writeJsonFile(config.paths.engineConfigFile, cfg);
  }

  async readCharacterAnchors(): Promise<Record<string, any>> {
    return this.readJsonFile(config.paths.characterAnchorsFile) || {};
  }

  async writeCharacterAnchors(anchors: Record<string, any>): Promise<void> {
    this.writeJsonFile(config.paths.characterAnchorsFile, anchors);
  }

  async saveMedia(value: string, prefix = "media"): Promise<string> {
    const parsed = parseDataUrl(value);
    if (!parsed) return value;
    try {
      const buffer = Buffer.from(parsed.base64, "base64");
      const ext = extensionForMime(parsed.mimeType);
      const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "media";
      const outName = `${safePrefix}_${Date.now()}.${ext}`;
      this.ensureDir(config.paths.uploadsDir);
      fs.writeFileSync(path.join(config.paths.uploadsDir, outName), buffer);
      // Redundant copy under repo-root uploads/ (mirrors original behavior).
      try {
        this.ensureDir(config.paths.rootUploadsDir);
        fs.writeFileSync(path.join(config.paths.rootUploadsDir, outName), buffer);
      } catch {
        /* best-effort mirror */
      }
      return `/uploads/${outName}`;
    } catch (e) {
      console.warn("Error persisting base64 media to file:", e);
      return value;
    }
  }
}
