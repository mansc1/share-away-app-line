
export interface Expense {
  id: string;
  tripId: string;
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
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  updatedAt?: string | null;
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
