import { TRADIER_KEY, TRADIER_BASE_URL } from '../constants';
import { TradierQuotesResponseSchema } from '../types/tradier';

export interface QuoteSummary {
  ticker: string;
  description: string;
  price: string;
  change: string;
  change_percentage: string;
}

/**
 * Fetch current stock quote from Tradier API
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
  const result = TradierQuotesResponseSchema.parse(json);

  if (result.quotes.unmatched_symbols || !result.quotes.quote) {
    throw new Error('Invalid ticker');
  }

  const quote = result.quotes.quote;
  const midPrice = (quote.ask + quote.bid) / 2;

  return {
    ticker: quote.symbol,
    description: quote.description,
    price: midPrice.toFixed(2),
    change:
      quote.change !== null && quote.change >= 0
        ? `+${quote.change.toFixed(2)}`
        : quote.change !== null
          ? `${quote.change.toFixed(2)}`
          : '0.00',
    change_percentage:
      quote.change_percentage !== null && quote.change_percentage >= 0
        ? `+${quote.change_percentage}`
        : quote.change_percentage !== null
          ? `${quote.change_percentage}`
          : '0.00',
  };
}
