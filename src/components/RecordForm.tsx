import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { CoffeeRecord, BrewMode, RoastLevel, TbTemperature, TbGrindSize } from '../types';
import { ArrowLeft, Camera, Image as ImageIcon, Check } from 'lucide-react';
import Logo from './Logo';

const ROAST_LEVELS: RoastLevel[] = ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'];
const PREDEFINED_TASTES = ['爽やかな酸味', '強めの酸味', 'コク', 'あっさり', '優しい苦味', '強い苦味'];

export default function RecordForm({ user }: { user: User }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<BrewMode>('twinbird');
  const [beansName, setBeansName] = useState('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel | ''>('');
  const [rating, setRating] = useState<number>(0);
  const [tastingNotes, setTastingNotes] = useState('');
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [grams, setGrams] = useState<number | ''>('');
  const [originalUserId, setOriginalUserId] = useState<string | null>(null);

  // Twinbird
  const [tbTemperature, setTbTemperature] = useState<TbTemperature>('90');
  const [tbGrindSize, setTbGrindSize] = useState<TbGrindSize>('medium');

  // Custom
  const [customMethod, setCustomMethod] = useState('');
  const [customTemperature, setCustomTemperature] = useState<number | ''>('');
  const [customGrindSize, setCustomGrindSize] = useState('');
  const [customWaterAmount, setCustomWaterAmount] = useState<number | ''>('');
  const [customBeansAmount, setCustomBeansAmount] = useState<number | ''>('');

  useEffect(() => {
    if (id) {
      const fetchRecord = async () => {
        try {
          const docRef = doc(db, 'records', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as CoffeeRecord;
            setMode(data.mode);
            setBeansName(data.beansName);
            setRoastLevel(data.roastLevel || '');
            setRating(data.rating || 0);
            setTastingNotes(data.tastingNotes || '');
            setSelectedTastes(data.tastes || []);
            setImageUrl(data.imageUrl || '');
            setPrice(data.price || '');
            setGrams(data.grams || '');
            setOriginalUserId(data.userId);
            
            if (data.mode === 'twinbird') {
              setTbTemperature(data.tbTemperature || '90');
              setTbGrindSize(data.tbGrindSize || 'medium');
            } else {
              setCustomMethod(data.customMethod || '');
              setCustomTemperature(data.customTemperature || '');
              setCustomGrindSize(data.customGrindSize || '');
              setCustomWaterAmount(data.customWaterAmount || '');
              setCustomBeansAmount(data.customBeansAmount || '');
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `records/${id}`);
        }
      };
      fetchRecord();
    }
  }, [id, user.uid]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with lower quality for lighter base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        setImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!beansName.trim()) {
      console.error('Beans name is required');
      return;
    }

    setLoading(true);
    try {
      const { collection } = await import('firebase/firestore');
      const recordRef = id ? doc(db, 'records', id) : doc(collection(db, 'records'));
      
      const baseData: any = {
        userId: originalUserId || user.uid,
        beansName,
        mode,
        ...(roastLevel && { roastLevel }),
        ...(rating > 0 && { rating }),
        ...(tastingNotes && { tastingNotes }),
        ...(selectedTastes.length > 0 && { tastes: selectedTastes }),
        ...(imageUrl && { imageUrl }),
        ...(price && { price: Number(price) }),
        ...(grams && { grams: Number(grams) }),
        ...(!id && { order: -Date.now() }),
      };

      if (!id) {
        baseData.createdAt = serverTimestamp();
      }

      if (mode === 'twinbird') {
        Object.assign(baseData, {
          tbTemperature,
          tbGrindSize
        });
      } else {
        Object.assign(baseData, {
          ...(customMethod && { customMethod }),
          ...(customTemperature && { customTemperature: Number(customTemperature) }),
          ...(customGrindSize && { customGrindSize }),
          ...(customWaterAmount && { customWaterAmount: Number(customWaterAmount) }),
          ...(customBeansAmount && { customBeansAmount: Number(customBeansAmount) }),
        });
      }

      await setDoc(recordRef, baseData, { merge: true });
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `records/${id || 'new'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-stone-50 min-h-screen pb-24">
      <header className="bg-white sticky top-0 z-10 border-b border-stone-200 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-500 hover:text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Logo />
        <button 
          onClick={handleSave} 
          disabled={loading || !beansName.trim()}
          className="bg-stone-900 text-white px-4 py-2 rounded-full font-medium text-sm disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? '保存中...' : <><Check className="w-4 h-4" /> 保存</>}
        </button>
      </header>

      <main className="p-4 space-y-6">
        {/* Image Upload */}
        <div 
          className="w-full aspect-video bg-stone-200 rounded-2xl overflow-hidden relative group cursor-pointer flex items-center justify-center"
          onClick={() => fileInputRef.current?.click()}
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="Coffee" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-stone-400">
              <ImageIcon className="w-10 h-10 mb-2" />
              <span className="text-sm font-medium">写真を追加</span>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
        </div>

        {/* Basic Info */}
        <div className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">豆の名前 *</label>
            <input 
              type="text" 
              value={beansName}
              onChange={(e) => setBeansName(e.target.value)}
              placeholder="例: エチオピア イルガチェフェ"
              className="w-full text-lg font-medium border-b-2 border-stone-200 focus:border-stone-900 outline-none py-2 bg-transparent transition-colors"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">価格 (円)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full font-mono text-lg font-medium border-b-2 border-stone-200 focus:border-stone-900 outline-none py-2 bg-transparent transition-colors"
                placeholder="例: 1500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">内容量 (g)</label>
              <input
                type="number"
                value={grams}
                onChange={(e) => setGrams(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full font-mono text-lg font-medium border-b-2 border-stone-200 focus:border-stone-900 outline-none py-2 bg-transparent transition-colors"
                placeholder="例: 200"
              />
            </div>
          </div>
          {price && grams && (
            <div className="text-right text-sm text-stone-500 font-mono mt-1">
              100gあたり: ¥{((Number(price) / Number(grams)) * 100).toFixed(1)}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">焙煎度</label>
            <div className="flex flex-wrap gap-2">
              {ROAST_LEVELS.map(level => {
                const label = level === 'Light' ? '浅煎り' :
                              level === 'Medium-Light' ? '中浅煎り' :
                              level === 'Medium' ? '中煎り' :
                              level === 'Medium-Dark' ? '中深煎り' : '深煎り';
                return (
                  <button
                    key={level}
                    onClick={() => setRoastLevel(level)}
                    className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all shadow-sm border ${
                      roastLevel === level 
                        ? 'bg-stone-900 text-white border-stone-900' 
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">評価</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-colors ${
                    rating >= star ? 'text-amber-400' : 'text-stone-200'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-stone-200 rounded-xl">
          <button
            onClick={() => setMode('twinbird')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === 'twinbird' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            ツインバード 6カップ
          </button>
          <button
            onClick={() => setMode('other')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === 'other' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            その他 / カスタム
          </button>
        </div>

        {/* Mode Specific Settings */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 space-y-6">
          {mode === 'twinbird' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">温度</label>
                <div className="flex gap-2">
                  {(['83', '90'] as TbTemperature[]).map(temp => (
                    <button
                      key={temp}
                      onClick={() => setTbTemperature(temp)}
                      className={`flex-1 py-3 rounded-2xl text-sm font-mono font-bold transition-all shadow-sm border ${
                        tbTemperature === temp 
                          ? 'border-stone-900 bg-stone-900 text-white' 
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {temp}°C
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">挽き目</label>
                <div className="flex gap-2">
                  {(['coarse', 'medium', 'fine'] as TbGrindSize[]).map(grind => (
                    <button
                      key={grind}
                      onClick={() => setTbGrindSize(grind)}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold capitalize transition-all shadow-sm border ${
                        tbGrindSize === grind 
                          ? 'border-stone-900 bg-stone-900 text-white' 
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {grind === 'coarse' ? '粗挽' : grind === 'medium' ? '中挽' : '細挽'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">抽出方法</label>
                <input 
                  type="text" 
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                  placeholder="例: V60, エアロプレス"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-stone-900 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">温度 (°C)</label>
                  <input 
                    type="number" 
                    value={customTemperature}
                    onChange={(e) => setCustomTemperature(e.target.value ? Number(e.target.value) : '')}
                    placeholder="例: 92"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-stone-900 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">挽き目</label>
                  <input 
                    type="text" 
                    value={customGrindSize}
                    onChange={(e) => setCustomGrindSize(e.target.value)}
                    placeholder="例: 中細挽き"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-stone-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">豆の量 (g)</label>
                  <input 
                    type="number" 
                    value={customBeansAmount}
                    onChange={(e) => setCustomBeansAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="例: 15"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-stone-900 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">湯量 (ml)</label>
                  <input 
                    type="number" 
                    value={customWaterAmount}
                    onChange={(e) => setCustomWaterAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="例: 250"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-stone-900 transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tasting Notes */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">テイスト</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {PREDEFINED_TASTES.map(taste => (
              <button
                key={taste}
                onClick={() => setSelectedTastes(prev => prev.includes(taste) ? prev.filter(t => t !== taste) : [...prev, taste])}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selectedTastes.includes(taste) 
                    ? 'bg-stone-900 text-white border-stone-900' 
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {taste}
              </button>
            ))}
          </div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">メモ（自由記述）</label>
          <textarea 
            value={tastingNotes}
            onChange={(e) => setTastingNotes(e.target.value)}
            placeholder="どんな味でしたか？（例: フローラル、チョコレート、明るい酸味）"
            rows={4}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-stone-900 transition-colors resize-none"
          />
        </div>

      </main>
    </div>
  );
}
