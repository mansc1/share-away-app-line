
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface PeopleToggleButtonProps {
  hasSelection: boolean;
  onToggleAll: () => void;
}

const PeopleToggleButton = ({ hasSelection, onToggleAll }: PeopleToggleButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onToggleAll}
      className={`text-xs h-6 px-2 rounded-lg border-2 transition-all ${
        hasSelection 
          ? 'border-red-200 text-red-600 hover:bg-red-50' 
          : 'border-blue-200 text-blue-600 hover:bg-blue-50'
      }`}
    >
      <Users className="w-3 h-3 mr-1" />
      {hasSelection ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
    </Button>
  );
};

export default PeopleToggleButton;
