
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CURRENCY_SYMBOLS } from "@/constants/currency";

interface CurrencyToggleProps {
  showThb: boolean;
  onToggle: (showThb: boolean) => void;
  originalCurrency?: keyof typeof CURRENCY_SYMBOLS;
  size?: 'sm' | 'md';
}

const CurrencyToggle = ({ showThb, onToggle, originalCurrency = 'CNY', size = 'md' }: CurrencyToggleProps) => {
  const labelSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const switchSize = size === 'sm' ? 'h-4 w-8' : 'h-6 w-11';
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-5 w-5';
  const thumbTranslate = size === 'sm' ? 'data-[state=checked]:translate-x-4' : 'data-[state=checked]:translate-x-5';
  
  return (
    <div className="flex items-center space-x-2">
      <Label className={`${labelSize} ${showThb ? 'text-gray-400' : 'text-red-600 font-medium'}`}>
        {CURRENCY_SYMBOLS[originalCurrency] ?? originalCurrency}
      </Label>
      <Switch
        checked={showThb}
        onCheckedChange={onToggle}
        className={switchSize}
      />
      <Label className={`${labelSize} ${showThb ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
        {CURRENCY_SYMBOLS.THB}
      </Label>
    </div>
  );
};

export default CurrencyToggle;
