
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Expense } from "@/types/expense";
import { Car, Utensils, Ticket, Clipboard } from "lucide-react";
import { EXCHANGE_RATE } from "@/constants/currency";
import CurrencyDisplay from "@/components/shared/CurrencyDisplay";

interface ExpenseChartProps {
  expenses: Expense[];
}

const COLORS = {
  travel: '#60A5FA', // Blue
  food: '#FBBF24', // Orange/Yellow  
  ticket: '#F87171', // Red
  other: '#34D399' // Green
};

const CATEGORY_LABELS = {
  travel: 'ค่าเดินทาง',
  food: 'ค่าอาหาร', 
  ticket: 'ค่าตั๋ว',
  other: 'อื่นๆ'
};

const CATEGORY_ICONS = {
  travel: Car,
  food: Utensils,
  ticket: Ticket, 
  other: Clipboard
};

const ExpenseChart = ({ expenses }: ExpenseChartProps) => {
  const totalExpensesCNY = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpensesTHB = Math.round(totalExpensesCNY * EXCHANGE_RATE * 100) / 100;
  
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData)
    .map(([category, amount]) => ({
      name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS],
      value: amount,
      color: COLORS[category as keyof typeof COLORS],
      percentage: Math.round((amount / totalExpensesCNY) * 100),
      category: category,
      Icon: CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="mb-3">
            <CurrencyDisplay 
              amount={totalExpensesCNY} 
              currency="CNY" 
              className="text-3xl font-bold"
            />
          </div>
          <div className="mb-1">
            <CurrencyDisplay 
              amount={totalExpensesTHB} 
              currency="THB" 
              className="text-xl font-semibold"
            />
          </div>
          <div className="text-base text-gray-500 font-medium">
            รายจ่ายทั้งหมด
          </div>
          <div className="text-xs text-gray-400 mt-1">
            อัตราแลกเปลี่ยน: 1¥ = {EXCHANGE_RATE}฿
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          {/* Donut Chart */}
          <div className="relative flex items-center justify-center mb-6" style={{ height: '250px' }}>
            <div style={{ width: '250px', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={450}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Icons arranged horizontally below chart, sorted by percentage */}
          <div className="flex justify-center items-center gap-6 flex-wrap">
            {chartData.map((entry, index) => {
              const IconComponent = entry.Icon;
              
              return (
                <div
                  key={`legend-${index}`}
                  className="flex flex-col items-center"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg mb-2"
                    style={{ backgroundColor: entry.color }}
                  >
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div 
                    className="text-sm font-bold mb-1"
                    style={{ color: entry.color }}
                  >
                    {entry.percentage}%
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    {entry.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;
