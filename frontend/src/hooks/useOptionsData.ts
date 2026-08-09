import { useQuery } from '@tanstack/react-query';
import { getDataByTicker } from '@/lib/api/generated';
import type {
  OptionsDataResponse,
  ProcessingResponse,
} from '@/lib/api/generated';
import { parseCacheControlMaxAgeMs } from '@/lib/utils';

type OptionsResult = OptionsDataResponse | ProcessingResponse;
const DEFAULT_OPTIONS_STALE_TIME_MS = 5 * 60 * 1000;

interface OptionsQueryData {
  payload: OptionsResult;
  staleTimeMs: number;
}

async function fetchOptionsData(ticker: string): Promise<OptionsQueryData> {
  const { data, error, response } = await getDataByTicker({
    path: { ticker },
  });

  if (response.status === 202 && data && 'status' in data) {
    return {
      payload: data as ProcessingResponse,
      staleTimeMs:
        parseCacheControlMaxAgeMs(response.headers.get('cache-control')) ??
        DEFAULT_OPTIONS_STALE_TIME_MS,
    };
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    payload: data as OptionsDataResponse,
    staleTimeMs:
      parseCacheControlMaxAgeMs(response.headers.get('cache-control')) ??
      DEFAULT_OPTIONS_STALE_TIME_MS,
  };
}

function isProcessing(data: OptionsResult | undefined): boolean {
  return !!data && 'status' in data && data.status === 'processing';
}

export function useOptionsData(ticker: string) {
  const upperTicker = ticker.toUpperCase();

  const query = useQuery({
    queryKey: ['options', upperTicker],
    queryFn: () => fetchOptionsData(upperTicker),
    enabled: ticker.length > 0,
    staleTime: (q) =>
      q.state.data?.staleTimeMs ?? DEFAULT_OPTIONS_STALE_TIME_MS,
    refetchInterval: (q) =>
      isProcessing(q.state.data?.payload) ? 2000 : false,
  });

  const payload = query.data?.payload;

  return {
    ...query,
    data: payload,
  };
}
