import { Expense } from "@/types/expense";
import { useMemo, useEffect } from "react";
import PaymentPageHeader from "@/components/PaymentPageHeader";
import PaymentEmptyState from "@/components/PaymentEmptyState";
import PaymentSummaryCard from "@/components/PaymentSummaryCard";
import PaymentCard from "@/components/PaymentCard";
import PaymentInfoCard from "@/components/PaymentInfoCard";
import PaymentStatusState from "@/components/PaymentStatusState";
import { usePayments } from "@/hooks/usePayments";
import { useTrip } from "@/contexts/TripContext";

interface PaymentPageProps {
  expenses: Expense[];
  actionsDisabled?: boolean;
}

const PaymentPage = ({ expenses, actionsDisabled }: PaymentPageProps) => {
  const { trip, members, currentMember, isAdmin } = useTrip();
  const isTripStarted = trip?.status === "confirmed";
  const {
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
  } = usePayments();

  const expenseSignature = useMemo(
    () => expenses.map((expense) => `${expense.id}:${expense.updatedAt ?? ""}:${expense.amount}:${expense.paidBy}:${expense.sharedBy.join(",")}`).join("|"),
    [expenses],
  );

  useEffect(() => {
    if (!expenseSignature) return;
    syncPayments();
  }, [expenseSignature, syncPayments]);

  const memberNameMap = useMemo(() => {
    const entries = members.map((member) => [member.user_id, member.display_name]);
    return new Map(entries);
  }, [members]);

  const outstandingTotal = payments
    .filter((payment) => payment.status !== "confirmed")
    .reduce((sum, payment) => sum + (payment.settlementAmount ?? 0), 0);

  const pendingCount = payments.filter((payment) => payment.status === "pending").length;
  const paidCount = payments.filter((payment) => payment.status === "paid").length;
  const confirmedCount = payments.filter((payment) => payment.status === "confirmed").length;

  return (
    <div className="p-4 pb-20 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="flex justify-center">
        {trip && (
          <PaymentPageHeader
            totalPayments={outstandingTotal}
            trip={trip}
            payments={payments}
            memberNameMap={memberNameMap}
            settlementBlockingCode={settlementBlockingCode}
            hasLegacyPayments={hasLegacyPayments}
            canShareSummary={isTripStarted}
          />
        )}
      </div>

      {!loading && settlementBlockingCode === "settlement_currency_incomplete" ? (
        <PaymentStatusState
          emoji="฿"
          title="ยังสร้างยอดโอนไม่ได้"
          description={settlementBlockingMessage || "ยังมีรายจ่ายบางรายการที่ต้องแปลงเป็นเงินบาทก่อน"}
          details={
            incompleteExpenseCount
              ? `มี ${incompleteExpenseCount} รายการที่ยังไม่พร้อม${sampleExpenseNames.length ? ` เช่น ${sampleExpenseNames.join(", ")}` : ""}`
              : undefined
          }
        />
      ) : !loading && !hasAuthoritativePayments && hasLegacyPayments ? (
        <PaymentStatusState
          emoji="!"
          title="มียอดโอนแบบเก่าอยู่"
          description="ข้อมูลยอดโอนเดิมยังไม่ใช่ยอด settlement แบบเงินบาทที่เชื่อถือได้"
          details="โปรดทำให้รายจ่ายทุกตัวพร้อมสำหรับ THB settlement แล้วให้ระบบสร้างยอดโอนใหม่อีกครั้ง"
        />
      ) : !loading && payments.length === 0 ? (
        <PaymentEmptyState />
      ) : (
        <>
          <PaymentSummaryCard
            pendingCount={pendingCount}
            paidCount={paidCount}
            confirmedCount={confirmedCount}
          />

          <div className="space-y-4">
            {payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                fromName={memberNameMap.get(payment.fromUserId) || "สมาชิก"}
                toName={memberNameMap.get(payment.toUserId) || "สมาชิก"}
                canMarkPaid={!!currentMember && (payment.fromUserId === currentMember.user_id || isAdmin)}
                canConfirm={!!currentMember && (payment.toUserId === currentMember.user_id || isAdmin)}
                actionsDisabled={actionsDisabled}
                onMarkPaid={() => markAsPaid(payment.id)}
                onConfirm={() => confirmPayment(payment.id)}
              />
            ))}
          </div>

          <PaymentInfoCard />
        </>
      )}
    </div>
  );
};

export default PaymentPage;
