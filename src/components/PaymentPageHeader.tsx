
import ShareSettlementDialog from "@/components/ShareSettlementDialog";
import { Payment } from "@/types/expense";
import { Trip } from "@/contexts/TripContext";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";

interface PaymentPageHeaderProps {
  totalPayments: number;
  trip: Trip;
  payments: Payment[];
  memberNameMap: Map<string, string>;
  settlementBlockingCode: string | null;
  hasLegacyPayments: boolean;
}

const PaymentPageHeader = ({
  totalPayments,
  trip,
  payments,
  memberNameMap,
  settlementBlockingCode,
  hasLegacyPayments,
}: PaymentPageHeaderProps) => {
  return (
    <div className="w-full rounded-[28px] bg-white/85 px-5 py-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">หนี้สิน</h1>
          <div className="text-lg text-gray-600">
            ยอดที่ยังค้างโอน (บาท):{" "}
            <CurrencyDisplay 
              amount={totalPayments} 
              currency="THB"
              className="font-semibold"
            />
          </div>
        </div>
        <ShareSettlementDialog
          trip={trip}
          payments={payments}
          memberNameMap={memberNameMap}
          settlementBlockingCode={settlementBlockingCode}
          hasLegacyPayments={hasLegacyPayments}
        />
      </div>
    </div>
  );
};

export default PaymentPageHeader;
