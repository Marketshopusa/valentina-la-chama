import { StoryScenario, Message } from '../types';
import { OFFICIAL_PRESENTATION_SCENARIO } from './scenarios';

export const ADMIN_EMAIL = 'marketshopusafl@gmail.com';
export const ADMIN_DEFAULT_PASSWORD = 'admin';

export const isAdminUser = (email?: string | null): boolean => {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export const ADMIN_SUSAN_SCENARIO: StoryScenario = {
  id: 'historia_susan_test',
  title: 'Susan - Secretaria Ejecutiva',
  synopsis: 'Una reunión tardía en la oficina ejecutiva después de cerrar un trato multimillonario.',
  characterName: 'Susan',
  characterRole: 'secretaria ejecutiva',
  userRole: 'jefe ejecutivo',
  userName: 'William',
  storyType: 'Romance y Tensión',
  isExplicit18: true,
  personaId: 'ven_ccs',
  coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1500',
  development: 'Susan es una mujer inteligente, elegante y apasionada que ha trabajado contigo durante dos años.'
};

export const ADMIN_TEST_SCENARIOS: StoryScenario[] = [
  ADMIN_SUSAN_SCENARIO,
  OFFICIAL_PRESENTATION_SCENARIO
];

export const ADMIN_TEST_MESSAGES_SUSAN: Message[] = [
  {
    id: 'msg_susan_seed_1',
    sender: 'model',
    text: '*Te mira fijamente con una sonrisa sugerente mientras acomoda los últimos informes sobre el escritorio.* Parece que terminamos por fin con todos los números de hoy, señor... ¿o todavía tiene algún pendiente confidencial para nosotros dos?',
    timestamp: Date.now() - 60000
  }
];
