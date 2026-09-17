/**
 * IAAC - Módulo de Inmersión Auditiva por Contexto
 * Servicio Central de Orquestación e Integración (FR-01, FR-02, FR-03, FR-04)
 */

import { scanTextForAudioEvents, DetectedIAACEvent, IAAC_LAUNCH_EVENTS } from './iaacDetector';
import { iaacAudioEngine, triggerContextualSound } from './iaacAudioEngine';

export interface IAACEventNotification {
  id: string;
  eventType: string;
  name: string;
  technicalDescription: string;
  intensity: number;
  matchedText: string;
  timestamp: number;
}

type IAACListener = (notification: IAACEventNotification) => void;

class IAACService {
  private listeners: Set<IAACListener> = new Set();
  private isEnabled: boolean = true;
  private recentTriggers: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      const storedEnabled = localStorage.getItem('iaac_enabled');
      if (storedEnabled !== null) {
        this.isEnabled = storedEnabled === 'true';
      }
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setIsEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('iaac_enabled', enabled ? 'true' : 'false');
    }
  }

  public subscribe(listener: IAACListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: IAACEventNotification) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[IAAC] Error en listener:', err);
      }
    }
  }

  /**
   * Dispara un evento contextual manualmente o desde prueba
   */
  public async triggerSound(eventType: string, intensity: number = 7): Promise<void> {
    if (!this.isEnabled) return;

    const eventDef = IAAC_LAUNCH_EVENTS[eventType];
    const notification: IAACEventNotification = {
      id: `iaac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventType,
      name: eventDef ? eventDef.name : eventType,
      technicalDescription: eventDef ? eventDef.technicalDescription : '',
      intensity,
      matchedText: 'Disparo manual',
      timestamp: Date.now()
    };

    this.notify(notification);
    await triggerContextualSound(eventType, intensity);
  }

  /**
   * Procesa el texto de una historia narrativa o mensaje de chat en tiempo real,
   * detecta eventos de usuario / físicos y reproduce los efectos Foley de forma concurrente con el TTS
   */
  public async processNarrativeText(text: string, options: { delayMs?: number } = {}): Promise<DetectedIAACEvent[]> {
    if (!this.isEnabled || !text) return [];

    const detectedEvents = scanTextForAudioEvents(text);
    if (detectedEvents.length === 0) return [];

    const baseDelay = options.delayMs || 150;

    // Trigger each event with a brief pacing interval to prevent audio crowding and allow clear sequential delivery
    detectedEvents.forEach((ev, idx) => {
      const lastTrigger = this.recentTriggers.get(ev.eventType) || 0;
      const now = Date.now();

      // Debounce the exact same event type within 800ms
      if (now - lastTrigger < 800) {
        return;
      }
      this.recentTriggers.set(ev.eventType, now);

      const delay = baseDelay + idx * 300;

      setTimeout(async () => {
        if (!this.isEnabled) return;

        const eventDef = IAAC_LAUNCH_EVENTS[ev.eventType];
        const notification: IAACEventNotification = {
          id: `iaac-${Date.now()}-${idx}`,
          eventType: ev.eventType,
          name: eventDef ? eventDef.name : ev.eventType,
          technicalDescription: eventDef ? eventDef.technicalDescription : '',
          intensity: ev.intensity,
          matchedText: ev.matchedText,
          timestamp: Date.now()
        };

        this.notify(notification);

        // Disparo de audio
        await triggerContextualSound(ev.eventType, ev.intensity);
      }, delay);
    });

    return detectedEvents;
  }
}

export const iaacService = new IAACService();
export { triggerContextualSound };
