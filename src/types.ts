import { ReactNode } from 'react';

export interface Activity {
  id: string;
  name: string;
  type: string;
  date: string;
  duration: string;
  calories: number;
  status: 'Completed' | 'Pending' | 'Hoàn thành';
  iconName: string;
  colorClass: string;
  bgClass: string;
  timestamp?: any;
}

export interface QuickLog {
  id: string;
  name: string;
  category: string;
  image: string;
}

export interface UserProfile {
  name: string;
  height: number;
  weight: number;
}
