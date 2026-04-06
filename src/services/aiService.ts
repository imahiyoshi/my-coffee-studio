import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-3-flash-preview";

export async function generateCoffeeAdvice(beansName: string, roastLevel: string) {
  // AI Studio環境では process.env.GEMINI_API_KEY を使用します
  let apiKey = '';
  try {
    apiKey = process.env.GEMINI_API_KEY || '';
  } catch (e) {
    console.warn("process.env.GEMINI_API_KEY is not accessible directly.");
  }

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    throw new Error("APIキーが設定されていません。設定メニューから確認してください。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
コーヒー豆「${beansName}」（焙煎度: ${roastLevel || '不明'}）について、
Twinbird全自動コーヒーメーカー（83度/90度、粗/中/細）での抽出アドバイスを300文字程度で教えてください。
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt, // シンプルな文字列形式に変更
    });
    
    return response.text || "アドバイスを生成できませんでした。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
