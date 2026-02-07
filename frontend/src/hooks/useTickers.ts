import { useQuery } from '@tanstack/react-query';
import { getTickers } from '@/lib/api/generated';
import type { TickersResponse } from '@/lib/api/generated';

async function fetchTickers(): Promise<TickersResponse> {
  const { data, error } = await getTickers();

  if (error) {
    throw new Error('Failed to fetch tickers');
  }

  return data;
}

export function useTickers() {
  return useQuery({
    queryKey: ['tickers'],
    queryFn: fetchTickers,
    staleTime: 60 * 60 * 1000, // 1 hour — data only changes daily
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
