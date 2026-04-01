
import { useState, useEffect, useCallback } from 'react';
import type { Database } from '@/integrations/supabase/types';
import { Expense } from '@/types/expense';
import { useToast } from '@/components/ui/use-toast';
import { useTrip } from '@/contexts/TripContext';
import { useLineAuth } from '@/contexts/LineAuthContext';
import { getStoredSessionToken } from '@/lib/session';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

function getAuthHeaders() {
  const token = getStoredSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { trip, isAdmin, isTripSwitching } = useTrip();
  const { user } = useLineAuth();
  const activeTripId = trip?.id ?? null;

  const mapExpenseRow = useCallback((expense: ExpenseRow): Expense => ({
    id: expense.id,
    tripId: expense.trip_id,
    name: expense.name,
    date: expense.date,
    time: expense.time,
    category: expense.category as Expense["category"],
    amount: Number(expense.amount),
    paidBy: expense.paid_by,
    sharedBy: expense.shared_by,
    currency: expense.currency || 'THB',
    thbAmount: expense.thb_amount === null ? undefined : Number(expense.thb_amount),
    isConvertedToThb: expense.is_converted_to_thb || false,
    createdByUserId: expense.created_by_user_id,
    updatedByUserId: expense.updated_by_user_id,
    updatedAt: expense.updated_at,
  }), []);

  const canModifyExpense = useCallback((expense: Expense): boolean => {
    if (isAdmin) return true;
    if (!expense.createdByUserId) return false; // legacy → only admin
    return expense.createdByUserId === user?.id;
  }, [isAdmin, user?.id]);

  const fetchExpenses = useCallback(async () => {
    if (!activeTripId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-trip-expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ trip_id: activeTripId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "ไม่สามารถโหลดข้อมูลรายจ่ายได้");
      }

      const rows = Array.isArray(data.expenses) ? data.expenses as ExpenseRow[] : [];
      setExpenses(rows.map(mapExpenseRow));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลรายจ่ายได้";
      console.error('fetchExpenses error:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTripId, mapExpenseRow, toast]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'tripId'>) => {
    if (!activeTripId || isTripSwitching) return false;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          trip_id: activeTripId,
          name: expense.name.trim(),
          date: expense.date,
          time: expense.time,
          category: expense.category,
          amount: expense.amount,
          paid_by: expense.paidBy,
          shared_by: expense.sharedBy,
          currency: expense.currency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create expense');
      }

      const nextExpense = mapExpenseRow(data as ExpenseRow);
      setExpenses(prev => [nextExpense, ...prev.filter((exp) => exp.id !== nextExpense.id)]);
      
      toast({
        title: "สำเร็จ",
        description: "เพิ่มรายจ่ายแล้ว",
      });

      void fetchExpenses().catch((error: unknown) => {
        console.error('post-create fetchExpenses error:', error);
        toast({
          title: "อัปเดตรายการช้าเล็กน้อย",
          description: "บันทึกรายจ่ายสำเร็จแล้ว แต่กำลังรีเฟรชรายการใหม่",
        });
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "ไม่สามารถเพิ่มรายจ่ายได้";
      console.error('addExpense error:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateExpense = async (id: string, expense: Omit<Expense, 'id'>) => {
    if (!activeTripId || isTripSwitching) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/update-expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          expense_id: id,
          trip_id: activeTripId,
          name: expense.name.trim(),
          date: expense.date,
          time: expense.time,
          category: expense.category,
          amount: expense.amount,
          paid_by: expense.paidBy,
          shared_by: expense.sharedBy,
          currency: expense.currency,
          thb_amount: expense.thbAmount ?? null,
          is_converted_to_thb: expense.isConvertedToThb,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'forbidden') {
          toast({ title: "ไม่มีสิทธิ์", description: data.message, variant: "destructive" });
          return;
        }
        if (data.code === 'trip_closed') {
          toast({ title: "ทริปปิดแล้ว", description: data.message, variant: "destructive" });
          return;
        }
        throw new Error(data.message || data.error || 'Failed to update');
      }

      setExpenses(prev =>
        prev.map(exp =>
          exp.id === id ? { ...expense, id, createdByUserId: (data.created_by_user_id ?? exp.createdByUserId), updatedByUserId: data.updated_by_user_id, updatedAt: data.updated_at } : exp
        )
      );
      await fetchExpenses();

      toast({ title: "สำเร็จ", description: "แก้ไขรายจ่ายแล้ว" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "ไม่สามารถแก้ไขรายจ่ายได้";
      console.error('updateExpense error:', error);
      toast({ title: "ข้อผิดพลาด", description: message, variant: "destructive" });
    }
  };

  const convertExpenseToCurrency = async (id: string, thbAmount: number) => {
    if (!activeTripId || isTripSwitching) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/update-expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          expense_id: id,
          trip_id: activeTripId,
          thb_amount: thbAmount,
          is_converted_to_thb: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to convert');
      }

      setExpenses(prev =>
        prev.map(exp =>
          exp.id === id 
            ? { ...exp, thbAmount, isConvertedToThb: true }
            : exp
        )
      );
    } catch (error: unknown) {
      console.error('convertExpenseToCurrency error:', error);
      throw error instanceof Error ? error : new Error("Failed to convert");
    }
  };

  const deleteExpense = async (id: string) => {
    if (!activeTripId || isTripSwitching) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          expense_id: id,
          trip_id: activeTripId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'forbidden') {
          toast({ title: "ไม่มีสิทธิ์", description: data.message, variant: "destructive" });
          return;
        }
        if (data.code === 'trip_closed') {
          toast({ title: "ทริปปิดแล้ว", description: data.message, variant: "destructive" });
          return;
        }
        throw new Error(data.message || data.error || 'Failed to delete');
      }

      setExpenses(prev => prev.filter(exp => exp.id !== id));
      await fetchExpenses();
      toast({ title: "สำเร็จ", description: "ลบรายจ่ายแล้ว" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "ไม่สามารถลบรายจ่ายได้";
      console.error('deleteExpense error:', error);
      toast({ title: "ข้อผิดพลาด", description: message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    convertExpenseToCurrency,
    canModifyExpense,
    refetch: fetchExpenses,
  };
};
