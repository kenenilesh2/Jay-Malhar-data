
import { GoogleGenAI } from "@google/genai";
import { MaterialEntry, SupplierPayment } from "../types";
import { CLIENT_LEDGER_DATA } from "./clientLedgerData";

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

  // Summarize Ledger Data
  const totalBilled = CLIENT_LEDGER_DATA.reduce((acc, curr) => acc + curr.credit, 0);
  const totalReceived = CLIENT_LEDGER_DATA.reduce((acc, curr) => acc + curr.debit, 0);
  
  const ledgerContext = {
    summary: `Historical Data (Arihant Ledger): Total Billed: ${totalBilled}, Total Received: ${totalReceived}`,
    recentTransactions: CLIENT_LEDGER_DATA.slice(-15)
  };

  const prompt = `
    You are an AI assistant for "Jay Malhar Enterprises".
    
    Data Context:
    1. Daily Site Entries (System): ${JSON.stringify(entriesContext)}
    2. Client Ledger (Arihant Superstructures): ${JSON.stringify(ledgerContext)}
    
    User Question: "${question}"
    
    Answer concisely. 
    - Use "Client Ledger" data if asked about "Arihant", "Client Billing", "History" or "Ledger".
    - Use "Daily Site Entries" if asked about specific material loads recently.
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
