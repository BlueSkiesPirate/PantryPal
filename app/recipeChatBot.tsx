import { GoogleGenAI } from "@google/genai";


export default class RecipeAIService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_KEY as string;
    this.ai = new GoogleGenAI({ apiKey });
  }

  async recommendRecipes(inventoryItems: any[]): Promise<string> {
    // Extract product names from inventory items (handles both strings and objects)
    const cleanedInventory = inventoryItems
      .map((item) => {
        // If it's an object with productName, use that; otherwise treat as string
        return typeof item === 'string' ? item.trim() : (item.productName || '').trim();
      })
      .filter((item) => item.length > 0);

    const prompt = `
The user has the following ingredients:

${cleanedInventory.join(", ")}

Recommend around 20 recipes that use some or all of these ingredients.

Return ONLY in this format:
Recipe Title - Recipe Link

Rules:
- Only include title and link
- No descriptions
- One recipe per line
;`

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text ?? "";
  }
}
