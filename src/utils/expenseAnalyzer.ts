
import { Expense, PersonBalance, PaymentSummary } from '@/types/expense';

export interface ExpenseStats {
  totalAmount: number;
  averagePerPerson: number;
  averagePerDay: number;
  mostExpensiveExpense: Expense | null;
  cheapestExpense: Expense | null;
  categoryTotals: Record<string, number>;
  personTotals: Record<string, number>;
  dailyTotals: Record<string, number>;
  balances: PersonBalance[];
  payments: PaymentSummary[];
}

export const analyzeExpenses = (expenses: Expense[]): ExpenseStats => {
  if (expenses.length === 0) {
    return {
      totalAmount: 0,
      averagePerPerson: 0,
      averagePerDay: 0,
      mostExpensiveExpense: null,
      cheapestExpense: null,
      categoryTotals: {},
      personTotals: {},
      dailyTotals: {},
      balances: [],
      payments: []
    };
  }

  // Calculate totals
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Category totals
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });

  // Person totals (who paid)
  const personTotals: Record<string, number> = {};
  expenses.forEach(expense => {
    personTotals[expense.paidBy] = (personTotals[expense.paidBy] || 0) + expense.amount;
  });

  // Daily totals
  const dailyTotals: Record<string, number> = {};
  expenses.forEach(expense => {
    dailyTotals[expense.date] = (dailyTotals[expense.date] || 0) + expense.amount;
  });

  // Most/least expensive
  const sortedByAmount = [...expenses].sort((a, b) => b.amount - a.amount);
  const mostExpensiveExpense = sortedByAmount[0] || null;
  const cheapestExpense = sortedByAmount[sortedByAmount.length - 1] || null;

  // Calculate balances
  const balances = calculateBalances(expenses);
  
  // Calculate payment suggestions
  const payments = calculatePayments(balances);

  // Get unique people for average calculation
  const allPeople = new Set<string>();
  expenses.forEach(expense => {
    allPeople.add(expense.paidBy);
    expense.sharedBy.forEach(person => allPeople.add(person));
  });

  // Get unique days
  const uniqueDays = new Set(expenses.map(e => e.date));

  return {
    totalAmount,
    averagePerPerson: allPeople.size > 0 ? totalAmount / allPeople.size : 0,
    averagePerDay: uniqueDays.size > 0 ? totalAmount / uniqueDays.size : 0,
    mostExpensiveExpense,
    cheapestExpense,
    categoryTotals,
    personTotals,
    dailyTotals,
    balances,
    payments
  };
};

const calculateBalances = (expenses: Expense[]): PersonBalance[] => {
  const balances: Record<string, number> = {};

  expenses.forEach(expense => {
    const sharePerPerson = expense.amount / expense.sharedBy.length;
    
    // Add to payer's balance
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
    
    // Subtract from each person's share
    expense.sharedBy.forEach(person => {
      balances[person] = (balances[person] || 0) - sharePerPerson;
    });
  });

  return Object.entries(balances).map(([name, balance]) => ({
    name,
    balance: Math.round(balance * 100) / 100
  }));
};

const calculatePayments = (balances: PersonBalance[]): PaymentSummary[] => {
  const payments: PaymentSummary[] = [];
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.balance, -debtor.balance);

    if (amount > 0.01) {
      payments.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amount * 100) / 100
      });

      creditor.balance -= amount;
      debtor.balance += amount;
    }

    if (creditor.balance < 0.01) i++;
    if (debtor.balance > -0.01) j++;
  }

  return payments;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'travel': 'ค่าเดินทาง',
    'food': 'ค่าอาหาร',
    'ticket': 'ค่าตั๋ว',
    'other': 'อื่นๆ'
  };
  return labels[category] || category;
};
