import React, { useState, useEffect, useMemo } from 'react';
import { HeartPulse, Search, Bell, Settings, Plus, Dumbbell, Flame, Weight, Activity, ArrowRight, X, Info, Moon, Sun, TrendingUp, Ruler, LogOut, Loader2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity as ActivityType, QuickLog, UserProfile } from '../types';
import { User } from 'firebase/auth';
import { logOut, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc, where, getDocs, deleteDoc } from 'firebase/firestore';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import AIChatWindow from './AIChatWindow';
import confetti from 'canvas-confetti';
import SettingsModal from './SettingsModal';
import HistoryModal from './HistoryModal';



interface DashboardProps {
  user: User | null;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function Dashboard({ user: firebaseUser, toggleTheme, isDarkMode }: DashboardProps) {
  const [showBmiModal, setShowBmiModal] = useState(false);
  const [selectedQuickLog, setSelectedQuickLog] = useState<QuickLog | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [quickLogs, setQuickLogs] = useState<QuickLog[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleDeleteActivity = async (id: string) => {
    if (!firebaseUser || !db) return;
    try {
      await deleteDoc(doc(db, 'users', firebaseUser.uid, 'activities', id));
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };
  const [notifications, setNotifications] = useState<any[]>([]);

  // Check for daily goal completion
  useEffect(() => {
    if (!firebaseUser?.uid || !db || activities.length === 0) return;

    const checkDailyGoal = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Filter activities for today
      const todayActivities = activities.filter(a => {
        let date;
        if (a.timestamp && typeof a.timestamp.toDate === 'function') {
          date = a.timestamp.toDate();
        } else if (a.timestamp instanceof Date) {
          date = a.timestamp;
        } else if (a.timestamp) {
          date = new Date(a.timestamp);
        } else if (a.date) {
          const parts = a.date.split(', ');
          if (parts.length === 2) {
            const [datePart, timePart] = parts[0].split('/'), [time, ampm] = parts[1].split(' ');
            const [day, month, year] = datePart;
            const [h, m] = time.split(':');
            let hour = parseInt(h);
            if (ampm === 'PM' && hour < 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;
            date = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(m));
          } else {
             date = new Date(a.date);
          }
        } else {
          return false;
        }
        
        if (!date || isNaN(date.getTime())) return false;
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      });

      const requiredExercises = ['tạ tay', 'hít đất', 'gập bụng', 'nhảy đá chân'];
      const completedExercises = new Set();
      let totalCalories = 0;

      todayActivities.forEach(a => {
        if (a.name) {
          const lowerName = a.name.toLowerCase();
          requiredExercises.forEach(req => {
            if (lowerName.includes(req)) completedExercises.add(req);
          });
        }
        if (a.calories) totalCalories += a.calories;
      });

      if (completedExercises.size === 4) {
        // Check if notification already exists for today
        const q = query(
          collection(db, 'users', firebaseUser.uid, 'notifications'),
          where('type', '==', 'daily_goal'),
          where('date', '==', todayStr)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // Fire confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });

          // Add notification
          await addDoc(collection(db, 'users', firebaseUser.uid, 'notifications'), {
            type: 'daily_goal',
            date: todayStr,
            message: `Chúc mừng tổng calo đốt được trong ngày hôm nay là ${totalCalories}, hãy tiếp tục luyện tập vào ngày mai nhé`,
            timestamp: serverTimestamp(),
            read: false
          });
        }
      }
    };

    checkDailyGoal();
  }, [activities, firebaseUser, db]);

  // Fetch notifications
  useEffect(() => {
    if (!firebaseUser?.uid || !db) return;

    const q = query(
      collection(db, 'users', firebaseUser.uid, 'notifications'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().timestamp?.toDate() || new Date()
      }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [firebaseUser, db]);

  const getFilteredActivities = () => {
    const now = new Date();
    return activities.filter(a => {
      let date;
      if (a.timestamp && typeof a.timestamp.toDate === 'function') {
        date = a.timestamp.toDate();
      } else if (a.timestamp instanceof Date) {
        date = a.timestamp;
      } else if (a.timestamp) {
        date = new Date(a.timestamp);
      } else if (a.date) {
        // Try to parse DD/MM/YY, HH:MM AM/PM
        const parts = a.date.split(', ');
        if (parts.length === 2) {
          const [datePart, timePart] = parts;
          const [day, month, year] = datePart.split('/');
          const [time, ampm] = timePart.split(' ');
          const [hours, minutes] = time.split(':');
          let h = parseInt(hours, 10);
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          date = new Date(2000 + parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), h, parseInt(minutes, 10));
        } else {
          date = new Date(a.date);
        }
      } else {
        return true;
      }
      
      if (isNaN(date.getTime())) return false;
      
      const diffTime = now.getTime() - date.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      switch (timeFilter) {
        case 'day': 
          return date.getDate() === now.getDate() && 
                 date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear();
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        case 'year': return diffDays <= 365;
        default: return true;
      }
    });
  };

  const calculateTotalReps = (activityName: string) => {
    const filtered = getFilteredActivities();
    return filtered
      .filter(a => a.name && a.name.toLowerCase().includes(activityName.toLowerCase()))
      .reduce((total, a) => {
        if (!a.duration) return total;
        const match = a.duration.match(/\((\d+)\s*(?:reps|lần)\)/i);
        if (match && match[1]) {
          return total + parseInt(match[1], 10);
        }
        return total;
      }, 0);
  };

  useEffect(() => {
    let unsubscribeActivities: () => void;
    
    if (firebaseUser?.uid && db) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      };
      fetchProfile();
        
      // Fetch user activities from Firebase
      const q = query(
        collection(db, 'users', firebaseUser.uid, 'activities'), 
        orderBy('timestamp', 'desc')
      );
      unsubscribeActivities = onSnapshot(q, (querySnapshot) => {
        const firebaseActivities: any[] = [];
        querySnapshot.forEach((doc) => {
          firebaseActivities.push({ id: doc.id, ...doc.data() });
        });
        setActivities(firebaseActivities);
      }, (error) => {
        console.error("Error fetching activities:", error);
        setActivities([]);
      });
    } else {
      setActivities([]);
    }

    fetch('/api/quick-logs')
      .then(res => res.json())
      .then(data => setQuickLogs(data))
      .catch(console.error);
      
    return () => {
      if (unsubscribeActivities) {
        unsubscribeActivities();
      }
    };
  }, [firebaseUser]);

  const chartData = useMemo(() => {
    const dailyCalories = new Map<string, number>();

    activities.forEach(a => {
      if (!a.calories || a.calories <= 0) return;

      let date;
      if (a.timestamp && typeof a.timestamp.toDate === 'function') {
        date = a.timestamp.toDate();
      } else if (a.timestamp instanceof Date) {
        date = a.timestamp;
      } else if (a.timestamp) {
        date = new Date(a.timestamp);
      } else if (a.date) {
        const parts = a.date.split(', ');
        if (parts.length === 2) {
          const [datePart, timePart] = parts;
          const [day, month, year] = datePart.split('/');
          const [time, ampm] = timePart.split(' ');
          const [h, m] = time.split(':');
          let hour = parseInt(h);
          if (ampm === 'PM' && hour < 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
          date = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(m));
        } else {
           date = new Date(a.date);
        }
      }

      if (date && !isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const key = `${year}-${month}-${day}`; // Sortable key
        
        dailyCalories.set(key, (dailyCalories.get(key) || 0) + a.calories);
      }
    });

    return Array.from(dailyCalories.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, calories]) => {
        const [year, month, day] = key.split('-');
        return {
          name: `${day}/${month}`,
          calories: calories
        };
      });
  }, [activities]);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <header className="sticky top-0 z-50 w-full border-b border-border-light dark:border-border-dark bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(25,240,115,0.3)] overflow-hidden">
                <img 
                  src="https://yt3.googleusercontent.com/Qe0CvfjbnWtLN3EUj1ErspRoiVSnj5AWO-txCCf-9a5FhglUElvJyE23F2RAg7nDWZWvA08DFOw=s160-c-k-c0x00ffffff-no-rj" 
                  alt="NT Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover filter invert mix-blend-screen opacity-90" 
                />
              </div>
              <span className="hidden md:block text-lg font-bold tracking-tight">Trợ lý sức khỏe</span>
            </div>
            
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <button 
                onClick={() => setIsChatOpen(true)}
                className="relative w-full group flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary py-2 px-4 transition-all"
              >
                <Search size={18} />
                <span className="font-semibold">Hỏi trợ lý</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden lg:flex items-center gap-6 mr-4">
                <a className="text-sm font-medium text-primary transition-colors" href="#">Tổng quan</a>
                <a className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors" href="#">Bài tập</a>
                <a className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors" href="#">Dinh dưỡng</a>
                <a className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors" href="#">Hồ sơ</a>
              </nav>
              
              <button onClick={toggleTheme} className="p-2 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                >
                  <Bell size={20} />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(25,240,115,0.5)]"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden z-50">
                    <div className="p-3 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                      <h3 className="font-semibold text-sm text-text-light dark:text-text-dark">Thông báo</h3>
                      <button onClick={() => setShowNotifications(false)}><X size={16} className="text-text-muted-light dark:text-text-muted-dark" /></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div key={notif.id} className="p-3 border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-1">
                              {notif.createdAt.toLocaleDateString('vi-VN')} {notif.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-sm text-text-light dark:text-text-dark">{notif.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-text-muted-light dark:text-text-muted-dark">Không có thông báo nào</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              >
                <Settings size={20} />
              </button>
              
              <div className="h-8 w-px bg-border-light dark:bg-border-dark mx-1"></div>
              
              <button className="flex items-center gap-3 pl-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors pr-4 py-1 group">
                <div className="h-8 w-8 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center overflow-hidden border border-primary/30 group-hover:border-primary/60 transition-colors">
                  <img 
                    src={user?.photoURL || firebaseUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop"} 
                    alt="User" 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <span className="hidden sm:block text-sm font-semibold group-hover:text-primary transition-colors">{user?.name || firebaseUser?.displayName || 'Alex D.'}</span>
              </button>

              <button onClick={handleLogout} className="p-2 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors" title="Đăng xuất">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="mt-2 text-text-muted-light dark:text-text-muted-dark text-lg">Chào mừng {user?.name || firebaseUser?.displayName || 'bạn'} đã trở lại! Hãy cập nhật quá trình tập luyện ngay nào.</p>
              
              <div className="mt-6 inline-flex bg-surface-light dark:bg-surface-dark rounded-lg p-1 border border-border-light dark:border-border-dark">
                <button 
                  onClick={() => setTimeFilter('day')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeFilter === 'day' ? 'bg-primary text-background-dark shadow-sm' : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'}`}
                >
                  Ngày
                </button>
                <button 
                  onClick={() => setTimeFilter('week')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeFilter === 'week' ? 'bg-primary text-background-dark shadow-sm' : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'}`}
                >
                  Tuần
                </button>
                <button 
                  onClick={() => setTimeFilter('month')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeFilter === 'month' ? 'bg-primary text-background-dark shadow-sm' : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'}`}
                >
                  Tháng
                </button>
                <button 
                  onClick={() => setTimeFilter('year')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeFilter === 'year' ? 'bg-primary text-background-dark shadow-sm' : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'}`}
                >
                  Năm
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setIsHistoryModalOpen(true)}
              className="mb-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Chi tiết lịch sử
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={<Dumbbell size={20} />} 
              iconColor="text-blue-500" 
              iconBg="bg-blue-500/20"
              title={`Tổng tạ tay (${timeFilter === 'day' ? 'Hôm nay' : timeFilter === 'week' ? '7 ngày' : timeFilter === 'month' ? '30 ngày' : '1 năm'})`} 
              value={calculateTotalReps('tạ tay').toLocaleString()} 
              unit="lần"
            />
            <StatCard 
              icon={<Activity size={20} />} 
              iconColor="text-orange-500" 
              iconBg="bg-orange-500/20"
              title={`Tổng hít đất (${timeFilter === 'day' ? 'Hôm nay' : timeFilter === 'week' ? '7 ngày' : timeFilter === 'month' ? '30 ngày' : '1 năm'})`} 
              value={calculateTotalReps('hít đất').toLocaleString()} 
              unit="lần"
            />
            <StatCard 
              icon={<Activity size={20} />} 
              iconColor="text-purple-500" 
              iconBg="bg-purple-500/20"
              title={`Tổng gập bụng (${timeFilter === 'day' ? 'Hôm nay' : timeFilter === 'week' ? '7 ngày' : timeFilter === 'month' ? '30 ngày' : '1 năm'})`} 
              value={calculateTotalReps('gập bụng').toLocaleString()} 
              unit="lần"
            />
            <StatCard 
              icon={<Activity size={20} />} 
              iconColor="text-pink-500" 
              iconBg="bg-pink-500/20"
              title={`Tổng nhảy đá chân (${timeFilter === 'day' ? 'Hôm nay' : timeFilter === 'week' ? '7 ngày' : timeFilter === 'month' ? '30 ngày' : '1 năm'})`} 
              value={calculateTotalReps('nhảy đá chân').toLocaleString()} 
              unit="lần"
            />
          </div>

          <div className="mb-8">
            <div className="p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Tiêu thụ Calo</h3>
              </div>
              <div className="h-64 w-full min-h-[256px] min-w-0 relative group">
                {/* Background Layer: Fixed Y-Axis and Full-width Grid */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#065f46'} />
                      <YAxis 
                        width={40} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isDarkMode ? '#a1a1aa' : '#6ee7b7', fontSize: 12 }} 
                      />
                      <XAxis dataKey="name" hide />
                      <Bar dataKey="calories" fill="transparent" /> {/* Invisible bar to force scale match */}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Foreground Layer: Scrollable Bars */}
                <div className="absolute inset-0 w-full h-full pl-[40px]">
                  <div className="w-full h-full overflow-x-auto scrollbar-hide">
                    <div style={{ width: `${Math.max(chartData.length * 80, 200)}px`, height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isDarkMode ? '#a1a1aa' : '#6ee7b7', fontSize: 12 }} 
                            dy={10} 
                          />
                          <YAxis width={0} hide />
                          <Tooltip 
                            cursor={{ fill: isDarkMode ? '#27272a' : '#065f46', opacity: 0.4 }}
                            contentStyle={{ backgroundColor: isDarkMode ? '#18181b' : '#064e3b', borderColor: isDarkMode ? '#27272a' : '#065f46', borderRadius: '8px', color: isDarkMode ? '#fafafa' : '#ecfdf5' }}
                            itemStyle={{ color: '#19f073', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="calories" fill="#19f073" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Ghi chép nhanh</h2>
              <a className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors" href="#">
                Xem tất cả <ArrowRight size={16} />
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLogs.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedQuickLog(log)}
                  className="group relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(25,240,115,0.2)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/50 dark:via-background-dark/50 to-transparent z-10 opacity-90"></div>
                  <img src={log.image} alt={log.name} className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-1 group-hover:text-primary transition-colors">{log.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">{log.category}</span>
                      <button className="bg-primary/20 hover:bg-primary text-primary hover:text-background-dark backdrop-blur-md p-2 rounded-full transition-all border border-primary/20">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark/50">
              <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Lịch sử hoạt động gần đây</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-muted-light dark:text-text-muted-dark">
                <thead className="bg-background-light dark:bg-background-dark text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Hoạt động</th>
                    <th className="px-6 py-4">Ngày & Giờ</th>
                    <th className="px-6 py-4">Thời lượng/Số lần</th>
                    <th className="px-6 py-4">Calo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-text-muted-light dark:text-text-muted-dark">
                        Chưa có dữ liệu hoạt động. Hãy bắt đầu tập luyện và ghi nhận kết quả nhé!
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-background-light dark:hover:bg-background-dark transition-colors group">
                        <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${activity.bgClass} ${activity.colorClass} transition-colors`}>
                            {activity.iconName === 'Activity' && <Activity size={18} />}
                            {activity.iconName === 'Dumbbell' && <Dumbbell size={18} />}
                            {activity.iconName === 'PersonStanding' && <Activity size={18} />}
                          </div>
                          {activity.name}
                        </td>
                        <td className="px-6 py-4">{activity.date}</td>
                        <td className="px-6 py-4">{activity.duration}</td>
                        <td className="px-6 py-4 text-text-light dark:text-text-dark font-medium">{activity.calories} kcal</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showBmiModal && <BmiModal onClose={() => setShowBmiModal(false)} />}
      {selectedQuickLog && (
        <QuickLogModal 
          log={selectedQuickLog} 
          user={user} 
          firebaseUser={firebaseUser}
          onClose={() => setSelectedQuickLog(null)} 
          onSave={(newActivity) => {
            if (newActivity) {
              setActivities(prev => [newActivity, ...prev]);
            }
            setSelectedQuickLog(null);
          }}
        />
      )}
      
      <AIChatWindow 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        userProfile={user} 
        activities={activities} 
      />
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        user={firebaseUser}
        userProfile={user}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        activities={activities} 
        onDelete={handleDeleteActivity}
      />
    </div>
  );
}

function StatCard({ icon, iconColor, iconBg, title, value, unit, trend, trendUp, badge }: any) {
  return (
    <div className="p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full border ${trendUp ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
            <TrendingUp size={14} className={`mr-1 ${!trendUp && 'rotate-180'}`} />
            {trend}
          </span>
        )}
        {badge && (
          <span className="flex items-center text-xs font-bold text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-2 py-1 rounded-full border border-border-light dark:border-border-dark">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-text-light dark:text-text-dark">
        {value} {unit && <span className="text-sm font-normal text-text-muted-light dark:text-text-muted-dark">{unit}</span>}
      </h3>
    </div>
  );
}

function QuickLogModal({ log, user, firebaseUser, onClose, onSave }: { log: QuickLog, user: UserProfile | null, firebaseUser: User | null, onClose: () => void, onSave: (activity: any | null) => void }) {
  const [reps, setReps] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateCalories = async () => {
    if (!reps || !duration) return;
    setIsCalculating(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `User: ${user?.height || 170}cm, ${user?.weight || 65}kg. Activity: ${reps} reps of ${log.name} in ${duration} mins. Estimate calories burned. Return JSON {"calories": integer}.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.INTEGER }
              }
            }
          }
        });
        
        const result = JSON.parse(response.text || '{}');
        if (result.calories) {
          setCalculatedCalories(result.calories);
        }
      } else {
        console.warn('No Gemini API Key found.');
        setCalculatedCalories(Math.floor(Math.random() * 50) + 10);
      }
    } catch (error) {
      console.error('Error calculating calories:', error);
      setCalculatedCalories(Math.floor(Math.random() * 50) + 10);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!reps || !duration) return;
    setIsSubmitting(true);
    try {
      let calories = calculatedCalories;
      
      if (calories === null) {
        // If not calculated yet, calculate it now
        calories = Math.floor(Math.random() * 50) + 10;
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `User: ${user?.height || 170}cm, ${user?.weight || 65}kg. Activity: ${reps} reps of ${log.name} in ${duration} mins. Estimate calories burned. Return JSON {"calories": integer}.`;
            
            const fetchAi = ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.INTEGER }
                  }
                }
              }
            });
            
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 4000));
            const response = await Promise.race([fetchAi, timeoutPromise]) as any;
            
            const result = JSON.parse(response.text || '{}');
            if (result.calories) calories = result.calories;
          }
        } catch (aiError) {
          console.warn('AI calculation took too long or failed, using fallback calories.', aiError);
        }
      }
      
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, '0');
      const formattedDate = `${day}/${month}/${year}, ${strHours}:${minutes} ${ampm}`;

      const newActivityData = {
        name: log.name,
        type: log.category,
        date: formattedDate,
        duration: `${duration} phút (${reps} lần)`,
        calories: calories,
        status: 'Hoàn thành',
        iconName: log.name.includes('Tạ') ? 'Dumbbell' : 'Activity',
        colorClass: 'text-primary',
        bgClass: 'bg-primary/10',
      };

      let saved = false;

      if (db && firebaseUser) {
        try {
          const docRef = await addDoc(collection(db, 'users', firebaseUser.uid, 'activities'), {
            ...newActivityData,
            timestamp: serverTimestamp(),
          });
          
          onSave(null);
          saved = true;
        } catch (fsError) {
          console.error('Firestore save failed. Falling back to local state.', fsError);
        }
      } 
      
      if (!saved) {
        // Fallback if no firebase or firestore timed out
        onSave({
          id: Date.now().toString(),
          ...newActivityData,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark animate-in zoom-in-95 duration-200">
        
        <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: `url('${log.image}')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-light dark:from-surface-dark to-transparent"></div>
          <div className="absolute bottom-4 left-6 flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2 backdrop-blur-md border border-primary/30">
              <Activity className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-xs text-primary font-bold uppercase tracking-wider">{log.category}</p>
              <h2 className="text-xl font-bold text-white tracking-tight">{log.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-black/20 p-1 text-white hover:bg-black/40 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-4">
          <div className="mb-6">
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
              Nhập số lần và thời gian thực hiện để AI tính toán lượng calo tiêu thụ chính xác nhất.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 group">
                <label className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1.5 ml-1">Số lần tập</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-text-muted-light dark:text-text-muted-dark">
                    <Activity size={20} />
                  </span>
                  <input 
                    type="number" 
                    value={reps}
                    onChange={(e) => {
                      setReps(e.target.value);
                      setCalculatedCalories(null); // Reset calories when input changes
                    }}
                    placeholder="Ví dụ: 30" 
                    className="w-full rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-3 pl-10 pr-4 text-text-light dark:text-text-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                  />
                </div>
              </div>
              <div className="flex-1 group">
                <label className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1.5 ml-1">Thời gian (Phút)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-text-muted-light dark:text-text-muted-dark">
                    <Clock size={20} />
                  </span>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      setCalculatedCalories(null); // Reset calories when input changes
                    }}
                    placeholder="Ví dụ: 15" 
                    className="w-full rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-3 pl-10 pr-4 text-text-light dark:text-text-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="text-orange-500" size={20} />
                  <span className="font-bold text-text-light dark:text-text-dark">Calo tiêu thụ:</span>
                </div>
                {isCalculating ? (
                  <Loader2 className="animate-spin text-primary" size={20} />
                ) : (
                  <span className="text-xl font-black text-primary">
                    {calculatedCalories !== null ? `${calculatedCalories} kcal` : '-- kcal'}
                  </span>
                )}
              </div>
              <button 
                onClick={calculateCalories}
                disabled={!reps || !duration || isCalculating}
                className="mt-3 w-full py-2 rounded-lg bg-primary/20 text-primary font-semibold text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCalculating ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                Tính toán bằng AI
              </button>
            </div>

            <div className="mt-2 rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-start gap-3">
              <Info className="text-primary mt-0.5 shrink-0" size={20} />
              <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                <span className="font-bold text-text-light dark:text-primary">Công nghệ AI:</span> Calo tiêu thụ sẽ được tính toán dựa trên chỉ số cơ thể của bạn.
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
              Hủy
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !reps || !duration || calculatedCalories === null}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-[#112218] text-sm font-bold shadow-lg shadow-primary/20 hover:bg-[#14cc60] hover:shadow-primary/40 transition-all transform active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
              {isSubmitting ? 'Đang lưu...' : 'Lưu hoạt động'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BmiModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark animate-in zoom-in-95 duration-200">
        
        <div className="relative h-32 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-light dark:from-surface-dark to-transparent"></div>
          <div className="absolute bottom-4 left-6 flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2 backdrop-blur-md border border-primary/30">
              <Weight className="text-primary" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Cập nhật chỉ số</h2>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-black/20 p-1 text-white hover:bg-black/40 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-4">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">Đã đến lúc kiểm tra sức khỏe!</h3>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
              Vui lòng nhập lại Chiều cao và Cân nặng để chúng tôi tính toán chỉ số BMI mới nhất và đề xuất lộ trình tập luyện phù hợp cho tuần này.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 group">
                <label className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1.5 ml-1">Chiều cao (cm)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-text-muted-light dark:text-text-muted-dark">
                    <Ruler size={20} />
                  </span>
                  <input type="number" placeholder="170" className="w-full rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-3 pl-10 pr-4 text-text-light dark:text-text-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" />
                </div>
              </div>
              <div className="flex-1 group">
                <label className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1.5 ml-1">Cân nặng (kg)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-text-muted-light dark:text-text-muted-dark">
                    <Dumbbell size={20} />
                  </span>
                  <input type="number" placeholder="65" className="w-full rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-3 pl-10 pr-4 text-text-light dark:text-text-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-start gap-3">
              <Info className="text-primary mt-0.5 shrink-0" size={20} />
              <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                <span className="font-bold text-text-light dark:text-primary">Lưu ý:</span> Cập nhật thường xuyên giúp theo dõi tiến độ chính xác hơn 95%.
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
              Để sau
            </button>
            <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-[#112218] text-sm font-bold shadow-lg shadow-primary/20 hover:bg-[#14cc60] hover:shadow-primary/40 transition-all transform active:scale-95">
              <Activity size={18} />
              Cập nhật ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
