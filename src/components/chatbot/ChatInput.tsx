
import { useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ value, onChange, onSend, disabled = false }: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  const handleSend = () => {
    onSend(value);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="border-t p-3 bg-white">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=""
          className="flex-1 min-h-[44px] max-h-[120px] resize-none text-base md:text-sm"
          disabled={disabled}
          onKeyPress={handleKeyPress}
          rows={1}
          style={{ 
            fontSize: '16px',
            overflow: 'hidden',
            lineHeight: '1.5',
            WebkitTextSizeAdjust: '100%',
            touchAction: 'manipulation'
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          size="sm"
          className="px-3 py-2 h-11 flex-shrink-0 min-w-[44px]"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
