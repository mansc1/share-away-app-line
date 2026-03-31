import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";
import PersonAvatar from "@/components/shared/PersonAvatar";
import { Payment } from "@/types/expense";

interface PaymentCardProps {
  payment: Payment;
  fromName: string;
  toName: string;
  canMarkPaid: boolean;
  canConfirm: boolean;
  actionsDisabled?: boolean;
  onMarkPaid: () => void;
  onConfirm: () => void;
}

const STATUS_META: Record<Payment["status"], { label: string; className: string }> = {
  pending: {
    label: "รอโอน",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  paid: {
    label: "จ่ายแล้ว",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const PaymentCard = ({
  payment,
  fromName,
  toName,
  canMarkPaid,
  canConfirm,
  actionsDisabled,
  onMarkPaid,
  onConfirm,
}: PaymentCardProps) => {
  const statusMeta = STATUS_META[payment.status];

  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <PersonAvatar name={fromName} size="lg" />
            <div>
              <div className="text-sm text-gray-500">จาก</div>
              <h3 className="text-xl font-bold text-gray-900">{fromName}</h3>
            </div>
          </div>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PersonAvatar name={toName} size="md" />
              <div>
                <div className="text-sm text-gray-500">โอนให้</div>
                <div className="font-semibold text-gray-900">{toName}</div>
              </div>
            </div>
            <CurrencyDisplay amount={payment.settlementAmount ?? 0} currency="THB" className="text-xl font-bold" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {canMarkPaid && payment.status === "pending" && (
            <Button onClick={onMarkPaid} disabled={actionsDisabled} className="rounded-full bg-slate-950 text-white hover:bg-slate-800">
              ฉันจ่ายแล้ว
            </Button>
          )}
          {canConfirm && payment.status !== "confirmed" && (
            <Button onClick={onConfirm} disabled={actionsDisabled} variant="outline" className="rounded-full">
              ได้รับเงินแล้ว
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentCard;
