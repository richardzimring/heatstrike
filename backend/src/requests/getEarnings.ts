import type { EarningsResponse } from '../schemas/earnings';

const FMP_API_KEY = process.env.FMP_API_KEY ?? '';

export async function fetchEarnings(
  ticker: string,
): Promise<EarningsResponse> {
  if (!FMP_API_KEY) {
    return { ticker, date: null, eps_estimated: null, revenue_estimated: null };
  }

  const url = `https://financialmodelingprep.com/api/v3/earning_calendar?symbol=${ticker}&apikey=${FMP_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`FMP API error: ${response.status}`);
    return { ticker, date: null, eps_estimated: null, revenue_estimated: null };
  }

  const data = (await response.json()) as {
    date?: string;
    epsEstimated?: number;
    revenueEstimated?: number;
  }[];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = data.find((e) => {
    if (!e.date) return false;
    return new Date(e.date) >= now;
  });

  if (!upcoming?.date) {
    return { ticker, date: null, eps_estimated: null, revenue_estimated: null };
  }

  return {
    ticker,
    date: upcoming.date,
    eps_estimated: upcoming.epsEstimated ?? null,
    revenue_estimated: upcoming.revenueEstimated ?? null,
  };
}
