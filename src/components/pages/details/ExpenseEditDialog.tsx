
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Expense } from "@/types/expense";
import { PEOPLE, DATES, CATEGORIES } from "@/types/form";
import { useToast } from "@/components/ui/use-toast";
import PeopleToggleButton from "@/components/shared/PeopleToggleButton";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";

interface ExpenseEditDialogProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updatedExpense: Omit<Expense, 'id'>) => void;
}

const ExpenseEditDialog = ({ expense, isOpen, onClose, onUpdate }: ExpenseEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    category: '',
    amount: '',
    paidBy: '',
    sharedBy: [] as string[],
    thbAmount: '',
    isConvertedToThb: false
  });

  useEffect(() => {
    if (expense) {
      console.log('ExpenseEditDialog - Setting form data from expense:', expense);
      setFormData({
        name: expense.name,
        date: expense.date,
        time: expense.time,
        category: expense.category,
        amount: expense.amount.toString(),
        paidBy: expense.paidBy,
        sharedBy: [...expense.sharedBy],
        thbAmount: expense.thbAmount?.toString() || '',
        isConvertedToThb: expense.isConvertedToThb
      });
    } else {
      console.log('ExpenseEditDialog - Resetting form data');
      setFormData({
        name: '',
        date: '',
        time: '',
        category: '',
        amount: '',
        paidBy: '',
        sharedBy: [],
        thbAmount: '',
        isConvertedToThb: false
      });
    }
  }, [expense]);

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
    
    if (!expense || !validateForm()) return;

    setLoading(true);
    console.log('ExpenseEditDialog - Updating expense with data:', formData);
    
    try {
      const thbAmount = formData.thbAmount ? parseFloat(formData.thbAmount) : undefined;
      
      const updatedExpenseData = {
        name: formData.name.trim(),
        date: formData.date,
        time: formData.time,
        category: formData.category as any,
        amount: parseFloat(formData.amount),
        paidBy: formData.paidBy,
        sharedBy: formData.sharedBy,
        currency: 'CNY', // Always CNY
        thbAmount,
        isConvertedToThb: formData.isConvertedToThb
      };
      
      await onUpdate(expense.id, updatedExpenseData);
      console.log('ExpenseEditDialog - Successfully updated expense');
      onClose();
    } catch (error) {
      console.error('ExpenseEditDialog - Error updating expense:', error);
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
      sharedBy: hasSelection ? [] : [...PEOPLE]
    }));
  };

  const hasSelection = formData.sharedBy.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">แก้ไขรายจ่าย</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name" className="text-sm">ชื่อรายจ่าย *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="เช่น ค่าโรงแรม"
              maxLength={100}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="edit-date" className="text-sm">วันที่ *</Label>
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
              <Label htmlFor="edit-time" className="text-sm">เวลา *</Label>
              <Input
                id="edit-time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-category" className="text-sm">ประเภท *</Label>
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
              <Label htmlFor="edit-amount" className="text-sm">
                จำนวนเงิน (<CurrencyDisplay amount={0} currency="CNY" showSymbol={true} className="text-sm" />) *
              </Label>
              <Input
                id="edit-amount"
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
              <Label htmlFor="edit-paidBy" className="text-sm">คนจ่าย *</Label>
              <Select value={formData.paidBy} onValueChange={(value) => setFormData(prev => ({ ...prev, paidBy: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="เลือกคน" />
                </SelectTrigger>
                <SelectContent>
                  {PEOPLE.map(person => (
                    <SelectItem key={person} value={person} className="text-sm">{person}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.isConvertedToThb && (
            <div>
              <Label htmlFor="edit-thb-amount" className="text-sm">
                จำนวนเงินบาท (<CurrencyDisplay amount={0} currency="THB" showSymbol={true} className="text-sm" />)
              </Label>
              <Input
                id="edit-thb-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.thbAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, thbAmount: e.target.value }))}
                placeholder="0.00"
                className="text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                *สามารถแก้ไขได้ตลอดเวลา
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">คนที่ต้องแชร์เงิน *</Label>
              <PeopleToggleButton hasSelection={hasSelection} onToggleAll={handleToggleAll} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PEOPLE.map(person => (
                <div key={person} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${person}`}
                    checked={formData.sharedBy.includes(person)}
                    onCheckedChange={() => handlePersonToggle(person)}
                  />
                  <Label htmlFor={`edit-${person}`} className="text-xs">{person}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 text-sm"
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-sm"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseEditDialog;
