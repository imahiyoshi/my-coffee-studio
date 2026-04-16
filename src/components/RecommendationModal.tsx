import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CoffeeRecord, Recommendation } from '../types';
import { X, Sparkles, Loader2, MapPin, Tag, Coffee, Trash2, ArrowUpRight } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { format } from 'date-fns';

interface RecommendationModalProps {
  user: User;
  records: CoffeeRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export default function RecommendationModal({ user, records, isOpen, onClose }: RecommendationModalProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // 複合インデックスによるエラーを避けるため、フィルタリングのみFirestoreで行う
    const q = query(
      collection(db, 'recommendations'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: Recommendation[] = [];
      snapshot.forEach((doc) => {
        recs.push({ id: doc.id, ...doc.data() } as Recommendation);
      });
      // メモリ上で新しい順にソート
      recs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      setRecommendations(recs);
      setLoading(false);
    }, (error) => {
      console.error("Fetch recommendations error:", error);
      handleFirestoreError(error, OperationType.GET, 'recommendations');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, user.uid]);

  // Initial trigger if none exists
  useEffect(() => {
    if (isOpen && !loading && recommendations.length === 0 && !generating) {
      handleGenerate();
    }
  }, [isOpen, loading, recommendations.length]);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setErrorMsg('');

    try {
      // 分析：評価が4以上、もしくはお気に入りの豆を「好きな豆」として抽出
      const likedRecords = records.filter(r => (r.rating || 0) >= 4 || r.isFavorite);
      const likedBeans = likedRecords.map(r => r.beansName).join(', ');
      
      // テイストの傾向
      const allTastes = likedRecords.flatMap(r => r.tastes || []);
      const tasteSummary = Array.from(new Set(allTastes)).join(', ');
      
      // 過去に提案した豆のリスト（同じ豆を避けるため）
      const pastRecs = recommendations.map(r => r.name).join(', ');

      const prompt = `
あなたはプロのバリスタです。ユーザーのコーヒーの好みに合わせて、新しいおすすめのコーヒー豆を**1つ**提案してください。
カルディ、コストコ、ブルックスなどの有名店や、専門店、オンライン通販などで購入できる豆を幅広く検索して選んでください。

[ユーザーの好み（過去に高く評価した傾向）]
好きな豆: ${likedBeans || 'まだデータがありませんが、一般的な万人受けする美味しい豆をお願いします'}
好みのテイスト: ${tasteSummary || '特に指定なし'}

[除外リスト (過去に提案済みのため避けてください)]
${pastRecs || 'なし'}

最新の情報に基づき、以下のJSONフォーマットで出力してください。Markdownのコードブロック（\`\`\`json など）を含めず、純粋なJSONテキストのみを出力してください。
{
  "name": "豆の名称（例: カルディ マイルドカルディ、〇〇珈琲店 エチオピア イルガチェフェ G1 など販売店がわかるよう記載）",
  "origin": "産地（国や地域）",
  "taste": "味の特徴、なぜおすすめなのか（80文字程度）",
  "estimatedPrice": "大体の価格・相場（例: 200g 1200円程度）"
}
`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          // Google検索グラウンディングを有効化して最新情報を取得
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const jsonText = response.text || "{}";
      
      // Markdownブロックや余分なテキストを除去してJSON部分のみを抽出
      const match = jsonText.match(/\{[\s\S]*\}/);
      const cleanJson = match ? match[0] : "{}";
      const recData = JSON.parse(cleanJson);

      if (recData.name && recData.origin) {
        const newRef = doc(collection(db, 'recommendations'));
        await setDoc(newRef, {
          userId: user.uid,
          name: recData.name,
          origin: recData.origin,
          taste: recData.taste || '',
          estimatedPrice: recData.estimatedPrice || '',
          createdAt: serverTimestamp()
        });
      } else {
        throw new Error("AIが正しい情報を生成できませんでした。");
      }
    } catch (error: any) {
      console.error("Recommendation generation error:", error);
      let message = error.message || "生成中にエラーが発生しました。";
      if (message.includes("API key is missing")) {
        message = "AIと通信するためのAPIキーが正しく読み込めていません。システムの設定や状況をご確認いただくか、時間をおいて再試行してください。";
      }
      setErrorMsg(message);
    } finally {
      setGenerating(false);
    }
  };

  const deleteRecommendation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recommendations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recommendations/${id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-opacity">
      <div 
        className="bg-stone-50 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200"
      >
        <div className="bg-white px-6 py-4 border-b border-stone-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-stone-900">AIおすすめ豆</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 最新の提案（トップに表示） */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">今日の提案</h3>
              <button 
                onClick={handleGenerate}
                disabled={generating}
                className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {generating ? <><Loader2 className="w-3 h-3 animate-spin"/>検索中...</> : '別の豆を見る'}
              </button>
            </div>

            {generating ? (
               <div className="bg-white rounded-2xl p-8 border border-stone-100 flex flex-col items-center justify-center text-stone-400 shadow-sm">
                 <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
                 <p className="font-medium">好みを分析し、最新情報を検索中...</p>
                 <p className="text-xs mt-2 text-stone-400">※初回は少し時間がかかります</p>
               </div>
            ) : errorMsg ? (
               <div className="bg-white rounded-2xl p-8 border border-red-100 flex flex-col items-center justify-center text-red-500 shadow-sm">
                 <p className="font-medium mb-4">{errorMsg}</p>
                 <button 
                   onClick={handleGenerate} 
                   className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-colors"
                 >
                   もう一度試す
                 </button>
               </div>
            ) : recommendations[0] ? (
              <div className="bg-white rounded-2xl p-5 border-2 border-amber-100 shadow-sm relative overflow-hidden group">
                <div className="absolute -top-6 -right-6 text-amber-50/50 group-hover:scale-110 transition-transform duration-500">
                  <Coffee className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-3">
                  <h4 className="text-lg font-bold text-stone-900 leading-tight">
                    {recommendations[0].name}
                  </h4>
                  
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="flex items-center gap-1 px-2 py-1 bg-stone-100 text-stone-600 rounded-lg">
                      <MapPin className="w-3 h-3" />
                      {recommendations[0].origin}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-stone-100 text-stone-600 rounded-lg">
                      <Tag className="w-3 h-3" />
                      {recommendations[0].estimatedPrice}
                    </span>
                  </div>

                  <p className="text-sm text-stone-600 leading-relaxed pt-2 border-t border-stone-100">
                    {recommendations[0].taste}
                  </p>
                </div>
              </div>
            ) : (
               <div className="bg-white rounded-2xl p-8 border border-stone-100 flex flex-col items-center justify-center text-stone-400 shadow-sm">
                 <p className="font-medium mb-4">まだ提案がありません</p>
                 <button 
                   onClick={handleGenerate} 
                   className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg font-bold transition-colors"
                 >
                   診断を開始する
                 </button>
               </div>
            )}
          </div>

          {/* 履歴リスト */}
          {recommendations.length > 1 && (
            <div className="space-y-4 pt-4 border-t border-stone-200">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">過去の提案履歴</h3>
              <div className="space-y-3">
                {recommendations.slice(1).map((rec) => (
                  <div key={rec.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:border-amber-200 transition-colors group relative">
                    <div className="pr-8">
                      <h4 className="font-bold text-stone-900 text-sm mb-1">{rec.name}</h4>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{rec.taste}</p>
                      <div className="flex items-center gap-3 mt-3 text-[10px] sm:text-xs font-mono text-stone-400">
                        <span>{rec.origin}</span>
                        <span>•</span>
                        <span>{rec.estimatedPrice}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteRecommendation(rec.id)}
                      className="absolute top-4 right-4 p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="履歴から削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
