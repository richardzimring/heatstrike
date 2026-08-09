import { useQuery } from '@tanstack/react-query';
import { getMarketPopular } from '@/lib/api/generated';
import { emptySummary, normalizeSummaries } from '@/lib/ticker-pulse';
import { parseCacheControlMaxAgeMs } from '@/lib/utils';

const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000;

// Keep in sync with backend POPULAR_TICKERS_FALLBACK.
const FALLBACK = [
  'AAPL',
  'TSLA',
  'NVDA',
  'AMZN',
  'MSFT',
  'META',
  'GOOG',
  'AMD',
].map(emptySummary);

export function usePopularTickers() {
  return useQuery({
    queryKey: ['popular-tickers'],
    queryFn: async () => {
      const { data, error, response } = await getMarketPopular();
      const tickers = normalizeSummaries(data);
      if (error || tickers.length === 0) {
        return { tickers: FALLBACK, staleTimeMs: DEFAULT_STALE_TIME_MS };
      }

      const staleTimeMs =
        parseCacheControlMaxAgeMs(response?.headers.get('cache-control')) ??
        DEFAULT_STALE_TIME_MS;

      return { tickers, staleTimeMs };
    },
    staleTime: (query) =>
      query.state.data?.staleTimeMs ?? DEFAULT_STALE_TIME_MS,
  });
}
