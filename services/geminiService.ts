
import { GoogleGenAI, Modality } from "@google/genai";
import { ModelType, Message, GroundingChunk } from '../types';

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: ModelType.IMAGE,
    contents: { parts: [{ text: prompt }] },
  });

  if (!response.candidates?.[0]?.content?.parts) throw new Error("No parts returned");

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No se pudo generar la imagen");
};

export const textToSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Lee esto con tono natural: ${text.substring(0, 1000)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");
  return base64Audio;
};

export const streamResponse = async (
  modelId: ModelType,
  systemInstruction: string,
  history: Message[],
  newMessage: string,
  useSearch: boolean,
  attachedImage: { data: string; mimeType: string } | null,
  onChunk: (text: string) => void,
  onGrounding?: (chunks: GroundingChunk[]) => void
): Promise<string> => {
  const ai = getClient();
  
  const chatContents = history
    .filter(msg => !msg.isImage)
    .map(msg => {
      const parts: any[] = [{ text: msg.content }];
      if (msg.attachedImage) {
        parts.push({
          inlineData: {
            data: msg.attachedImage.data,
            mimeType: msg.attachedImage.mimeType
          }
        });
      }
      return {
        role: msg.role,
        parts: parts
      };
    });

  // Add the current message
  const currentParts: any[] = [{ text: newMessage }];
  if (attachedImage) {
    currentParts.push({
      inlineData: {
        data: attachedImage.data,
        mimeType: attachedImage.mimeType
      }
    });
  }
  
  chatContents.push({ role: 'user', parts: currentParts });

  const config: any = {
    systemInstruction: systemInstruction,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  if (modelId === ModelType.PRO) {
    config.thinkingConfig = { includeThinkingProcess: true };
  }

  try {
    const stream = await ai.models.generateContentStream({
      model: modelId,
      contents: chatContents,
      config: config
    });

    let fullText = "";
    let lastChunk: any = null;
    for await (const chunk of stream) {
      lastChunk = chunk;
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.text) {
            fullText += part.text;
            onChunk(fullText);
          }
        }
      }
    }

    if (useSearch && lastChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = lastChunk.candidates[0].groundingMetadata.groundingChunks
        .filter((c: any) => !!c.web)
        .map((c: any) => ({
          web: {
            uri: c.web?.uri || "",
            title: c.web?.title || ""
          }
        }));
      onGrounding?.(chunks as GroundingChunk[]);
    }

    return fullText;
  } catch (error) {
    console.error("Error en Gemini API:", error);
    throw error;
  }
};

export const enhancePrompt = async (prompt: string, type: 'image' | 'video' | 'general'): Promise<string> => {
  const ai = getClient();
  const systemPrompt = `Eres un experto Ingeniero de Prompts. Tu tarea es recibir una idea simple y convertirla en un prompt técnico, detallado y profesional de alta calidad.
    Si el tipo es 'image', crea un prompt visual descriptivo incluyendo iluminación, estilo artístico (fotorealista, digital, etc.) y composición.
    Si el tipo es 'video', crea un prompt cinemático detallando movimiento de cámara, atmósfera y narrativa visual.
    Responde ÚNICAMENTE con el prompt mejorado, sin introducciones ni explicaciones.`;

  const response = await ai.models.generateContent({
    model: ModelType.FLASH,
    contents: [{ parts: [{ text: `Idea: ${prompt}\nTipo: ${type}` }] }],
    config: { systemInstruction: systemPrompt }
  });

  return response.text || prompt;
};
