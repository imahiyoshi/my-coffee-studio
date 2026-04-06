import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

admin.initializeApp();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateCoffeeAdvice = functions.region('asia-northeast1').firestore
  .document('records/{recordId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data) return null;

    const { beansName, roastLevel } = data;
    if (!beansName) return null;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
以下のコーヒー豆の情報に基づいて、抽出アドバイスを生成してください。

豆の名前: ${beansName}
焙煎度: ${roastLevel || '不明'}

指示事項:
1. Twinbird全自動コーヒーメーカー（温度は83度か90度、挽き目は粗・中・細の3段階）を使用することを前提とする。
2. 対象のコーヒー豆の一般的な特徴を簡潔に解説する。
3. 対象の焙煎度に応じた、Twinbirdでの推奨設定（温度と挽き目）とその理由を提示する。
4. 簡潔で親しみやすいトーンで回答する。
`;

    try {
      const result = await model.generateContent(prompt);
      const advice = result.response.text();

      return snapshot.ref.update({
        aiAdvice: advice,
        aiStatus: 'completed'
      });
    } catch (error) {
      console.error('Error generating AI advice:', error);
      return snapshot.ref.update({
        aiStatus: 'error'
      });
    }
  });
