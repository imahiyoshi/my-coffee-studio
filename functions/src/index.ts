import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

admin.initializeApp();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateCoffeeAdvice = functions.region('asia-northeast1').firestore
  .document('records/{recordId}')
  .onWrite(async (change, context) => {
    // Cloud FunctionでのGemini呼び出しはガイドラインにより禁止されているため、
    // フロントエンド側（RecordDetail.tsx）で生成処理を行うように変更しました。
    // この関数は将来的な拡張のために残していますが、現在は何もしません。
    return null;
  });
