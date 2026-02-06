import { useQuery } from '@tanstack/react-query';
import { getTickers } from '@/lib/api/generated';
import { client } from '@/lib/api/generated/client.gen';
import type { TickersResponse } from '@/lib/api/generated';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Ensure the client is configured (same pattern as useOptionsData)
client.setConfig({ baseUrl: API_BASE_URL });

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
