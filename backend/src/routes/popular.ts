import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { QuoteSummariesResponseSchema } from '../schemas/popular';
import type { PopularTickerList } from '../schemas/popular';
import { CACHE_TTL_MS } from '../constants';
import { readPopularSymbolsFromS3 } from '../services/popularTickers';
import {
  resolveQuoteSummaries,
  placeholderQuoteSummary,
} from '../services/quoteSummary';

const POPULAR_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

let cachedSymbols: PopularTickerList | null = null;
let cachedLastModifiedMs: number | null = null;
let cacheTimestamp = 0;

function getMaxAgeSeconds(lastModifiedMs: number): number {
  const nextRefreshMs = lastModifiedMs + POPULAR_REFRESH_INTERVAL_MS;
  const remainingMs = Math.max(0, nextRefreshMs - Date.now());
  return Math.floor(remainingMs / 1000);
}

async function loadPopularSymbols(): Promise<{
  symbols: PopularTickerList;
  maxAgeSeconds: number;
}> {
  const now = Date.now();
  if (cachedSymbols && now - cacheTimestamp < CACHE_TTL_MS) {
    return {
      symbols: cachedSymbols,
      maxAgeSeconds: getMaxAgeSeconds(cachedLastModifiedMs ?? cacheTimestamp),
    };
  }

  const symbols = await readPopularSymbolsFromS3();
  cachedSymbols = symbols;
  cachedLastModifiedMs = now;
  cacheTimestamp = now;

  return {
    symbols,
    maxAgeSeconds: getMaxAgeSeconds(cachedLastModifiedMs),
  };
}

export const popularRouter = new OpenAPIHono();

const getPopularRoute = createRoute({
  method: 'get',
  path: '/market/popular',
  tags: ['Market'],
  summary: 'Get popular tickers with quote summaries',
  description:
    'Returns popular tickers ranked by Reddit mention activity, enriched with cached quote fields for the home launcher.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: QuoteSummariesResponseSchema,
        },
      },
      description: 'Ranked popular tickers with quote summaries',
    },
  },
});

popularRouter.openapi(getPopularRoute, async (c) => {
  const { symbols, maxAgeSeconds } = await loadPopularSymbols();
  const summaries = await resolveQuoteSummaries(symbols);

  const payload = symbols.map(
    (ticker) => summaries.get(ticker) ?? placeholderQuoteSummary(ticker),
  );

  const summaryMaxAge = Math.min(maxAgeSeconds, 60);
  c.header('Cache-Control', `public, max-age=${summaryMaxAge}`);
  return c.json(payload, 200);
});
