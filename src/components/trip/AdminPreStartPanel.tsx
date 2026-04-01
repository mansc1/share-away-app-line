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
  compact?: boolean;
}

const AdminPreStartPanel = ({
  isFull,
  memberCount,
  capacityTotal,
  starting,
  cancelling,
  onStart,
  onCancel,
  compact = false,
}: AdminPreStartPanelProps) => {
  return (
    <Card className="border-blue-100 bg-blue-50/50">
      <CardHeader className={compact ? "px-4 pb-1.5 pt-4" : "pb-2"}>
        <CardTitle className="text-base text-slate-900">สมาชิกเข้าร่วมแล้ว</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-3 px-4 pb-4 pt-0" : "space-y-4"}>
        <div className={compact ? "text-[13px] leading-5 text-slate-600" : "text-sm text-slate-600"}>
          <p>ตรวจสอบรายชื่อก่อนเริ่มทริป</p>
          <p className="mt-1">
            ตอนนี้มีสมาชิก {memberCount}/{capacityTotal} คน
          </p>
          {isFull && (
            <p className={compact ? "mt-1.5 font-medium text-slate-900" : "mt-2 font-medium text-slate-900"}>
              สมาชิกครบแล้ว พร้อมให้ผู้ดูแลเริ่มทริป
            </p>
          )}
        </div>

        <div className={compact ? "flex gap-2" : "flex gap-3"}>
          <Button
            className={compact ? "h-11 flex-1 rounded-xl px-3" : "flex-1"}
            disabled={!isFull || starting || cancelling}
            onClick={onStart}
          >
            {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            เริ่มทริป
          </Button>
          <Button
            variant="destructive"
            className={compact ? "h-11 flex-1 rounded-xl px-3" : "flex-1"}
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
