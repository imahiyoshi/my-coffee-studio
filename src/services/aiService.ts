import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-1.5-flash";

export async function generateCoffeeAdvice(beansName: string, roastLevel: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
以下のコーヒー豆の情報に基づいて、抽出アドバイスを生成してください。

豆の名前: ${beansName}
焙煎度: ${roastLevel || '不明'}

指示事項:
1. Twinbird全自動コーヒーメーカー（温度は83度か90度、挽き目は粗・中・細の3段階）を使用することを前提とする。
2. 対象のコーヒー豆の一般的な特徴を簡潔に解説する。
3. 対象の焙煎度に応じた、Twinbirdでの推奨設定（温度と挽き目）とその理由を提示する。
4. 簡潔で親しみやすいトーンで回答する。
5. 回答は日本語で行う。
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    return response.text || "アドバイスを生成できませんでした。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
