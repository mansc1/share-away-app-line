
import { useState, useEffect } from 'react';
import { Expense } from '@/types/expense';
import { analyzeExpenses } from '@/utils/expenseAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { Message } from './types';
import { useConversationContext } from './useConversationContext';

const ADD_EXPENSE_KEYWORDS = ['เพิ่มรายจ่าย', 'เพิ่มค่าใช้จ่าย', 'บันทึกรายจ่าย', 'เพิ่มรายการ', 'จดรายจ่าย', 'เพิ่มค่า', 'add expense'];

export const useChatbot = (expenses: Expense[], onRequestAddExpense?: () => void) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { updateConversationContext, buildAIContext } = useConversationContext();

  useEffect(() => {
    // Count converted expenses
    const convertedExpenses = expenses.filter(e => e.isConvertedToThb);
    const totalCny = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalThb = expenses.reduce((sum, e) => sum + (e.thbAmount || 0), 0);
    
    // Welcome message with dual currency info
    const welcomeMessage: Message = {
      id: '1',
      type: 'bot',
      content: `สวัสดีครับ! 👋 ผมเป็น AI ที่ปรึกษารายจ่าย

📊 สถานะปัจจุบัน:
• รายจ่ายทั้งหมด: ${expenses.length} รายการ
• ยอดรวมเป็นหยวน: ¥${totalCny.toLocaleString()}
• รายการที่แปลงเป็นบาทแล้ว: ${convertedExpenses.length} รายการ
${totalThb > 0 ? `• ยอดรวมเป็นบาท: ฿${totalThb.toLocaleString()}` : ''}

🤖 ลองถามคำถามดูครับ`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [expenses]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Check if user wants to add an expense
    const qLower = question.toLowerCase();
    if (ADD_EXPENSE_KEYWORDS.some(kw => qLower.includes(kw))) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'เปิดหน้าเพิ่มรายจ่ายให้แล้วครับ กรุณากรอกข้อมูลได้เลย 📝',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      onRequestAddExpense?.();
      return;
    }

    setIsTyping(true);

    try {
      const stats = analyzeExpenses(expenses);
      
      // Enhanced expense data with currency info
      const enhancedExpenses = expenses.map(expense => ({
        ...expense,
        hasThbConversion: expense.isConvertedToThb,
        thbAmount: expense.thbAmount || null
      }));
      
      // Get recent messages for context (excluding the welcome message)
      const recentMessages = messages.filter(msg => msg.id !== '1');
      const contextString = buildAIContext(recentMessages);
      
      console.log('Calling OpenAI API via Edge Function with conversation context');
      
      const { data, error } = await supabase.functions.invoke('expense-ai-chat', {
        body: {
          question,
          expenses: enhancedExpenses,
          stats,
          currencyInfo: {
            totalCny: expenses.reduce((sum, e) => sum + e.amount, 0),
            totalThb: expenses.reduce((sum, e) => sum + (e.thbAmount || 0), 0),
            convertedCount: expenses.filter(e => e.isConvertedToThb).length,
            totalCount: expenses.length
          },
          conversationContext: contextString
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.message || 'ขอโทษครับ ไม่สามารถประมวลผลคำถามได้',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Update conversation context
      updateConversationContext(question, data.message || '');

    } catch (error) {
      console.error('Error processing question:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'ขอโทษครับ เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    sendMessage
  };
};
