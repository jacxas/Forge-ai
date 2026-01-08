
import { GoogleGenAI, Modality } from "@google/genai";
import { ModelType, Message, GroundingChunk } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: ModelType.IMAGE,
    contents: { parts: [{ text: prompt }] },
  });

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
    model: "gemini-2.5-flash-preview-tts",
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
    config.thinkingConfig = { thinkingBudget: 2000 };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: chatContents,
      config: config
    });

    const text = response.text || "";
    onChunk(text);

    if (useSearch && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      onGrounding?.(response.candidates[0].groundingMetadata.groundingChunks);
    }

    return text;
  } catch (error) {
    console.error("Error en Gemini API:", error);
    throw error;
  }
};
