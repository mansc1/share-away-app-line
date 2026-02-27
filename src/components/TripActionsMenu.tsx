import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { useTrip } from "@/contexts/TripContext";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";

const TripActionsMenu = () => {
  const { trip, refetch } = useTrip();
  const navigate = useNavigate();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const callFunction = async (fnName: string) => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token || !trip) return;
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trip_id: trip.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "เกิดข้อผิดพลาด", description: data.message || "ลองใหม่อีกครั้ง", variant: "destructive" });
        return false;
      }
      return true;
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถเชื่อมต่อได้", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    const ok = await callFunction("archive-trip");
    if (ok) {
      toast({ title: "จบทริปแล้ว", description: "ทริปถูกจบเรียบร้อย" });
      setArchiveOpen(false);
      navigate("/trip/new");
    }
  };

  const handleCancel = async () => {
    const ok = await callFunction("cancel-trip");
    if (ok) {
      toast({ title: "ยกเลิกทริปแล้ว", description: "ทริปถูกยกเลิกเรียบร้อย" });
      setCancelOpen(false);
      setCancelConfirmText("");
      navigate("/trip/new");
    }
  };

  const cancelEnabled =
    cancelConfirmText === "ยกเลิก" ||
    (trip?.name && cancelConfirmText === trip.name);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 text-gray-400 hover:text-gray-600" title="ตัวเลือกทริป">
            <Settings className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/trip/manage")}>
            จัดการทริป
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
            จบทริป
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setCancelOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            ยกเลิกทริป
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Dialog */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>จบทริป</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการจบทริป "{trip?.name}" หรือไม่? สมาชิกจะไม่สามารถเพิ่มรายการใหม่ได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={loading}>
              {loading ? "กำลังดำเนินการ..." : "จบทริป"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={(open) => { setCancelOpen(open); if (!open) setCancelConfirmText(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยกเลิกทริป</AlertDialogTitle>
            <AlertDialogDescription>
              การยกเลิกทริปจะไม่สามารถย้อนกลับได้ พิมพ์ชื่อทริป "{trip?.name}" หรือ "ยกเลิก" เพื่อยืนยัน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={cancelConfirmText}
            onChange={(e) => setCancelConfirmText(e.target.value)}
            placeholder="พิมพ์เพื่อยืนยัน"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>กลับ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={loading || !cancelEnabled}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? "กำลังดำเนินการ..." : "ยกเลิกทริป"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TripActionsMenu;
