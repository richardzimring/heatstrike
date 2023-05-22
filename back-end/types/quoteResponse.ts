interface Quote {
  symbol: string;
  description: string;
  exch: string;
  type: string;
  last: number;
  change: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number | null;
  bid: number;
  ask: number;
  change_percentage: number;
  average_volume: number;
  last_volume: number;
  trade_date: number;
  prevclose: number;
  week_52_high: number;
  week_52_low: number;
  bidsize: number;
  bidexch: string;
  bid_date: number;
  asksize: number;
  askexch: string;
  ask_date: number;
  root_symbols: string;
}

export interface QuotesResponse {
  status: number;
  data: {
    quotes: {
      quote: Quote;
      unmatched_symbols?: string[];
    };
  };
}

export interface QuoteSummary {
  ticker: string;
  description: string;
  price: string;
  change_percentage: string;
}