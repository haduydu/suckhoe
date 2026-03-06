import { Activity, QuickLog } from './types';

export const RECENT_ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Running',
    type: 'Cardio',
    date: 'Today, 06:30 AM',
    duration: '45 mins',
    calories: 420,
    status: 'Completed',
    iconName: 'Activity',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10'
  },
  {
    id: '2',
    name: 'Tạ tay (Dumbbells)',
    type: 'Strength',
    date: 'Yesterday, 05:45 PM',
    duration: '3 sets x 12 reps',
    calories: 180,
    status: 'Completed',
    iconName: 'Dumbbell',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10'
  },
  {
    id: '3',
    name: 'Yoga Flow',
    type: 'Flexibility',
    date: 'Yesterday, 07:00 AM',
    duration: '30 mins',
    calories: 120,
    status: 'Completed',
    iconName: 'PersonStanding',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10'
  }
];

export const QUICK_LOGS: QuickLog[] = [
  {
    id: '1',
    name: 'Tạ tay (Dumbbells)',
    category: 'Strength Training',
    image: 'https://images.unsplash.com/photo-1586401700818-192e9468d13b?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Hít đất (Push-ups)',
    category: 'Bodyweight',
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'Gập bụng (Sit-ups)',
    category: 'Core Strength',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'Nhảy đá chân (Jumping Jacks)',
    category: 'Cardio',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=500&auto=format&fit=crop'
  }
];
