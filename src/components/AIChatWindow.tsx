import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Activity, UserProfile } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  activities: Activity[];
}

export default function AIChatWindow({ isOpen, onClose, userProfile, activities }: AIChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là Trợ lý NuNu, là trợ lý sức khỏe của bạn. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi về lịch sử tập luyện, phân tích lượng calo, hoặc xin lời khuyên về sức khỏe.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Missing Gemini API Key');
      }

      const ai = new GoogleGenAI({ apiKey });

      // Prepare context/system instruction
      const systemInstruction = `
Bạn là "Trợ lý NuNu", một chuyên gia tư vấn sức khỏe và thể hình thân thiện, nhiệt tình.
Thông tin người dùng:
- Tên: ${userProfile?.name || 'Chưa cập nhật'}
- Chiều cao: ${userProfile?.height ? userProfile.height + ' cm' : 'Chưa cập nhật'}
- Cân nặng: ${userProfile?.weight ? userProfile.weight + ' kg' : 'Chưa cập nhật'}

Lịch sử tập luyện của người dùng (từ mới nhất đến cũ nhất, tối đa 20 hoạt động gần đây):
${activities.slice(0, 20).map(a => `- Ngày: ${a.date}, Bài tập: ${a.name}, Loại: ${a.type}, Thời lượng/Reps: ${a.duration}, Calo tiêu thụ: ${a.calories} kcal, Trạng thái: ${a.status}`).join('\n')}

Hãy trả lời câu hỏi của người dùng dựa trên thông tin trên. Trả lời bằng tiếng Việt, thân thiện, ngắn gọn và súc tích. Nếu người dùng hỏi về lịch sử tập luyện, hãy phân tích dữ liệu trên để trả lời.
`;

      const chatHistory = messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Use the chat API for better multi-turn handling
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction,
        },
        history: chatHistory,
      });

      const response = await chat.sendMessage({ message: userMessage.content });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'Xin lỗi, tôi không thể trả lời lúc này.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      let errorMessage = 'Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.';
      
      if (error?.message?.includes('API key not valid')) {
        errorMessage = 'Lỗi: API Key không hợp lệ. Vui lòng kiểm tra cấu hình.';
      } else if (error?.message?.includes('model not found')) {
        errorMessage = 'Lỗi: Không tìm thấy mô hình AI phù hợp.';
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-border flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-background-dark">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <h3 className="font-bold">Trợ lý NuNu</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-black/10 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-background-dark">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' 
                ? 'bg-slate-200 dark:bg-surface-border text-slate-700 dark:text-slate-300' 
                : 'bg-primary/20 text-primary'
            }`}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-background-dark rounded-tr-sm'
                : 'bg-white dark:bg-surface-dark border border-slate-100 dark:border-surface-border text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 flex-row">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">
              <Bot size={16} />
            </div>
            <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <Loader2 size={16} className="animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-surface-border">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi Trợ lý NuNu..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none h-[46px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
