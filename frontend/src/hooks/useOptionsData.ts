import { useQuery } from '@tanstack/react-query';
import { getDataByTicker } from '@/lib/api/generated';
import type { OptionsDataResponse } from '@/lib/api/generated';

async function fetchOptionsData(ticker: string): Promise<OptionsDataResponse> {
  const { data, error } = await getDataByTicker({
    path: { ticker },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function useOptionsData(ticker: string) {
  return useQuery({
    queryKey: ['options', ticker.toUpperCase()],
    queryFn: () => fetchOptionsData(ticker.toUpperCase()),
    enabled: ticker.length > 0,
  });
}
