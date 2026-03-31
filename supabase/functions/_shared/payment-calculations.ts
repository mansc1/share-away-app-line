export interface ExpenseRow {
  settlement_amount: number;
  paid_by: string;
  shared_by: string[];
}

export interface SuggestedPayment {
  fromDisplayName: string;
  toDisplayName: string;
  amount: number;
}

export function calculateSuggestedPayments(expenses: ExpenseRow[]): SuggestedPayment[] {
  const balances: Record<string, number> = {};
  const people = [...new Set(expenses.flatMap((expense) => [expense.paid_by, ...expense.shared_by]))];

  people.forEach((person) => {
    balances[person] = 0;
  });

  expenses.forEach((expense) => {
    if (!expense.shared_by.length) return;

    const shareAmount = Number(expense.settlement_amount) / expense.shared_by.length;
    balances[expense.paid_by] = (balances[expense.paid_by] || 0) + Number(expense.settlement_amount);

    expense.shared_by.forEach((person) => {
      balances[person] = (balances[person] || 0) - shareAmount;
    });
  });

  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0.01)
    .map(([person, amount]) => ({ person, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < -0.01)
    .map(([person, amount]) => ({ person, amount: Math.abs(amount) }))
    .sort((a, b) => b.amount - a.amount);

  const payments: SuggestedPayment[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      payments.push({
        fromDisplayName: debtor.person,
        toDisplayName: creditor.person,
        amount: Number(amount.toFixed(2)),
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i += 1;
    if (creditor.amount < 0.01) j += 1;
  }

  return payments;
}
