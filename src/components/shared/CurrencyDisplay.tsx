
import { CURRENCY_SYMBOLS, CURRENCY_COLORS, CurrencyType } from "@/constants/currency";

interface CurrencyDisplayProps {
  amount: number;
  currency: CurrencyType;
  className?: string;
  showSymbol?: boolean;
}

const CurrencyDisplay = ({ 
  amount, 
  currency, 
  className = "", 
  showSymbol = true 
}: CurrencyDisplayProps) => {
  const colorClass = CURRENCY_COLORS[currency];
  const symbol = CURRENCY_SYMBOLS[currency];
  
  return (
    <span className={`${colorClass} ${className}`}>
      {showSymbol && symbol}{amount.toLocaleString()}
    </span>
  );
};

export default CurrencyDisplay;
