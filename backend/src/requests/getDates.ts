import { TRADIER_KEY, TRADIER_BASE_URL } from '../constants';
import { TradierExpirationsResponseSchema } from '../types/tradier';

/**
 * Fetch available expiration dates for a ticker from Tradier API
 */
export async function fetchExpirationDates(ticker: string): Promise<string[]> {
  const url = new URL(`${TRADIER_BASE_URL}/options/expirations`);
  url.searchParams.set('symbol', ticker);

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
  const result = TradierExpirationsResponseSchema.parse(json);

  if (result.expirations === null) {
    throw new Error('Invalid ticker');
  }

  return Array.isArray(result.expirations.date)
    ? result.expirations.date
    : [result.expirations.date];
}
