
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { Expense } from "@/types/expense";
import { ExpenseFormData, CATEGORIES } from "@/types/form";
import { useToast } from "@/components/ui/use-toast";
import { useTrip } from "@/contexts/TripContext";
import PeopleToggleButton from "@/components/shared/PeopleToggleButton";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AddExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'tripId'>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddExpenseForm = ({ onAddExpense, open, onOpenChange }: AddExpenseFormProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { members, currentMember, memberNames, trip } = useTrip();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    date: '',
    time: '',
    category: '',
    amount: '',
    paidBy: currentMember?.display_name || '',
    sharedBy: []
  });

  const minDate = trip?.start_date ? parseISO(trip.start_date) : undefined;
  const maxDate = trip?.end_date ? parseISO(trip.end_date) : undefined;

  useEffect(() => {
    if (!isOpen) return;
    if (trip?.start_date) {
      setSelectedDate(parseISO(trip.start_date));
    } else {
      setSelectedDate(undefined);
    }
  }, [isOpen, trip?.start_date]);

  useEffect(() => {
    if (selectedDate) {
      const thaiDate = format(selectedDate, "d MMM", { locale: th }) + ".";
      setFormData(prev => ({ ...prev, date: thaiDate }));
    } else {
      setFormData(prev => ({ ...prev, date: '' }));
    }
  }, [selectedDate]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกชื่อรายจ่าย",
        variant: "destructive",
      });
      return false;
    }

    if (!selectedDate || !formData.time || !formData.category || !formData.paidBy) {
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
      setSelectedDate(undefined);
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
              <Label className="text-sm">วันที่ *</Label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: th }) : "เลือกวันที่"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setDatePopoverOpen(false);
                    }}
                    disabled={(date) =>
                      (minDate ? date < minDate : false) || (maxDate ? date > maxDate : false)
                    }
                    defaultMonth={selectedDate || minDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">เลือกได้เฉพาะวันที่ในทริป</p>
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
