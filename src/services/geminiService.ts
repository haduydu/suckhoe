import { GoogleGenAI } from '@google/genai';

// Khởi tạo Gemini API client
// Lưu ý: Trong môi trường này, API Key đã được hệ thống tự động cung cấp 
// thông qua biến môi trường process.env.GEMINI_API_KEY. 
// Bạn KHÔNG CẦN (và không nên) dán trực tiếp API key vào đây để đảm bảo bảo mật.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Hàm gọi Gemini API để lấy lời khuyên sức khỏe hoặc phân tích dữ liệu
 * @param prompt Câu hỏi hoặc yêu cầu dành cho Gemini
 * @returns Câu trả lời từ Gemini
 */
export async function getHealthAdvice(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là một chuyên gia y tế và huấn luyện viên thể hình cá nhân (Trợ Lý Sức Khỏe). Hãy đưa ra những lời khuyên ngắn gọn, khoa học, dễ hiểu và mang tính động viên.',
        temperature: 0.7,
      }
    });
    
    return response.text || 'Không thể lấy được phản hồi từ AI lúc này.';
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    throw new Error('Đã xảy ra lỗi khi kết nối với Trợ Lý AI.');
  }
}
