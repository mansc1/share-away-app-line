
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Expense } from '@/types/expense';
import { useToast } from '@/components/ui/use-toast';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    console.log('fetchExpenses: Fetching all public expenses');
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchExpenses error:', error);
        throw error;
      }

      console.log('fetchExpenses: Raw data from Supabase:', data);

      const formattedExpenses: Expense[] = data.map(expense => ({
        id: expense.id,
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
      }));

      console.log('fetchExpenses: Formatted expenses:', formattedExpenses);
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
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    console.log('addExpense called with:', expense);

    try {
      const insertData = {
        name: expense.name.trim(),
        date: expense.date,
        time: expense.time,
        category: expense.category,
        amount: expense.amount,
        paid_by: expense.paidBy,
        shared_by: expense.sharedBy,
        currency: 'CNY', // Always CNY for new expenses
        thb_amount: null,
        is_converted_to_thb: false,
        user_id: null,
      };

      console.log('addExpense: Inserting data:', insertData);

      const { data, error } = await supabase
        .from('expenses')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('addExpense: Supabase error:', error);
        throw error;
      }

      console.log('addExpense: Successfully inserted:', data);

      const newExpense: Expense = {
        id: data.id,
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
      };

      setExpenses(prev => {
        const updated = [newExpense, ...prev];
        console.log('addExpense: Updated expenses state:', updated);
        return updated;
      });
      
      toast({
        title: "สำเร็จ",
        description: "เพิ่มรายจ่ายแล้ว",
      });

      console.log('addExpense: Success toast shown');
    } catch (error: any) {
      console.error('addExpense: Caught error:', error);
      
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มรายจ่ายได้",
        variant: "destructive",
      });
    }
  };

  const updateExpense = async (id: string, expense: Omit<Expense, 'id'>) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          name: expense.name.trim(),
          date: expense.date,
          time: expense.time,
          category: expense.category,
          amount: expense.amount,
          paid_by: expense.paidBy,
          shared_by: expense.sharedBy,
          currency: expense.currency,
          thb_amount: expense.thbAmount,
          is_converted_to_thb: expense.isConvertedToThb,
        })
        .eq('id', id);

      if (error) throw error;

      setExpenses(prev =>
        prev.map(exp =>
          exp.id === id ? { ...expense, id } : exp
        )
      );

      toast({
        title: "สำเร็จ",
        description: "แก้ไขรายจ่ายแล้ว",
      });
    } catch (error: any) {
      console.error('updateExpense error:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขรายจ่ายได้",
        variant: "destructive",
      });
    }
  };

  const convertExpenseToCurrency = async (id: string, thbAmount: number) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          thb_amount: thbAmount,
          is_converted_to_thb: true,
        })
        .eq('id', id);

      if (error) throw error;

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
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(prev => prev.filter(exp => exp.id !== id));
      
      toast({
        title: "สำเร็จ",
        description: "ลบรายจ่ายแล้ว",
      });
    } catch (error: any) {
      console.error('deleteExpense error:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถลบรายจ่ายได้",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    convertExpenseToCurrency,
    refetch: fetchExpenses,
  };
};
