import type { OptionsDataResponse } from '@/lib/api/generated';
export type { OptionsDataResponse };

export type OptionChain = OptionsDataResponse['options'][number];
export type Option = NonNullable<OptionChain['calls'][number]>;
export type Direction = keyof OptionChain;

export type Metric =
  | Extract<
      keyof Option,
      | 'volume'
      | 'open_interest'
      | 'price'
      | 'spread'
      | 'delta'
      | 'gamma'
      | 'theta'
      | 'vega'
      | 'rho'
      | 'phi'
      | 'mid_iv'
    >
  | 'vol_oi_ratio';

export interface MetricOption {
  value: Metric;
  label: string;
  selectedLabel?: string;
}

export interface DirectionOption {
  value: Direction;
  label: string;
}

export const METRIC_OPTIONS: MetricOption[] = [
  { value: 'volume', label: 'Volume' },
  { value: 'open_interest', label: 'Open Interest', selectedLabel: 'OI' },
  { value: 'vol_oi_ratio', label: 'Unusual Activity', selectedLabel: 'UA' },
  { value: 'price', label: 'Price' },
  { value: 'spread', label: 'Spread' },
  { value: 'mid_iv', label: 'IV' },
  { value: 'delta', label: 'Delta' },
  { value: 'gamma', label: 'Gamma' },
  { value: 'theta', label: 'Theta' },
  { value: 'vega', label: 'Vega' },
  { value: 'rho', label: 'Rho' },
  { value: 'phi', label: 'Phi' },
];

export const DIRECTION_OPTIONS: DirectionOption[] = [
  { value: 'calls', label: 'Calls' },
  { value: 'puts', label: 'Puts' },
];
