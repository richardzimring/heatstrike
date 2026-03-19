import { TRADIER_KEY, TRADIER_BASE_URL, TRADIER_CONCURRENCY } from '../constants';
import { TradierOptionsChainResponseSchema } from '../types/tradier';
import type { TradierOptionData } from '../types/tradier';
import type { Option, OptionChain } from '../schemas/options';

export interface OptionChainSummary {
  strikes: string[];
  updated_at: string;
  options: OptionChain[];
}

async function limitConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      const task = tasks[index];
      if (!task) continue;
      results[index] = await task();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => runNext()),
  );
  return results;
}

function fetchChain(ticker: string, date: string) {
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
}

function transformOption(option: TradierOptionData, date: string, dateStr: string): Option {
  const bid = option.bid;
  const ask = option.ask;
  const price = bid !== null && ask !== null ? ((ask + bid) / 2).toFixed(2) : null;
  const spread = bid !== null && ask !== null ? (ask - bid).toFixed(2) : null;

  return {
    symbol: option.symbol,
    direction: option.option_type,
    date,
    date_str: dateStr,
    strike: option.strike.toString(),
    volume: (option.open === null ? option.last_volume : option.volume).toString(),
    open_interest: option.open_interest.toString(),
    bid: bid !== null ? bid.toFixed(2) : null,
    ask: ask !== null ? ask.toFixed(2) : null,
    price,
    spread,
    delta: option.greeks?.delta?.toFixed(6) ?? null,
    gamma: option.greeks?.gamma?.toFixed(6) ?? null,
    theta: option.greeks?.theta?.toFixed(6) ?? null,
    vega: option.greeks?.vega?.toFixed(6) ?? null,
    rho: option.greeks?.rho?.toFixed(6) ?? null,
    phi: option.greeks?.phi?.toFixed(6) ?? null,
    mid_iv: option.greeks?.mid_iv?.toFixed(6) ?? null,
  };
}

export async function fetchOptionData(
  ticker: string,
  expirationDates: string[],
  expirationDatesStringified: string[],
): Promise<OptionChainSummary> {
  const tasks = expirationDates.map((date) => async () => {
    const response = await fetchChain(ticker, date);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return TradierOptionsChainResponseSchema.parse(json);
  });

  const results = await limitConcurrency(tasks, TRADIER_CONCURRENCY);

  const optionChains: TradierOptionData[][] = results.map(
    (result) => result.options.option,
  );

  const processed: Option[][] = optionChains.map((chain, dateIndex) => {
    const date = expirationDates[dateIndex];
    const dateStr = expirationDatesStringified[dateIndex];

    if (!date || !dateStr) {
      throw new Error(`Missing expiration date at index ${dateIndex}`);
    }

    return chain.map((option) => transformOption(option, date, dateStr));
  });

  const allStrikes = [
    ...new Set(
      processed.flatMap((options) => options.map((opt) => parseFloat(opt.strike))),
    ),
  ]
    .sort((a, b) => a - b)
    .map((strike) => strike.toString())
    .filter((strike) => !strike.includes('.'));

  const optionMaps = processed.map((chain) => {
    const map = new Map<string, Option>();
    for (const option of chain) {
      map.set(`${option.strike}-${option.direction}`, option);
    }
    return map;
  });

  const formatted: OptionChain[] = expirationDates.map((_date, dateIndex) => {
    const optionMap = optionMaps[dateIndex];
    if (!optionMap) {
      throw new Error(`Missing data at index ${dateIndex}`);
    }

    return {
      calls: allStrikes.map((strike) => optionMap.get(`${strike}-call`) ?? null),
      puts: allStrikes.map((strike) => optionMap.get(`${strike}-put`) ?? null),
    };
  });

  const firstOption = optionChains[0]?.[0];
  const updatedAt = firstOption?.greeks?.updated_at ?? new Date().toISOString();

  return {
    strikes: allStrikes.map((strike) => `$${strike}`),
    updated_at: updatedAt,
    options: formatted,
  };
}
