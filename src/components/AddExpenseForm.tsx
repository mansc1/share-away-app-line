
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Expense } from "@/types/expense";
import { ExpenseFormData, DATES, CATEGORIES } from "@/types/form";
import { useToast } from "@/components/ui/use-toast";
import { useTrip } from "@/contexts/TripContext";
import PeopleToggleButton from "@/components/shared/PeopleToggleButton";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";

interface AddExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddExpenseForm = ({ onAddExpense, open, onOpenChange }: AddExpenseFormProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { members, currentMember, memberNames } = useTrip();
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    date: '',
    time: '',
    category: '',
    amount: '',
    paidBy: currentMember?.display_name || '',
    sharedBy: []
  });

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกชื่อรายจ่าย",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.date || !formData.time || !formData.category || !formData.paidBy) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกจำนวนเงินที่ถูกต้อง (มากกว่า 0)",
        variant: "destructive",
      });
      return false;
    }

    if (formData.sharedBy.length === 0) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาเลือกคนที่ต้องแชร์เงินอย่างน้อย 1 คน",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    console.log('AddExpenseForm - Starting form submission');
    
    try {
      const expenseData = {
        name: formData.name.trim(),
        date: formData.date,
        time: formData.time,
        category: formData.category as any,
        amount: parseFloat(formData.amount),
        paidBy: formData.paidBy,
        sharedBy: formData.sharedBy,
        currency: 'CNY' as const,
        isConvertedToThb: false
      };
      
      console.log('AddExpenseForm - Calling onAddExpense with:', expenseData);
      await onAddExpense(expenseData);

      console.log('AddExpenseForm - Successfully added expense, resetting form');
      setFormData({
        name: '',
        date: '',
        time: '',
        category: '',
        amount: '',
        paidBy: '',
        sharedBy: []
      });
      setIsOpen(false);
    } catch (error) {
      console.error('AddExpenseForm - Error in handleSubmit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonToggle = (person: string) => {
    setFormData(prev => ({
      ...prev,
      sharedBy: prev.sharedBy.includes(person)
        ? prev.sharedBy.filter(p => p !== person)
        : [...prev.sharedBy, person]
    }));
  };

  const handleToggleAll = () => {
    const hasSelection = formData.sharedBy.length > 0;
    setFormData(prev => ({
      ...prev,
      sharedBy: hasSelection ? [] : [...memberNames]
    }));
  };

  const hasSelection = formData.sharedBy.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 text-sm">
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มรายจ่าย
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">เพิ่มรายจ่าย</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm">ชื่อรายจ่าย *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="เช่น ค่าโรงแรม"
              maxLength={100}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="date" className="text-sm">วันที่ *</Label>
              <Select value={formData.date} onValueChange={(value) => setFormData(prev => ({ ...prev, date: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="เลือกวันที่" />
                </SelectTrigger>
                <SelectContent>
                  {DATES.map(date => (
                    <SelectItem key={date} value={date} className="text-sm">{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="time" className="text-sm">เวลา *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category" className="text-sm">ประเภท *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-sm">{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="amount" className="text-sm">
                จำนวนเงิน (<CurrencyDisplay amount={0} currency="CNY" showSymbol={true} className="text-sm" />) *
              </Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="paidBy" className="text-sm">คนจ่าย *</Label>
              <Select value={formData.paidBy} onValueChange={(value) => setFormData(prev => ({ ...prev, paidBy: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="เลือกคน" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map(person => (
                    <SelectItem key={person} value={person} className="text-sm">{person}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">คนที่ต้องแชร์เงิน *</Label>
              <PeopleToggleButton hasSelection={hasSelection} onToggleAll={handleToggleAll} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {memberNames.map(person => (
                <div key={person} className="flex items-center space-x-2">
                  <Checkbox
                    id={person}
                    checked={formData.sharedBy.includes(person)}
                    onCheckedChange={() => handlePersonToggle(person)}
                  />
                  <Label htmlFor={person} className="text-xs">{person}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-sm"
            disabled={loading}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseForm;
