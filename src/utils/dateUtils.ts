import { Timestamp } from 'firebase/firestore';

export const parseActivityDate = (activity: any): Date | null => {
  if (!activity) return null;

  // Handle Firestore Timestamp
  if (activity.timestamp) {
    if (typeof activity.timestamp.toDate === 'function') {
      return activity.timestamp.toDate();
    }
    if (activity.timestamp instanceof Date) {
      return activity.timestamp;
    }
    // Handle ISO string or number
    const date = new Date(activity.timestamp);
    if (!isNaN(date.getTime())) return date;
  }

  // Handle manual date string
  if (activity.date) {
    // Try to parse DD/MM/YY, HH:MM AM/PM
    const parts = activity.date.split(', ');
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      const dateSegments = datePart.split('/');
      if (dateSegments.length === 3) {
        const [day, month, yearStr] = dateSegments;
        const [time, ampm] = timePart.split(' ');
        const [h, m] = time.split(':');
        
        let year = parseInt(yearStr, 10);
        // Handle 2-digit year (assume 20xx)
        if (year < 100) year += 2000;
        
        let hour = parseInt(h, 10);
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        
        const date = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10), hour, parseInt(m, 10));
        if (!isNaN(date.getTime())) return date;
      }
    }
    
    // Fallback to standard parsing
    const date = new Date(activity.date);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
};

export const formatDateForDisplay = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');
  return `${day}/${month}/${year}, ${strHours}:${minutes} ${ampm}`;
};
