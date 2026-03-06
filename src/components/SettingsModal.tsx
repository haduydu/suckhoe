import React, { useState, useRef } from 'react';
import { X, Lock, Calendar, Mail, Camera, Loader2 } from 'lucide-react';
import { User, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  userProfile: any;
}

export default function SettingsModal({ isOpen, onClose, user, userProfile }: SettingsModalProps) {
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
      setError(null);
    } catch (err) {
      setError('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
      console.error(err);
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.8 quality to ensure it fits in Firestore
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            reject(new Error('Could not get canvas context'));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) { // Limit to 5MB
      setError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    setUploading(true);
    try {
      // Resize and compress image before uploading
      const base64String = await resizeImage(file);
      
      // Update Firestore using setDoc with merge: true to create doc if not exists
      await setDoc(doc(db, 'users', user.uid), {
        photoURL: base64String
      }, { merge: true });
      
      // Note: We don't update Auth Profile photoURL here because base64 strings 
      // are often too long for the Firebase Auth profile limit (2048 chars).
      // The app should rely on the Firestore user profile for the photo.
      
      setUploading(false);
      setError(null);
      
      // Force reload page to reflect changes if needed, or rely on real-time listeners
      // window.location.reload(); 
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Không thể xử lý hoặc lưu ảnh. Vui lòng thử lại.');
      setUploading(false);
    }
  };

  const creationDate = user?.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Không có thông tin';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Cài đặt tài khoản</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/10 transition-colors">
            <X size={20} className="text-text-muted-light dark:text-text-muted-dark" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/50 group-hover:border-primary transition-colors">
                <img 
                  src={userProfile?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop"} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover transition-colors"
                disabled={uploading}
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-text-light dark:text-text-dark">{userProfile?.name || user?.displayName || 'Người dùng'}</h3>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Thay đổi ảnh đại diện</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 dark:bg-white/5 border border-border-light dark:border-border-dark">
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Ngày lập tài khoản</p>
                <p className="font-medium text-text-light dark:text-text-dark">{creationDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 dark:bg-white/5 border border-border-light dark:border-border-dark">
              <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Email đăng ký</p>
                <p className="font-medium text-text-light dark:text-text-dark">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Password Reset */}
          <div className="pt-4 border-t border-border-light dark:border-border-dark">
            <h3 className="text-sm font-semibold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
              <Lock size={16} />
              Bảo mật
            </h3>
            
            {resetSent ? (
              <div className="p-4 rounded-xl bg-green-500/20 text-green-400 text-sm">
                Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư của bạn.
              </div>
            ) : (
              <button
                onClick={handlePasswordReset}
                className="w-full py-2.5 px-4 rounded-xl border border-border-light dark:border-border-dark hover:bg-white/10 dark:hover:bg-white/10 transition-colors text-text-light dark:text-text-dark font-medium text-sm flex items-center justify-center gap-2"
              >
                Đổi mật khẩu
              </button>
            )}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
