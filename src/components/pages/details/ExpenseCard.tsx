
import { useState, useEffect } from "react";
import { Trash2, Edit, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/types/expense";
import { useToast } from "@/components/ui/use-toast";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";
import CurrencyToggle from "@/components/shared/CurrencyToggle";
import { CATEGORY_ICONS, CATEGORIES } from "./constants";

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onConvert: (expense: Expense) => void;
}

const COLORS = {
  travel: '#60A5FA', // Blue
  food: '#FBBF24', // Orange/Yellow  
  ticket: '#F87171', // Red
  other: '#34D399' // Green
};

const ExpenseCard = ({ expense, onEdit, onDelete, onConvert }: ExpenseCardProps) => {
  const [showThb, setShowThb] = useState(() => {
    const saved = localStorage.getItem(`expense-toggle-${expense.id}`);
    return saved ? JSON.parse(saved) : false;
  });
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(`expense-toggle-${expense.id}`, JSON.stringify(showThb));
  }, [showThb, expense.id]);

  // Listen for storage events to update toggle when conversion happens
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `expense-toggle-${expense.id}` && e.newValue) {
        setShowThb(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [expense.id]);

  const handleDelete = () => {
    if (window.confirm('คุณต้องการลบรายจ่ายนี้หรือไม่?')) {
      onDelete(expense.id);
    }
  };

  const handleToggleChange = (newShowThb: boolean) => {
    if (newShowThb && !expense.isConvertedToThb) {
      toast({
        title: "ไม่สามารถแสดงเป็นบาทได้",
        description: "กรุณาแปลงเป็นบาทก่อน",
        variant: "destructive",
      });
      return;
    }
    setShowThb(newShowThb);
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5);
  };

  const getCategoryLabel = (category: string): string => {
    const categoryObj = CATEGORIES.find(cat => cat.value === category);
    return categoryObj ? categoryObj.label : category;
  };

  const currentAmount = showThb && expense.thbAmount ? expense.thbAmount : expense.amount;
  const currentCurrency = showThb && expense.thbAmount ? 'THB' : 'CNY';
  const IconComponent = CATEGORY_ICONS[expense.category];
  const iconColor = COLORS[expense.category];

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Top row: Icon + Name + Amount */}
        <div className="flex items-start justify-between mb-3">
          {/* Left: Icon + Name + Date/Time */}
          <div className="flex items-start gap-3 flex-1">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: iconColor }}
            >
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base text-gray-900 mb-1">{expense.name}</h3>
              <div className="text-sm text-gray-600">
                {expense.date} • {formatTime(expense.time)}
              </div>
            </div>
          </div>
          
          {/* Right: Amount + Toggle */}
          <div className="text-right">
            <CurrencyDisplay 
              amount={currentAmount} 
              currency={currentCurrency as any}
              className="text-xl font-bold"
            />
            {/* Toggle below amount */}
            {expense.isConvertedToThb && (
              <div className="mt-2 flex justify-end">
                <CurrencyToggle 
                  showThb={showThb} 
                  onToggle={handleToggleChange} 
                  size="sm" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Second row: Paid by (right) */}
        <div className="flex items-center justify-end mb-3">
          {/* Paid by */}
          <div className="text-xs text-gray-500">
            จ่ายโดย {expense.paidBy}
          </div>
        </div>

        {/* Shared by section */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">
            {getCategoryLabel(expense.category)} แชร์กับ {expense.sharedBy.length} คน:
          </div>
          <div className="flex flex-wrap gap-1">
            {expense.sharedBy.map((person) => (
              <Badge key={person} variant="outline" className="text-xs">
                {person}
              </Badge>
            ))}
          </div>
        </div>

        {/* Per person amount */}
        <div className="mb-4">
          <div className="text-sm text-gray-600">
            คนละ: <CurrencyDisplay 
              amount={currentAmount / expense.sharedBy.length} 
              currency={currentCurrency as any}
              className="font-medium text-gray-600"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {!expense.isConvertedToThb && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onConvert(expense)}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              แปลงเป็นบาท
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(expense)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            แก้ไข
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            ลบ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCard;
