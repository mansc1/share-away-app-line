
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Expense } from '@/types/expense';
import { useToast } from '@/components/ui/use-toast';
import { useTrip } from '@/contexts/TripContext';
import { useLineAuth } from '@/contexts/LineAuthContext';
import { getStoredSessionToken } from '@/lib/session';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', activeTripId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedExpenses: Expense[] = (data ?? []).map(expense => ({
        id: expense.id,
        tripId: expense.trip_id,
        name: expense.name,
        date: expense.date,
        time: expense.time,
        category: expense.category as any,
        amount: parseFloat(expense.amount.toString()),
        paidBy: expense.paid_by,
        sharedBy: expense.shared_by,
        currency: expense.currency || 'CNY',
        thbAmount: expense.thb_amount ? parseFloat(expense.thb_amount.toString()) : undefined,
        isConvertedToThb: expense.is_converted_to_thb || false,
        createdByUserId: (expense as any).created_by_user_id ?? null,
        updatedByUserId: (expense as any).updated_by_user_id ?? null,
        updatedAt: (expense as any).updated_at ?? null,
      }));

      setExpenses(formattedExpenses);
    } catch (error: any) {
      console.error('fetchExpenses error:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายจ่ายได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTripId, toast]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'tripId'>) => {
    if (!activeTripId || isTripSwitching) return;

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

      // Realtime will pick up the new row, but also optimistically add
      const newExpense: Expense = {
        id: data.id,
        tripId: data.trip_id,
        name: data.name,
        date: data.date,
        time: data.time,
        category: data.category as any,
        amount: parseFloat(data.amount.toString()),
        paidBy: data.paid_by,
        sharedBy: data.shared_by,
        currency: data.currency || 'CNY',
        thbAmount: data.thb_amount ? parseFloat(data.thb_amount.toString()) : undefined,
        isConvertedToThb: data.is_converted_to_thb || false,
        createdByUserId: data.created_by_user_id ?? null,
        updatedByUserId: data.updated_by_user_id ?? null,
        updatedAt: data.updated_at ?? null,
      };

      setExpenses(prev => [newExpense, ...prev]);
      
      toast({
        title: "สำเร็จ",
        description: "เพิ่มรายจ่ายแล้ว",
      });
    } catch (error: any) {
      console.error('addExpense error:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถเพิ่มรายจ่ายได้",
        variant: "destructive",
      });
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

      toast({ title: "สำเร็จ", description: "แก้ไขรายจ่ายแล้ว" });
    } catch (error: any) {
      console.error('updateExpense error:', error);
      toast({ title: "ข้อผิดพลาด", description: error.message || "ไม่สามารถแก้ไขรายจ่ายได้", variant: "destructive" });
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
    } catch (error: any) {
      console.error('convertExpenseToCurrency error:', error);
      throw error;
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
      toast({ title: "สำเร็จ", description: "ลบรายจ่ายแล้ว" });
    } catch (error: any) {
      console.error('deleteExpense error:', error);
      toast({ title: "ข้อผิดพลาด", description: error.message || "ไม่สามารถลบรายจ่ายได้", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Realtime subscription for expenses
  useEffect(() => {
    if (!activeTripId) return;

    const channel = supabase
      .channel(`expenses-${activeTripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `trip_id=eq.${activeTripId}`,
        },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchExpenses(), 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [activeTripId, fetchExpenses]);

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
