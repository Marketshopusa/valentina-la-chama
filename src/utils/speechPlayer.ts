import { resolveVoiceProfile, VoiceProfile, LISTA_VOCES, VoiceSegment } from './voices';

export interface PlayVoiceOptions {
  text: string;
  voiceId?: string;
  characterName?: string;
  voiceDirective?: string;
  baseVoice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

let sharedAudioCtx: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let currentAudio: HTMLAudioElement | null = null;
let activeMultiVoiceToken = 0;

// High-speed client-side in-memory audio cache for zero-latency repeated and prefetched playback
const clientTtsCache = new Map<string, string>();

/**
 * Synchronously unlocks and warms up the browser AudioContext on direct user interaction (tap/click).
 * This ensures that when the asynchronous Gemini TTS audio arrives, playback is never blocked by iOS/Safari autoplay rules.
 */
export function unlockAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

export function stopAllSpeech(): void {
  activeMultiVoiceToken++;
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch (e) {}
    currentSourceNode = null;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

/**
 * Background prefetch for upcoming dialogue/narrator segments to eliminate latency between lines
 */
function prefetchSegment(seg?: VoiceSegment) {
  if (!seg || !seg.text || !seg.text.trim()) return;
  const profile = resolveVoiceProfile(seg.voiceId);
  const cacheKey = `${profile.id}:${profile.baseVoice}:${seg.text.trim().toLowerCase().slice(0, 160)}`;
  if (clientTtsCache.has(cacheKey)) return;

  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: seg.text,
      voiceId: profile.id,
      characterName: seg.speakerName || profile.name,
      voiceDirective: profile.voiceInstruction,
      baseVoice: profile.baseVoice
    })
  })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.audioData) {
          clientTtsCache.set(cacheKey, data.audioData);
        }
      }
    })
    .catch(() => {});
}

/**
 * Internal single segment player that returns a promise when the audio piece finishes playing.
 */
async function playSingleSegmentInternal(
  text: string,
  voiceId: string | undefined,
  characterName: string | undefined,
  audioCtx: AudioContext | null,
  token: number
): Promise<void> {
  if (token !== activeMultiVoiceToken) return;

  const profile = resolveVoiceProfile(voiceId);
  const effectiveBaseVoice = profile.baseVoice;
  const effectiveDirective = profile.voiceInstruction;
  const cacheKey = `${profile.id}:${effectiveBaseVoice}:${text.trim().toLowerCase().slice(0, 160)}`;

  return new Promise<void>(async (resolve) => {
    let hasResolved = false;
    const safeResolve = () => {
      if (!hasResolved) {
        hasResolved = true;
        resolve();
      }
    };

    let audioDataToPlay: string | null = clientTtsCache.get(cacheKey) || null;

    if (!audioDataToPlay) {
      try {
        const abortCtrl = new AbortController();
        // Fast 2.2 second timeout so chat never feels stalled for 30s
        const timeoutId = setTimeout(() => abortCtrl.abort(), 2200);

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortCtrl.signal,
          body: JSON.stringify({
            text,
            voiceId: profile.id,
            characterName: characterName || profile.name,
            voiceDirective: effectiveDirective,
            baseVoice: effectiveBaseVoice
          })
        });
        clearTimeout(timeoutId);

        if (token !== activeMultiVoiceToken) {
          safeResolve();
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data && data.audioData) {
            audioDataToPlay = data.audioData;
            clientTtsCache.set(cacheKey, data.audioData);
          }
        }
      } catch (err) {
        // Fallback directly to local synthesis with zero delay
      }
    }

    if (token !== activeMultiVoiceToken) {
      safeResolve();
      return;
    }

    // If we have high-fidelity base64 audio (from server or cache), play it
    if (audioDataToPlay) {
      try {
        const binaryStr = atob(audioDataToPlay);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        // Method 1: Web Audio API
        if (audioCtx && audioCtx.state !== 'closed') {
          try {
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }
            const bufferCopy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            const decodedBuffer = await audioCtx.decodeAudioData(bufferCopy);
            if (decodedBuffer && token === activeMultiVoiceToken) {
              const source = audioCtx.createBufferSource();
              source.buffer = decodedBuffer;
              const effectiveRate = profile.rate || 1.0;
              source.playbackRate.value = Math.max(0.65, Math.min(1.4, effectiveRate));
              source.connect(audioCtx.destination);
              currentSourceNode = source;

              source.onended = () => {
                if (currentSourceNode === source) {
                  currentSourceNode = null;
                }
                safeResolve();
              };

              source.start(0);
              return;
            }
          } catch (ctxErr) {
            console.warn('[speechPlayer] AudioContext decoding failed:', ctxErr);
          }
        }

        // Method 2: HTMLAudioElement
        try {
          const wavBlob = new Blob([bytes.buffer], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(wavBlob);
          const audio = new Audio(audioUrl);
          currentAudio = audio;

          const effectiveRate = profile.rate || 1.0;
          audio.playbackRate = Math.max(0.65, Math.min(1.4, effectiveRate));

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (currentAudio === audio) currentAudio = null;
            safeResolve();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            if (currentAudio === audio) currentAudio = null;
            fallbackSpeechSynthesis(text, profile, undefined, safeResolve, safeResolve);
          };

          await audio.play();
          return;
        } catch (playErr) {
          console.warn('[speechPlayer] audio.play() rejected:', playErr);
        }
      } catch (decodeErr) {
        console.warn('[speechPlayer] Raw audio parsing error:', decodeErr);
      }
    }

    // Immediate fallback: Expressive local speech synthesis without waiting
    if (token === activeMultiVoiceToken) {
      fallbackSpeechSynthesis(text, profile, undefined, safeResolve, safeResolve);
    } else {
      safeResolve();
    }
  });
}

/**
 * Plays a single voice piece (standalone backwards compatibility)
 */
export async function playVoice(options: PlayVoiceOptions): Promise<void> {
  const { text, voiceId, characterName, onStart, onEnd, onError } = options;
  stopAllSpeech();

  const token = activeMultiVoiceToken;
  const audioCtx = unlockAudioContext();

  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return;
  }

  if (onStart) onStart();

  try {
    await playSingleSegmentInternal(text, voiceId, characterName, audioCtx, token);
    if (token === activeMultiVoiceToken && onEnd) {
      onEnd();
    }
  } catch (e) {
    if (onError) onError(e);
  }
}

/**
 * Plays a sequence of distinct vocal segments:
 * 1. Narrator (intense, sensual, skin-tingling tone)
 * 2. Protagonist character (Scarlett / custom character voice)
 * 3. Guest / secondary character (third distinct voice)
 *
 * Pre-fetches subsequent segments in background for zero lag between lines!
 */
export async function playMultiVoice(
  segments: VoiceSegment[],
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err?: any) => void;
    onSegmentChange?: (index: number, segment: VoiceSegment) => void;
  }
): Promise<void> {
  stopAllSpeech();

  if (!segments || segments.length === 0) {
    options?.onEnd?.();
    return;
  }

  const token = activeMultiVoiceToken;
  const audioCtx = unlockAudioContext();

  options?.onStart?.();

  try {
    for (let i = 0; i < segments.length; i++) {
      if (token !== activeMultiVoiceToken) break;
      const seg = segments[i];
      if (!seg.text || !seg.text.trim()) continue;

      // Prefetch next segment in parallel while this one is preparing and playing
      if (i + 1 < segments.length) {
        prefetchSegment(segments[i + 1]);
      }

      options?.onSegmentChange?.(i, seg);

      await playSingleSegmentInternal(
        seg.text,
        seg.voiceId,
        seg.speakerName,
        audioCtx,
        token
      );
    }

    if (token === activeMultiVoiceToken) {
      options?.onEnd?.();
    }
  } catch (err) {
    options?.onError?.(err);
  }
}

/**
 * Expressive local speech synthesis tailored with skin-tingling sensual cadence
 * for narration and distinct voice profiles for characters.
 */
function fallbackSpeechSynthesis(
  text: string,
  profile?: VoiceProfile,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err?: any) => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported'));
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';

    const isNarrator = profile?.id?.toLowerCase().includes('narrador');
    const isMale = profile?.baseVoice === 'Charon' || profile?.baseVoice === 'Fenrir';

    if (isNarrator) {
      // Sensual, deep, intimate narration that gives goosebumps (hace estremecer la piel)
      utterance.pitch = Math.max(0.68, Math.min(0.85, (profile?.pitch || 0.78) * 0.95));
      utterance.rate = Math.max(0.72, Math.min(0.88, (profile?.rate || 0.86) * 0.95));
    } else if (isMale) {
      utterance.pitch = Math.max(0.55, Math.min(0.85, profile?.pitch || 0.68));
      utterance.rate = Math.max(0.80, Math.min(1.05, profile?.rate || 0.90));
    } else {
      // Female protagonist or guest
      utterance.pitch = Math.max(0.95, Math.min(1.35, profile?.pitch || 1.08));
      utterance.rate = Math.max(0.85, Math.min(1.15, profile?.rate || 0.96));
    }

    const voices = window.speechSynthesis.getVoices();

    let chosenVoice: SpeechSynthesisVoice | undefined;
    if (isMale) {
      chosenVoice = voices.find(v => v.lang.startsWith('es') && (
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('jorge') ||
        v.name.toLowerCase().includes('pablo') ||
        v.name.toLowerCase().includes('diego') ||
        v.name.toLowerCase().includes('raul')
      ));
    } else if (isNarrator) {
      // Richer, deeper female voice for sensual narration
      chosenVoice = voices.find(v => v.lang.startsWith('es') && (
        v.name.toLowerCase().includes('monica') ||
        v.name.toLowerCase().includes('elena') ||
        v.name.toLowerCase().includes('sabina') ||
        v.name.toLowerCase().includes('helena') ||
        v.name.toLowerCase().includes('female')
      ));
    } else {
      // Sweet, vibrant female voice for protagonist
      chosenVoice = voices.find(v => v.lang.startsWith('es') && (
        v.name.toLowerCase().includes('paulina') ||
        v.name.toLowerCase().includes('laura') ||
        v.name.toLowerCase().includes('monica') ||
        v.name.toLowerCase().includes('female')
      ));
    }

    if (!chosenVoice) {
      chosenVoice = voices.find(v => v.lang.startsWith('es')) || voices[0];
    }
    if (chosenVoice) utterance.voice = chosenVoice;

    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        clearTimeout(safetyTimeout);
        if (onEnd) onEnd();
      }
    };

    // Safety timeout prevents speech synthesis from ever hanging the queue
    const safetyTimeout = setTimeout(finish, Math.max(3000, text.length * 120));

    utterance.onstart = () => {
      if (onStart) onStart();
    };
    utterance.onend = finish;
    utterance.onerror = (e) => {
      clearTimeout(safetyTimeout);
      if (onError) onError(e);
      finish();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (onError) onError(err);
    if (onEnd) onEnd();
  }
}
