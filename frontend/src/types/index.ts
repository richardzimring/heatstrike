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
