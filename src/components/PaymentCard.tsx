import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GroupedPayment } from "@/utils/paymentCalculations";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";
import { getPersonAvatar } from "@/utils/avatarUtils";
import { useTrip } from "@/contexts/TripContext";

interface PersonAvatarProps {
  name: string;
  sizeClass: string;
  textSize: string;
}

const PersonAvatar = ({ name, sizeClass, textSize }: PersonAvatarProps) => {
  const { getAvatarForName } = useTrip();
  const [failed, setFailed] = useState(false);
  const url = getAvatarForName(name);
  const fallback = getPersonAvatar(name);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`${sizeClass} rounded-full object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} ${fallback.bg} rounded-full flex items-center justify-center text-white ${textSize}`}>
      {fallback.emoji}
    </div>
  );
};

interface PaymentCardProps {
  groupedPayment: GroupedPayment;
  showThb?: boolean;
}

const PaymentCard = ({ groupedPayment, showThb = false }: PaymentCardProps) => {
  const currency = showThb ? 'THB' : 'CNY';
  
  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <PersonAvatar name={groupedPayment.from} sizeClass="w-12 h-12" textSize="text-xl" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{groupedPayment.from}</h3>
            <p className="text-gray-600">ต้องโอน {groupedPayment.payments.length} รายการ</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {groupedPayment.payments.map((payment, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">โอนให้</span>
                <PersonAvatar name={payment.to} sizeClass="w-8 h-8" textSize="text-sm" />
                <span className="font-medium text-gray-900">{payment.to}</span>
              </div>
              <CurrencyDisplay 
                amount={payment.amount} 
                currency={currency as any}
                className="text-lg font-bold"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">รวมทั้งหมด</span>
            <CurrencyDisplay 
              amount={groupedPayment.totalAmount} 
              currency={currency as any}
              className="text-xl font-bold"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentCard;
