import { StoryScenario, Message } from '../types';
import { OFFICIAL_PRESENTATION_SCENARIO } from './scenarios';

export const ADMIN_EMAILS = [
  'marketshopusafl@gmail.com',
  'madevatrashbin@gmail.com'
];

export const ADMIN_EMAIL = 'marketshopusafl@gmail.com';

export const isAdminUser = (userOrEmail?: any): boolean => {
  if (!userOrEmail) return false;
  const email = typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email;
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(adm => adm.toLowerCase() === clean);
};

export const ADMIN_AHIJADA_SCENARIO: StoryScenario = {
  id: 'story_1788622260799',
  title: 'Mi Ahijada',
  storyType: 'Romance y Tensión Prohibida',
  personaId: 'caracas_susan',
  characterRole: 'ahijada',
  characterName: 'Camila',
  userRole: 'padrino',
  userName: 'willian',
  synopsis: 'Un encuentro inesperado y prohibido entre padrino y ahijada.',
  coverImage: '/uploads/cover_story_1788622260799.mp4',
  createdAt: 1788622260799,
  updatedAt: 1788622260799
};

export const ADMIN_SECRETARIA_SCENARIO: StoryScenario = {
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

export const ADMIN_SUSAN_SCENARIO: StoryScenario = {
  id: 'story_1788499485974',
  title: 'Samantha y su gemela Susan',
  synopsis: 'William visita la casa de su novia Samantha de 18 años y por error entra a la habitación de su gemela Susan en plena madrugada...',
  characterName: 'Susan',
  characterRole: 'hermana gemela de Samantha',
  userRole: 'novio de Samantha',
  userName: 'William',
  storyType: 'Juego de Roles',
  isExplicit18: true,
  personaId: 'ven_ccs',
  voiceStyle: 'scarlett_hd',
  coverImage: '/uploads/currentCardMedia.mp4'
};

export const ADMIN_TEST_SCENARIOS: StoryScenario[] = [];

export const ADMIN_TEST_MESSAGES_SUSAN: Message[] = [
  {
    id: 'susan_msg_1',
    sender: 'model',
    text: '*Me sobresalto un poco sobre la cama al escuchar el chirrido de la puerta y me cubro a medias con la sábana, mirándote sorprendida con una sonrisa maliciosa* ¿William...? ¿Qué haces metido en mi cuarto a las dos de la madrugada? Samantha se quedó profundamente dormida en el sofá de la sala... y yo no llevo casi nada puesto.',
    timestamp: Date.now() - 120000
  },
  {
    id: 'susan_msg_2',
    sender: 'user',
    text: '*Me quedo congelado en la penumbra frente a la cama, tragando saliva al notar tu silueta* Susan... discúlpame, la casa estaba totalmente a oscuras y juré que esta era la habitación de Samantha...',
    timestamp: Date.now() - 60000
  },
  {
    id: 'susan_msg_3',
    sender: 'model',
    text: '*Bajo lentamente las piernas al borde de la cama mientras aparto un mechón de pelo, mirándote de arriba a abajo fijamente* Pues ya ves que no es la de Samantha... es la mía. Pero no veo que te estés dando la vuelta para salir corriendo, William... ¿o es que te dio curiosidad ver cómo duermo?',
    timestamp: Date.now() - 10000
  }
];
