import { useMemo, useState } from "react";
import { ChevronsUpDown, Loader2, MapPinned, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { useTrip } from "@/contexts/TripContext";
import { useUserTrips } from "@/hooks/useUserTrips";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: "กำลังเปิดรับ", className: "bg-blue-50 text-blue-700 border-blue-200" },
  confirmed: { label: "ยืนยันแล้ว", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived: { label: "จบทริป", className: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelled: { label: "ยกเลิก", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

function formatTripDateRange(startDate: string, endDate: string) {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return `${format(start, "d MMM", { locale: th })} - ${format(end, "d MMM yyyy", { locale: th })}`;
  } catch {
    return `${startDate} - ${endDate}`;
  }
}

const TripSelectorSheet = () => {
  const { trip, effectiveTripId, persistedActiveTripId, isTripOverrideActive, isTripSwitching } = useTrip();
  const { trips, loading, switchingTripId, switchError, setActiveTrip } = useUserTrips();
  const [open, setOpen] = useState(false);

  const shouldShowSelector = trips.length > 1;
  const currentTripName = trip?.name || "เลือกทริป";

  const handleSelectTrip = async (tripId: string) => {
    const ok = await setActiveTrip(tripId);
    if (ok) {
      setOpen(false);
    }
  };

  const listContent = useMemo(() => {
    if (loading) {
      return <div className="py-10 text-center text-sm text-muted-foreground">กำลังโหลดรายการทริป...</div>;
    }

    return (
      <div className="space-y-3">
        {trips.map((item) => {
          const statusMeta = STATUS_META[item.status] || STATUS_META.open;
          const isPersisted = item.id === persistedActiveTripId;
          const isViewed = item.id === effectiveTripId;
          const isSwitchingRow = item.id === switchingTripId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTrip(item.id)}
              disabled={!!switchingTripId}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-colors",
                isViewed ? "border-blue-400 bg-blue-50/70" : "border-slate-200 bg-white hover:border-slate-300",
                switchingTripId && !isSwitchingRow && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900">{item.name}</div>
                  <div className="mt-1 text-sm text-slate-600">{formatTripDateRange(item.start_date, item.end_date)}</div>
                </div>
                {isSwitchingRow ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-blue-600" /> : <ChevronsUpDown className="mt-0.5 h-4 w-4 text-slate-400" />}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className={statusMeta.className}>{statusMeta.label}</Badge>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {item.role === "admin" ? "ผู้ดูแล" : "สมาชิก"}
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  <Users className="mr-1 h-3 w-3" />
                  {item.member_count} คน
                </Badge>
                {isPersisted && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    ทริปหลัก
                  </Badge>
                )}
                {isViewed && !isPersisted && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    กำลังดูอยู่
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }, [effectiveTripId, loading, persistedActiveTripId, switchingTripId, trips]);

  if (!shouldShowSelector) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (switchingTripId) return;
        setOpen(nextOpen);
      }}
    >
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto max-w-[210px] items-start gap-2 rounded-2xl border-slate-200 px-3 py-2 text-left"
          disabled={isTripSwitching}
        >
          <MapPinned className="mt-0.5 h-4 w-4 text-blue-600" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{currentTripName}</div>
            <div className="truncate text-xs text-slate-500">
              {isTripOverrideActive ? "กำลังดูทริปชั่วคราว" : "สลับทริปที่ใช้งาน"}
            </div>
          </div>
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[78vh] rounded-t-[28px] px-0 pb-0">
        <SheetHeader className="px-5 pt-5 text-left">
          <SheetTitle>เลือกทริปที่ต้องการใช้งาน</SheetTitle>
          <SheetDescription>
            เลือกทริปเพื่อเปลี่ยนทริปหลักของคุณแบบถาวร
          </SheetDescription>
          {isTripOverrideActive && (
            <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-700">
              ตอนนี้คุณกำลังดูทริปแบบชั่วคราวจากลิงก์
            </Badge>
          )}
          {switchError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {switchError}
            </div>
          )}
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(78vh-140px)] px-5 pb-6">
          {listContent}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TripSelectorSheet;
