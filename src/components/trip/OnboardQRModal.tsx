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
import { Copy, Check, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";

const LineIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

interface OnboardQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OnboardQRModal = ({ open, onOpenChange }: OnboardQRModalProps) => {
  const { trip, members } = useTrip();
  const { toast } = useToast();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
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
      setCopied(false);
      setGenerating(false);
    }
  }, [open]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: "คัดลอกแล้ว" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "ไม่สามารถคัดลอกอัตโนมัติ", variant: "destructive" });
    }
  };

  const handleLineShare = () => {
    if (!inviteUrl || !trip) return;
    const start = format(new Date(trip.start_date), "d MMM yyyy", { locale: th });
    const end = format(new Date(trip.end_date), "d MMM yyyy", { locale: th });
    const text = `🌴 ${trip.name}\n📅 ${start} – ${end}\n\nกดลิงก์เพื่อเข้าร่วมทริป\n${inviteUrl}`;

    if (typeof window !== "undefined" && (window as any).liff?.shareTargetPicker) {
      (window as any).liff
        .shareTargetPicker([{ type: "text", text }])
        .then((res: any) => { if (!res) toast({ title: "ยกเลิกการแชร์" }); })
        .catch(() => toast({ title: "ยกเลิกการแชร์" }));
      return;
    }

    const encoded = encodeURIComponent(inviteUrl);
    window.open(`https://social-plugins.line.me/lineit/share?url=${encoded}`, "_blank");
  };

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

        {/* Action buttons */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopy}
            disabled={!inviteUrl || isFull}
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            คัดลอกลิงก์
          </Button>
          <Button
            className="flex-1 bg-[#06C755] hover:bg-[#05b04d] text-white"
            onClick={handleLineShare}
            disabled={!inviteUrl || isFull}
          >
            <LineIcon />
            <span className="ml-2">แชร์ใน LINE</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardQRModal;
