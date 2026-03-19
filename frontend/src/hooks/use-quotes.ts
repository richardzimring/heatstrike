import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMarketQuotes } from '@/lib/api/generated';
import type { QuoteSummary } from '@/lib/api/generated';

async function fetchQuotes(tickers: string[]): Promise<QuoteSummary[]> {
  const { data, error } = await getMarketQuotes({
    query: { tickers: tickers.join(',') },
  });

  if (error) {
    throw new Error('Failed to fetch quotes');
  }

  return data ?? [];
}

export function useQuotes(tickers: string[]) {
  const sorted = useMemo(() => [...tickers].sort(), [tickers]);
  const key = sorted.join(',');

  const query = useQuery({
    queryKey: ['quotes', key],
    queryFn: () => fetchQuotes(sorted),
    enabled: sorted.length > 0,
  });

  const quotesMap = useMemo(() => {
    const map = new Map<string, QuoteSummary>();
    if (query.data) {
      for (const quote of query.data) {
        map.set(quote.ticker, quote);
      }
    }
    return map;
  }, [query.data]);

  return { ...query, quotesMap };
}
