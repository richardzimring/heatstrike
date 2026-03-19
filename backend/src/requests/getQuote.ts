import { TRADIER_KEY, TRADIER_BASE_URL } from '../constants';
import { TradierQuotesResponseSchema } from '../types/tradier';
import type { TradierQuote } from '../types/tradier';

export interface QuoteSummary {
  ticker: string;
  description: string;
  price: string;
  change: string;
  change_percentage: string;
}

export interface BatchQuoteSummary {
  ticker: string;
  description: string;
  price: string;
  change: string;
  change_percentage: string;
  volume: number;
  average_volume: number;
  week_52_high: number;
  week_52_low: number;
  prev_close: number;
  open: number | null;
  high: number | null;
  low: number | null;
}

function formatChange(value: number | null): string {
  if (value === null) return '0.00';
  return value >= 0 ? `+${value.toFixed(2)}` : `${value.toFixed(2)}`;
}

function formatChangePercentage(value: number | null): string {
  if (value === null) return '0.00';
  return value >= 0 ? `+${value}` : `${value}`;
}

function normalizeQuotes(raw: unknown): TradierQuote[] {
  const result = TradierQuotesResponseSchema.parse(raw);
  if (!result.quotes.quote) return [];
  return Array.isArray(result.quotes.quote)
    ? result.quotes.quote
    : [result.quotes.quote];
}

function transformQuote(quote: TradierQuote): BatchQuoteSummary {
  const midPrice = (quote.ask + quote.bid) / 2;
  return {
    ticker: quote.symbol,
    description: quote.description,
    price: midPrice.toFixed(2),
    change: formatChange(quote.change),
    change_percentage: formatChangePercentage(quote.change_percentage),
    volume: quote.volume,
    average_volume: quote.average_volume,
    week_52_high: quote.week_52_high,
    week_52_low: quote.week_52_low,
    prev_close: quote.prevclose ?? 0,
    open: quote.open,
    high: quote.high,
    low: quote.low,
  };
}

/**
 * Fetch current stock quote from Tradier API (single ticker)
 */
export async function fetchQuote(ticker: string): Promise<QuoteSummary> {
  const url = new URL(`${TRADIER_BASE_URL}/quotes`);
  url.searchParams.set('symbols', ticker);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TRADIER_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const json = await response.json();
  const quotes = normalizeQuotes(json);

  if (quotes.length === 0) {
    throw new Error('Invalid ticker');
  }

  const quote = quotes[0];
  if (!quote) {
    throw new Error('Invalid ticker');
  }
  const midPrice = (quote.ask + quote.bid) / 2;

  return {
    ticker: quote.symbol,
    description: quote.description,
    price: midPrice.toFixed(2),
    change: formatChange(quote.change),
    change_percentage: formatChangePercentage(quote.change_percentage),
  };
}

/**
 * Fetch stock quotes for multiple tickers in a single Tradier API call.
 * Returns a map of ticker -> BatchQuoteSummary.
 */
export async function fetchBatchQuotes(
  tickers: string[],
): Promise<Map<string, BatchQuoteSummary>> {
  if (tickers.length === 0) return new Map();

  const url = new URL(`${TRADIER_BASE_URL}/quotes`);
  url.searchParams.set('symbols', tickers.join(','));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TRADIER_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Tradier batch quotes HTTP error: ${response.status}`);
  }

  const json = await response.json();
  const quotes = normalizeQuotes(json);

  const result = new Map<string, BatchQuoteSummary>();
  for (const quote of quotes) {
    result.set(quote.symbol, transformQuote(quote));
  }
  return result;
}
