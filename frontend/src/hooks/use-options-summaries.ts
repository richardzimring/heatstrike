import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getMarketSummaries } from '@/lib/api/generated';
import type { OptionsTickerSummary } from '@/lib/api/generated';
import { normalizeSummaries } from '@/lib/options-pulse';
import { parseCacheControlMaxAgeMs } from '@/lib/utils';

const DEFAULT_STALE_TIME_MS = 60 * 1000;

export function useOptionsSummaries(tickers: string[]) {
  const sorted = useMemo(
    () => [...new Set(tickers.map((t) => t.toUpperCase()))].sort(),
    [tickers],
  );
  const key = sorted.join(',');

  const query = useQuery({
    queryKey: ['options-summaries', key],
    queryFn: async () => {
      const { data, error, response } = await getMarketSummaries({
        query: { tickers: key },
      });

      if (error) {
        throw new Error('Failed to fetch options summaries');
      }

      const staleTimeMs =
        parseCacheControlMaxAgeMs(response?.headers.get('cache-control')) ??
        DEFAULT_STALE_TIME_MS;

      return {
        summaries: normalizeSummaries(data),
        staleTimeMs,
      };
    },
    enabled: sorted.length > 0,
    staleTime: (q) => q.state.data?.staleTimeMs ?? DEFAULT_STALE_TIME_MS,
    // Removing a watchlist/recent ticker changes the key; keep prior summaries
    // so remaining cards don't flash empty while the new request loads.
    placeholderData: keepPreviousData,
  });

  const summariesMap = useMemo(() => {
    const map = new Map<string, OptionsTickerSummary>();
    for (const summary of query.data?.summaries ?? []) {
      map.set(summary.ticker.toUpperCase(), summary);
    }
    return map;
  }, [query.data?.summaries]);

  return { ...query, summariesMap };
}
