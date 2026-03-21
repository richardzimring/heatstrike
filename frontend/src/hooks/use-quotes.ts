import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMarketQuotes } from '@/lib/api/generated';
import type { QuoteSummary } from '@/lib/api/generated';
import { parseCacheControlMaxAgeMs } from '@/lib/utils';

const DEFAULT_QUOTES_STALE_TIME_MS = 5 * 60 * 1000;

interface QuotesQueryData {
  quotes: QuoteSummary[];
  staleTimeMs: number;
}

async function fetchQuotes(tickers: string[]): Promise<QuotesQueryData> {
  const { data, error, response } = await getMarketQuotes({
    query: { tickers: tickers.join(',') },
  });

  if (error) {
    throw new Error('Failed to fetch quotes');
  }

  const staleTimeMs =
    parseCacheControlMaxAgeMs(response?.headers.get('cache-control')) ??
    DEFAULT_QUOTES_STALE_TIME_MS;

  return {
    quotes: data ?? [],
    staleTimeMs,
  };
}

export function useQuotes(tickers: string[]) {
  const sorted = useMemo(() => [...tickers].sort(), [tickers]);
  const key = sorted.join(',');

  const query = useQuery({
    queryKey: ['quotes', key],
    queryFn: () => fetchQuotes(sorted),
    enabled: sorted.length > 0,
    staleTime: (query) =>
      query.state.data?.staleTimeMs ?? DEFAULT_QUOTES_STALE_TIME_MS,
  });

  const quotes = query.data?.quotes;
  const quotesMap = useMemo(() => {
    const map = new Map<string, QuoteSummary>();
    if (quotes) {
      for (const quote of quotes) {
        map.set(quote.ticker, quote);
      }
    }
    return map;
  }, [quotes]);

  return { ...query, data: quotes, quotesMap };
}
