import { Loader2, PlayCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminPreStartPanelProps {
  isFull: boolean;
  memberCount: number;
  capacityTotal: number;
  starting: boolean;
  cancelling: boolean;
  onStart: () => Promise<void>;
  onCancel: () => Promise<void>;
}

const AdminPreStartPanel = ({
  isFull,
  memberCount,
  capacityTotal,
  starting,
  cancelling,
  onStart,
  onCancel,
}: AdminPreStartPanelProps) => {
  return (
    <Card className="border-blue-100 bg-blue-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900">สมาชิกเข้าร่วมแล้ว</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-slate-600">
          <p>ตรวจสอบรายชื่อก่อนเริ่มทริป</p>
          <p className="mt-1">
            ตอนนี้มีสมาชิก {memberCount}/{capacityTotal} คน
          </p>
          {isFull && (
            <p className="mt-2 font-medium text-slate-900">
              สมาชิกครบแล้ว พร้อมให้ผู้ดูแลเริ่มทริป
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1"
            disabled={!isFull || starting || cancelling}
            onClick={onStart}
          >
            {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            เริ่มทริป
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={starting || cancelling}
            onClick={onCancel}
          >
            {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            ยกเลิกทริป
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPreStartPanel;
