interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  phi: number;
  bid_iv: number;
  mid_iv: number;
  ask_iv: number;
  smv_vol: number;
  updated_at: string;
}

export interface OptionData {
  symbol: string;
  description: string;
  exch: string;
  type: string;
  last: number | null;
  change: number | null;
  volume: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  bid: number;
  ask: number;
  underlying: string;
  strike: number;
  change_percentage: number | null;
  average_volume: number;
  last_volume: number;
  trade_date: number;
  prevclose: number | null;
  week_52_high: number;
  week_52_low: number;
  bidsize: number;
  bidexch: string;
  bid_date: number;
  asksize: number;
  askexch: string;
  ask_date: number;
  open_interest: number;
  contract_size: number;
  expiration_date: string;
  expiration_type: string;
  option_type: string;
  root_symbol: string;
  greeks: Greeks;
}

export interface FlatOptionData {
  strike: number;
  option_type: string;
  volume: number;
  open_interest: number;
  price: number,
  spread: number,
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  phi: number;
  updated_at: string;
}

export interface OptionChainSummary {
  strikes: number[];
  updated_at: string;
  options: FlatOptionData[][];
}