import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { METRIC_OPTIONS } from '@/types';
import type { Metric } from '@/types';

interface SizeSelectProps {
  value: Metric | 'none';
  onChange: (value: Metric | 'none') => void;
}

export function SizeSelect({ value, onChange }: SizeSelectProps) {
  const selectedMetric =
    value === 'none' ? null : METRIC_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Size
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as Metric | 'none')}>
        <SelectTrigger className="h-8 w-auto min-w-[80px] text-xs">
          <SelectValue>
            {value === 'none'
              ? 'None'
              : selectedMetric?.selectedLabel ?? selectedMetric?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="none">None</SelectItem>
            {METRIC_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
