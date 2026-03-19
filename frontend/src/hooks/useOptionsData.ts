import { useQuery } from '@tanstack/react-query';
import { getDataByTicker } from '@/lib/api/generated';
import type {
  OptionsDataResponse,
  ProcessingResponse,
} from '@/lib/api/generated';

type OptionsResult = OptionsDataResponse | ProcessingResponse;

async function fetchOptionsData(ticker: string): Promise<OptionsResult> {
  const { data, error, response } = await getDataByTicker({
    path: { ticker },
  });

  if (response.status === 202 && data && 'status' in data) {
    return data as ProcessingResponse;
  }

  if (error) {
    throw new Error(error.message);
  }

  return data as OptionsDataResponse;
}

function isProcessing(data: OptionsResult | undefined): boolean {
  return !!data && 'status' in data && data.status === 'processing';
}

export function useOptionsData(ticker: string) {
  return useQuery({
    queryKey: ['options', ticker.toUpperCase()],
    queryFn: () => fetchOptionsData(ticker.toUpperCase()),
    enabled: ticker.length > 0,
    refetchInterval: (query) => (isProcessing(query.state.data) ? 2000 : false),
  });
}
