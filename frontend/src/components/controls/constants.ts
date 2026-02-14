import type { Direction, Metric } from '@/types';

export const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'volume', label: 'Volume' },
  { value: 'open_interest', label: 'Open Interest' },
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

export const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: 'calls', label: 'Calls' },
  { value: 'puts', label: 'Puts' },
];
