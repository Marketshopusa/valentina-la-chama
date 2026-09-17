import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = path.resolve('public/assets/sfx/iaac');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // FMT subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // DATA subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp to -1.0 .. 1.0
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(intSample), offset);
    offset += 2;
  }

  return buffer;
}

// Noise generator
function whiteNoise() {
  return Math.random() * 2 - 1;
}

// Low-pass/band-pass filter helper
function applyLowPass(samples, cutoffFreq, sampleRate = SAMPLE_RATE) {
  const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = dt / (rc + dt);
  const out = new Float32Array(samples.length);
  let last = 0;
  for (let i = 0; i < samples.length; i++) {
    last = last + alpha * (samples[i] - last);
    out[i] = last;
  }
  return out;
}

function applyReverb(samples, delaySec = 0.08, decay = 0.35, sampleRate = SAMPLE_RATE) {
  const delaySamples = Math.floor(delaySec * sampleRate);
  const out = new Float32Array(samples.length + delaySamples * 3);
  for (let i = 0; i < samples.length; i++) {
    out[i] += samples[i];
    if (i + delaySamples < out.length) {
      out[i + delaySamples] += samples[i] * decay;
    }
    if (i + delaySamples * 2 < out.length) {
      out[i + delaySamples * 2] += samples[i] * decay * decay;
    }
  }
  return out;
}

// 1. impact_body_surface: Thud against hard wall with plaster transient + body boom + reverb
function generateImpactBodySurface(intensity = 8) {
  const duration = 0.75;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(numSamples);
  const force = Math.max(0.3, intensity / 10);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Transient smack (high noise slap against plaster)
    const smackEnv = Math.exp(-t * 90);
    const smack = whiteNoise() * smackEnv * 0.7 * force;

    // Body weight deep boom (60Hz dropping to 40Hz)
    const freq = 65 * Math.exp(-t * 8) + 40;
    const thudEnv = Math.exp(-t * 14);
    const thud = Math.sin(2 * Math.PI * freq * t) * thudEnv * 0.9 * force;

    // Plaster vibration resonance (~140Hz)
    const wallEnv = Math.exp(-t * 22);
    const wall = Math.sin(2 * Math.PI * 135 * t) * wallEnv * 0.4 * force;

    samples[i] = smack + thud + wall;
  }

  const filtered = applyLowPass(samples, 1800 + force * 1500);
  return applyReverb(filtered, 0.05, 0.32 * force);
}

// 2. rhythmic_impact_sequence: Skin-on-skin rhythmic claps/thuds with BPM depending on intensity
function generateRhythmicImpactSequence(intensity = 8, beats = 5) {
  const bpm = 90 + intensity * 11; // 90 to 200 BPM
  const beatInterval = 60 / bpm;
  const totalDuration = beatInterval * (beats + 0.6);
  const numSamples = Math.floor(totalDuration * SAMPLE_RATE);
  const samples = new Float32Array(numSamples);
  const force = Math.max(0.4, intensity / 10);

  for (let b = 0; b < beats; b++) {
    const startT = b * beatInterval;
    const startIndex = Math.floor(startT * SAMPLE_RATE);
    // Slight humanization in velocity and timing
    const velocity = force * (0.88 + Math.random() * 0.24);

    for (let i = 0; i < Math.floor(0.28 * SAMPLE_RATE); i++) {
      const idx = startIndex + i;
      if (idx >= numSamples) break;
      const t = i / SAMPLE_RATE;

      // Skin slap transient (slight wet crack)
      const slapEnv = Math.exp(-t * 110);
      const slap = whiteNoise() * slapEnv * 0.5 * velocity;

      // Flesh compression thud (85Hz resonant tone)
      const fleshEnv = Math.exp(-t * 26);
      const flesh = Math.sin(2 * Math.PI * (88 - t * 40) * t) * fleshEnv * 0.7 * velocity;

      samples[idx] += slap + flesh;
    }
  }

  return applyReverb(samples, 0.04, 0.2);
}

// 3. intimate_mouth_interaction: Wet suction and soft lip friction / kiss pops
function generateIntimateMouthInteraction(intensity = 7, variant = 1) {
  const duration = 0.85;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(numSamples);
  const force = Math.max(0.3, intensity / 10);

  // Soft aspiration / breath
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const breathEnv = Math.sin((t / duration) * Math.PI) * 0.15 * force;
    samples[i] = whiteNoise() * breathEnv;
  }

  // 1 or 2 suction / lip release pops
  const popCount = variant === 2 ? 3 : 2;
  for (let p = 0; p < popCount; p++) {
    const popStartT = 0.18 + p * 0.25;
    const startIndex = Math.floor(popStartT * SAMPLE_RATE);
    for (let i = 0; i < Math.floor(0.12 * SAMPLE_RATE); i++) {
      const idx = startIndex + i;
      if (idx >= numSamples) break;
      const t = i / SAMPLE_RATE;

      // Lip release vacuum pop (frequency sweeping down from 900 to 250)
      const f = 850 * Math.exp(-t * 45) + 200;
      const env = Math.exp(-t * 60) * Math.sin(2 * Math.PI * f * t) * 0.6 * force;
      // Wet squelch noise
      const wetNoise = whiteNoise() * Math.exp(-t * 85) * 0.3 * force;

      samples[idx] += env + wetNoise;
    }
  }

  return applyLowPass(samples, 3200);
}

// 4. body_fall_sequence: Short breath gasp followed by heavy body thud on floor
function generateBodyFallSequence(intensity = 7) {
  const duration = 1.2;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(numSamples);
  const force = Math.max(0.4, intensity / 10);

  // Short sharp intake/gasp at t = 0 to 0.22
  for (let i = 0; i < Math.floor(0.25 * SAMPLE_RATE); i++) {
    const t = i / SAMPLE_RATE;
    const gaspEnv = Math.sin((t / 0.25) * Math.PI) * 0.25 * force;
    samples[i] += whiteNoise() * gaspEnv;
  }

  // Double thump of fall: knees/hips (t = 0.28) then torso/shoulders (t = 0.38)
  const hits = [
    { start: 0.28, power: 0.7 * force, freq: 55, dur: 0.35 },
    { start: 0.40, power: 0.95 * force, freq: 45, dur: 0.45 }
  ];

  for (const hit of hits) {
    const startIndex = Math.floor(hit.start * SAMPLE_RATE);
    for (let i = 0; i < Math.floor(hit.dur * SAMPLE_RATE); i++) {
      const idx = startIndex + i;
      if (idx >= numSamples) break;
      const t = i / SAMPLE_RATE;

      const thudEnv = Math.exp(-t * 12);
      const thud = Math.sin(2 * Math.PI * (hit.freq - t * 15) * t) * thudEnv * hit.power;
      const rustle = whiteNoise() * Math.exp(-t * 25) * 0.3 * hit.power;

      samples[idx] += thud + rustle;
    }
  }

  const filtered = applyLowPass(samples, 1400);
  return applyReverb(filtered, 0.08, 0.3);
}

// 5. slam_door: Sharp wooden crack + heavy frame latch impact + room reverberation
function generateSlamDoor(intensity = 8) {
  const duration = 1.1;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(numSamples);
  const force = Math.max(0.4, intensity / 10);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Sharp initial latch/frame click (high frequency crack)
    const latchEnv = Math.exp(-t * 150);
    const latch = whiteNoise() * latchEnv * 0.8 * force;

    // Heavy wooden door resonance (110Hz down to 60Hz)
    const f = 120 * Math.exp(-t * 6) + 60;
    const boomEnv = Math.exp(-t * 9);
    const boom = Math.sin(2 * Math.PI * f * t) * boomEnv * 0.95 * force;

    // Frame vibration rattling tone (240Hz)
    const rattleEnv = Math.exp(-t * 18);
    const rattle = Math.sin(2 * Math.PI * 240 * t) * rattleEnv * 0.35 * force;

    samples[i] = latch + boom + rattle;
  }

  const filtered = applyLowPass(samples, 2600);
  return applyReverb(filtered, 0.09, 0.45 * force);
}

// 6. footsteps_run_surface: Rapid footsteps running on wooden floorboards
function generateFootstepsRunSurface(intensity = 7, steps = 6) {
  const stepInterval = 0.16; // Fast running pace (~375 steps/min)
  const duration = stepInterval * steps + 0.5;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(numSamples);
  const force = Math.max(0.3, intensity / 10);

  for (let s = 0; s < steps; s++) {
    const startT = s * stepInterval;
    const startIndex = Math.floor(startT * SAMPLE_RATE);
    const isHeel = s % 2 === 0;
    const power = force * (isHeel ? 0.9 : 0.75);

    for (let i = 0; i < Math.floor(0.14 * SAMPLE_RATE); i++) {
      const idx = startIndex + i;
      if (idx >= numSamples) break;
      const t = i / SAMPLE_RATE;

      // Shoe sole tap on wood (click)
      const tapEnv = Math.exp(-t * 120);
      const tap = whiteNoise() * tapEnv * 0.5 * power;

      // Wooden floorboard hollow thump (180Hz)
      const woodEnv = Math.exp(-t * 30);
      const wood = Math.sin(2 * Math.PI * (175 + (isHeel ? 20 : 0)) * t) * woodEnv * 0.7 * power;

      samples[idx] += tap + wood;
    }
  }

  return applyReverb(samples, 0.04, 0.28);
}

// Generate all target files for launch
const filePlan = [
  // 1. impact_body_surface
  { name: 'impact_body_surface_5_01.wav', gen: () => generateImpactBodySurface(5) },
  { name: 'impact_body_surface_8_01.wav', gen: () => generateImpactBodySurface(8) },
  { name: 'impact_body_surface_10_01.wav', gen: () => generateImpactBodySurface(10) },

  // 2. rhythmic_impact_sequence
  { name: 'rhythmic_impact_sequence_5_01.wav', gen: () => generateRhythmicImpactSequence(5, 4) },
  { name: 'rhythmic_impact_sequence_8_01.wav', gen: () => generateRhythmicImpactSequence(8, 6) },
  { name: 'rhythmic_impact_sequence_10_01.wav', gen: () => generateRhythmicImpactSequence(10, 8) },

  // 3. intimate_mouth_interaction
  { name: 'intimate_mouth_interaction_5_01.wav', gen: () => generateIntimateMouthInteraction(5, 1) },
  { name: 'intimate_mouth_interaction_7_01.wav', gen: () => generateIntimateMouthInteraction(7, 1) },
  { name: 'intimate_mouth_interaction_7_02.wav', gen: () => generateIntimateMouthInteraction(7, 2) },
  { name: 'intimate_mouth_interaction_9_01.wav', gen: () => generateIntimateMouthInteraction(9, 2) },

  // 4. body_fall_sequence
  { name: 'body_fall_sequence_5_01.wav', gen: () => generateBodyFallSequence(5) },
  { name: 'body_fall_sequence_8_01.wav', gen: () => generateBodyFallSequence(8) },
  { name: 'body_fall_sequence_10_01.wav', gen: () => generateBodyFallSequence(10) },

  // 5. slam_door
  { name: 'slam_door_5_01.wav', gen: () => generateSlamDoor(5) },
  { name: 'slam_door_8_01.wav', gen: () => generateSlamDoor(8) },
  { name: 'slam_door_10_01.wav', gen: () => generateSlamDoor(10) },

  // 6. footsteps_run_surface
  { name: 'footsteps_run_surface_5_01.wav', gen: () => generateFootstepsRunSurface(5, 5) },
  { name: 'footsteps_run_surface_6_01.wav', gen: () => generateFootstepsRunSurface(6, 6) },
  { name: 'footsteps_run_surface_8_01.wav', gen: () => generateFootstepsRunSurface(8, 7) },
];

console.log(`Generating ${filePlan.length} IAAC WAV audio assets into ${OUTPUT_DIR}...`);

for (const item of filePlan) {
  const audioData = item.gen();
  const buffer = createWavBuffer(audioData);
  const destPath = path.join(OUTPUT_DIR, item.name);
  fs.writeFileSync(destPath, buffer);
  console.log(`Created: ${item.name} (${buffer.length} bytes, 44.1kHz 16-bit PCM)`);
}

console.log('All IAAC launch SFX files generated successfully!');
