import { useState } from 'react';
import { ConversationContext } from './types';

export const useConversationContext = () => {
  const [conversationContext, setConversationContext] = useState<ConversationContext[]>([]);

  const MAX_CONTEXT_ITEMS = 5;

  const addOrUpdateContext = (context: ConversationContext[], key: string, value: string) => {
    const existingIndex = context.findIndex(item => item.key === key);
    if (existingIndex >= 0) {
      context[existingIndex].value = value;
    } else {
      context.push({ key, value });
    }
  };

  const updateConversationContext = (userMessage: string, botResponse: string) => {
    const newContext: ConversationContext[] = [...conversationContext];
    
    const userLower = userMessage.toLowerCase();
    
    // Remember specific person queries
    const personNames = ['แมน', 'น้องหนู', 'ยุ้ย', 'แอน', 'ปลา', 'ลิโอ', 'มด', 'ภัท'];
    const mentionedPerson = personNames.find(name => userLower.includes(name.toLowerCase()));
    if (mentionedPerson) {
      addOrUpdateContext(newContext, 'last_person_asked', mentionedPerson);
    }
    
    // Remember category queries
    const categories = ['อาหาร', 'เดินทาง', 'ตั๋ว', 'อื่น'];
    const mentionedCategory = categories.find(cat => userLower.includes(cat));
    if (mentionedCategory) {
      addOrUpdateContext(newContext, 'last_category_asked', mentionedCategory);
    }
    
    // Remember if asking about debts/payments
    if (userLower.includes('หนี้') || userLower.includes('คืน') || userLower.includes('จ่าย')) {
      addOrUpdateContext(newContext, 'last_query_type', 'payments');
    }
    
    // Remember if asking about totals
    if (userLower.includes('รวม') || userLower.includes('ทั้งหมด')) {
      addOrUpdateContext(newContext, 'last_query_type', 'totals');
    }
    
    // Keep only recent context items
    if (newContext.length > MAX_CONTEXT_ITEMS) {
      newContext.splice(0, newContext.length - MAX_CONTEXT_ITEMS);
    }
    
    setConversationContext(newContext);
  };

  const buildAIContext = (recentMessages: any[]) => {
    let contextString = '';
    
    // Add conversation context
    if (conversationContext.length > 0) {
      contextString += '\nบริบทการสนทนา:\n';
      conversationContext.forEach(ctx => {
        switch (ctx.key) {
          case 'last_person_asked':
            contextString += `- เพิ่งถามเกี่ยวกับ: ${ctx.value}\n`;
            break;
          case 'last_category_asked':
            contextString += `- เพิ่งถามเกี่ยวกับหมวด: ${ctx.value}\n`;
            break;
          case 'last_query_type':
            contextString += `- ประเภทคำถามล่าสุด: ${ctx.value}\n`;
            break;
        }
      });
    }
    
    // Add recent conversation (only essential parts)
    if (recentMessages.length > 0) {
      contextString += '\nบทสนทนาล่าสุด:\n';
      recentMessages.slice(-4).forEach(msg => { // Only last 4 messages
        const shortContent = msg.content.length > 100 ? 
          msg.content.substring(0, 100) + '...' : msg.content;
        contextString += `${msg.type === 'user' ? 'ผู้ใช้' : 'AI'}: ${shortContent}\n`;
      });
    }
    
    return contextString;
  };

  return {
    updateConversationContext,
    buildAIContext
  };
};
