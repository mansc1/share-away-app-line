
import { Expense, PersonBalance } from "@/types/expense";
import { useTrip } from "@/contexts/TripContext";
import ExpenseChart from "@/components/ExpenseChart";
import BalanceChart from "@/components/BalanceChart";
import AddExpenseForm from "@/components/AddExpenseForm";
import EmptyState from "@/components/EmptyState";

interface MainPageProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  addExpenseOpen?: boolean;
  onAddExpenseOpenChange?: (open: boolean) => void;
}

const MainPage = ({ expenses, onAddExpense, addExpenseOpen, onAddExpenseOpenChange }: MainPageProps) => {
  const { memberNames } = useTrip();

  const calculateBalances = (): PersonBalance[] => {
    const balances: { [key: string]: number } = {};
    
    memberNames.forEach(person => {
      balances[person] = 0;
    });

    expenses.forEach(expense => {
      const shareAmount = expense.amount / expense.sharedBy.length;
      
      // Person who paid gets positive balance
      balances[expense.paidBy] += expense.amount;
      
      // People who shared get negative balance
      expense.sharedBy.forEach(person => {
        balances[person] -= shareAmount;
      });
    });

    return Object.entries(balances)
      .map(([name, balance]) => ({ name, balance }))
      .sort((a, b) => b.balance - a.balance);
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      <AddExpenseForm onAddExpense={onAddExpense} open={addExpenseOpen} onOpenChange={onAddExpenseOpenChange} />

      {expenses.length > 0 && (
        <>
          <ExpenseChart expenses={expenses} />
          <BalanceChart balances={calculateBalances()} />
        </>
      )}

      {expenses.length === 0 && <EmptyState />}
    </div>
  );
};

export default MainPage;
