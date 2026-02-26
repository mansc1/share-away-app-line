
import { Expense, PaymentSummary } from "@/types/expense";

export interface GroupedPayment {
  from: string;
  payments: { to: string; amount: number }[];
  totalAmount: number;
}

export const calculateOptimalPayments = (expenses: Expense[], people?: string[]): PaymentSummary[] => {
  // Calculate individual balances
  const balances: { [key: string]: number } = {};
  
  // Derive people from expenses if not provided
  const memberList = people ?? [...new Set(expenses.flatMap(e => [e.paidBy, ...e.sharedBy]))];
  
  memberList.forEach(person => {
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

  // Separate creditors and debtors
  const creditors: { person: string; amount: number }[] = [];
  const debtors: { person: string; amount: number }[] = [];

  Object.entries(balances).forEach(([person, balance]) => {
    if (balance > 0.01) { // Small threshold for floating point errors
      creditors.push({ person, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ person, amount: Math.abs(balance) });
    }
  });

  // Sort by amount for optimal matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const payments: PaymentSummary[] = [];
  let i = 0, j = 0;

  // Match debtors with creditors to minimize transactions
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const paymentAmount = Math.min(debtor.amount, creditor.amount);

    if (paymentAmount > 0.01) {
      payments.push({
        from: debtor.person,
        to: creditor.person,
        amount: paymentAmount
      });
    }

    debtor.amount -= paymentAmount;
    creditor.amount -= paymentAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return payments;
};

export const groupPaymentsBySender = (payments: PaymentSummary[]): GroupedPayment[] => {
  const grouped: { [key: string]: GroupedPayment } = {};

  payments.forEach(payment => {
    if (!grouped[payment.from]) {
      grouped[payment.from] = {
        from: payment.from,
        payments: [],
        totalAmount: 0
      };
    }
    
    grouped[payment.from].payments.push({
      to: payment.to,
      amount: payment.amount
    });
    grouped[payment.from].totalAmount += payment.amount;
  });

  return Object.values(grouped);
};
