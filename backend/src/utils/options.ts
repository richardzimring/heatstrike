import type { Option } from '../schemas/options';

/**
 * Create an empty option placeholder
 * Used when no option data exists for a specific strike/date combination
 */
export function createEmptyOption(
  ticker: string,
  direction: 'call' | 'put',
  date: string,
  dateStr: string,
  strike: string,
): Option {
  return {
    symbol: ticker,
    direction,
    date,
    date_str: dateStr,
    strike,
    volume: '',
    open_interest: '',
    price: '',
    spread: '',
    delta: '',
    gamma: '',
    theta: '',
    vega: '',
    rho: '',
    phi: '',
  };
}
