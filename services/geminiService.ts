import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

const getAI = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// 1. Chatbot (Gemini 3 Pro)
export const createChatSession = (): Chat => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'You are an advanced AI assistant for a 3D Solar System simulator. You are helpful, scientific, and concise. You can answer questions about astronomy, physics, and the specific simulation.',
    },
  });
};

// 2. Search Grounding (Gemini 2.5 Flash)
export const searchFact = async (query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "No information found.";
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .flat()
    .filter((source: any) => source) || [];

  return { text, sources };
};

// 3. Image Editing (Gemini 2.5 Flash Image - Nano Banana)
export const generateTexture = async (prompt: string, baseImageBase64?: string): Promise<string | null> => {
  const ai = getAI();
  
  // If we have a base image, we are "editing" it (or using it as reference).
  // If not, we generate from scratch.
  
  let contents: any = { parts: [] };
  
  if (baseImageBase64) {
      // Clean base64 string if it has prefix
      const cleanBase64 = baseImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      contents.parts.push({
          inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
          }
      });
  }

  contents.parts.push({ text: `Create a spherical texture for a planet. ${prompt}. Ensure it is seamless and high contrast.` });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Texture generation failed:", error);
  }
  return null;
};

// 4. Fast Logic (Gemini 2.5 Flash Lite)
export const getFastResponse = async (query: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: query,
    });
    return response.text || "";
  } catch (e) {
    return "";
  }
};
