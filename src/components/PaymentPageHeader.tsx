
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";

interface PaymentPageHeaderProps {
  totalPayments: number;
  showThb?: boolean;
}

const PaymentPageHeader = ({ totalPayments, showThb = false }: PaymentPageHeaderProps) => {
  const currency = showThb ? 'THB' : 'CNY';
  
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">หนี้สิน</h1>
      <div className="text-lg text-gray-600">
        ยอดโอนทั้งหมด:{" "}
        <CurrencyDisplay 
          amount={totalPayments} 
          currency={currency as any}
          className="font-semibold"
        />
      </div>
    </div>
  );
};

export default PaymentPageHeader;
