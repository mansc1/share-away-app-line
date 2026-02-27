import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardQRModal from "@/components/trip/OnboardQRModal";
import { format, addDays } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Loader2, Users, Plane } from "lucide-react";
import { useLineAuth } from "@/contexts/LineAuthContext";
import { useTrip } from "@/contexts/TripContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";

const TripNewPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useLineAuth();
  const { refetch } = useTrip();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [capacity, setCapacity] = useState("4");
  const [submitting, setSubmitting] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: "กรุณากรอกชื่อทริป", variant: "destructive" });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "กรุณาเลือกวันเดินทาง", variant: "destructive" });
      return;
    }
    if (endDate < startDate) {
      toast({ title: "วันกลับต้องไม่ก่อนวันไป", variant: "destructive" });
      return;
    }
    const cap = parseInt(capacity);
    if (isNaN(cap) || cap < 2) {
      toast({ title: "จำนวนคนต้องอย่างน้อย 2 คน", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem(SESSION_KEY);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-trip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          capacity_total: cap,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "สร้างทริปไม่สำเร็จ",
          description: data.error || data.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "สร้างทริปสำเร็จ!", description: trimmedName });
      await refetch();
      setQrModalOpen(true);
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect unauthenticated users
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">กรุณาเข้าสู่ระบบก่อนสร้างทริป</p>
            <Button
              className="w-full"
              onClick={() => {
                localStorage.setItem("post_login_redirect", "/trip/new");
                window.location.href = `${SUPABASE_URL}/functions/v1/auth-line-start`;
              }}
            >
              เข้าสู่ระบบด้วย LINE
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">สร้างทริปใหม่</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              ข้อมูลทริป
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Trip name */}
              <div className="space-y-2">
                <Label htmlFor="trip-name">ชื่อทริป *</Label>
                <Input
                  id="trip-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น เที่ยวญี่ปุ่น 2026"
                  maxLength={100}
                  autoFocus
                />
              </div>

              {/* Start date */}
              <div className="space-y-2">
                <Label>วันไป *</Label>
                <Popover open={startOpen} onOpenChange={setStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate
                        ? format(startDate, "d MMM yyyy", { locale: th })
                        : "เลือกวันไป"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        setStartDate(d);
                        if (d && (!endDate || endDate < d)) {
                          setEndDate(addDays(d, 3));
                        }
                        setStartOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End date */}
              <div className="space-y-2">
                <Label>วันกลับ *</Label>
                <Popover open={endOpen} onOpenChange={setEndOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate
                        ? format(endDate, "d MMM yyyy", { locale: th })
                        : "เลือกวันกลับ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => {
                        setEndDate(d);
                        setEndOpen(false);
                      }}
                      disabled={(date) =>
                        startDate ? date < startDate : date < new Date()
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">จำนวนคน *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="capacity"
                    type="number"
                    min={2}
                    max={50}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="pl-10"
                    placeholder="อย่างน้อย 2 คน"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  รวมตัวคุณด้วย (อย่างน้อย 2 คน)
                </p>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  "สร้างทริป"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <OnboardQRModal
        open={qrModalOpen}
        onOpenChange={(v) => {
          setQrModalOpen(v);
          if (!v) navigate("/app");
        }}
      />
    </div>
  );
};

export default TripNewPage;
