import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/contexts/TripContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Crown, User, CheckCircle2, UserPlus } from "lucide-react";
import MemberNameEditor from "@/components/trip/MemberNameEditor";
import AddCapacityDialog from "@/components/trip/AddCapacityDialog";
import InviteShareSection from "@/components/trip/InviteShareSection";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = 'line_session_token';

const TripManagePage = () => {
  const { trip, members, isAdmin, isConfirmed, refetch } = useTrip();
  const [confirming, setConfirming] = useState(false);
  const [addCapOpen, setAddCapOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">ไม่พบทริป</p>
      </div>
    );
  }

  const isFull = members.length === trip.capacity_total;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const token = localStorage.getItem(SESSION_KEY);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/confirm-trip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trip_id: trip.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          capacity_not_full: data.message || "สมาชิกยังไม่ครบ",
          forbidden: "เฉพาะแอดมินเท่านั้น",
          invalid_status: "ทริปไม่ได้อยู่ในสถานะเปิด",
        };
        toast({
          title: "ไม่สามารถยืนยันได้",
          description: messages[data.code] || data.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "สำเร็จ", description: "ยืนยันรายชื่อเรียบร้อย" });
      await refetch();
    } catch {
      toast({ title: "ข้อผิดพลาด", description: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/app")} className="p-1 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 flex-1">จัดการทริป</h1>
          <Badge variant={isConfirmed ? "default" : "secondary"}>
            {isConfirmed ? "ยืนยันแล้ว" : "เปิดรับสมาชิก"}
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Trip info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{trip.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-1">
            <p>📅 {trip.start_date} — {trip.end_date}</p>
            <p>👥 สมาชิก {members.length}/{trip.capacity_total} คน</p>
          </CardContent>
        </Card>

        {/* Member name editor (for current user, only when open) */}
        <MemberNameEditor />

        {/* Members list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">สมาชิก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                {m.role === "admin" ? (
                  <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span className="text-sm flex-1">{m.display_name}</span>
                {m.role === "admin" && (
                  <Badge variant="outline" className="text-xs">แอดมิน</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invite share (admin only, trip open) */}
        {isAdmin && !isConfirmed && <InviteShareSection />}

        {/* Confirm button (admin only, trip open) */}
        {isAdmin && !isConfirmed && (
          <Button
            className="w-full"
            disabled={!isFull || confirming}
            onClick={handleConfirm}
          >
            {confirming ? (
              "กำลังยืนยัน..."
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                ยืนยันรายชื่อ ({members.length}/{trip.capacity_total})
              </>
            )}
          </Button>
        )}

        {isConfirmed && (
          <div className="text-center text-sm text-gray-500 py-2">
            ✅ รายชื่อถูกยืนยันแล้ว
          </div>
        )}

        {/* Add capacity button (admin only) */}
        {isAdmin && (
          <Button variant="outline" className="w-full" onClick={() => setAddCapOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            เพิ่มจำนวนสมาชิก
          </Button>
        )}

        <AddCapacityDialog open={addCapOpen} onOpenChange={setAddCapOpen} />
      </div>
    </div>
  );
};

export default TripManagePage;
