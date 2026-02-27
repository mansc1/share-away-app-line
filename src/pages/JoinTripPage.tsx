import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLineAuth } from "@/contexts/LineAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CalendarDays, Users, AlertTriangle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";

interface TripInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity_total: number;
}

interface InviteInfo {
  trip: TripInfo;
  admin_name: string | null;
  member_count: number;
  is_full: boolean;
}

const JoinTripPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useLineAuth();
  const { toast } = useToast();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Pre-fill display name from LINE profile
  useEffect(() => {
    if (user?.display_name && !displayName) {
      setDisplayName(user.display_name);
    }
  }, [user]);

  // Fetch invite info (no auth needed)
  useEffect(() => {
    if (!token) return;
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/get-invite-info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (!res.ok) {
          setInviteError(data.code || "invalid_invite");
          return;
        }

        setInviteInfo(data);
      } catch {
        setInviteError("invalid_invite");
      } finally {
        setLoadingInfo(false);
      }
    };
    fetchInfo();
  }, [token]);

  const handleJoin = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      toast({ title: "กรุณากรอกชื่อ", variant: "destructive" });
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      const sessionToken = localStorage.getItem(SESSION_KEY);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/join-trip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, display_name: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          trip_full: "ทริปเต็มแล้ว",
          duplicate_name: "ชื่อนี้ถูกใช้แล้วในทริปนี้",
        };
        const msg = messages[data.code] || data.error || "ไม่สามารถเข้าร่วมได้";
        setJoinError(msg);
        toast({ title: "ไม่สามารถเข้าร่วมได้", description: msg, variant: "destructive" });
        return;
      }

      toast({
        title: data.already_member ? "คุณเป็นสมาชิกอยู่แล้ว" : "เข้าร่วมทริปสำเร็จ!",
        description: data.name,
      });
      navigate("/app");
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
  };

  // Loading state
  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardHeader>
            <Skeleton className="h-6 w-40 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (inviteError) {
    const errorMessages: Record<string, { title: string; desc: string }> = {
      invalid_invite: { title: "ลิงก์เชิญไม่ถูกต้อง", desc: "ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว" },
      invite_revoked: { title: "ลิงก์เชิญถูกยกเลิก", desc: "ลิงก์เชิญนี้ถูกยกเลิกแล้ว" },
      invite_closed: { title: "ทริปเต็มแล้ว", desc: "ทริปนี้เต็มแล้ว ไม่สามารถเข้าร่วมได้" },
      trip_closed: { title: "ทริปนี้ปิดแล้ว", desc: "ทริปนี้ปิดรับสมาชิกแล้ว" },
    };
    const err = errorMessages[inviteError] || errorMessages.invalid_invite;

    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">{err.title}</h2>
            <p className="text-sm text-muted-foreground">{err.desc}</p>
            <Button variant="outline" asChild className="w-full">
              <Link to="/">กลับหน้าหลัก</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteInfo) return null;

  const { trip, admin_name, member_count, is_full } = inviteInfo;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg">เข้าร่วมทริป</CardTitle>
          <p className="text-xl font-bold mt-1">{trip.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trip info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 shrink-0" />
              <span>{member_count}/{trip.capacity_total} คน</span>
              {is_full && <Badge variant="destructive" className="text-xs">เต็ม</Badge>}
            </div>
            {admin_name && (
              <p className="text-muted-foreground">สร้างโดย: {admin_name}</p>
            )}
          </div>

          {/* Full trip */}
          {is_full && (
            <div className="rounded-md bg-destructive/10 p-3 text-center">
              <p className="text-sm font-medium text-destructive">ทริปเต็มแล้ว</p>
              <p className="text-xs text-muted-foreground mt-1">ไม่สามารถเข้าร่วมได้ในขณะนี้</p>
            </div>
          )}

          {/* Not authenticated */}
          {!authLoading && !isAuthenticated && !is_full && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">กรุณาเข้าสู่ระบบเพื่อเข้าร่วมทริป</p>
              <Button
                className="w-full"
                onClick={() => {
                  localStorage.setItem("post_login_redirect", `/join/${token}`);
                  window.location.href = `${SUPABASE_URL}/functions/v1/auth-line-start`;
                }}
              >
                เข้าสู่ระบบด้วย LINE
              </Button>
            </div>
          )}

          {/* Authenticated + not full */}
          {isAuthenticated && !is_full && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm">ชื่อที่จะแสดงในทริป *</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ชื่อเล่น หรือชื่อจริง"
                  maxLength={50}
                  className="mt-1"
                  onKeyDown={(e) => e.key === "Enter" && !joining && handleJoin()}
                />
              </div>

              {joinError && <p className="text-sm text-destructive">{joinError}</p>}

              <Button className="w-full" onClick={handleJoin} disabled={joining}>
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังเข้าร่วม...
                  </>
                ) : (
                  "เข้าร่วมทริป"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinTripPage;
