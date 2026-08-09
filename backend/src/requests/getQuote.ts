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

function toQuoteSummary(quote: TradierQuote): QuoteSummary {
  const midPrice = (quote.ask + quote.bid) / 2;
  return {
    ticker: quote.symbol,
    description: quote.description,
    price: midPrice.toFixed(2),
    change: formatChange(quote.change),
    change_percentage: formatChangePercentage(quote.change_percentage),
  };
}

async function requestQuotes(symbols: string[]): Promise<TradierQuote[]> {
  if (symbols.length === 0) return [];

  const url = new URL(`${TRADIER_BASE_URL}/quotes`);
  url.searchParams.set('symbols', symbols.join(','));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TRADIER_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return normalizeQuotes(await response.json());
}

/**
 * Fetch current stock quote from Tradier API (single ticker)
 */
export async function fetchQuote(ticker: string): Promise<QuoteSummary> {
  const quotes = await requestQuotes([ticker]);
  const quote = quotes[0];
  if (!quote) {
    throw new Error('Invalid ticker');
  }
  return toQuoteSummary(quote);
}

/**
 * Fetch current stock quotes from Tradier API (batch).
 * Tradier accepts comma-separated symbols in one request.
 */
export async function fetchQuotes(tickers: string[]): Promise<QuoteSummary[]> {
  const unique = [
    ...new Set(tickers.map((t) => t.trim().toUpperCase()).filter(Boolean)),
  ];
  if (unique.length === 0) return [];

  const BATCH_SIZE = 25;
  const results: QuoteSummary[] = [];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const quotes = await requestQuotes(batch);
    for (const quote of quotes) {
      results.push(toQuoteSummary(quote));
    }
  }

  return results;
}
