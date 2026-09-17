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

let currentAudio: HTMLAudioElement | null = null;

export function stopAllSpeech(): void {
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

export async function playVoice(options: PlayVoiceOptions): Promise<void> {
  const { text, baseVoice = 'Aoede', voiceDirective, onStart, onEnd, onError } = options;
  stopAllSpeech();

  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return;
  }

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        baseVoice,
        voiceInstruction: voiceDirective
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onplay = () => {
        if (onStart) onStart();
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        fallbackSpeechSynthesis(text, onStart, onEnd, onError);
      };

      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('Backend TTS failed, falling back to speech synthesis:', err);
  }

  fallbackSpeechSynthesis(text, onStart, onEnd, onError);
}

function fallbackSpeechSynthesis(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err?: any) => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported'));
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onstart = () => {
      if (onStart) onStart();
    };
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      if (onError) onError(e);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (onError) onError(err);
  }
}
