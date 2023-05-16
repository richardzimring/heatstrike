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

export interface GetDataResponse {
  status: number;
  data: {
    symbol: string;
    description: string;
    price: number;
    change_percentage: number;
    expirationDates: string[];
    strikes: number[];
    updated_at: string;
    options: FlatOptionData[][];
  };
}

