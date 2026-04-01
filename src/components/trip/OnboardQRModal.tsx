import { useState, useEffect, useRef } from "react";
import { useTrip } from "@/contexts/TripContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Crown, Loader2, User, Users } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminPreStartPanel from "@/components/trip/AdminPreStartPanel";
import { useTripAdminActions } from "@/hooks/useTripAdminActions";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;


interface OnboardQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OnboardQRModal = ({ open, onOpenChange }: OnboardQRModalProps) => {
  const { trip, members, isAdmin, isConfirmed } = useTrip();
  const { toast } = useToast();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const generatedRef = useRef(false);
  const { starting, cancelling, startTrip, cancelTrip } = useTripAdminActions({
    onStarted: async () => {
      onOpenChange(false);
    },
    onCancelled: async () => {
      onOpenChange(false);
    },
  });

  const isFull = trip ? members.length >= trip.capacity_total : false;
  const mode = !isFull && !isConfirmed ? "qr" : "review";

  // Auto-generate invite link once per modal open
  useEffect(() => {
    if (!open || generatedRef.current || inviteUrl || !trip || mode !== "qr") return;
    generatedRef.current = true;

    const generate = async () => {
      setGenerating(true);
      try {
        const token = localStorage.getItem("line_session_token");
        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-invite-link`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ trip_id: trip.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({ title: "สร้างลิงก์ไม่สำเร็จ", description: data.error, variant: "destructive" });
          return;
        }
        setInviteUrl(data.invite_url);
      } catch {
        toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
      } finally {
        setGenerating(false);
      }
    };
    generate();
  }, [inviteUrl, mode, open, toast, trip]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      generatedRef.current = false;
      setInviteUrl(null);
      setGenerating(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && isConfirmed) {
      onOpenChange(false);
    }
  }, [isConfirmed, onOpenChange, open]);

  if (!trip) return null;

  const startFormatted = format(new Date(trip.start_date), "d MMM yyyy", { locale: th });
  const endFormatted = format(new Date(trip.end_date), "d MMM yyyy", { locale: th });
  const memberSummary = `${members.length}/${trip.capacity_total} คน`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`mx-auto flex max-w-sm flex-col items-center ${mode === "qr" ? "gap-5 pt-8 pb-6" : "gap-3 pt-7 pb-5"}`}>
        <DialogHeader className={`text-center ${mode === "qr" ? "space-y-1" : "space-y-0.5"}`}>
          <DialogTitle className="text-xl">{trip.name}</DialogTitle>
          <DialogDescription className="text-sm">
            📅 {startFormatted} — {endFormatted}
          </DialogDescription>
        </DialogHeader>

        {/* Realtime counter */}
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className={`${mode === "qr" ? "text-lg" : "text-base"} font-semibold`}>
            สมาชิก {memberSummary}
          </span>
          {isFull && (
            <Badge variant="destructive" className="ml-1">เต็มแล้ว</Badge>
          )}
        </div>

        {mode === "qr" ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              {generating ? (
                <div className="w-[220px] h-[220px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : inviteUrl ? (
                <QRCodeSVG value={inviteUrl} size={220} />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                  ไม่สามารถสร้าง QR ได้
                </div>
              )}
            </div>

            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <h3 className="font-semibold text-slate-900">ขั้นตอนถัดไป</h3>
              <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-6">
                <li className="list-disc">ให้สมาชิกสแกน QR นี้เพื่อเข้าร่วมทริป</li>
                <li className="list-disc">เมื่อสมาชิกเข้าครบแล้ว ผู้ดูแลต้องกด &quot;เริ่มทริป&quot;</li>
                <li className="list-disc">ก่อนเริ่มทริป สมาชิกจะยังไม่สามารถเพิ่มรายจ่ายได้</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">สมาชิกครบแล้ว</h3>
                  <p className="mt-0.5 text-[13px] leading-5 text-slate-600">ตรวจสอบรายชื่อก่อนเริ่มทริป</p>
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  พร้อมเริ่ม
                </Badge>
              </div>
            </div>

            <div className="w-full rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-900">รายชื่อสมาชิก</div>
                  <div className="text-xs text-slate-500">{memberSummary}</div>
                </div>
              </div>
              <ScrollArea className="max-h-48">
                <div className="space-y-1.5 p-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      {member.role === "admin" ? (
                        <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                      ) : (
                        <User className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium leading-5 text-slate-900">{member.display_name}</div>
                      </div>
                      {member.role === "admin" ? (
                        <Badge variant="outline" className="text-xs">แอดมิน</Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {isAdmin ? (
              <div className="w-full">
                <AdminPreStartPanel
                  isFull={isFull}
                  memberCount={members.length}
                  capacityTotal={trip.capacity_total}
                  starting={starting}
                  cancelling={cancelling}
                  onStart={startTrip}
                  onCancel={cancelTrip}
                  compact
                />
              </div>
            ) : null}
          </>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default OnboardQRModal;
