
export interface ExpenseFormData {
  name: string;
  date: string;
  time: string;
  category: string;
  amount: string;
  currency: string;
  paidBy: string;
  sharedBy: string[];
}

export const PEOPLE = [
  "แมน", "น้องหนู", "Knot", "BeePeep"
];

export const DATES = [
  "27 ก.พ.", "28 ก.พ.", "1 มี.ค.", "2 มี.ค.", "3 มี.ค.", "4 มี.ค."
];

export const CATEGORIES = [
  { value: 'travel', label: 'ค่าเดินทาง' },
  { value: 'food', label: 'ค่าอาหาร' },
  { value: 'ticket', label: 'ค่าตั๋ว' },
  { value: 'other', label: 'อื่นๆ' }
];
