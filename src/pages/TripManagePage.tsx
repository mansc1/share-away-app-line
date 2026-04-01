import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/contexts/TripContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Crown, User, UserPlus, QrCode } from "lucide-react";
import MemberNameEditor from "@/components/trip/MemberNameEditor";
import AddCapacityDialog from "@/components/trip/AddCapacityDialog";
import InviteShareSection from "@/components/trip/InviteShareSection";
import OnboardQRModal from "@/components/trip/OnboardQRModal";
import AdminPreStartPanel from "@/components/trip/AdminPreStartPanel";
import { useTripAdminActions } from "@/hooks/useTripAdminActions";

const TripManagePage = () => {
  const { trip, members, isAdmin, isConfirmed } = useTrip();
  const [addCapOpen, setAddCapOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const navigate = useNavigate();
  const prevMemberIdsRef = useRef<Set<string>>(new Set());
  const [newMemberIds, setNewMemberIds] = useState<Set<string>>(new Set());
  const { starting, cancelling, startTrip, cancelTrip } = useTripAdminActions();

  useEffect(() => {
    const currentIds = new Set(members.map(m => m.id));
    const prevIds = prevMemberIdsRef.current;
    if (prevIds.size > 0) {
      const added = new Set<string>();
      currentIds.forEach(id => {
        if (!prevIds.has(id)) added.add(id);
      });
      if (added.size > 0) {
        setNewMemberIds(added);
        const timer = setTimeout(() => setNewMemberIds(new Set()), 1000);
        return () => clearTimeout(timer);
      }
    }
    prevMemberIdsRef.current = currentIds;
  }, [members]);

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">ไม่พบทริป</p>
      </div>
    );
  }

  const isFull = members.length === trip.capacity_total;

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

        {isAdmin && !isConfirmed && (
          <AdminPreStartPanel
            isFull={isFull}
            memberCount={members.length}
            capacityTotal={trip.capacity_total}
            starting={starting}
            cancelling={cancelling}
            onStart={startTrip}
            onCancel={cancelTrip}
          />
        )}

        {/* Member name editor (for current user, only when open) */}
        <MemberNameEditor />

        {/* Members list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">สมาชิก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-2 py-1.5 border-b last:border-0 transition-all duration-500 ${
                  newMemberIds.has(m.id) ? "animate-fade-in bg-primary/5" : ""
                }`}
              >
                {m.role === "admin" ? (
                  <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm flex-1">{m.display_name}</span>
                {m.role === "admin" && (
                  <Badge variant="outline" className="text-xs">แอดมิน</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* QR onboard button (admin only, open or confirmed) */}
        {isAdmin && (trip.status === "open" || trip.status === "confirmed") && (
          <Button variant="outline" className="w-full" onClick={() => setQrModalOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            เปิด QR ลงทะเบียน
          </Button>
        )}

        {/* Invite share (admin only, trip open) */}
        {isAdmin && !isConfirmed && <InviteShareSection />}

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
        <OnboardQRModal open={qrModalOpen} onOpenChange={setQrModalOpen} />
      </div>
    </div>
  );
};

export default TripManagePage;
