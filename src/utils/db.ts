import { StoryScenario, Persona } from '../types';

const MEDIA_KEY = 'media_url';
const CARD_MEDIA_KEY = 'card_media_url';
const HISTORY_KEY = 'chat_messages';
const PERSONA_KEY = 'active_persona';
const ACTIVE_SCENARIO_KEY = 'active_scenario';
const ACTIVE_SCENARIO_ID_KEY = 'active_scenario_id';
const SCENARIOS_KEY = 'scenarios_list';

const DB_NAME = 'valentina_novela_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_keyval';

// IndexedDB Helper
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Ignore
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Ignore
  }
}

const isLocalStorageAvailable = () => {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};

// ================= Cross-Device Server Sync Helpers =================
let syncTimeout: any = null;
let pendingServerUpdates: Record<string, any> = {};

export async function flushPendingServerUpdates(isUnload: boolean = false): Promise<void> {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  const payload = { ...pendingServerUpdates };
  if (Object.keys(payload).length === 0) return;
  pendingServerUpdates = {};

  try {
    const bodyStr = JSON.stringify(payload);
    if (isUnload && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      navigator.sendBeacon('/api/app-state', blob);
      return;
    }
    await fetch('/api/app-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
      keepalive: true
    });
  } catch (err) {
    console.warn("Background pushServerAppState failed:", err);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingServerUpdates(true);
  });
  window.addEventListener('pagehide', () => {
    flushPendingServerUpdates(true);
  });
}

export async function pushServerAppState(updates: Record<string, any>, immediate: boolean = false): Promise<void> {
  try {
    pendingServerUpdates = { ...pendingServerUpdates, ...updates };
    if (immediate) {
      await flushPendingServerUpdates(false);
      return;
    }
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      flushPendingServerUpdates(false);
    }, 120);
  } catch (e) {
    console.warn("pushServerAppState error:", e);
  }
}

export async function fetchServerAppState(): Promise<any> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch('/api/app-state', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("fetchServerAppState failed:", e);
  }
  return null;
}

export async function uploadMediaToServer(media: string, scenarioId?: string): Promise<string> {
  if (!media || !media.startsWith('data:')) return media;
  try {
    const res = await fetch('/api/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media, scenarioId })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (e) {
    console.warn("uploadMediaToServer failed, keeping original:", e);
  }
  return media;
}

// ================= Active Scenario Persistence =================
export async function saveActiveScenario(scenario: StoryScenario, syncToServer = true): Promise<void> {
  let scenToSave = { ...scenario };
  if (scenToSave.coverImage && scenToSave.coverImage.startsWith('data:')) {
    scenToSave.coverImage = await uploadMediaToServer(scenToSave.coverImage, scenToSave.id);
  }

  await idbSet(ACTIVE_SCENARIO_KEY, scenToSave);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(ACTIVE_SCENARIO_KEY, JSON.stringify(scenToSave));
      if (scenToSave.id) {
        localStorage.setItem(ACTIVE_SCENARIO_ID_KEY, scenToSave.id);
      }
    } catch (e) {
      console.warn("localStorage saveActiveScenario quota or blocked:", e);
    }
  }

  if (syncToServer) {
    pushServerAppState({
      activeScenario: scenToSave,
      activeScenarioId: scenToSave.id,
      currentCardMedia: scenToSave.coverImage || undefined
    });
  }
}

export async function getActiveScenario(): Promise<StoryScenario | null> {
  const fromIdb = await idbGet<StoryScenario>(ACTIVE_SCENARIO_KEY);
  if (fromIdb) return fromIdb;

  if (isLocalStorageAvailable()) {
    try {
      const item = localStorage.getItem(ACTIVE_SCENARIO_KEY);
      if (item) return JSON.parse(item);
    } catch (e) {
      console.warn("localStorage getActiveScenario blocked:", e);
    }
  }
  return null;
}

// ================= Scenarios List Persistence =================
export async function saveScenarios(scenarios: StoryScenario[], syncToServer = true): Promise<void> {
  // Enforce strict limit: only keep the 6 most recent stories
  const capped = scenarios.slice(0, 6);
  await idbSet(SCENARIOS_KEY, capped);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(capped));
    } catch (e) {
      console.warn("localStorage saveScenarios quota or blocked:", e);
    }
  }

  if (syncToServer) {
    pushServerAppState({ scenarios: capped });
  }
}

export async function getScenarios(): Promise<StoryScenario[] | null> {
  const fromIdb = await idbGet<StoryScenario[]>(SCENARIOS_KEY);
  if (fromIdb && Array.isArray(fromIdb) && fromIdb.length > 0) return fromIdb.slice(0, 6);

  if (isLocalStorageAvailable()) {
    try {
      const item = localStorage.getItem(SCENARIOS_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 6);
      }
    } catch (e) {
      console.warn("localStorage getScenarios blocked:", e);
    }
  }
  return null;
}

// ================= Card Media (Image/Video) Persistence =================
export async function saveCardMedia(media: string, scenarioId?: string): Promise<string> {
  let effectiveMedia = media;
  if (media && media.startsWith('data:')) {
    effectiveMedia = await uploadMediaToServer(media, scenarioId);
  }

  await idbSet(CARD_MEDIA_KEY, effectiveMedia);
  if (scenarioId) {
    await idbSet(`card_media_${scenarioId}`, effectiveMedia);
  }

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(CARD_MEDIA_KEY, effectiveMedia);
      if (scenarioId) {
        localStorage.setItem(`card_media_${scenarioId}`, effectiveMedia);
      }
    } catch (e) {
      console.warn("localStorage saveCardMedia quota or blocked:", e);
    }
  }

  pushServerAppState({
    currentCardMedia: effectiveMedia,
    ...(scenarioId ? { [`card_media_${scenarioId}`]: effectiveMedia } : {})
  });

  return effectiveMedia;
}

export async function getCardMedia(scenarioId?: string): Promise<string | null> {
  if (scenarioId) {
    const fromIdbScen = await idbGet<string>(`card_media_${scenarioId}`);
    if (fromIdbScen) return fromIdbScen;

    if (isLocalStorageAvailable()) {
      try {
        const scenItem = localStorage.getItem(`card_media_${scenarioId}`);
        if (scenItem) return scenItem;
      } catch (e) {
        console.warn("localStorage getCardMedia blocked:", e);
      }
    }
    // Do NOT fall back to global CARD_MEDIA_KEY when querying a specific scenario
    return null;
  }

  const fromIdb = await idbGet<string>(CARD_MEDIA_KEY);
  if (fromIdb) return fromIdb;

  if (isLocalStorageAvailable()) {
    try {
      return localStorage.getItem(CARD_MEDIA_KEY);
    } catch (e) {
      console.warn("localStorage getCardMedia blocked:", e);
    }
  }
  return null;
}

export async function deleteCardMedia(scenarioId?: string): Promise<void> {
  await idbDelete(CARD_MEDIA_KEY);
  if (scenarioId) {
    await idbDelete(`card_media_${scenarioId}`);
  }
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(CARD_MEDIA_KEY);
      if (scenarioId) localStorage.removeItem(`card_media_${scenarioId}`);
    } catch (e) {
      console.warn("localStorage deleteCardMedia blocked:", e);
    }
  }
}

// ================= Custom Media (Call Avatar) =================
export async function saveMedia(media: string): Promise<string> {
  let effectiveMedia = media;
  if (media && media.startsWith('data:')) {
    effectiveMedia = await uploadMediaToServer(media, 'avatar');
  }
  await idbSet(MEDIA_KEY, effectiveMedia);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(MEDIA_KEY, effectiveMedia);
    } catch (e) {
      console.warn("localStorage saveMedia blocked or full:", e);
    }
  }
  pushServerAppState({ customImage: effectiveMedia });
  return effectiveMedia;
}

export async function getMedia(): Promise<string | null> {
  const fromIdb = await idbGet<string>(MEDIA_KEY);
  if (fromIdb) return fromIdb;

  if (isLocalStorageAvailable()) {
    try {
      return localStorage.getItem(MEDIA_KEY);
    } catch (e) {
      console.warn("localStorage getMedia blocked:", e);
    }
  }
  return null;
}

export async function deleteMedia(): Promise<void> {
  await idbDelete(MEDIA_KEY);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(MEDIA_KEY);
    } catch (e) {
      console.warn("localStorage deleteMedia blocked:", e);
    }
  }
}

// ================= Chat History Persistence =================

/**
 * Ensures a list of messages contains only strictly unique items with guaranteed distinct IDs.
 * Filters out duplicate IDs and identical rapid consecutive echoes.
 */
export function deduplicateMessages<T extends { id?: string; text?: string; timestamp?: number; sender?: string }>(messages: T[]): T[] {
  if (!Array.isArray(messages)) return [];
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const deduped: T[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') continue;

    let id = (msg.id ? String(msg.id).trim() : '');
    // If ID was already seen in this list, skip the duplicate item
    if (id && seenIds.has(id)) {
      continue;
    }

    // Fingerprint by sender + trimmed text + rough timestamp (within 2s) to prevent double transcription flush
    const textNorm = (msg.text || '').trim();
    const timeNorm = Math.floor((msg.timestamp || Date.now()) / 2000);
    const fingerprint = `${msg.sender || 'unknown'}:${textNorm.slice(0, 100)}:${timeNorm}`;

    if (textNorm && seenFingerprints.has(fingerprint)) {
      continue;
    }

    if (!id) {
      id = `${msg.sender === 'user' ? 'u' : 'm'}-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
    }

    seenIds.add(id);
    if (textNorm) seenFingerprints.add(fingerprint);
    deduped.push({
      ...msg,
      id
    });
  }

  return deduped;
}

export async function saveHistory(messages: any[], scenarioId?: string): Promise<void> {
  const cleanMsgs = deduplicateMessages(messages);
  await idbSet(HISTORY_KEY, cleanMsgs);
  if (scenarioId) {
    await idbSet(`chat_messages_${scenarioId}`, cleanMsgs);
  }

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(cleanMsgs));
      if (scenarioId) {
        localStorage.setItem(`chat_messages_${scenarioId}`, JSON.stringify(cleanMsgs));
      }
    } catch (e) {
      console.warn("localStorage saveHistory blocked:", e);
    }
  }

  pushServerAppState({
    messages: cleanMsgs,
    ...(scenarioId ? { [`chat_messages_${scenarioId}`]: cleanMsgs } : {})
  });
}

export async function getHistory(scenarioId?: string): Promise<any[] | null> {
  if (scenarioId) {
    const fromIdbScen = await idbGet<any[]>(`chat_messages_${scenarioId}`);
    if (fromIdbScen && Array.isArray(fromIdbScen)) return deduplicateMessages(fromIdbScen);

    if (isLocalStorageAvailable()) {
      try {
        const scenItem = localStorage.getItem(`chat_messages_${scenarioId}`);
        if (scenItem) return deduplicateMessages(JSON.parse(scenItem));
      } catch (e) {
        console.warn("localStorage getHistory blocked:", e);
      }
    }
    // Do NOT fall back to global history when querying a specific scenario
    return null;
  }

  const fromIdb = await idbGet<any[]>(HISTORY_KEY);
  if (fromIdb && Array.isArray(fromIdb)) return deduplicateMessages(fromIdb);

  if (isLocalStorageAvailable()) {
    try {
      const item = localStorage.getItem(HISTORY_KEY);
      return item ? deduplicateMessages(JSON.parse(item)) : null;
    } catch (e) {
      console.warn("localStorage getHistory blocked:", e);
    }
  }
  return null;
}

export async function deleteHistory(scenarioId?: string): Promise<void> {
  await idbDelete(HISTORY_KEY);
  if (scenarioId) {
    await idbDelete(`chat_messages_${scenarioId}`);
  }
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(HISTORY_KEY);
      if (scenarioId) localStorage.removeItem(`chat_messages_${scenarioId}`);
    } catch (e) {
      console.warn("localStorage deleteHistory blocked:", e);
    }
  }
  pushServerAppState({
    messages: [],
    ...(scenarioId ? { [`chat_messages_${scenarioId}`]: [] } : {})
  });
}

// ================= Persona Persistence =================
export async function savePersona(persona: Persona): Promise<void> {
  await idbSet(PERSONA_KEY, persona);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(PERSONA_KEY, JSON.stringify(persona));
    } catch (e) {
      console.warn("localStorage savePersona blocked:", e);
    }
  }
  pushServerAppState({ persona });
}

export async function getPersona(): Promise<Persona | null> {
  const fromIdb = await idbGet<Persona>(PERSONA_KEY);
  if (fromIdb) return fromIdb;

  if (isLocalStorageAvailable()) {
    try {
      const item = localStorage.getItem(PERSONA_KEY);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn("localStorage getPersona blocked:", e);
    }
  }
  return null;
}

export async function deletePersona(): Promise<void> {
  await idbDelete(PERSONA_KEY);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(PERSONA_KEY);
    } catch (e) {
      console.warn("localStorage deletePersona blocked:", e);
    }
  }
}

// ================= Complete Device Backup & Cross-Device Transfer =================
export async function collectAllLocalDeviceData(): Promise<Record<string, any>> {
  const result: Record<string, any> = {
    exportedAt: Date.now(),
    devicePlatform: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };

  try {
    const [scens, activeScen, cardMedia, persona, media, hist] = await Promise.all([
      getScenarios(),
      getActiveScenario(),
      getCardMedia(),
      getPersona(),
      getMedia(),
      getHistory()
    ]);

    if (scens && Array.isArray(scens) && scens.length > 0) result.scenarios = scens;
    if (activeScen) {
      result.activeScenario = activeScen;
      result.activeScenarioId = activeScen.id;
    }
    if (cardMedia) result.currentCardMedia = cardMedia;
    if (persona) result.persona = persona;
    if (media) result.customImage = media;
    if (hist && Array.isArray(hist) && hist.length > 0) result.messages = hist;

    // Scan localStorage for any story-specific media and chats
    if (isLocalStorageAvailable()) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('card_media_')) {
          const val = localStorage.getItem(key);
          if (val) result[key] = val;
        } else if (key.startsWith('chat_messages_')) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed) && parsed.length > 0) {
                result[key] = parsed;
              }
            } catch (e) {}
          }
        }
      }
    }

    // Also check IndexedDB for any scenario-specific data
    if (Array.isArray(scens)) {
      for (const s of scens) {
        if (!s || !s.id) continue;
        if (!result[`card_media_${s.id}`]) {
          const m = await getCardMedia(s.id);
          if (m) result[`card_media_${s.id}`] = m;
        }
        if (!result[`chat_messages_${s.id}`]) {
          const h = await getHistory(s.id);
          if (h && Array.isArray(h) && h.length > 0) {
            result[`chat_messages_${s.id}`] = h;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error collecting local device data:", e);
  }

  return result;
}

export async function pushAllLocalDataToServer(): Promise<{ success: boolean; message?: string }> {
  try {
    const localData = await collectAllLocalDeviceData();
    const res = await fetch('/api/app-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...localData, isExplicitSave: true })
    });
    if (res.ok) {
      return { success: true };
    }
    return { success: false, message: "Error al responder del servidor." };
  } catch (e: any) {
    return { success: false, message: e?.message || "Error al conectar con el servidor." };
  }
}

export async function exportFullBackup(): Promise<void> {
  const data = await collectAllLocalDeviceData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `openlover_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreFullBackup(data: Record<string, any>): Promise<boolean> {
  if (!data || typeof data !== 'object') return false;

  try {
    if (Array.isArray(data.scenarios) && data.scenarios.length > 0) {
      await saveScenarios(data.scenarios);
    }
    if (data.activeScenario) {
      await saveActiveScenario(data.activeScenario);
    }
    if (data.currentCardMedia) {
      await saveCardMedia(data.currentCardMedia, data.activeScenarioId || data.activeScenario?.id);
    }
    if (data.persona) {
      await savePersona(data.persona);
    }
    if (data.customImage) {
      await saveMedia(data.customImage);
    }
    if (Array.isArray(data.messages) && data.messages.length > 0) {
      await saveHistory(data.messages, data.activeScenarioId || data.activeScenario?.id);
    }

    // Restore any card_media_* and chat_messages_*
    for (const key of Object.keys(data)) {
      if (key.startsWith('card_media_')) {
        const scenId = key.replace('card_media_', '');
        const val = data[key];
        if (typeof val === 'string') {
          await saveCardMedia(val, scenId);
        }
      } else if (key.startsWith('chat_messages_')) {
        const scenId = key.replace('chat_messages_', '');
        const msgs = data[key];
        if (Array.isArray(msgs) && msgs.length > 0) {
          await saveHistory(msgs, scenId);
        }
      }
    }

    // Push restored state to server
    await fetch('/api/app-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, isExplicitSave: true })
    });

    return true;
  } catch (e) {
    console.error("Error restoring full backup:", e);
    return false;
  }
}

