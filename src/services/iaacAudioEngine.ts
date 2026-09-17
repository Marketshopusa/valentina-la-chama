/**
 * IAAC - Módulo de Inmersión Auditiva por Contexto
 * Motor de Audio y Foley Dinámico (FR-02, FR-04, FR-05)
 */

interface SFXMetadata {
  eventType: string;
  intensity: number;
  variant: string;
  path: string;
}

// Catálogo de la biblioteca inicial de audio (/assets/sfx/iaac/)
const SFX_LIBRARY: SFXMetadata[] = [
  // 1. impact_body_surface
  { eventType: 'impact_body_surface', intensity: 5, variant: '01', path: '/assets/sfx/iaac/impact_body_surface_5_01.wav' },
  { eventType: 'impact_body_surface', intensity: 8, variant: '01', path: '/assets/sfx/iaac/impact_body_surface_8_01.wav' },
  { eventType: 'impact_body_surface', intensity: 10, variant: '01', path: '/assets/sfx/iaac/impact_body_surface_10_01.wav' },

  // 2. rhythmic_impact_sequence
  { eventType: 'rhythmic_impact_sequence', intensity: 5, variant: '01', path: '/assets/sfx/iaac/rhythmic_impact_sequence_5_01.wav' },
  { eventType: 'rhythmic_impact_sequence', intensity: 8, variant: '01', path: '/assets/sfx/iaac/rhythmic_impact_sequence_8_01.wav' },
  { eventType: 'rhythmic_impact_sequence', intensity: 10, variant: '01', path: '/assets/sfx/iaac/rhythmic_impact_sequence_10_01.wav' },

  // 3. intimate_mouth_interaction
  { eventType: 'intimate_mouth_interaction', intensity: 5, variant: '01', path: '/assets/sfx/iaac/intimate_mouth_interaction_5_01.wav' },
  { eventType: 'intimate_mouth_interaction', intensity: 7, variant: '01', path: '/assets/sfx/iaac/intimate_mouth_interaction_7_01.wav' },
  { eventType: 'intimate_mouth_interaction', intensity: 7, variant: '02', path: '/assets/sfx/iaac/intimate_mouth_interaction_7_02.wav' },
  { eventType: 'intimate_mouth_interaction', intensity: 9, variant: '01', path: '/assets/sfx/iaac/intimate_mouth_interaction_9_01.wav' },

  // 4. body_fall_sequence
  { eventType: 'body_fall_sequence', intensity: 5, variant: '01', path: '/assets/sfx/iaac/body_fall_sequence_5_01.wav' },
  { eventType: 'body_fall_sequence', intensity: 8, variant: '01', path: '/assets/sfx/iaac/body_fall_sequence_8_01.wav' },
  { eventType: 'body_fall_sequence', intensity: 10, variant: '01', path: '/assets/sfx/iaac/body_fall_sequence_10_01.wav' },

  // 5. slam_door
  { eventType: 'slam_door', intensity: 5, variant: '01', path: '/assets/sfx/iaac/slam_door_5_01.wav' },
  { eventType: 'slam_door', intensity: 8, variant: '01', path: '/assets/sfx/iaac/slam_door_8_01.wav' },
  { eventType: 'slam_door', intensity: 10, variant: '01', path: '/assets/sfx/iaac/slam_door_10_01.wav' },

  // 6. footsteps_run_surface
  { eventType: 'footsteps_run_surface', intensity: 5, variant: '01', path: '/assets/sfx/iaac/footsteps_run_surface_5_01.wav' },
  { eventType: 'footsteps_run_surface', intensity: 6, variant: '01', path: '/assets/sfx/iaac/footsteps_run_surface_6_01.wav' },
  { eventType: 'footsteps_run_surface', intensity: 8, variant: '01', path: '/assets/sfx/iaac/footsteps_run_surface_8_01.wav' },
];

class IAACAudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85; // Default volume
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private activeSources: Set<AudioBufferSourceNode | HTMLAudioElement> = new Set();

  constructor() {
    // Lazy audio context init on user gesture
    if (typeof window !== 'undefined') {
      const storedMuted = localStorage.getItem('iaac_muted');
      if (storedMuted !== null) {
        this.isMuted = storedMuted === 'true';
      }
      const storedVol = localStorage.getItem('iaac_volume');
      if (storedVol !== null) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed)) this.volume = Math.max(0, Math.min(1, parsed));
      }
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx?.currentTime || 0);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('iaac_volume', this.volume.toString());
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.audioCtx?.currentTime || 0);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('iaac_muted', muted ? 'true' : 'false');
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Encuentra el mejor archivo en la biblioteca para un eventType e intensidad dada
   */
  public findBestSFXMatch(eventType: string, targetIntensity: number): SFXMetadata | null {
    const candidates = SFX_LIBRARY.filter(item => item.eventType === eventType);
    if (candidates.length === 0) return null;

    // Find closest intensity
    let best = candidates[0];
    let minDiff = Math.abs(best.intensity - targetIntensity);

    for (let i = 1; i < candidates.length; i++) {
      const diff = Math.abs(candidates[i].intensity - targetIntensity);
      if (diff < minDiff) {
        minDiff = diff;
        best = candidates[i];
      }
    }
    return best;
  }

  /**
   * Carga y decodifica un archivo de audio WAV en un AudioBuffer
   */
  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        // Try fallback with leading slash or without
        throw new Error(`HTTP ${res.status} fetching ${url}`);
      }
      const arrayBuf = await res.arrayBuffer();
      const ctx = this.getAudioContext();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      this.bufferCache.set(url, decoded);
      return decoded;
    } catch (err) {
      console.warn(`[IAAC] Error cargando asset de audio ${url}:`, err);
      return null;
    }
  }

  /**
   * Síntesis procedimental Foley de respaldo garantizada (Web Audio API)
   * Asegura que el sonido siempre se escuche incluso sin conexión o antes de descargar assets
   */
  private playProceduralFallback(eventType: string, intensity: number) {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const force = Math.max(0.2, Math.min(1.0, intensity / 10));

    // Master node for this effect
    const sfxGain = ctx.createGain();
    sfxGain.gain.setValueAtTime(force * (this.isMuted ? 0 : this.volume), now);
    sfxGain.connect(this.masterGain || ctx.destination);

    if (eventType === 'body_slap_spank') {
      // 1. Nalgada / Palmada firme sobre carne / piel:
      // Transiente de impacto rápido (burst de ruido blanco filtrado paso banda a 1.2kHz)
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, now);
      bandpass.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(1.2 * force, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(sfxGain);

      noiseSource.start(now);

      // Resonancia de cuerpo / tono carnoso subyacente (senoide con descenso rápido de 220Hz a 60Hz)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);

      oscGain.gain.setValueAtTime(1.0 * force, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(oscGain);
      oscGain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.18);

    } else if (eventType === 'intense_vocal_reaction') {
      // 2. Grito vocal agudo o exclamación intensa
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      
      // Filtro de formante vocal humano
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(3.0, now);

      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.45);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.85 * force, now + 0.06);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(sfxGain);

      osc.start(now);
      osc.stop(now + 0.48);

    } else if (eventType === 'choking_gag_sound') {
      // 3. Ahogamiento y atragantamiento (espasmo faríngeo y tos asfixiada)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);

      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(240, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      oscGain.gain.setValueAtTime(0.9 * force, now);
      oscGain.gain.setValueAtTime(0.2, now + 0.1);
      oscGain.gain.setValueAtTime(0.85 * force, now + 0.18);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(sfxGain);

      osc.start(now);
      osc.stop(now + 0.4);

    } else if (eventType === 'retching_nausea_sound') {
      // 4. Arcada estomacal profunda y sensación de vómito
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(210, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.5);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.9 * force, now + 0.15);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(sfxGain);

      osc.start(now);
      osc.stop(now + 0.52);

    } else if (eventType === 'crying_weeping_sound') {
      // 5. Llanto suave/agudo y sollozos
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';

      // Modulación vibrato de sollozo humano
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, now); // 5.5 Hz vibrato
      lfoGain.gain.setValueAtTime(25, now);
      lfo.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + 0.65);

      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.65);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.65 * force, now + 0.12);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(oscGain);
      oscGain.connect(sfxGain);

      osc.start(now);
      osc.stop(now + 0.65);

    } else if (eventType === 'heavy_panting_breath') {
      // 6. Respiración extremadamente agitada (inhalación y exhalación jadeante)
      const bufferSize = Math.floor(ctx.sampleRate * 0.45);
      const breathBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = breathBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Envolvente de 2 jadeos continuos
        const t = i / ctx.sampleRate;
        const env = Math.sin(t * Math.PI * 4) * (1 - t / 0.45);
        data[i] = (Math.random() * 2 - 1) * Math.max(0, env);
      }
      const breathSource = ctx.createBufferSource();
      breathSource.buffer = breathBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(850, now);
      bandpass.Q.setValueAtTime(1.4, now);

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.85 * force, now);

      breathSource.connect(bandpass);
      bandpass.connect(breathGain);
      breathGain.connect(sfxGain);

      breathSource.start(now);

    } else if (eventType === 'chewing_eating_sound') {
      // 7. Masticar / comer
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);

      oscGain.gain.setValueAtTime(0.6 * force, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(oscGain);
      oscGain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);

    } else if (eventType === 'impact_body_surface') {
      // 8. Impacto seco contra pared / yeso
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

      oscGain.gain.setValueAtTime(1.0 * force, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(oscGain);
      oscGain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.5);

    } else if (eventType === 'slam_door') {
      // 9. Portazo de madera con eco
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

      oscGain.gain.setValueAtTime(1.0 * force, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(oscGain);
      oscGain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.65);

    } else if (eventType === 'intimate_mouth_interaction') {
      // 10. Succión / chupar / beso húmedo
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.22);

      oscGain.gain.setValueAtTime(0.85 * force, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(oscGain);
      oscGain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.24);

    } else {
      // Genérico rítmico / pasos / caída
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      oscGain.gain.setValueAtTime(0.8 * force, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(oscGain);
      oscGain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.38);
    }
  }

  /**
   * Función central para reproducir un efecto de sonido contextual
   * Especificación 3.2: triggerContextualSound(eventType, intensity)
   *
   * @param eventType Identificador único del evento físico (ej. impact_body_surface)
   * @param intensity Intensidad del evento físico (1 a 10)
   */
  public async triggerContextualSound(eventType: string, intensity: number = 7): Promise<void> {
    if (this.isMuted) return;

    // Normalizar intensidad entre 1 y 10
    const clampedIntensity = Math.max(1, Math.min(10, Math.round(intensity)));
    const sfxMeta = this.findBestSFXMatch(eventType, clampedIntensity);

    try {
      const ctx = this.getAudioContext();

      if (sfxMeta) {
        const buffer = await this.loadAudioBuffer(sfxMeta.path);
        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;

          // Modulación fina de pitch / velocidad basada en la intensidad
          const intensityRatio = clampedIntensity / (sfxMeta.intensity || 7);
          const playbackRate = Math.max(0.85, Math.min(1.25, 1.0 + (intensityRatio - 1) * 0.15));
          source.playbackRate.setValueAtTime(playbackRate, ctx.currentTime);

          // Ganancia de volumen específica para este sonido
          const gainNode = ctx.createGain();
          const targetGain = (clampedIntensity / 10) * 0.9 + 0.1;
          gainNode.gain.setValueAtTime(targetGain, ctx.currentTime);

          source.connect(gainNode);
          gainNode.connect(this.masterGain || ctx.destination);

          this.activeSources.add(source);
          source.onended = () => {
            this.activeSources.delete(source);
          };

          source.start(0);
          return;
        }
      }

      // Si no se encontró el asset o falló la carga, reproducir síntesis procedural
      this.playProceduralFallback(eventType, clampedIntensity);
    } catch (err) {
      console.warn(`[IAAC] Fallback ejecutado para ${eventType}:`, err);
      this.playProceduralFallback(eventType, clampedIntensity);
    }
  }

  /**
   * Detiene todos los sonidos IAAC activos sin afectar el sistema TTS
   */
  public stopAllIAAC(): void {
    for (const source of this.activeSources) {
      try {
        if ('stop' in source) {
          source.stop();
        } else if ('pause' in source) {
          source.pause();
        }
      } catch {}
    }
    this.activeSources.clear();
  }
}

export const iaacAudioEngine = new IAACAudioEngine();

/**
 * Función exportada según especificación 3.2
 */
export function triggerContextualSound(eventType: string, intensity: number = 7): Promise<void> {
  return iaacAudioEngine.triggerContextualSound(eventType, intensity);
}

if (typeof window !== 'undefined') {
  (window as any).triggerContextualSound = triggerContextualSound;
}

