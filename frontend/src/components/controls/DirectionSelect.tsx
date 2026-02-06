import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { DIRECTION_OPTIONS, type Direction } from '@/types';

interface DirectionSelectProps {
  value: Direction;
  onChange: (direction: Direction) => void;
}

export function DirectionSelect({ value, onChange }: DirectionSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Direction)}>
      <SelectTrigger size="sm" className="w-[90px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Direction</SelectLabel>
          <SelectGroup>
            {DIRECTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
