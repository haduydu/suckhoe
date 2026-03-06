import React, { useState } from 'react';
import { Activity, HeartPulse, Mail, Lock, ArrowRight } from 'lucide-react';
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
    <div className="flex min-h-screen w-full flex-col bg-emerald-950 text-emerald-50">
      <header className="sticky top-0 z-50 w-full border-b border-emerald-500/20 bg-emerald-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(25,240,115,0.3)] overflow-hidden">
              <img 
                src="https://yt3.googleusercontent.com/Qe0CvfjbnWtLN3EUj1ErspRoiVSnj5AWO-txCCf-9a5FhglUElvJyE23F2RAg7nDWZWvA08DFOw=s160-c-k-c0x00ffffff-no-rj" 
                alt="Logo" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover filter invert mix-blend-screen opacity-90" 
              />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">Trợ lý sức khỏe</h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSignUpMode(false)} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
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
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-emerald-950 to-emerald-950"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col gap-6 text-center lg:text-left">
                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl text-primary">
                  Chào mừng bạn đến với trợ lý sức khỏe
                </h1>
                <p className="text-lg leading-relaxed text-emerald-200/90">
                  Theo dõi tiến trình tập luyện, dinh dưỡng và các chỉ số sức khỏe quan trọng của bạn ở một nơi duy nhất. Bắt đầu hành trình sống khỏe ngay hôm nay với công nghệ AI tiên tiến.
                </p>
                
                <div className="mt-4 w-full max-w-md bg-emerald-900/40 p-6 rounded-2xl border border-emerald-500/20 shadow-xl mx-auto lg:mx-0">
                  <h3 className="text-2xl font-bold mb-6 text-center text-primary">
                    {isSignUpMode ? 'Tạo tài khoản mới' : 'Đăng nhập'}
                  </h3>
                  
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-emerald-400/60" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 rounded-xl border-emerald-500/20 bg-emerald-950/50 focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder:text-emerald-400/50 h-12 px-4 transition-all outline-none"
                        placeholder="Địa chỉ Email"
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-emerald-400/60" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 rounded-xl border-emerald-500/20 bg-emerald-950/50 focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder:text-emerald-400/50 h-12 px-4 transition-all outline-none"
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
                    <p className="text-sm text-emerald-200/70">
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
