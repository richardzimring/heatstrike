import type { OptionsDataResponse } from '@/lib/api/generated';
export type { OptionsDataResponse };

export type OptionChain = OptionsDataResponse['options'][number];
export type Option = NonNullable<OptionChain['calls'][number]>;
export type Direction = keyof OptionChain;
export type Metric = Extract<
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
>;

export interface HeatmapCell {
  strike: string;
  date: string;
  dateStr: string;
  value: number;
  option: Option;
}

export interface HeatmapBin {
  bin: number;
  bins: HeatmapCell[];
}

export const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'volume', label: 'Volume' },
  { value: 'open_interest', label: 'Open Interest' },
  { value: 'price', label: 'Price' },
  { value: 'spread', label: 'Spread' },
  { value: 'delta', label: 'Delta' },
  { value: 'gamma', label: 'Gamma' },
  { value: 'theta', label: 'Theta' },
  { value: 'vega', label: 'Vega' },
  { value: 'rho', label: 'Rho' },
  { value: 'phi', label: 'Phi' },
];

export const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: 'calls', label: 'Calls' },
  { value: 'puts', label: 'Puts' },
];
