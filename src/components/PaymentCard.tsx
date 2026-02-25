
import { Card, CardContent } from "@/components/ui/card";
import { GroupedPayment } from "@/utils/paymentCalculations";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";
import { getPersonAvatar } from "@/utils/avatarUtils";

interface PaymentCardProps {
  groupedPayment: GroupedPayment;
  showThb?: boolean;
}

const PaymentCard = ({ groupedPayment, showThb = false }: PaymentCardProps) => {
  const currency = showThb ? 'THB' : 'CNY';
  const fromAvatar = getPersonAvatar(groupedPayment.from);
  
  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 ${fromAvatar.bg} rounded-full flex items-center justify-center text-white text-xl`}>
            {fromAvatar.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{groupedPayment.from}</h3>
            <p className="text-gray-600">ต้องโอน {groupedPayment.payments.length} รายการ</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {groupedPayment.payments.map((payment, index) => {
            const toAvatar = getPersonAvatar(payment.to);
            return (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">โอนให้</span>
                  <div className={`w-8 h-8 ${toAvatar.bg} rounded-full flex items-center justify-center text-white text-sm`}>
                    {toAvatar.emoji}
                  </div>
                  <span className="font-medium text-gray-900">{payment.to}</span>
                </div>
                <CurrencyDisplay 
                  amount={payment.amount} 
                  currency={currency as any}
                  className="text-lg font-bold"
                />
              </div>
            );
          })}
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
