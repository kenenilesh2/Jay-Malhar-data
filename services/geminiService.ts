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

  // Summarize data to send to LLM (prevent token overflow if data is huge)
  // We send a JSON representation of the last 50 entries and last 20 payments for context
  const entriesContext = entries.slice(0, 100).map(e => ({
    date: e.date,
    material: e.material,
    qty: e.quantity,
    unit: e.unit,
    challan: e.challanNumber
  }));

  const paymentsContext = payments.slice(0, 50).map(p => ({
    date: p.date,
    supplier: p.supplierName,
    amount: p.amount,
    notes: p.notes
  }));

  const prompt = `
    You are an AI assistant for "Jay Malhar Enterprises", a construction supply firm.
    We supply materials (Sand, Metal, Water) and Machinery (JCB, Dumper) to the site "Arihant Aaradhya".
    
    Here is a subset of the recent data:
    Entries: ${JSON.stringify(entriesContext)}
    Payments: ${JSON.stringify(paymentsContext)}
    
    User Question: "${question}"
    
    Please provide a concise, professional business insight or answer based on the data provided. 
    If you calculate totals, show your work briefly. If the data provided doesn't cover the answer, state that clearly.
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