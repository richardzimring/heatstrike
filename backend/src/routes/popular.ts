import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { PopularTickersResponseSchema } from '../schemas/popular';
import type { PopularTickersResponse } from '../schemas/popular';
import {
  TICKERS_BUCKET_NAME,
  CACHE_TTL_MS,
  POPULAR_TICKERS_S3_KEY,
  POPULAR_TICKERS_FALLBACK,
} from '../constants';

const s3 = new S3Client({});
const POPULAR_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

let cachedPopular: PopularTickersResponse | null = null;
let cachedLastModifiedMs: number | null = null;
let cacheTimestamp = 0;

function getMaxAgeSeconds(lastModifiedMs: number): number {
  const nextRefreshMs = lastModifiedMs + POPULAR_REFRESH_INTERVAL_MS;
  const remainingMs = Math.max(0, nextRefreshMs - Date.now());
  return Math.floor(remainingMs / 1000);
}

async function loadPopular(): Promise<{
  popular: PopularTickersResponse;
  maxAgeSeconds: number;
}> {
  const now = Date.now();
  if (cachedPopular && now - cacheTimestamp < CACHE_TTL_MS) {
    return {
      popular: cachedPopular,
      maxAgeSeconds: getMaxAgeSeconds(cachedLastModifiedMs ?? cacheTimestamp),
    };
  }

  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: TICKERS_BUCKET_NAME,
        Key: POPULAR_TICKERS_S3_KEY,
      }),
    );

    const body = await result.Body?.transformToString();
    if (body) {
      cachedPopular = JSON.parse(body) as PopularTickersResponse;
      cachedLastModifiedMs = result.LastModified?.getTime() ?? now;
      cacheTimestamp = now;
      return {
        popular: cachedPopular,
        maxAgeSeconds: getMaxAgeSeconds(cachedLastModifiedMs),
      };
    }
  } catch {
    // popular.json doesn't exist yet — fall through to fallback
  }

  return {
    popular: [...POPULAR_TICKERS_FALLBACK],
    maxAgeSeconds: 3600,
  };
}

export const popularRouter = new OpenAPIHono();

const getPopularRoute = createRoute({
  method: 'get',
  path: '/market/popular',
  tags: ['Market'],
  summary: 'Get popular tickers',
  description:
    'Returns popular tickers ranked by Reddit mention activity (YoloStocks WSB data). Refreshed daily.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PopularTickersResponseSchema,
        },
      },
      description: 'Array of popular ticker symbols',
    },
  },
});

popularRouter.openapi(getPopularRoute, async (c) => {
  const { popular, maxAgeSeconds } = await loadPopular();
  c.header('Cache-Control', `public, max-age=${maxAgeSeconds}`);
  return c.json(popular, 200);
});
