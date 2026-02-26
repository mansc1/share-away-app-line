import { useState } from "react";
import { useTrip } from "@/contexts/TripContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = 'line_session_token';

const MemberNameEditor = () => {
  const { trip, currentMember, isConfirmed, refetch } = useTrip();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentMember?.display_name || "");
  const [saving, setSaving] = useState(false);

  if (!currentMember || !trip) return null;

  // After confirmation, show read-only
  if (isConfirmed) {
    return (
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">ชื่อของคุณ:</span>
            <span className="text-sm font-medium">{currentMember.display_name}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "กรุณากรอกชื่อ", variant: "destructive" });
      return;
    }
    if (trimmed === currentMember.display_name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem(SESSION_KEY);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/update-member-name`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trip_id: trip.id, display_name: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          duplicate_name: "ชื่อนี้ถูกใช้แล้วในทริปนี้",
          trip_locked: "รายชื่อถูกยืนยันแล้ว ไม่สามารถเปลี่ยนชื่อได้",
        };
        toast({
          title: "ไม่สามารถเปลี่ยนชื่อได้",
          description: messages[data.code] || data.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "เปลี่ยนชื่อสำเร็จ" });
      setEditing(false);
      await refetch();
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">ชื่อของคุณ:</span>
            <span className="text-sm font-medium flex-1">{currentMember.display_name}</span>
            <Button variant="ghost" size="sm" onClick={() => { setName(currentMember.display_name); setEditing(true); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อที่จะแสดง"
            className="text-sm h-8 flex-1"
            maxLength={50}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving}>
            <Check className="w-4 h-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberNameEditor;
