
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

const ExpenseEmptyState = () => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mb-4">
          <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีรายจ่าย</h3>
        <p className="text-gray-500 mb-4">เริ่มต้นด้วยการเพิ่มรายจ่ายแรกของคุณ</p>
        <p className="text-sm text-gray-400">
          ปัดไปซ้ายหรือกดที่ "หน้าแรก" เพื่อเพิ่มรายจ่าย
        </p>
      </CardContent>
    </Card>
  );
};

export default ExpenseEmptyState;
