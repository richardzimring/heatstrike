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
  onPreview?: (value: Metric) => void;
  onPreviewEnd?: () => void;
}

export function MetricSelect({
  label,
  value,
  onChange,
  onPreview,
  onPreviewEnd,
}: MetricSelectProps) {
  const selectedMetric = METRIC_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <Select
        value={value}
        onValueChange={(v) => {
          onPreviewEnd?.();
          onChange(v as Metric);
        }}
        onOpenChange={(open) => {
          if (!open) onPreviewEnd?.();
        }}
      >
        <SelectTrigger className="h-8 w-auto min-w-[90px] text-xs">
          <SelectValue>
            {selectedMetric?.selectedLabel ?? selectedMetric?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {METRIC_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                onPointerMove={() => onPreview?.(opt.value)}
                onFocus={() => onPreview?.(opt.value)}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
