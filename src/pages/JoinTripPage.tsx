import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLineAuth } from "@/contexts/LineAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";

interface TripInfo {
  name: string;
  start_date: string;
  end_date: string;
  admin_name: string;
}

const JoinTripPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useLineAuth();
  const { toast } = useToast();

  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill display name from LINE profile
  useEffect(() => {
    if (user?.display_name && !displayName) {
      setDisplayName(user.display_name);
    }
  }, [user]);

  // Fetch trip info via a lightweight call
  useEffect(() => {
    if (!token) return;
    const fetchInfo = async () => {
      try {
        const sessionToken = localStorage.getItem(SESSION_KEY);
        if (!sessionToken) {
          setLoadingInfo(false);
          return;
        }
        // We'll try joining with a dry-run approach — just show basic info
        // For now, we show the join form and let the user attempt
        setLoadingInfo(false);
      } catch {
        setLoadingInfo(false);
      }
    };
    fetchInfo();
  }, [token]);

  if (authLoading || loadingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the join URL so we can redirect after login
    localStorage.setItem("post_login_redirect", `/join/${token}`);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-gray-600">กรุณาเข้าสู่ระบบก่อนเข้าร่วมทริป</p>
            <Button className="w-full" onClick={() => {
              window.location.href = `${SUPABASE_URL}/functions/v1/auth-line-start`;
            }}>
              เข้าสู่ระบบด้วย LINE
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleJoin = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      toast({ title: "กรุณากรอกชื่อ", variant: "destructive" });
      return;
    }

    setJoining(true);
    setError(null);
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
        setError(msg);
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-lg text-center">เข้าร่วมทริป</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">ชื่อที่จะแสดงในทริป *</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ชื่อเล่น หรือชื่อจริง"
              maxLength={50}
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

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
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinTripPage;
