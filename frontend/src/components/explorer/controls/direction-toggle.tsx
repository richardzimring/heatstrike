import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import type { Direction } from '@/types';

interface DirectionToggleProps {
  value: Direction;
  onChange: (value: Direction) => void;
}

export function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as Direction);
      }}
    >
      <ToggleGroupItem value="calls" className="text-xs px-3 h-8">
        Calls
      </ToggleGroupItem>
      <ToggleGroupItem value="puts" className="text-xs px-3 h-8">
        Puts
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
