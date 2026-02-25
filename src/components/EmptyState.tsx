
import { Card, CardContent } from "@/components/ui/card";

const EmptyState = () => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-gray-500">ยังไม่มีรายจ่าย</p>
        <p className="text-sm text-gray-400 mt-1">เริ่มต้นด้วยการเพิ่มรายจ่ายแรก</p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
