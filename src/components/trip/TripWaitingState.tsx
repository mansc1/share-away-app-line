import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TripWaitingStateProps {
  isFull: boolean;
  memberCount: number;
  capacityTotal: number;
  onRefresh: () => Promise<void>;
}

const TripWaitingState = ({
  isFull,
  memberCount,
  capacityTotal,
  onRefresh,
}: TripWaitingStateProps) => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-white shadow-lg">
        <CardContent className="space-y-5 p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock3 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">รอผู้ดูแลเริ่มทริป</h2>
            <p className="text-sm leading-6 text-slate-600">
              คุณเข้าร่วมทริปแล้ว กำลังรอผู้ดูแลยืนยันรายชื่อและเริ่มทริป
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Users className="h-4 w-4 text-blue-600" />
              สมาชิก {memberCount}/{capacityTotal} คน
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {isFull
                ? "สมาชิกครบแล้ว รอผู้ดูแลกดเริ่มทริป"
                : "กำลังรอสมาชิกเข้าร่วมให้ครบ"}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => navigate("/")}>
              กลับหน้าหลัก
            </Button>
            <Button className="flex-1 rounded-full" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              รีเฟรชสถานะ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripWaitingState;
