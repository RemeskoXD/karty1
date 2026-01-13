import { GoogleGenAI } from "@google/genai";
import { Suit, Rank } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCardText = async (suit: Suit, rank: Rank): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key missing for Gemini");
    return "Vložte vlastní text...";
  }

  try {
    const prompt = `Jsi kreativní copywriter pro luxusní karetní hru.
    Napiš krátký, vtipný nebo poetický text (max 6 slov) v češtině, který by se hodil na hrací kartu.
    
    Karta: ${rank} - ${suit}.
    
    Text by měl být úderný a stylový.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 50,
        temperature: 0.9,
      }
    });

    return response.text?.trim() || "Vlastní text...";
  } catch (error) {
    console.error("Error generating text:", error);
    return "Chyba generování.";
  }
};