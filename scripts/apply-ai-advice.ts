import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin
// Make sure to set GOOGLE_APPLICATION_CREDENTIALS or provide service account key
admin.initializeApp();

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function applyAIAdvice() {
  console.log('Starting AI Advice retroactive application...');
  
  const recordsRef = db.collection('records');
  const snapshot = await recordsRef.where('aiStatus', '==', null).get();
  
  if (snapshot.empty) {
    console.log('No records found without AI status.');
    return;
  }

  console.log(`Found ${snapshot.size} records to process.`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const { beansName, roastLevel } = data;
    
    if (!beansName) {
      console.log(`Skipping record ${doc.id} (no beansName).`);
      continue;
    }

    console.log(`Processing record ${doc.id}: ${beansName}...`);

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

      await doc.ref.update({
        aiAdvice: advice,
        aiStatus: 'completed'
      });
      console.log(`Updated record ${doc.id} successfully.`);
    } catch (error) {
      console.error(`Error processing record ${doc.id}:`, error);
      await doc.ref.update({
        aiStatus: 'error'
      });
    }
  }

  console.log('Finished processing all records.');
}

applyAIAdvice().catch(console.error);
