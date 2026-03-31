
import { Card, CardContent } from "@/components/ui/card";

const PaymentEmptyState = () => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
      <CardContent className="p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✓</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          ยังไม่มียอดโอนค้าง
        </h3>
        <p className="text-gray-500">
          ตอนนี้ยังไม่จำเป็นต้องโอนเงินเพิ่มจากรายการรายจ่ายที่มี
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentEmptyState;
