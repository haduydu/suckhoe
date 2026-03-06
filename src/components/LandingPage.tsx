import React, { useState } from 'react';
import { Activity, PlayCircle, HeartPulse, Edit3, TrendingUp, Target, Utensils, Users, RefreshCw, Mail, Lock, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      onGetStarted();
      return;
    }
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    try {
      setIsLoggingIn(true);
      setError('');
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // onGetStarted will be handled by App.tsx auth state change
    } catch (err: any) {
      console.error('Auth failed', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Email hoặc mật khẩu không đúng.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu (ít nhất 6 ký tự).');
      } else {
        setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-surface-border bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-500 text-background-dark">
              <HeartPulse size={20} />
            </div>
            <h2 className="text-lg font-bold tracking-tight">HealthTracker</h2>
          </div>
          <nav className="hidden md:flex flex-1 justify-center gap-8">
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#">Trang chủ</a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#">Tính năng</a>
            <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors" href="#">Giới thiệu</a>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSignUpMode(false)} className="hidden text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary md:block transition-colors">
              Đăng nhập
            </button>
            <button onClick={() => setIsSignUpMode(true)} className="flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background-dark transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(25,240,115,0.3)]">
              <span className="truncate">Đăng ký</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background-dark to-background-dark"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col gap-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 self-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary lg:self-start">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Phiên bản mới 2.0 đã có mặt
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Chào mừng bạn đến với <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Trợ Lý Sức Khỏe</span>
                </h1>
                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                  Theo dõi tiến trình tập luyện, dinh dưỡng và các chỉ số sức khỏe quan trọng của bạn ở một nơi duy nhất. Bắt đầu hành trình sống khỏe ngay hôm nay với công nghệ AI tiên tiến.
                </p>
                
                <div className="mt-4 w-full max-w-md bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-surface-border shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 text-center">
                    {isSignUpMode ? 'Tạo tài khoản mới' : 'Đăng nhập'}
                  </h3>
                  
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-500/20">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 rounded-xl border-slate-200 dark:border-surface-border bg-slate-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 h-12 px-4 transition-all outline-none"
                        placeholder="Địa chỉ Email"
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 rounded-xl border-slate-200 dark:border-surface-border bg-slate-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 h-12 px-4 transition-all outline-none"
                        placeholder="Mật khẩu"
                        required
                        minLength={6}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoggingIn} 
                      className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-bold text-background-dark transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(25,240,115,0.4)] disabled:opacity-70"
                    >
                      {isLoggingIn ? 'Đang xử lý...' : (isSignUpMode ? 'Đăng ký ngay' : 'Đăng nhập')}
                      {!isLoggingIn && <ArrowRight className="ml-2" size={20} />}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isSignUpMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                      <button 
                        onClick={() => setIsSignUpMode(!isSignUpMode)}
                        className="ml-2 font-bold text-primary hover:underline focus:outline-none"
                      >
                        {isSignUpMode ? 'Đăng nhập' : 'Đăng ký'}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
                <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-br from-surface-dark to-background-dark border border-surface-border p-2 shadow-2xl">
                  <div className="h-full w-full rounded-xl overflow-hidden relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1000&auto=format&fit=crop')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-surface-border bg-surface-dark/90 p-4 backdrop-blur-md shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/20 p-2 text-primary">
                          <Activity size={24} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-400">Hoạt động hôm nay</p>
                          <p className="text-lg font-bold text-white">5.4 km / 7,230 bước</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-primary">+12%</span>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-background-dark">
                        <div className="h-1.5 w-[75%] rounded-full bg-primary"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 dark:border-surface-border bg-gray-50 dark:bg-[#0d1a12] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-base font-bold uppercase tracking-wider text-primary">Giải pháp toàn diện</h2>
              <h3 className="mt-2 text-3xl font-black sm:text-4xl">Tính năng nổi bật</h3>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">Công cụ mạnh mẽ được thiết kế để giúp bạn đạt được mục tiêu sức khỏe nhanh hơn.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <Edit3 size={24} />, title: 'Theo dõi chi tiết', desc: 'Ghi lại calo, bước chân, lượng nước và giấc ngủ mỗi ngày với giao diện trực quan.', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                { icon: <TrendingUp size={24} />, title: 'Biểu đồ trực quan', desc: 'Phân tích dữ liệu sức khỏe của bạn qua các biểu đồ đường, cột dễ hiểu theo tuần và tháng.', color: 'text-primary', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
                { icon: <Target size={24} />, title: 'Mục tiêu cá nhân', desc: 'Thiết lập mục tiêu cân nặng, tập luyện và nhận thông báo nhắc nhở thông minh.', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
                { icon: <Utensils size={24} />, title: 'Kế hoạch dinh dưỡng', desc: 'Gợi ý thực đơn hàng ngày dựa trên chỉ số BMI và mục tiêu sức khỏe của bạn.', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
                { icon: <Users size={24} />, title: 'Cộng đồng', desc: 'Kết nối với những người cùng chí hướng, chia sẻ thành tựu và động viên nhau.', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
                { icon: <RefreshCw size={24} />, title: 'Đồng bộ thiết bị', desc: 'Kết nối dễ dàng với Apple Health, Google Fit và các thiết bị đeo thông minh.', color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30' },
              ].map((feature, idx) => (
                <div key={idx} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-surface-border dark:bg-surface-dark dark:hover:border-primary/50">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h4 className="mb-2 text-xl font-bold">{feature.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
