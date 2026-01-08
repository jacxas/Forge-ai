
import { Bot, ModelType } from './types';

export const DEFAULT_BOTS: Bot[] = [
  {
    id: 'bot-general',
    name: 'Asistente General',
    description: 'Ayuda con tareas generales, preguntas y escritura.',
    systemInstruction: 'Eres un asistente de IA útil, amable y conciso.',
    model: ModelType.FLASH,
    avatarColor: 'bg-blue-500',
    icon: 'Bot',
    isDefault: true
  },
  {
    id: 'bot-search',
    name: 'Explorador Web',
    description: 'Busca en internet para darte información actualizada.',
    systemInstruction: 'Eres un investigador experto. Utilizas la búsqueda de Google.',
    model: ModelType.FLASH,
    avatarColor: 'bg-emerald-500',
    icon: 'Globe',
    isDefault: true,
    useSearch: true
  },
  {
    id: 'bot-narrator',
    name: 'El Narrador',
    description: 'Cuenta historias fantásticas y relatos épicos con voz.',
    systemInstruction: 'Eres un cuentacuentos legendario. Escribes de forma descriptiva, poética y envolvente. Tus historias suelen ser de fantasía o ciencia ficción.',
    model: ModelType.PRO,
    avatarColor: 'bg-orange-600',
    icon: 'BookOpen',
    isDefault: true
  },
  {
    id: 'bot-artist',
    name: 'Artista Digital',
    description: 'Genera imágenes asombrosas a partir de tus descripciones.',
    systemInstruction: 'Eres un artista digital experto.',
    model: ModelType.IMAGE,
    avatarColor: 'bg-gradient-to-br from-purple-500 to-pink-500',
    icon: 'Palette',
    isDefault: true
  }
];

export const ICONS_LIST = ['Bot', 'Terminal', 'Feather', 'BarChart', 'Brain', 'Zap', 'Globe', 'MessageSquare', 'Palette', 'Search', 'Cpu', 'BookOpen', 'Mic'];
