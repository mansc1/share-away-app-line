
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

export interface Payment {
  id: string;
  tripId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  settlementAmount: number | null;
  settlementCurrency: string | null;
  isAuthoritativeSettlement: boolean;
  status: "pending" | "paid" | "confirmed";
  createdAt: string;
  paidAt: string | null;
  confirmedAt: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  updatedAt: string | null;
}

export interface PersonBalance {
  name: string;
  balance: number;
}
