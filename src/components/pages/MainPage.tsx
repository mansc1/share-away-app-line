
import { Expense, PersonBalance } from "@/types/expense";
import { useTrip } from "@/contexts/TripContext";
import ExpenseChart from "@/components/ExpenseChart";
import BalanceChart from "@/components/BalanceChart";
import AddExpenseForm from "@/components/AddExpenseForm";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { type CurrencyType } from "@/constants/currency";

interface MainPageProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'tripId'>) => void;
  addExpenseOpen?: boolean;
  onAddExpenseOpenChange?: (open: boolean) => void;
  actionsDisabled?: boolean;
}

const MainPage = ({ expenses, onAddExpense, addExpenseOpen, onAddExpenseOpenChange, actionsDisabled }: MainPageProps) => {
  const { memberNames } = useTrip();

  const getAggregateExpenseView = () => {
    if (expenses.length === 0) {
      return { expenses: [], currency: "THB" as CurrencyType, available: false };
    }

    const allThbReady = expenses.every(
      (expense) => expense.currency === "THB" || typeof expense.thbAmount === "number"
    );

    if (allThbReady) {
      return {
        expenses: expenses.map((expense) => ({
          ...expense,
          amount: expense.currency === "THB" ? expense.amount : expense.thbAmount ?? expense.amount,
        })),
        currency: "THB" as CurrencyType,
        available: true,
      };
    }

    const firstCurrency = expenses[0].currency || "THB";
    const sameOriginalCurrency = expenses.every(
      (expense) => (expense.currency || "THB") === firstCurrency
    );

    if (sameOriginalCurrency) {
      return {
        expenses,
        currency: firstCurrency as CurrencyType,
        available: true,
      };
    }

    return { expenses: [], currency: "THB" as CurrencyType, available: false };
  };

  const aggregateView = getAggregateExpenseView();

  const calculateBalances = (sourceExpenses: Expense[]): PersonBalance[] => {
    const balances: { [key: string]: number } = {};
    
    memberNames.forEach(person => {
      balances[person] = 0;
    });

    sourceExpenses.forEach(expense => {
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
      <AddExpenseForm onAddExpense={onAddExpense} open={addExpenseOpen} onOpenChange={onAddExpenseOpenChange} disabled={actionsDisabled} />

      {expenses.length > 0 && (
        <>
          {aggregateView.available ? (
            <>
              <ExpenseChart expenses={aggregateView.expenses} currency={aggregateView.currency} />
              <BalanceChart balances={calculateBalances(aggregateView.expenses)} currency={aggregateView.currency} />
            </>
          ) : (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                สรุปรวมยังแสดงแบบกราฟไม่ได้เมื่อมีหลายสกุลเงินปนกันและยังแปลงเป็น THB ไม่ครบ
              </CardContent>
            </Card>
          )}
        </>
      )}

      {expenses.length === 0 && <EmptyState />}
    </div>
  );
};

export default MainPage;
