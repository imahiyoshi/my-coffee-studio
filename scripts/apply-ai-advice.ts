import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
以下のコーヒー豆の情報に基づいて、抽出アドバイスを生成してください。

豆の名前: ${beansName}
焙煎度: ${roastLevel || '不明'}

指示事項:
1. Twinbird全自動コーヒーメーカー（温度は83度か90度、挽き目は粗・中・細の3段階）を使用することを前提とする。
2. 全体的に文章を極めて短く、簡潔にまとめること。
3. 構成は以下の通りとする：
   - ### [豆の名前] の特徴
     豆の一般的な特徴を1〜2文で。
   - ### 推奨設定
     推奨温度と推奨挽き目のみを記載（理由は不要）。
     例：
     - 推奨温度: 90度
     - 推奨挽き目: 中
   - ### アドバイス
     具体的な調整のヒントを60文字以上150文字以内で記載。
     「味を見て調整してください」のような抽象的な表現は禁止し、
     「苦味が強い場合は温度を83度に下げる」「酸味を立たせたい場合は挽き目を細かくする」など、
     具体的かつ実践的なアクションを提示すること。
4. 挨拶や結びの言葉は省き、事実のみを伝える。
`,
      });

      const advice = response.text;

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
