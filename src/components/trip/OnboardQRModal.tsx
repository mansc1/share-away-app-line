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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";


interface OnboardQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OnboardQRModal = ({ open, onOpenChange }: OnboardQRModalProps) => {
  const { trip, members } = useTrip();
  const { toast } = useToast();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const generatedRef = useRef(false);

  const isFull = trip ? members.length >= trip.capacity_total : false;

  // Auto-generate invite link once per modal open
  useEffect(() => {
    if (!open || generatedRef.current || inviteUrl || !trip) return;
    generatedRef.current = true;

    const generate = async () => {
      setGenerating(true);
      try {
        const token = localStorage.getItem(SESSION_KEY);
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
  }, [open, trip, inviteUrl, toast]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      generatedRef.current = false;
      setInviteUrl(null);
      setGenerating(false);
      setGenerating(false);
    }
  }, [open]);

  if (!trip) return null;

  const startFormatted = format(new Date(trip.start_date), "d MMM yyyy", { locale: th });
  const endFormatted = format(new Date(trip.end_date), "d MMM yyyy", { locale: th });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto flex flex-col items-center gap-5 pt-8 pb-6">
        <DialogHeader className="text-center space-y-1">
          <DialogTitle className="text-xl">{trip.name}</DialogTitle>
          <DialogDescription className="text-sm">
            📅 {startFormatted} — {endFormatted}
          </DialogDescription>
        </DialogHeader>

        {/* Realtime counter */}
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">
            สมาชิก {members.length}/{trip.capacity_total} คน
          </span>
          {isFull && (
            <Badge variant="destructive" className="ml-1">เต็มแล้ว</Badge>
          )}
        </div>

        {/* QR Code */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm border ${isFull ? "opacity-40" : ""}`}>
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
          {isFull && (
            <p className="mt-3 font-medium text-slate-900">
              สมาชิกครบแล้ว ตรวจสอบรายชื่อก่อนเริ่มทริป
            </p>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default OnboardQRModal;
