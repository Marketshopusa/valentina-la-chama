// Converts Uint8Array to base64
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Converts base64 to Uint8Array
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw 16-bit PCM byte data into an AudioContext compliant AudioBuffer, OR decodes native compressed audio (MP3/WAV)
export async function decodeAudioData(
  pcmBytes: Uint8Array,
  audioCtx: AudioContext,
  sampleRate = 24000,
  channels = 1
): Promise<AudioBuffer> {
  // First, try standard native decoding (MP3, WAV, AAC, etc. that contain headers)
  try {
    const arrayBufferCopy = pcmBytes.buffer.slice(
      pcmBytes.byteOffset,
      pcmBytes.byteOffset + pcmBytes.byteLength
    );
    const decoded = await audioCtx.decodeAudioData(arrayBufferCopy);
    if (decoded) return decoded;
  } catch (nativeErr) {
    console.warn("Native browser decodeAudioData failed, falling back to manual raw PCM parsing:", nativeErr);
  }

  // Fallback: manual raw 16-bit PCM parsing
  const numSamples = Math.floor(pcmBytes.length / 2);
  const audioBuffer = audioCtx.createBuffer(channels, numSamples, sampleRate);
  
  const dataView = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength);
  
  for (let channel = 0; channel < channels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < numSamples; i++) {
      if (i * 2 + 1 < pcmBytes.length) {
        const sample = dataView.getInt16(i * 2, true); // little-endian
        channelData[i] = sample / 32768;
      }
    }
  }
  
  return audioBuffer;
}
