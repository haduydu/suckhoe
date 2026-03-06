import React, { useState } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { Activity } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  onDelete: (id: string) => void;
}

export default function HistoryModal({ isOpen, onClose, activities, onDelete }: HistoryModalProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-surface-border overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-emerald-800 bg-emerald-900 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Chi tiết lịch sử hoạt động
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-white/70 hover:text-white" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-0 flex-1">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p>Chưa có dữ liệu lịch sử.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-white/5 text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="px-6 py-4">Hoạt động</th>
                    <th className="px-6 py-4">Ngày & Giờ</th>
                    <th className="px-6 py-4">Thời lượng/Số lần</th>
                    <th className="px-6 py-4">Calo</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${activity.status === 'Completed' || activity.status === 'Hoàn thành' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          {activity.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">{activity.date}</td>
                      <td className="px-6 py-4">{activity.duration}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{activity.calories} kcal</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteClick(activity.id)}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ml-auto ${
                            deleteConfirmId === activity.id 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                          }`}
                          title="Xóa hoạt động"
                        >
                          <Trash2 size={16} />
                          {deleteConfirmId === activity.id && <span className="text-xs font-bold">Xác nhận?</span>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
