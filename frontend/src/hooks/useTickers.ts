import { useQuery } from '@tanstack/react-query';
import { getTickers } from '@/lib/api/generated';
import type { TickersResponse } from '@/lib/api/generated';
import { parseCacheControlMaxAgeMs } from '@/lib/utils';

const DEFAULT_TICKERS_STALE_TIME_MS = 60 * 60 * 1000;

interface TickersQueryData {
  payload: TickersResponse;
  staleTimeMs: number;
}

async function fetchTickers(): Promise<TickersQueryData> {
  const { data, error, response } = await getTickers();

  if (error) {
    throw new Error('Failed to fetch tickers');
  }

  return {
    payload: data,
    staleTimeMs:
      parseCacheControlMaxAgeMs(response?.headers.get('cache-control')) ??
      DEFAULT_TICKERS_STALE_TIME_MS,
  };
}

export function useTickers() {
  const query = useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: (query) =>
      query.state.data?.staleTimeMs ?? DEFAULT_TICKERS_STALE_TIME_MS,
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    data: query.data?.payload,
  };
}
