import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CoffeeRecord } from '../types';
import { ArrowLeft, Edit2, Trash2, Image as ImageIcon, Heart, X, AlertTriangle } from 'lucide-react';
import Logo from './Logo';
import { format } from 'date-fns';

export default function RecordDetail({ user }: { user: User }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CoffeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchRecord = async () => {
        try {
          const docRef = doc(db, 'records', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as CoffeeRecord;
            setRecord(data);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `records/${id}`);
        } finally {
          setLoading(false);
        }
      };
      fetchRecord();
    }
  }, [id, user]);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'records', id!));
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `records/${id}`);
    }
  };

  const toggleFavorite = async () => {
    if (!record || isTogglingFavorite) return;
    
    setIsTogglingFavorite(true);
    const newFavoriteStatus = !record.isFavorite;
    
    try {
      const docRef = doc(db, 'records', id!);
      await updateDoc(docRef, { isFavorite: newFavoriteStatus });
      setRecord({ ...record, isFavorite: newFavoriteStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `records/${id}`);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Logo animated />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">記録が見つかりません</h2>
        <p className="text-stone-500 mb-6">削除されたか、アクセス権限がありません。</p>
        <button onClick={() => navigate('/')} className="text-stone-900 font-medium underline">
          ダッシュボードに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-stone-50 min-h-screen pb-24 relative">
      <header className="bg-white sticky top-0 z-10 border-b border-stone-200 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-stone-500 hover:text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={toggleFavorite} 
            disabled={isTogglingFavorite}
            className={`p-2 transition-colors flex items-center gap-1 ${record.isFavorite ? 'text-rose-500' : 'text-stone-300 hover:text-rose-400'}`}
            title={record.isFavorite ? "お気に入り解除" : "お気に入り"}
          >
            <Heart className={`w-6 h-6 ${record.isFavorite ? 'fill-current' : ''}`} />
          </button>
          
          <Link 
            to={`/edit/${id}`} 
            className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </Link>
          
          {record.userId === user.uid && (
            <button 
              onClick={() => !record.isFavorite && setShowDeleteConfirm(true)} 
              disabled={record.isFavorite}
              className={`p-2 transition-colors ${record.isFavorite ? 'text-stone-200 cursor-not-allowed' : 'text-stone-300 hover:text-red-500'}`}
              title={record.isFavorite ? "お気に入り解除してから削除してください" : "削除"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main>
        {/* Image */}
        <div className="w-full aspect-square sm:aspect-video bg-stone-200 flex items-center justify-center relative">
          {record.imageUrl ? (
            <img src={record.imageUrl} alt={record.beansName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <ImageIcon className="w-16 h-16 text-stone-300" />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
            <h1 className="text-3xl font-bold text-white mb-1">{record.beansName}</h1>
            <div className="flex items-center gap-3">
              <p className="text-stone-200 font-mono text-sm">
                {record.createdAt?.toDate ? format(record.createdAt.toDate(), 'MMMM d, yyyy') : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 -mt-4 relative z-10">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex flex-wrap gap-y-4 gap-x-8">
            {record.rating && (
              <div>
                <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">評価</span>
                <span className="text-amber-500 text-lg font-mono font-bold">★ {record.rating}</span>
              </div>
            )}
            {record.roastLevel && (
              <div>
                <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">焙煎度</span>
                <span className="text-stone-900 font-medium">
                  {record.roastLevel === 'Light' ? '浅煎り' :
                   record.roastLevel === 'Medium-Light' ? '中浅煎り' :
                   record.roastLevel === 'Medium' ? '中煎り' :
                   record.roastLevel === 'Medium-Dark' ? '中深煎り' : '深煎り'}
                </span>
              </div>
            )}
            {record.price && record.grams && (
              <>
                <div>
                  <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">購入価格</span>
                  <span className="text-stone-900 font-mono font-medium">
                    ¥{record.price}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">内容量</span>
                  <span className="text-stone-900 font-mono font-medium">
                    {record.grams}g
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">100gあたり</span>
                  <span className="text-stone-900 font-mono font-medium">
                    ¥{((record.price / record.grams) * 100).toFixed(1)}
                  </span>
                </div>
              </>
            )}
            <div>
              <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">モード</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-800">
                {record.mode === 'twinbird' ? 'ツインバード 6カップ' : 'カスタム'}
              </span>
            </div>
          </div>

          {/* Brew Details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Logo className="scale-50 origin-left" /> 抽出の詳細
            </h3>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              {record.mode === 'twinbird' ? (
                <>
                  <div>
                    <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">温度</span>
                    <span className="text-stone-900 font-mono font-medium">{record.tbTemperature}°C</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">挽き目</span>
                    <span className="text-stone-900 font-medium capitalize">
                      {record.tbGrindSize === 'coarse' ? '粗挽' : record.tbGrindSize === 'medium' ? '中挽' : '細挽'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {record.customMethod && (
                    <div className="col-span-2">
                      <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">抽出方法</span>
                      <span className="text-stone-900 font-medium">{record.customMethod}</span>
                    </div>
                  )}
                  {record.customTemperature && (
                    <div>
                      <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">温度</span>
                      <span className="text-stone-900 font-mono font-medium">{record.customTemperature}°C</span>
                    </div>
                  )}
                  {record.customGrindSize && (
                    <div>
                      <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">挽き目</span>
                      <span className="text-stone-900 font-medium">{record.customGrindSize}</span>
                    </div>
                  )}
                  {record.customBeansAmount && (
                    <div>
                      <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">豆の量</span>
                      <span className="text-stone-900 font-mono font-medium">{record.customBeansAmount}g</span>
                    </div>
                  )}
                  {record.customWaterAmount && (
                    <div>
                      <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">湯量</span>
                      <span className="text-stone-900 font-mono font-medium">{record.customWaterAmount}ml</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tasting Notes */}
          {((record.tastes && record.tastes.length > 0) || record.tastingNotes) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 mb-3">テイスト・メモ</h3>
              {record.tastes && record.tastes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {record.tastes.map(taste => (
                    <span key={taste} className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md text-sm font-medium">
                      {taste}
                    </span>
                  ))}
                </div>
              )}
              {record.tastingNotes && (
                <p className="text-stone-600 whitespace-pre-wrap leading-relaxed">{record.tastingNotes}</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">記録を削除しますか？</h3>
              <p className="text-stone-500 mb-8 leading-relaxed">
                この操作は取り消せません。<br />
                「{record.beansName}」の記録を完全に削除します。
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDelete}
                  className="w-full py-3.5 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  削除する
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3.5 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
