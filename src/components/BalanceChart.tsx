
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { PersonBalance } from "@/types/expense";
import { CURRENCY_SYMBOLS, type CurrencyType } from "@/constants/currency";

interface BalanceChartProps {
  balances: PersonBalance[];
  currency: CurrencyType;
}

const BalanceChart = ({ balances, currency }: BalanceChartProps) => {
  const formatBalance = (value: number) => `${CURRENCY_SYMBOLS[currency] ?? ""}${Math.abs(value)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">สถานะหนี้ของแต่ละคน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={balances} 
              margin={{ top: 20, right: 5, left: 5, bottom: 60 }}
              barCategoryGap="10%"
            >
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                height={50}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={formatBalance}
              />
              <Bar 
                dataKey="balance" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={100}
              >
                {balances.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.balance >= 0 ? '#10B981' : '#EF4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <div className="flex justify-center gap-6">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              เจ้าหนี้
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              ลูกหนี้
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceChart;
