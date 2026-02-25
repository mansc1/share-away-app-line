
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Expense } from "@/types/expense";
import { EXCHANGE_RATE } from "@/constants/currency";

interface CurrencyConversionDialogProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (expenseId: string, thbAmount: number) => void;
}

const CurrencyConversionDialog = ({ 
  expense, 
  isOpen, 
  onClose, 
  onConvert
}: CurrencyConversionDialogProps) => {
  const [thbAmount, setThbAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!expense || !thbAmount) return;

    const amount = parseFloat(thbAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาใส่จำนวนเงินที่ถูกต้อง",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onConvert(expense.id, amount);
      setThbAmount('');
      onClose();
      
      // Auto-switch individual expense toggle to THB
      localStorage.setItem(`expense-toggle-${expense.id}`, JSON.stringify(true));
      
      // Trigger a storage event to update the ExpenseCard component
      window.dispatchEvent(new StorageEvent('storage', {
        key: `expense-toggle-${expense.id}`,
        newValue: 'true'
      }));
      
      // Auto-switch payment page toggle to THB
      localStorage.setItem('payment-currency-toggle', JSON.stringify(true));
      
      toast({
        title: "สำเร็จ",
        description: `แปลงรายจ่าย "${expense.name}" เป็น ${amount} บาทแล้ว`,
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถแปลงสกุลเงินได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedAmount = () => {
    if (!expense) return;
    const suggestedThbAmount = Math.round(expense.amount * EXCHANGE_RATE);
    setThbAmount(suggestedThbAmount.toString());
  };

  useEffect(() => {
    if (isOpen && expense) {
      setThbAmount(expense.thbAmount?.toString() || '');
    }
  }, [isOpen, expense]);

  if (!expense) return null;

  const suggestedThbAmount = Math.round(expense.amount * EXCHANGE_RATE);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>แปลงเป็นเงินบาท</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>รายจ่าย</Label>
            <p className="text-sm text-gray-600">{expense.name}</p>
          </div>
          
          <div className="space-y-2">
            <Label>จำนวนเงินเดิม</Label>
            <p className="text-lg font-semibold">¥{expense.amount}</p>
          </div>

          <div className="space-y-2">
            <Label>จำนวนเงินแนะนำ (อัตรา 1¥ = {EXCHANGE_RATE}฿)</Label>
            <div className="flex gap-2">
              <p className="text-lg font-semibold text-green-600">฿{suggestedThbAmount}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSuggestedAmount}
                className="text-xs"
              >
                ใช้จำนวนนี้
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="thb-amount">จำนวนเงินบาท (ระบุจำนวนจริง)</Label>
            <Input
              id="thb-amount"
              type="number"
              value={thbAmount}
              onChange={(e) => setThbAmount(e.target.value)}
              placeholder="ใส่จำนวนเงินบาท"
              step="0.01"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ยกเลิก
          </Button>
          <Button 
            onClick={handleConvert} 
            disabled={!thbAmount || loading}
            className="flex-1"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกการแปลง"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CurrencyConversionDialog;
