import { useMemo, useState } from "react";
import { Check, Copy, Loader2, MessageSquareShare } from "lucide-react";
import { Trip } from "@/contexts/TripContext";
import { Payment } from "@/types/expense";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildPaymentSummary,
  canShareSettlementSummary,
  PaymentSummaryMode,
} from "@/utils/paymentSummary";

const MAX_LINE_SHARE_URL_LENGTH = 1800;
const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL;

const LineIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

interface ShareSettlementDialogProps {
  trip: Trip;
  payments: Payment[];
  memberNameMap: Map<string, string>;
  settlementBlockingCode: string | null;
  hasLegacyPayments: boolean;
}

const ShareSettlementDialog = ({
  trip,
  payments,
  memberNameMap,
  settlementBlockingCode,
  hasLegacyPayments,
}: ShareSettlementDialogProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<PaymentSummaryMode>("outstanding");
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const validation = useMemo(
    () => canShareSettlementSummary({ payments, settlementBlockingCode, hasLegacyPayments }),
    [payments, settlementBlockingCode, hasLegacyPayments],
  );
  const baseUrl = typeof window !== "undefined"
    ? (APP_BASE_URL || window.location.origin)
    : (APP_BASE_URL || "");

  const summaryText = useMemo(() => {
    if (!validation.shareable) return "";
    return buildPaymentSummary({
      trip,
      payments,
      mode,
      memberNameMap,
      baseUrl,
    });
  }, [baseUrl, memberNameMap, mode, payments, trip, validation.shareable]);

  const handleCopy = async () => {
    if (!validation.shareable || !summaryText) return;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      toast({ title: "คัดลอกสรุปแล้ว" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "คัดลอกไม่สำเร็จ",
        description: "ลองกดคัดลอกใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const handleLineShare = async () => {
    if (!validation.shareable || !summaryText) return;

    try {
      setSharing(true);
      const lineWindow = window as Window & { liff?: { shareTargetPicker?: (messages: Array<{ type: string; text: string }>) => Promise<unknown> } };

      if (lineWindow.liff?.shareTargetPicker) {
        const result = await lineWindow.liff.shareTargetPicker([{ type: "text", text: summaryText }]);
        if (!result) {
          toast({ title: "ยกเลิกการแชร์" });
        }
        return;
      }

      const encodedText = encodeURIComponent(summaryText);
      const shareUrl = `https://line.me/R/msg/text/?${encodedText}`;

      if (shareUrl.length > MAX_LINE_SHARE_URL_LENGTH) {
        toast({
          title: "ข้อความยาวเกินไปสำหรับแชร์ตรง",
          description: "คัดลอกข้อความแล้วส่งใน LINE แทนจะปลอดภัยที่สุด",
        });
        return;
      }

      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: "แชร์ใน LINE ไม่สำเร็จ",
        description: "ลองใช้ปุ่มคัดลอกแล้วส่งในแชตแทน",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-slate-200 bg-white/90">
          <MessageSquareShare className="h-4 w-4" />
          แชร์สรุป
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
        <div className="p-6 space-y-5">
          <DialogHeader className="text-left">
            <DialogTitle>{validation.title}</DialogTitle>
            <DialogDescription>{validation.description}</DialogDescription>
          </DialogHeader>

          {validation.shareable ? (
            <>
              <Tabs value={mode} onValueChange={(value) => setMode(value as PaymentSummaryMode)}>
                <TabsList className="grid w-full grid-cols-2 rounded-2xl">
                  <TabsTrigger value="outstanding" className="rounded-xl">ค้างชำระ</TabsTrigger>
                  <TabsTrigger value="all" className="rounded-xl">ทั้งหมด</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">ตัวอย่างข้อความ</div>
                <Textarea
                  value={summaryText}
                  readOnly
                  className="min-h-[260px] resize-none rounded-2xl bg-slate-50"
                />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              สรุปการเคลียร์จะแชร์ได้เมื่อยอด settlement ของทริปนี้พร้อมและเป็นข้อมูลเงินบาทที่เชื่อถือได้แล้ว
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={handleCopy}
              disabled={!validation.shareable}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              คัดลอก
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-full bg-[#06C755] text-white hover:bg-[#05b04d]"
              onClick={handleLineShare}
              disabled={!validation.shareable || sharing}
            >
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LineIcon />}
              แชร์ LINE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSettlementDialog;
