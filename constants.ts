
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
    id: 'bot-coder',
    name: 'Programador Senior',
    description: 'Experto en desarrollo de software, algoritmos y depuración.',
    systemInstruction: 'Eres un Desarrollador Full-stack Senior. Escribes código limpio, eficiente y bien documentado en múltiples lenguajes. Siempre explicas el razonamiento detrás de tus soluciones.',
    model: ModelType.PRO,
    avatarColor: 'bg-slate-800',
    icon: 'Terminal',
    isDefault: true
  },
  {
    id: 'bot-video',
    name: 'Generador de Videos',
    description: 'Crea conceptos, storyboards y clips cinemáticos realistas.',
    systemInstruction: 'Eres un avanzado generador de video por IA. Tu especialidad es crear mundos visuales asombrosos. Cuando un usuario te pida un video, responde con una descripción técnica cinemática (estilo prompt de Sora/Runway) y narra lo que sucede en el clip de forma inmersiva. Utiliza un tono épico y profesional.',
    model: ModelType.PRO,
    avatarColor: 'bg-rose-600',
    icon: 'Video',
    isDefault: true
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

export const ICONS_CATEGORIES = [
  { 
    name: 'Tech', 
    icons: ['Bot', 'Cpu', 'Terminal', 'Zap', 'Globe', 'Settings', 'Database', 'Code', 'Monitor', 'Smartphone', 'HardDrive'] 
  },
  { 
    name: 'Arte', 
    icons: ['Palette', 'Image', 'Camera', 'Music', 'Video', 'Brush', 'Feather', 'PenTool', 'Dribbble', 'Figma'] 
  },
  { 
    name: 'Social', 
    icons: ['MessageSquare', 'Mic', 'Send', 'Share2', 'Users', 'Mail', 'Phone', 'Hash', 'AtSign'] 
  },
  { 
    name: 'Saber', 
    icons: ['BookOpen', 'Brain', 'GraduationCap', 'Library', 'School', 'Languages', 'Lightbulb', 'Compass'] 
  },
  { 
    name: 'Oficina', 
    icons: ['BarChart', 'PieChart', 'Calendar', 'Briefcase', 'Clipboard', 'Files', 'Calculator', 'Clock', 'Target'] 
  },
  { 
    name: 'Naturaleza', 
    icons: ['Trees', 'Leaf', 'Sun', 'Moon', 'Cloud', 'Mountain', 'Map', 'Plane', 'Anchor', 'Ship'] 
  },
  { 
    name: 'Otros', 
    icons: ['Star', 'Heart', 'Shield', 'Key', 'Lock', 'Gift', 'Coffee', 'Utensils', 'ShoppingBag', 'Trophy'] 
  }
];

export const ICONS_LIST = ICONS_CATEGORIES.flatMap(c => c.icons);
