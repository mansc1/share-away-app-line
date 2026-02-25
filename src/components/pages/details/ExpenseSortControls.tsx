
import { ArrowUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORT_OPTIONS } from "./constants";

interface ExpenseSortControlsProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

const ExpenseSortControls = ({ sortBy, onSortChange }: ExpenseSortControlsProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-gray-600" />
        <Label className="text-sm font-medium text-gray-700">จัดเรียงตาม:</Label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ExpenseSortControls;
