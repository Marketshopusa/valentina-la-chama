export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: any;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  avatarUrl: string;
  greeting: string;
  creatorId: string;
  isPublic: boolean;
  category?: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  characterId: string;
  userId: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: any;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING',
  RESETTING = 'RESETTING'
}

export interface Message {
  id: string;
  sender: 'user' | 'model' | 'ai';
  text: string;
  timestamp: number;
  sceneImage?: string;
  isGeneratingImage?: boolean;
  coherenceResult?: any;
  decodedSlots?: any;
}

export interface StoryScenario {
  id: string;
  title: string;
  synopsis: string;
  characterName: string;
  characterRole: string;
  userRole?: string;
  userName: string;
  storyType?: string;
  isExplicit18?: boolean;
  development?: string;
  coverImage?: string;
  personaId: string;
  initialPrompt?: string;
  voiceStyle?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Persona {
  id: string;
  name: string;
  region?: string;
  accent?: string;
  description: string;
  voice: 'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir' | string;
  defaultImage?: string;
  instruction: string;
  isCustom?: boolean;
}

export type VoiceTier = 'free' | 'premium';

export interface CharacterAnchor {
  characterId: string;
  characterName: string;
  referenceImage: string;
  identityToken: string;
  loraTag: string;
  loraWeight: number;
  facialEmbedding?: {
    eyeColor?: string;
    eyeShape?: string;
    hairStyle?: string;
    hairColor?: string;
    skinTone?: string;
    faceStructure?: string;
    distinguishingFeatures?: string;
    summary?: string;
  };
  bodyEmbedding?: {
    build?: string;
    silhouette?: string;
    skinTexture?: string;
  };
  isAnchored: boolean;
  updatedAt: number;
}

export interface DecodedPromptSlots {
  subject: string;
  mainAction: string;
  physicalDetails: string;
  emotion: string;
  environment: string;
  camera: string;
  intensity: 'suave' | 'moderada' | 'intensa' | 'explicita';
  rawNarrative: string;
  formattedPrompt: string;
  identityTokenApplied?: string;
  loraWeightApplied?: number;
}

export interface CoherenceAnalysis {
  overallScore: number;
  identityMatchScore: number;
  actionFidelityScore: number;
  sharpnessScore: number;
  status: 'aprobado' | 'recalibrado' | 'inspeccion_sugerida';
  attemptCount: number;
  feedbackNotes: string[];
  adjustedWeightsApplied?: Record<string, number>;
}


