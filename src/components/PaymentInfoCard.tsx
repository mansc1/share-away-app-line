
import { Card, CardContent } from "@/components/ui/card";

const PaymentInfoCard = () => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-sm rounded-3xl">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-2xl mb-3">
            <span className="text-xl">💡</span>
          </div>
          <p className="text-sm text-blue-700 font-medium mb-1">
            การคำนวณอัตโนมัติ
          </p>
          <p className="text-xs text-blue-600">
            ใช้จำนวนการโอนเงินน้อยที่สุดเพื่อความสะดวก
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentInfoCard;
