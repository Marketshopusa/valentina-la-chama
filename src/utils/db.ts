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

// ================= Active Scenario Persistence =================
export async function saveActiveScenario(scenario: StoryScenario): Promise<void> {
  await idbSet(ACTIVE_SCENARIO_KEY, scenario);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(ACTIVE_SCENARIO_KEY, JSON.stringify(scenario));
      if (scenario.id) {
        localStorage.setItem(ACTIVE_SCENARIO_ID_KEY, scenario.id);
      }
    } catch (e) {
      console.warn("localStorage saveActiveScenario quota or blocked:", e);
    }
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
export async function saveScenarios(scenarios: StoryScenario[]): Promise<void> {
  await idbSet(SCENARIOS_KEY, scenarios);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
    } catch (e) {
      console.warn("localStorage saveScenarios quota or blocked:", e);
    }
  }
}

export async function getScenarios(): Promise<StoryScenario[] | null> {
  const fromIdb = await idbGet<StoryScenario[]>(SCENARIOS_KEY);
  if (fromIdb && Array.isArray(fromIdb) && fromIdb.length > 0) return fromIdb;

  if (isLocalStorageAvailable()) {
    try {
      const item = localStorage.getItem(SCENARIOS_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("localStorage getScenarios blocked:", e);
    }
  }
  return null;
}

// ================= Card Media (Image/Video) Persistence =================
export async function saveCardMedia(media: string, scenarioId?: string): Promise<void> {
  await idbSet(CARD_MEDIA_KEY, media);
  if (scenarioId) {
    await idbSet(`card_media_${scenarioId}`, media);
  }

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(CARD_MEDIA_KEY, media);
      if (scenarioId) {
        localStorage.setItem(`card_media_${scenarioId}`, media);
      }
    } catch (e) {
      console.warn("localStorage saveCardMedia quota or blocked:", e);
    }
  }
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
export async function saveMedia(media: string): Promise<void> {
  await idbSet(MEDIA_KEY, media);
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(MEDIA_KEY, media);
    } catch (e) {
      console.warn("localStorage saveMedia blocked or full:", e);
    }
  }
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
export async function saveHistory(messages: any[], scenarioId?: string): Promise<void> {
  await idbSet(HISTORY_KEY, messages);
  if (scenarioId) {
    await idbSet(`chat_messages_${scenarioId}`, messages);
  }

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
      if (scenarioId) {
        localStorage.setItem(`chat_messages_${scenarioId}`, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn("localStorage saveHistory blocked:", e);
    }
  }
}

export async function getHistory(scenarioId?: string): Promise<any[] | null> {
  if (scenarioId) {
    const fromIdbScen = await idbGet<any[]>(`chat_messages_${scenarioId}`);
    if (fromIdbScen && Array.isArray(fromIdbScen)) return fromIdbScen;

    if (isLocalStorageAvailable()) {
      try {
        const scenItem = localStorage.getItem(`chat_messages_${scenarioId}`);
        if (scenItem) return JSON.parse(scenItem);
      } catch (e) {
        console.warn("localStorage getHistory blocked:", e);
      }
    }
  }

  const fromIdb = await idbGet<any[]>(HISTORY_KEY);
  if (fromIdb && Array.isArray(fromIdb)) return fromIdb;

  if (isLocalStorageAvailable()) {
    try {
      const item = localStorage.getItem(HISTORY_KEY);
      return item ? JSON.parse(item) : null;
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

// ================= Server Sync & Cloud Persistence =================
export async function fetchServerAppState(): Promise<any> {
  try {
    const res = await fetch('/api/app-state');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("fetchServerAppState error:", e);
  }
  return null;
}

export async function pushServerAppState(updates: any, force?: boolean): Promise<{ success: boolean; state?: any }> {
  try {
    const res = await fetch('/api/app-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("pushServerAppState error:", e);
  }
  return { success: false };
}

export async function collectAllLocalDeviceData(): Promise<any> {
  const scenarios = await getScenarios();
  const activeScenario = await getActiveScenario();
  const cardMedia = await getCardMedia();
  const history = await getHistory();
  const persona = await getPersona();

  return {
    scenarios: scenarios || [],
    activeScenario: activeScenario || null,
    activeScenarioId: activeScenario?.id || null,
    cardMedia: cardMedia || null,
    messages: history || [],
    persona: persona || null,
    timestamp: Date.now()
  };
}

export async function pushAllLocalDataToServer(): Promise<{ success: boolean }> {
  try {
    const localData = await collectAllLocalDeviceData();
    const result = await pushServerAppState(localData, true);
    return { success: !!result.success };
  } catch (e) {
    console.error("pushAllLocalDataToServer error:", e);
    return { success: false };
  }
}

export async function exportFullBackup(): Promise<void> {
  try {
    const data = await collectAllLocalDeviceData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_valentina_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("exportFullBackup error:", e);
  }
}

export async function restoreFullBackup(data: any): Promise<boolean> {
  if (!data || typeof data !== 'object') return false;

  try {
    if (Array.isArray(data.scenarios) && data.scenarios.length > 0) {
      await saveScenarios(data.scenarios);
    }
    if (data.activeScenario) {
      await saveActiveScenario(data.activeScenario);
    }
    if (data.cardMedia) {
      await saveCardMedia(data.cardMedia);
    }
    if (Array.isArray(data.messages)) {
      await saveHistory(data.messages);
    }
    if (data.persona) {
      await savePersona(data.persona);
    }

    await pushServerAppState(data, true);
    return true;
  } catch (e) {
    console.error("restoreFullBackup error:", e);
    return false;
  }
}

