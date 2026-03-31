import { Card, CardContent } from "@/components/ui/card";

interface PaymentStatusStateProps {
  emoji: string;
  title: string;
  description: string;
  details?: string;
}

const PaymentStatusState = ({ emoji, title, description, details }: PaymentStatusStateProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <span className="text-4xl">{emoji}</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500">{description}</p>
        {details && (
          <p className="mt-3 text-sm text-slate-600">{details}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatusState;
