
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface PaymentSummaryCardProps {
  paymentsCount: number;
  payersCount: number;
}

const PaymentSummaryCard = ({ paymentsCount, payersCount }: PaymentSummaryCardProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-blue-600 mb-2">
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm font-medium">จำนวนการโอนเงิน</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {paymentsCount} ครั้ง
          </div>
          <p className="text-sm text-gray-500 mt-1">
            จำนวนคนที่โอนเงิน {payersCount} คน
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSummaryCard;
