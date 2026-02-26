import { useState } from "react";
import { useTrip } from "@/contexts/TripContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, UserPlus } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";

interface AddCapacityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddCapacityDialog = ({ open, onOpenChange }: AddCapacityDialogProps) => {
  const { trip, members, refetch } = useTrip();
  const { toast } = useToast();
  const [addCount, setAddCount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newCapacity, setNewCapacity] = useState<number | null>(null);

  if (!trip) return null;

  const getToken = () => localStorage.getItem(SESSION_KEY);

  const handleSubmit = async () => {
    const count = parseInt(addCount);
    if (!count || count < 1 || count > 50) {
      toast({ title: "กรุณากรอกจำนวน 1-50", variant: "destructive" });
      return;
    }

    setLoading(true);
    setInviteUrl(null);
    try {
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Step 1: Add capacity
      const capRes = await fetch(`${SUPABASE_URL}/functions/v1/add-capacity`, {
        method: "POST",
        headers,
        body: JSON.stringify({ trip_id: trip.id, add_count: count }),
      });
      const capData = await capRes.json();
      if (!capRes.ok) {
        toast({ title: "ไม่สามารถเพิ่มจำนวนได้", description: capData.message, variant: "destructive" });
        return;
      }
      setNewCapacity(capData.trip.capacity_total);

      // Step 2: Generate invite link
      const invRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-invite-link`, {
        method: "POST",
        headers,
        body: JSON.stringify({ trip_id: trip.id }),
      });
      const invData = await invRes.json();
      if (!invRes.ok) {
        toast({ title: "ไม่สามารถสร้างลิงก์ได้", description: invData.error, variant: "destructive" });
        return;
      }

      setInviteUrl(invData.invite_url);
      await refetch();
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setInviteUrl(null);
      setNewCapacity(null);
      setAddCount("1");
      setCopied(false);
    }
    onOpenChange(v);
  };

  const currentCapacity = newCapacity ?? trip.capacity_total;
  const remaining = currentCapacity - members.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">เพิ่มจำนวนสมาชิก</DialogTitle>
        </DialogHeader>

        {!inviteUrl ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              ปัจจุบัน: {members.length}/{currentCapacity} คน
              {remaining > 0 && ` (เหลือ ${remaining} ที่)`}
            </div>
            <div>
              <Label className="text-sm">จำนวนที่เพิ่ม</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={addCount}
                onChange={(e) => setAddCount(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? "กำลังดำเนินการ..." : "เพิ่มและสร้างลิงก์เชิญ"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 text-center">
              เพิ่มเป็น {currentCapacity} คน (เหลือ {remaining} ที่)
            </div>
            <div className="flex justify-center">
              <QRCodeSVG value={inviteUrl} size={180} />
            </div>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="text-xs flex-1" />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center">แชร์ QR code หรือลิงก์ให้สมาชิกใหม่</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddCapacityDialog;
