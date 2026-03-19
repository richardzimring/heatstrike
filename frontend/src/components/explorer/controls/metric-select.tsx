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

interface MetricSelectProps {
  label: string;
  value: Metric;
  onChange: (value: Metric) => void;
}

export function MetricSelect({ label, value, onChange }: MetricSelectProps) {
  const selectedMetric = METRIC_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as Metric)}>
        <SelectTrigger className="h-8 w-auto min-w-[90px] text-xs">
          <SelectValue>
            {selectedMetric?.selectedLabel ?? selectedMetric?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
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
