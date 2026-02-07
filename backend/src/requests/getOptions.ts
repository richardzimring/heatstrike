import { TRADIER_KEY, TRADIER_BASE_URL, STRIKE_RANGE } from '../constants';
import { TradierOptionsChainResponseSchema } from '../types/tradier';
import type { TradierOptionData } from '../types/tradier';
import type { Option, OptionChain } from '../schemas/options';

export interface OptionChainSummary {
  strikes: string[];
  updated_at: string;
  options: OptionChain[];
}

/**
 * Fetch options chain data from Tradier API for all expiration dates
 */
export async function fetchOptionData(
  ticker: string,
  stockPrice: string,
  expirationDates: string[],
  expirationDatesStringified: string[],
): Promise<OptionChainSummary> {
  // Create requests for all expiration dates
  const requests = expirationDates.map((date) => {
    const url = new URL(`${TRADIER_BASE_URL}/options/chains`);
    url.searchParams.set('symbol', ticker);
    url.searchParams.set('expiration', date);
    url.searchParams.set('greeks', 'true');

    return fetch(url, {
      headers: {
        Authorization: `Bearer ${TRADIER_KEY}`,
        Accept: 'application/json',
      },
    });
  });

  // Fetch all option chains concurrently
  const responses = await Promise.all(requests);

  // Check for errors and parse JSON
  const results = await Promise.all(
    responses.map(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      return TradierOptionsChainResponseSchema.parse(json);
    }),
  );

  // Extract option chains from responses
  const optionChains: TradierOptionData[][] = results.map(
    (result) => result.options.option,
  );

  // Transform raw option data to our format
  const processed: Option[][] = optionChains.map((chain, dateIndex) => {
    const date = expirationDates[dateIndex];
    const dateStr = expirationDatesStringified[dateIndex];

    if (!date || !dateStr) {
      throw new Error(`Missing expiration date at index ${dateIndex}`);
    }

    return chain.map((option) => {
      // Handle null bid/ask
      const bid = option.bid;
      const ask = option.ask;
      const price =
        bid !== null && ask !== null ? ((ask + bid) / 2).toFixed(2) : null;
      const spread = bid !== null && ask !== null ? (ask - bid).toFixed(2) : null;

      return {
        symbol: option.symbol,
        direction: option.option_type,
        date: date,
        date_str: dateStr,
        strike: option.strike.toString(),
        volume: (option.open === null
          ? option.last_volume
          : option.volume
        ).toString(),
        open_interest: option.open_interest.toString(),
        price,
        spread,
        delta: option.greeks?.delta?.toFixed(6) ?? null,
        gamma: option.greeks?.gamma?.toFixed(6) ?? null,
        theta: option.greeks?.theta?.toFixed(6) ?? null,
        vega: option.greeks?.vega?.toFixed(6) ?? null,
        rho: option.greeks?.rho?.toFixed(6) ?? null,
        phi: option.greeks?.phi?.toFixed(6) ?? null,
      };
    });
  });

  // Get unique integer strikes, sorted
  const uniqueStrikes = [
    ...new Set(
      processed.flatMap((options) => options.map((opt) => parseFloat(opt.strike))),
    ),
  ]
    .sort((a, b) => a - b)
    .map((strike) => strike.toString())
    .filter((strike) => !strike.includes('.')); // Only integer strikes

  // Find index of strike closest to stock price
  const stockPriceNum = parseFloat(stockPrice);
  const stockPriceIndex = uniqueStrikes.findIndex(
    (strike) => parseFloat(strike) > stockPriceNum,
  );

  // Filter to strikes within range of current stock price
  const desiredStrikes = uniqueStrikes.filter(
    (_, index) => Math.abs(index - stockPriceIndex) <= STRIKE_RANGE,
  );

  // Build option chain map for O(1) lookup
  const optionMaps = processed.map((chain) => {
    const map = new Map<string, Option>();
    for (const option of chain) {
      map.set(`${option.strike}-${option.direction}`, option);
    }
    return map;
  });

  // Initialize output with empty options, then populate with actual data
  const formatted: OptionChain[] = expirationDates.map((date, dateIndex) => {
    const dateStr = expirationDatesStringified[dateIndex];
    const optionMap = optionMaps[dateIndex];

    if (!dateStr || !optionMap) {
      throw new Error(`Missing data at index ${dateIndex}`);
    }

    return {
      calls: desiredStrikes.map((strike) => {
        return optionMap.get(`${strike}-call`) ?? null;
      }),
      puts: desiredStrikes.map((strike) => {
        return optionMap.get(`${strike}-put`) ?? null;
      }),
    };
  });

  // Get updated_at from first option's greeks, or use current time
  const firstOption = optionChains[0]?.[0];
  const updatedAt = firstOption?.greeks?.updated_at ?? new Date().toISOString();

  return {
    strikes: desiredStrikes.map((strike) => `$${strike}`),
    updated_at: updatedAt,
    options: formatted,
  };
}
