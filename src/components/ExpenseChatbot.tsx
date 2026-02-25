
import { useState, useRef, useEffect } from 'react';
import { Expense } from '@/types/expense';
import { useChatbot } from './chatbot/useChatbot';
import ChatMessage from './chatbot/ChatMessage';
import TypingIndicator from './chatbot/TypingIndicator';
import ChatInput from './chatbot/ChatInput';
import { getSuggestedQuestions } from '@/utils/chatbotPatterns';

interface ExpenseChatbotProps {
  expenses: Expense[];
  onRequestAddExpense?: () => void;
}

const QUICK_SUGGESTIONS = [
  'เพิ่มรายจ่าย',
  'สรุปรายจ่าย',
  ...getSuggestedQuestions().slice(0, 3),
];

const ExpenseChatbot = ({ expenses, onRequestAddExpense }: ExpenseChatbotProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isTyping, sendMessage } = useChatbot(expenses, onRequestAddExpense);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (message: string) => {
    sendMessage(message);
    setInputValue('');
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-2">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Quick Suggestions */}
        {showSuggestions && !isTyping && (
          <div className="flex flex-wrap gap-2 mt-3 mb-2">
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSendMessage(suggestion)}
                className="px-3 py-1.5 text-sm rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        disabled={isTyping}
      />
    </div>
  );
};

export default ExpenseChatbot;
