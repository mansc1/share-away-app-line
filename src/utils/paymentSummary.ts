import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Payment } from "@/types/expense";
import { Trip } from "@/contexts/TripContext";

export type PaymentSummaryMode = "outstanding" | "all";

interface BuildPaymentSummaryOptions {
  trip: Trip;
  payments: Payment[];
  mode: PaymentSummaryMode;
  memberNameMap: Map<string, string>;
  baseUrl: string;
}

interface ShareValidationOptions {
  payments: Payment[];
  settlementBlockingCode: string | null;
  hasLegacyPayments: boolean;
}

export interface ShareValidationResult {
  shareable: boolean;
  title: string;
  description: string;
}

const STATUS_META: Record<Payment["status"], { icon: string; suffix?: string }> = {
  pending: { icon: "⏳" },
  paid: { icon: "💸", suffix: "(จ่ายแล้ว รอยืนยัน)" },
  confirmed: { icon: "✅", suffix: "(เรียบร้อย)" },
};

function formatTripDateRange(startDate: string, endDate: string) {
  const start = format(new Date(startDate), "d MMM", { locale: th });
  const end = format(new Date(endDate), "d MMM yyyy", { locale: th });
  return `${start} - ${end}`;
}

function formatSettlementAmount(amount: number) {
  return `${amount.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท`;
}

export function canShareSettlementSummary({
  payments,
  settlementBlockingCode,
  hasLegacyPayments,
}: ShareValidationOptions): ShareValidationResult {
  if (settlementBlockingCode) {
    return {
      shareable: false,
      title: "ยังแชร์สรุปไม่ได้",
      description: "ยังมีรายจ่ายบางรายการที่ต้องแปลงเป็นเงินบาทก่อนสร้างสรุปการเคลียร์",
    };
  }

  if (hasLegacyPayments && payments.length === 0) {
    return {
      shareable: false,
      title: "ยังแชร์สรุปไม่ได้",
      description: "ข้อมูลยอดโอนเดิมยังไม่ใช่ยอด settlement แบบเงินบาทที่เชื่อถือได้",
    };
  }

  if (payments.some((payment) => payment.isAuthoritativeSettlement && payment.settlementCurrency !== "THB")) {
    return {
      shareable: false,
      title: "ยังแชร์สรุปไม่ได้",
      description: "ยอด settlement ปัจจุบันยังไม่ได้อยู่ในรูปแบบเงินบาททั้งหมด",
    };
  }

  return {
    shareable: true,
    title: "แชร์สรุปการเคลียร์",
    description: "คัดลอกหรือแชร์สรุปยอดโอนของทริปนี้ได้ทันที",
  };
}

export function buildPaymentSummary({
  trip,
  payments,
  mode,
  memberNameMap,
  baseUrl,
}: BuildPaymentSummaryOptions) {
  const visiblePayments = mode === "outstanding"
    ? payments.filter((payment) => payment.status !== "confirmed")
    : payments;

  const lines = [
    `TripSplit — สรุปการเคลียร์ทริป ${trip.name}`,
    formatTripDateRange(trip.start_date, trip.end_date),
    "",
  ];

  if (payments.length === 0) {
    lines.push("ยังไม่มียอด settlement สำหรับทริปนี้");
  } else if (visiblePayments.length === 0 && mode === "outstanding") {
    lines.push("✅ ทุกคนชำระเรียบร้อยแล้ว");
  } else {
    visiblePayments.forEach((payment) => {
      const fromName = memberNameMap.get(payment.fromUserId) || "สมาชิก";
      const toName = memberNameMap.get(payment.toUserId) || "สมาชิก";
      const statusMeta = STATUS_META[payment.status];
      const suffix = statusMeta.suffix ? ` ${statusMeta.suffix}` : "";
      lines.push(
        `${statusMeta.icon} ${fromName} → ${toName} ${formatSettlementAmount(payment.settlementAmount ?? 0)}${suffix}`,
      );
    });
  }

  lines.push("");
  lines.push("ดูรายละเอียด:");
  lines.push(`${baseUrl}/app?trip=${trip.id}&tab=payment`);

  return lines.join("\n");
}
