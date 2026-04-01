import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";
import { useTrip } from "@/contexts/TripContext";
import { Payment } from "@/types/expense";
import { getStoredSessionToken } from "@/lib/session";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

function getAuthHeaders() {
  const token = getStoredSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const usePayments = () => {
  const { trip, isTripSwitching } = useTrip();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLegacyPayments, setHasLegacyPayments] = useState(false);
  const [hasAuthoritativePayments, setHasAuthoritativePayments] = useState(false);
  const [settlementBlockingCode, setSettlementBlockingCode] = useState<string | null>(null);
  const [settlementBlockingMessage, setSettlementBlockingMessage] = useState<string | null>(null);
  const [incompleteExpenseCount, setIncompleteExpenseCount] = useState<number | null>(null);
  const [sampleExpenseNames, setSampleExpenseNames] = useState<string[]>([]);
  const activeTripId = trip?.id ?? null;

  const mapPaymentRow = useCallback((payment: PaymentRow): Payment => ({
    id: payment.id,
    tripId: payment.trip_id,
    fromUserId: payment.from_user_id,
    toUserId: payment.to_user_id,
    amount: Number(payment.amount),
    settlementAmount: payment.settlement_amount === null ? null : Number(payment.settlement_amount),
    settlementCurrency: payment.settlement_currency ?? null,
    isAuthoritativeSettlement: payment.settlement_amount !== null,
    status: payment.status as Payment["status"],
    createdAt: payment.created_at,
    paidAt: payment.paid_at,
    confirmedAt: payment.confirmed_at,
    createdByUserId: payment.created_by_user_id,
    updatedByUserId: payment.updated_by_user_id,
    updatedAt: payment.updated_at,
  }), []);

  const fetchPayments = useCallback(async () => {
    if (!activeTripId) {
      setPayments([]);
      setLoading(false);
      setHasLegacyPayments(false);
      setHasAuthoritativePayments(false);
      setSettlementBlockingCode(null);
      setSettlementBlockingMessage(null);
      setIncompleteExpenseCount(null);
      setSampleExpenseNames([]);
      return;
    }

    try {
      setSettlementBlockingCode(null);
      setSettlementBlockingMessage(null);
      setIncompleteExpenseCount(null);
      setSampleExpenseNames([]);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-trip-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ trip_id: activeTripId }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message || payload.error || "ไม่สามารถโหลดสถานะการโอนเงินได้");
      }

      const rows = Array.isArray(payload.payments) ? payload.payments as PaymentRow[] : [];
      const formattedPayments: Payment[] = rows.map(mapPaymentRow);

      const authoritativePayments = formattedPayments.filter((payment) => payment.isAuthoritativeSettlement);
      const legacyPayments = formattedPayments.filter((payment) => !payment.isAuthoritativeSettlement);

      setPayments(authoritativePayments);
      setHasAuthoritativePayments(authoritativePayments.length > 0);
      setHasLegacyPayments(legacyPayments.length > 0);
    } catch (error) {
      console.error("fetchPayments error:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดสถานะการโอนเงินได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTripId, mapPaymentRow, toast]);

  const syncPayments = useCallback(async () => {
    if (!activeTripId || isTripSwitching) return;

    try {
      setSettlementBlockingCode(null);
      setSettlementBlockingMessage(null);
      setIncompleteExpenseCount(null);
      setSampleExpenseNames([]);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ trip_id: activeTripId }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "settlement_currency_incomplete") {
          setSettlementBlockingCode(data.code);
          setSettlementBlockingMessage(data.message || "ยังมีรายจ่ายที่ต้องแปลงเป็นเงินบาทก่อน");
          setIncompleteExpenseCount(data.incomplete_expense_count ?? null);
          setSampleExpenseNames(data.sample_expense_names || []);
          return;
        }
        throw new Error(data.message || data.error || "Failed to sync payments");
      }

      if (Array.isArray(data.payments)) {
        const formattedPayments: Payment[] = data.payments.map((payment: PaymentRow) => mapPaymentRow(payment));
        const authoritativePayments = formattedPayments.filter((payment) => payment.isAuthoritativeSettlement);
        const legacyPayments = formattedPayments.filter((payment) => !payment.isAuthoritativeSettlement);
        setPayments(authoritativePayments);
        setHasAuthoritativePayments(authoritativePayments.length > 0);
        setHasLegacyPayments(legacyPayments.length > 0);
      } else {
        await fetchPayments();
      }
    } catch (error) {
      console.error("syncPayments error:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเตรียมรายการโอนเงินได้",
        variant: "destructive",
      });
    }
  }, [activeTripId, fetchPayments, isTripSwitching, mapPaymentRow, toast]);

  const markAsPaid = useCallback(async (paymentId: string) => {
    if (!activeTripId || isTripSwitching) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mark-payment-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ payment_id: paymentId, trip_id: activeTripId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to mark payment as paid");
      }

      toast({ title: "บันทึกแล้ว", description: "อัปเดตสถานะเป็นจ่ายแล้ว" });
      await fetchPayments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "ไม่สามารถอัปเดตสถานะได้";
      console.error("markAsPaid error:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: message,
        variant: "destructive",
      });
    }
  }, [activeTripId, fetchPayments, isTripSwitching, toast]);

  const confirmPayment = useCallback(async (paymentId: string) => {
    if (!activeTripId || isTripSwitching) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ payment_id: paymentId, trip_id: activeTripId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to confirm payment");
      }

      toast({ title: "ยืนยันแล้ว", description: "อัปเดตสถานะเป็นได้รับเงินแล้ว" });
      await fetchPayments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "ไม่สามารถยืนยันการรับเงินได้";
      console.error("confirmPayment error:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: message,
        variant: "destructive",
      });
    }
  }, [activeTripId, fetchPayments, isTripSwitching, toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    hasLegacyPayments,
    hasAuthoritativePayments,
    settlementBlockingCode,
    settlementBlockingMessage,
    incompleteExpenseCount,
    sampleExpenseNames,
    syncPayments,
    markAsPaid,
    confirmPayment,
    refetch: fetchPayments,
  };
};
