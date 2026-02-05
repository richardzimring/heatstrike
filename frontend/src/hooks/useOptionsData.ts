import { useQuery } from "@tanstack/react-query";
import { getDataByTicker } from "@/lib/api/generated";
import { client } from "@/lib/api/generated/client.gen";
import type { OptionsDataResponse } from "@/lib/api/generated";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Configure the client with the environment variable base URL
client.setConfig({ baseUrl: API_BASE_URL });

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
    queryKey: ["options", ticker.toUpperCase()],
    queryFn: () => fetchOptionsData(ticker.toUpperCase()),
    enabled: ticker.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
