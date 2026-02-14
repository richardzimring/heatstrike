import type { Metric } from '@/types';
import { METRIC_OPTIONS } from './constants';
import { OptionsSelect } from './OptionsSelect';

interface MetricSelectProps {
  value: Metric;
  onChange: (metric: Metric) => void;
}

export function MetricSelect({ value, onChange }: MetricSelectProps) {
  return (
    <OptionsSelect
      value={value}
      onChange={onChange}
      options={METRIC_OPTIONS}
      label="Metric"
      triggerWidth="sm:w-[150px]"
    />
  );
}
