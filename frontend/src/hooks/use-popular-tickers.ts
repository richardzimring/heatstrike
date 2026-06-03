import { useQuery } from '@tanstack/react-query';
import { getMarketPopular } from '@/lib/api/generated';
import { parseCacheControlMaxAgeMs } from '@/lib/utils';

const FALLBACK: string[] = [
  'AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'META', 'GOOG', 'AMD',
];
const DEFAULT_STALE_TIME_MS = 60 * 60 * 1000;

export function usePopularTickers() {
  return useQuery({
    queryKey: ['popular-tickers'],
    queryFn: async () => {
      const { data, error, response } = await getMarketPopular();
      if (error || !data || data.length === 0) return { tickers: FALLBACK, staleTimeMs: DEFAULT_STALE_TIME_MS };

      const staleTimeMs =
        parseCacheControlMaxAgeMs(response?.headers.get('cache-control')) ??
        DEFAULT_STALE_TIME_MS;

      return { tickers: data, staleTimeMs };
    },
    staleTime: (query) =>
      query.state.data?.staleTimeMs ?? DEFAULT_STALE_TIME_MS,
  });
}
