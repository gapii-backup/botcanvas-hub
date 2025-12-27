import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMOJI_LIST = [
  '👋', '😊', '🎉', '❤️', '🔥', '⭐', '💡', '🚀',
  '✨', '👍', '💪', '🎯', '📌', '💬', '🤝', '🏆',
  '📞', '✅', '❓', '💼', '📧', '🛒', '🎁', '💰',
  '🏠', '🔧', '📱', '💻', '🎨', '📝', '🔔', '⏰',
];

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void;
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
        >
          <Smile className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
