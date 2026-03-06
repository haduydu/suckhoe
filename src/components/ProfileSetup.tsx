import React, { useState, useEffect } from 'react';
import { HeartPulse, LogOut, UserPlus, Badge, Ruler, Weight, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { logOut, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ProfileSetupProps {
  user: User | null;
  onComplete: () => void;
}

export default function ProfileSetup({ user, onComplete }: ProfileSetupProps) {
  const [name, setName] = useState(user?.displayName || 'Nguyễn Văn A');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
    
    // Fetch existing user data if any
    if (user?.uid && db) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.name) setName(data.name);
            if (data.height) setHeight(data.height.toString());
            if (data.weight) setWeight(data.weight.toString());
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!user?.uid || !db) {
      setIsLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name,
        height: parseFloat(height) || null,
        weight: parseFloat(weight) || null,
      }, { merge: true });
      
      onComplete();
    } catch (error) {
      console.error('Failed to save profile', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-surface-border bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-6 lg:px-10 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <HeartPulse size={24} />
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight">Trợ Lý Sức Khỏe</h2>
        </div>
        <button onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 hover:bg-slate-200 dark:hover:bg-surface-border transition-colors text-slate-700 dark:text-text-secondary text-sm font-bold">
          <LogOut size={20} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 lg:py-16 relative z-10">
        <div className="w-full max-w-[640px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-10 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <UserPlus className="text-primary" size={32} />
            </div>
            <h1 className="tracking-tight text-3xl lg:text-4xl font-extrabold mb-3">Hoàn tất hồ sơ</h1>
            <p className="text-slate-500 dark:text-text-secondary text-base lg:text-lg max-w-lg mx-auto">
              Vui lòng nhập thông tin cơ bản để chúng tôi có thể cá nhân hóa trải nghiệm theo dõi sức khỏe của bạn.
            </p>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 lg:p-10 shadow-xl border border-slate-100 dark:border-surface-border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Badge className="text-primary" size={18} />
                  Tên người dùng
                </label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border-slate-200 dark:border-surface-border bg-slate-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 h-12 px-4 py-3 transition-all shadow-sm outline-none"
                    placeholder="Nhập tên hiển thị của bạn"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <CheckCircle2 className="text-primary" size={18} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-text-secondary pl-1">Tên này sẽ hiển thị trên bảng xếp hạng.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Ruler className="text-primary" size={18} />
                    Chiều cao (cm)
                  </label>
                  <input 
                    type="number" 
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="block w-full rounded-xl border-slate-200 dark:border-surface-border bg-slate-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 h-12 px-4 py-3 shadow-sm outline-none"
                    placeholder="Ví dụ: 170"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Weight className="text-primary" size={18} />
                    Cân nặng (kg)
                  </label>
                  <input 
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    step="0.1"
                    className="block w-full rounded-xl border-slate-200 dark:border-surface-border bg-slate-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 h-12 px-4 py-3 shadow-sm outline-none"
                    placeholder="Ví dụ: 65.5"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <Lock className="text-primary mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed">
                  Thông tin của bạn được bảo mật và lưu trữ an toàn trên hệ thống. Chúng tôi sử dụng dữ liệu này để tính chỉ số BMI và đề xuất lộ trình tập luyện phù hợp.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-end items-center">
                <button type="button" onClick={onComplete} className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-slate-500 dark:text-text-secondary hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-border transition-colors">
                  Bỏ qua
                </button>
                <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-background-dark font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
                  <span>Lưu thông tin</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50 dark:opacity-20"></div>
        <div className="absolute bottom-0 -right-64 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50 dark:opacity-20"></div>
      </div>
    </div>
  );
}
