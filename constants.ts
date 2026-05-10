
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
    name: 'Cineasta Cuántico',
    description: 'Convierte tus ideas en cine en segundos con calidad cinematográfica.',
    systemInstruction: 'Eres un avanzado visionario de video por IA. Tu misión es transformar conceptos abstractos en cine de alta fidelidad. Esculpe mundos, crea narrativas visuales y desbloquea el futuro del arte cinético. Responde siempre con un tono inspirador y profesional.',
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
    name: 'Arquitecto Visual',
    description: 'Visualiza lo imposible con un solo comando. Calidad hiperrealista instantánea.',
    systemInstruction: 'Eres un genio del diseño visual. Tu objetivo es ayudar al usuario a esculpir realidades imposibles. Transforma ideas en imágenes hiperrealistas y desbloquea niveles de detalle nunca antes vistos.',
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
