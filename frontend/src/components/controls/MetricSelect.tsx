import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { METRIC_OPTIONS, type Metric } from '@/types';

interface MetricSelectProps {
  value: Metric;
  onChange: (metric: Metric) => void;
}

export function MetricSelect({ value, onChange }: MetricSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Metric)}>
      <SelectTrigger size="sm" className="w-full sm:w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Metric</SelectLabel>
          <SelectGroup>
            {METRIC_OPTIONS.map((option) => (
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
