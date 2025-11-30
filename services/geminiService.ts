
import { GoogleGenAI } from "@google/genai";
import { MaterialEntry, SupplierPayment } from "../types";

export const analyzeBusinessData = async (
  entries: MaterialEntry[], 
  payments: SupplierPayment[], 
  question: string
): Promise<string> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key not configured. Please add API_KEY to environment variables to use AI features.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const entriesContext = entries.slice(0, 50).map(e => ({
    d: e.date,
    m: e.material,
    q: e.quantity,
    u: e.unit
  }));

  const prompt = `
    You are an AI assistant for "Jay Malhar Enterprises".
    
    Data Context:
    1. Daily Site Entries (System): ${JSON.stringify(entriesContext)}
    
    User Question: "${question}"
    
    Answer concisely. 
    Use the Daily Entries if the user asks about "Material supplied today/recently".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I encountered an error while analyzing the data.";
  }
};
