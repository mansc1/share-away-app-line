
export interface Expense {
  id: string;
  name: string;
  date: string;
  time: string;
  category: 'travel' | 'food' | 'ticket' | 'other';
  amount: number;
  paidBy: string;
  sharedBy: string[];
  currency: string;
  thbAmount?: number;
  isConvertedToThb: boolean;
}

export interface PaymentSummary {
  from: string;
  to: string;
  amount: number;
}

export interface PersonBalance {
  name: string;
  balance: number;
}
