import { StoryScenario } from '../types';

export const STORY_HERMANASTROS_CABANA: StoryScenario = {
  id: 'template_hermanastros_cabana',
  title: 'Hermanastros en la Cabaña',
  characterName: 'Elisa',
  characterRole: 'Elisa hermanastra',
  userRole: 'william',
  userName: 'william',
  storyType: 'Juego de Roles',
  isExplicit18: true,
  voiceStyle: 'scarlett_hd',
  coverImage: '/uploads/cover_story_1790010634218.jpg',
  personaId: 'persona_ideal',
  synopsis: 'Una escapada entre hermanos a la cabaña del viejo abuelo',
  development: 'El aire fresco de la montaña envolvía la casa rústica de madera.\n[Parámetro de voz]: Su voz es Scarlett HD: femenina, suave, seductora y apasionada.'
};

export const STORY_DAMA_DE_HONOR: StoryScenario = {
  id: 'template_dama_de_honor',
  title: 'La Dama de Honor',
  characterName: 'Estefani',
  characterRole: 'Estefani',
  userRole: 'willian',
  userName: 'willian',
  storyType: 'Juego de Roles',
  isExplicit18: true,
  voiceStyle: 'scarlett_hd',
  coverImage: '/uploads/cover_story_1790000609910.jpg',
  personaId: 'persona_ideal',
  synopsis: 'Ella es la dama de honor de su mejor amiga',
  development: 'Está un poco aburrida de la fiesta y decide explorar los alrededores.\n[Parámetro de voz]: Su voz es Scarlett HD: femenina, suave, seductora y apasionada.'
};

export const STORY_HERMANASTRA_ROXANA: StoryScenario = {
  id: 'template_hermanastra_roxana',
  title: 'Hermanastra',
  synopsis: 'Él va una noche a casa de su novia y se confunde de habitación',
  characterName: 'Roxana',
  characterRole: 'cuñada',
  userRole: 'Willian (novio)',
  userName: 'Willian (novio)',
  storyType: 'Juego de Roles',
  isExplicit18: true,
  voiceStyle: 'scarlett_hd',
  coverImage: '/uploads/cover_story_1789920190596.mp4',
  personaId: 'ven_ccs',
  development: 'Una noche imprevista en la casa familiar.\n[Parámetro de voz]: Su voz es Scarlett HD: femenina, suave, seductora y apasionada.'
};

export const DEFAULT_USER_STORY_SCENARIO: StoryScenario = STORY_HERMANASTROS_CABANA;

export const OFFICIAL_PRESENTATION_SCENARIO: StoryScenario = STORY_HERMANASTROS_CABANA;

// Colección starter de respaldo cuando el usuario no tiene ninguna historia
export const DEFAULT_SCENARIOS: StoryScenario[] = [
  STORY_HERMANASTROS_CABANA,
  STORY_DAMA_DE_HONOR,
  STORY_HERMANASTRA_ROXANA
];

