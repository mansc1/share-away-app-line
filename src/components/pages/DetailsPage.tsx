
import { useState, useEffect } from "react";
import { Expense } from "@/types/expense";
import ExpenseCard from "./details/ExpenseCard";
import ExpenseEditDialog from "./details/ExpenseEditDialog";
import ExpenseSortControls from "./details/ExpenseSortControls";
import ExpenseEmptyState from "./details/ExpenseEmptyState";
import CurrencyConversionDialog from "@/components/shared/CurrencyConversionDialog";

interface DetailsPageProps {
  expenses: Expense[];
  onUpdateExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onConvertExpense?: (id: string, thbAmount: number) => void;
}

const DetailsPage = ({ 
  expenses, 
  onUpdateExpense, 
  onDeleteExpense, 
  onConvertExpense 
}: DetailsPageProps) => {
  console.log('DetailsPage rendered with expenses:', expenses);
  console.log('Number of expenses:', expenses?.length || 0);
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [convertingExpense, setConvertingExpense] = useState<Expense | null>(null);
  const [sortBy, setSortBy] = useState('time-desc');

  // Reset sort to default when navigating back to this page
  useEffect(() => {
    setSortBy('time-desc');
  }, []);

  useEffect(() => {
    console.log('DetailsPage useEffect - expenses changed:', expenses);
  }, [expenses]);

  const sortExpenses = (expenses: Expense[]): Expense[] => {
    const sorted = [...expenses];
    
    switch (sortBy) {
      case 'time-desc':
        return sorted.sort((a, b) => {
          const dateTimeA = new Date(`2024-06-${a.date.split(' ')[0]} ${a.time}`);
          const dateTimeB = new Date(`2024-06-${b.date.split(' ')[0]} ${b.time}`);
          return dateTimeB.getTime() - dateTimeA.getTime();
        });
      case 'time-asc':
        return sorted.sort((a, b) => {
          const dateTimeA = new Date(`2024-06-${a.date.split(' ')[0]} ${a.time}`);
          const dateTimeB = new Date(`2024-06-${b.date.split(' ')[0]} ${b.time}`);
          return dateTimeA.getTime() - dateTimeB.getTime();
        });
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount);
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case 'paidBy':
        return sorted.sort((a, b) => a.paidBy.localeCompare(b.paidBy));
      default:
        return sorted;
    }
  };

  const handleEdit = (expense: Expense) => {
    console.log('Editing expense:', expense);
    setEditingExpense(expense);
  };

  const handleCloseEdit = () => {
    setEditingExpense(null);
  };

  const handleConvert = (expense: Expense) => {
    console.log('Converting expense:', expense);
    setConvertingExpense(expense);
  };

  const handleCloseConvert = () => {
    setConvertingExpense(null);
  };

  const handleConvertConfirm = async (expenseId: string, thbAmount: number) => {
    if (onConvertExpense) {
      await onConvertExpense(expenseId, thbAmount);
    }
  };

  // Debug info
  const hasExpenses = expenses && expenses.length > 0;
  console.log('Rendering decision - hasExpenses:', hasExpenses);

  const sortedExpenses = hasExpenses ? sortExpenses(expenses) : [];

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">รายละเอียดรายจ่าย</h2>
        <p className="text-gray-600 mt-1">ทั้งหมด {expenses?.length || 0} รายการ</p>
      </div>

      {!hasExpenses ? (
        <ExpenseEmptyState />
      ) : (
        <div>
          <ExpenseSortControls 
            sortBy={sortBy} 
            onSortChange={setSortBy} 
          />
          
          {sortedExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEdit}
              onDelete={onDeleteExpense}
              onConvert={handleConvert}
            />
          ))}
        </div>
      )}

      <ExpenseEditDialog
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={handleCloseEdit}
        onUpdate={onUpdateExpense}
      />

      <CurrencyConversionDialog
        expense={convertingExpense}
        isOpen={!!convertingExpense}
        onClose={handleCloseConvert}
        onConvert={handleConvertConfirm}
      />
    </div>
  );
};

export default DetailsPage;
