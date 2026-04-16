export type RoastLevel = 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark';
export type BrewMode = 'twinbird' | 'other';
export type TbTemperature = '83' | '90';
export type TbGrindSize = 'coarse' | 'medium' | 'fine';

export interface Recommendation {
  id: string;
  userId: string;
  createdAt: any;
  name: string;
  origin: string;
  taste: string;
  estimatedPrice: string;
}

export interface CoffeeRecord {
  id: string;
  userId: string;
  createdAt: any; // Firestore Timestamp
  beansName: string;
  roastLevel?: RoastLevel;
  rating?: number;
  tastingNotes?: string;
  tastes?: string[];
  imageUrl?: string;
  price?: number;
  grams?: number;
  order?: number;
  isFavorite?: boolean;
  mode: BrewMode;
  
  // Twinbird specific
  tbTemperature?: TbTemperature;
  tbGrindSize?: TbGrindSize;
  
  // Custom specific
  customMethod?: string;
  customTemperature?: number;
  customGrindSize?: string;
  customWaterAmount?: number;
  customBeansAmount?: number;
  
  // AI Advice
  aiAdvice?: string | null;
  aiStatus?: 'pending' | 'completed' | 'error';
}
