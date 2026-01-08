
export enum ModelType {
  FLASH_LITE = 'gemini-flash-lite-latest',
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview',
  IMAGE = 'gemini-2.5-flash-image',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string; // Used for text content display
  timestamp: number;
  botId: string;
  isImage?: boolean; // If true, it's a GENERATED image
  imageUrl?: string;
  groundingChunks?: GroundingChunk[];
  attachedImage?: { // Image UPLOADED by user
    data: string;
    mimeType: string;
  };
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  model: ModelType;
  avatarColor: string;
  icon: string;
  isDefault?: boolean;
  useSearch?: boolean;
}

export interface ChatSession {
  botId: string;
  messages: Message[];
}

export interface BotFormData {
  name: string;
  description: string;
  systemInstruction: string;
  model: ModelType;
  avatarColor: string;
  icon: string;
  useSearch?: boolean;
}
