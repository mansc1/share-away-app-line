
import { Expense } from '@/types/expense';
import ExpenseChatbot from '../ExpenseChatbot';

interface ChatbotPageProps {
  expenses: Expense[];
  onRequestAddExpense?: () => void;
}

const ChatbotPage = ({ expenses, onRequestAddExpense }: ChatbotPageProps) => {
  return (
    <div className="h-[calc(100vh-140px)] pb-16">
      <ExpenseChatbot expenses={expenses} onRequestAddExpense={onRequestAddExpense} />
    </div>
  );
};

export default ChatbotPage;
