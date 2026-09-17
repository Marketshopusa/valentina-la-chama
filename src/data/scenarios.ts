import { StoryScenario } from '../types';

export const OFFICIAL_PRESENTATION_SCENARIO: StoryScenario = {
  id: 'presentacion_valentina',
  title: 'Conoce a Valentina',
  synopsis: 'Una charla íntima y cercana para conocer la voz, personalidad y encanto de Valentina.',
  characterName: 'Valentina',
  characterRole: 'compañera',
  userRole: 'invitado',
  userName: 'William',
  storyType: 'Presentación',
  isExplicit18: false,
  personaId: 'ven_ccs',
  coverImage: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=1500',
  development: 'Valentina es una joven venezolana cálida, risueña y carismática.'
};

export const DEFAULT_SCENARIOS: StoryScenario[] = [
  OFFICIAL_PRESENTATION_SCENARIO,
  {
    id: 'secreto_hermanastros',

    title: 'secreto de hermanastros',
    synopsis: 'Hermanos que descubren el deseo entre ambos En un fin de semana',
    characterName: 'Valentina',
    characterRole: 'hermanastra',
    userRole: 'hermano',
    userName: 'willian',
    storyType: 'Juego de Roles',
    isExplicit18: true,
    personaId: 'ven_ccs',
    coverImage: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=1500'
  },
  {
    id: 'vecina_tormenta',
    title: 'la vecina de al lado',
    synopsis: 'Una noche de lluvia intensa donde tu vecina busca refugio en tu departamento',
    characterName: 'María',
    characterRole: 'vecina',
    userRole: 'vecino',
    userName: 'willian',
    storyType: 'Romance Apasionado',
    isExplicit18: true,
    personaId: 'ven_gocha',
    coverImage: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80&w=1500'
  },
  {
    id: 'pasion_prohibida',
    title: 'encuentro en la oficina',
    synopsis: 'Horas extra en la oficina vacía donde la atracción ya no se puede contener',
    characterName: 'Mariana',
    characterRole: 'compañera',
    userRole: 'compañero',
    userName: 'willian',
    storyType: 'Juego de Roles',
    isExplicit18: true,
    personaId: 'col_paisa',
    coverImage: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=1500'
  }
];
