/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './components/Dashboard';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type AppState = 'landing' | 'profile' | 'dashboard';

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && db) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.height && data.weight) {
              setAppState('dashboard');
            } else {
              setAppState('profile');
            }
          } else {
            setAppState('profile');
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setAppState('profile');
        } finally {
          setLoading(false);
        }
      } else {
        setAppState('landing');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-200">
      {appState === 'landing' && <LandingPage onGetStarted={() => setAppState('profile')} />}
      {appState === 'profile' && <ProfileSetup user={user} onComplete={() => setAppState('dashboard')} />}
      {appState === 'dashboard' && <Dashboard user={user} toggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} />}
    </div>
  );
}
