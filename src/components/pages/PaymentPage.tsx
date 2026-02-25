
import { useState, useEffect } from "react";
import { Expense } from "@/types/expense";
import { calculateOptimalPayments, groupPaymentsBySender } from "@/utils/paymentCalculations";
import PaymentPageHeader from "@/components/PaymentPageHeader";
import PaymentEmptyState from "@/components/PaymentEmptyState";
import PaymentSummaryCard from "@/components/PaymentSummaryCard";
import PaymentCard from "@/components/PaymentCard";
import PaymentInfoCard from "@/components/PaymentInfoCard";
import CurrencyToggle from "@/components/shared/CurrencyToggle";

interface PaymentPageProps {
  expenses: Expense[];
}

const PaymentPage = ({ expenses }: PaymentPageProps) => {
  const [showThb, setShowThb] = useState(() => {
    const saved = localStorage.getItem('payment-currency-toggle');
    return saved ? JSON.parse(saved) : false;
  });
  
  useEffect(() => {
    localStorage.setItem('payment-currency-toggle', JSON.stringify(showThb));
  }, [showThb]);

  // Get expenses based on individual toggles
  const getProcessedExpenses = () => {
    return expenses.map(expense => {
      const expenseToggle = localStorage.getItem(`expense-toggle-${expense.id}`);
      const useThb = expenseToggle ? JSON.parse(expenseToggle) : false;
      
      if (useThb && expense.isConvertedToThb && expense.thbAmount) {
        return {
          ...expense,
          amount: expense.thbAmount,
          currency: 'THB'
        };
      } else {
        return {
          ...expense,
          currency: 'CNY'
        };
      }
    });
  };

  // Separate expenses by currency based on individual toggles
  const processedExpenses = getProcessedExpenses();
  const cnyExpenses = processedExpenses.filter(exp => exp.currency === 'CNY');
  const thbExpenses = processedExpenses.filter(exp => exp.currency === 'THB');

  // Calculate payments for each currency
  const cnyPayments = cnyExpenses.length > 0 ? calculateOptimalPayments(cnyExpenses) : [];
  const thbPayments = thbExpenses.length > 0 ? calculateOptimalPayments(thbExpenses) : [];

  // Group payments by sender for each currency
  const groupedCnyPayments = groupPaymentsBySender(cnyPayments);
  const groupedThbPayments = groupPaymentsBySender(thbPayments);

  // Calculate totals for each currency
  const totalCnyPayments = cnyPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalThbPayments = thbPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Determine which currency to show based on what has payments
  const hasThbPayments = groupedThbPayments.length > 0;
  const hasCnyPayments = groupedCnyPayments.length > 0;
  
  // Auto-switch to appropriate currency
  const effectiveShowThb = hasThbPayments && !hasCnyPayments ? true : 
                          !hasThbPayments && hasCnyPayments ? false : 
                          showThb;

  const currentPayments = effectiveShowThb ? groupedThbPayments : groupedCnyPayments;
  const currentTotal = effectiveShowThb ? totalThbPayments : totalCnyPayments;
  const payersCount = currentPayments.length;

  const handleToggleChange = (newShowThb: boolean) => {
    // Only allow toggle if both currencies have payments
    if (hasThbPayments && hasCnyPayments) {
      setShowThb(newShowThb);
    }
  };

  const shouldShowToggle = hasThbPayments && hasCnyPayments;

  return (
    <div className="p-4 pb-20 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="flex justify-between items-center">
        <PaymentPageHeader totalPayments={currentTotal} showThb={effectiveShowThb} />
        {shouldShowToggle && (
          <CurrencyToggle showThb={effectiveShowThb} onToggle={handleToggleChange} />
        )}
      </div>

      {/* Show currency breakdown */}
      {hasThbPayments && hasCnyPayments && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-2">สรุปการโอนแยกตามสกุลเงิน</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>การโอนเป็นหยวน:</span>
              <span className="font-medium">¥{totalCnyPayments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>การโอนเป็นบาท:</span>
              <span className="font-medium">฿{totalThbPayments.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {currentPayments.length === 0 ? (
        <PaymentEmptyState />
      ) : (
        <>
          <PaymentSummaryCard 
            paymentsCount={effectiveShowThb ? thbPayments.length : cnyPayments.length} 
            payersCount={payersCount} 
          />

          <div className="space-y-4">
            {currentPayments.map((groupedPayment, index) => (
              <PaymentCard 
                key={index} 
                groupedPayment={groupedPayment} 
                showThb={effectiveShowThb}
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
