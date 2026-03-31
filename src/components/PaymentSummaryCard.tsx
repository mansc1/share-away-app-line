
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface PaymentSummaryCardProps {
  pendingCount: number;
  paidCount: number;
  confirmedCount: number;
}

const PaymentSummaryCard = ({ pendingCount, paidCount, confirmedCount }: PaymentSummaryCardProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-blue-600 mb-2">
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm font-medium">สถานะการโอนเงิน</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
              <div className="text-gray-500">รอโอน</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{paidCount}</div>
              <div className="text-gray-500">จ่ายแล้ว</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{confirmedCount}</div>
              <div className="text-gray-500">ยืนยันแล้ว</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSummaryCard;
