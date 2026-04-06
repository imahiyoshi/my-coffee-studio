import React, { useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, limit } from 'firebase/firestore';
import { db, logout, handleFirestoreError, OperationType } from '../firebase';
import { CoffeeRecord } from '../types';
import { Link } from 'react-router-dom';
import { Plus, LogOut, Image as ImageIcon, Search, ArrowUpDown, GripVertical, Heart } from 'lucide-react';
import { format } from 'date-fns';
import Logo from './Logo';

// Dnd Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortOption = 'newest' | 'oldest' | 'rating' | 'price' | 'manual' | 'favorite';

interface SortableItemProps {
  record: CoffeeRecord;
  sortBy: SortOption;
}

const SortableItem: React.FC<SortableItemProps> = ({ record, sortBy }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id, disabled: sortBy !== 'manual' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {sortBy === 'manual' && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <Link
        to={`/record/${record.id}`}
        className={`bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow flex gap-4 ${sortBy === 'manual' ? 'pl-10' : ''}`}
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-stone-100 rounded-xl overflow-hidden flex items-center justify-center relative">
          {record.imageUrl ? (
            <img src={record.imageUrl} alt={record.beansName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <ImageIcon className="w-8 h-8 text-stone-300" />
          )}
          {record.isFavorite && (
            <div className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm">
              <Heart className="w-3 h-3 text-rose-500 fill-current" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <h3 className="font-bold text-stone-900 truncate">{record.beansName}</h3>
          <p className="text-sm text-stone-500 mb-2 font-mono">
            {record.createdAt?.toDate ? format(record.createdAt.toDate(), 'MMM d, yyyy') : ''}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium mt-1">
            <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded-md">
              {record.mode === 'twinbird' ? 'ツイン' : '他'}
            </span>
            
            {(record.mode === 'twinbird' ? record.tbTemperature : record.customTemperature) && (
              <span className="bg-stone-50 text-stone-500 border border-stone-100 px-2 py-1 rounded-md font-mono">
                {record.mode === 'twinbird' ? record.tbTemperature : record.customTemperature}°C
              </span>
            )}
            
            {record.price && record.grams && (
              <span className="bg-stone-50 text-stone-500 border border-stone-100 px-2 py-1 rounded-md font-mono">
                ¥{((record.price / record.grams) * 100).toFixed(1)}/100g
              </span>
            )}

            {record.rating && (
              <span className="flex items-center text-amber-500 ml-1 font-mono">
                ★ {record.rating}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function Dashboard({ user }: { user: User }) {
  const [records, setRecords] = useState<CoffeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Listen to records
  useEffect(() => {
    if (!user?.uid) return;

    // どのアカウントでも同じデータが見れるように、全ユーザーのデータを取得する
    const q = query(
      collection(db, 'records'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: CoffeeRecord[] = [];
      snapshot.forEach((doc) => {
        recs.push({ id: doc.id, ...doc.data() } as CoffeeRecord);
      });
      setRecords(recs);
      setLoading(false);
    }, (error: any) => {
      console.error("Firestore Snapshot Error:", error);
      setLoading(false);
      
      // インデックス未作成のエラーなどの場合、ユーザーに分かりやすく表示するために
      // handleFirestoreErrorを呼び出すが、致命的なクラッシュは避ける
      if (error.code === 'failed-precondition') {
        console.warn("Firestore index might be missing. Check Firebase console.");
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.beansName.toLowerCase().includes(query) || 
        r.tastingNotes?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;

      if (sortBy === 'manual') {
        return (a.order ?? 0) - (b.order ?? 0);
      }
      if (sortBy === 'favorite') {
        if (a.isFavorite === b.isFavorite) {
          return timeB - timeA;
        }
        return a.isFavorite ? -1 : 1;
      }
      if (sortBy === 'newest') {
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        return timeA - timeB;
      }
      if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (sortBy === 'price') {
        const priceA = a.price && a.grams ? (a.price / a.grams) : Infinity;
        const priceB = b.price && b.grams ? (b.price / b.grams) : Infinity;
        return priceA - priceB;
      }
      return 0;
    });

    return result;
  }, [records, searchQuery, sortBy]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = active.id.toString();
      const overId = over.id.toString();

      const oldIndex = filteredAndSortedRecords.findIndex((r) => r.id === activeId);
      const newIndex = filteredAndSortedRecords.findIndex((r) => r.id === overId);

      const newOrderedList = arrayMove(filteredAndSortedRecords, oldIndex, newIndex);
      
      const batch = writeBatch(db);
      newOrderedList.forEach((record: CoffeeRecord, index: number) => {
        const docRef = doc(db, 'records', record.id);
        batch.update(docRef, { order: index });
      });

      try {
        await batch.commit();
      } catch (error) {
        console.error("Failed to update order:", error);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <header className="bg-white sticky top-0 z-10 border-b border-stone-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={logout} className="p-2 text-stone-500 hover:text-stone-900 transition-colors" title="ログアウト">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4">
        {/* Search and Sort Controls */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="豆の名前やメモで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-stone-900 transition-colors shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0 px-2 py-1.5 bg-stone-100 rounded-lg text-stone-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">並べ替え</span>
            </div>
            {[
              { id: 'newest', label: '新着順' },
              { id: 'oldest', label: '古い順' },
              { id: 'rating', label: '評価順' },
              { id: 'price', label: '価格順' },
              { id: 'favorite', label: 'お気に入り' },
              { id: 'manual', label: '手動' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as SortOption)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sortBy === option.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Logo animated />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-24 px-4 flex flex-col items-center">
            <div className="mb-8">
              <Logo animated />
            </div>
            <h2 className="text-lg font-medium text-stone-900 mb-2">まだ記録がありません</h2>
            <p className="text-stone-500 mb-6">毎日のコーヒーの抽出を記録しましょう。</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredAndSortedRecords.map(r => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-4">
                {filteredAndSortedRecords.map((record) => (
                  <SortableItem key={record.id} record={record} sortBy={sortBy} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {filteredAndSortedRecords.length === 0 && !loading && records.length > 0 && (
          <div className="text-center py-12">
            <p className="text-stone-400 text-sm">検索結果が見つかりませんでした。</p>
          </div>
        )}
      </main>

      <Link
        to="/new"
        className="fixed bottom-6 right-6 w-14 h-14 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-stone-800 transition-colors z-20"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}

