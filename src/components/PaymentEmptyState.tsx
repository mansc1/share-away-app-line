
import { Card, CardContent } from "@/components/ui/card";

const PaymentEmptyState = () => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
      <CardContent className="p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✓</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          เรียบร้อยแล้ว!
        </h3>
        <p className="text-gray-500">
          ทุกคนได้จ่ายเงินครบถ้วนแล้ว
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentEmptyState;
