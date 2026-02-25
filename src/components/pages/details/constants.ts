
import { Car, Utensils, Ticket, Clipboard } from "lucide-react";

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

export const CATEGORY_COLORS = {
  travel: 'bg-blue-100 text-blue-800',
  food: 'bg-green-100 text-green-800',
  ticket: 'bg-yellow-100 text-yellow-800',
  other: 'bg-purple-100 text-purple-800'
};

export const CATEGORY_ICONS = {
  travel: Car,
  food: Utensils,
  ticket: Ticket, 
  other: Clipboard
};

export const CATEGORY_ICON_COLORS = {
  travel: '#60A5FA', // Blue
  food: '#FBBF24', // Orange/Yellow  
  ticket: '#F87171', // Red
  other: '#34D399' // Green
};

export const SORT_OPTIONS = [
  { value: 'time-desc', label: 'เวลาล่าสุด' },
  { value: 'time-asc', label: 'เวลาเก่าสุด' },
  { value: 'amount-desc', label: 'ราคาสูงสุด' },
  { value: 'amount-asc', label: 'ราคาต่ำสุด' },
  { value: 'category', label: 'ประเภทรายจ่าย' },
  { value: 'paidBy', label: 'คนจ่าย' }
];
