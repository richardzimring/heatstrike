import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TickersResponseSchema } from '../schemas/tickers';
import type { TickersResponse } from '../schemas/tickers';
import { TICKERS_BUCKET_NAME, CACHE_TTL_MS } from '../constants';

const s3 = new S3Client({});
const TICKERS_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

// In-memory cache so we don't re-read S3 on every invocation within the same Lambda instance
let cachedTickers: TickersResponse | null = null;
let cachedTickersLastModifiedMs: number | null = null;
let cacheTimestamp = 0;

function getTickersMaxAgeSeconds(lastModifiedMs: number): number {
  const now = Date.now();
  const nextRefreshMs = lastModifiedMs + TICKERS_REFRESH_INTERVAL_MS;
  const remainingMs = Math.max(0, nextRefreshMs - now);
  return Math.floor(remainingMs / 1000);
}

async function loadTickers(): Promise<{
  tickers: TickersResponse;
  maxAgeSeconds: number;
}> {
  const now = Date.now();
  if (cachedTickers && now - cacheTimestamp < CACHE_TTL_MS) {
    return {
      tickers: cachedTickers,
      maxAgeSeconds: getTickersMaxAgeSeconds(
        cachedTickersLastModifiedMs ?? cacheTimestamp,
      ),
    };
  }

  const result = await s3.send(
    new GetObjectCommand({
      Bucket: TICKERS_BUCKET_NAME,
      Key: 'tickers.json',
    }),
  );

  const body = await result.Body?.transformToString();
  if (!body) {
    throw new Error('Empty response from S3');
  }

  cachedTickers = JSON.parse(body) as TickersResponse;
  cachedTickersLastModifiedMs = result.LastModified?.getTime() ?? now;
  cacheTimestamp = now;
  return {
    tickers: cachedTickers,
    maxAgeSeconds: getTickersMaxAgeSeconds(cachedTickersLastModifiedMs),
  };
}

// Create router for tickers endpoint
export const tickersRouter = new OpenAPIHono();

/**
 * GET /tickers
 * Return the full list of valid tickers and company names
 */
const getTickersRoute = createRoute({
  method: 'get',
  path: '/tickers',
  tags: ['Tickers'],
  summary: 'Get all valid tickers',
  description:
    'Returns the full list of valid stock tickers and their company names. Data is refreshed daily from the OCC.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TickersResponseSchema,
        },
      },
      description: 'Tickers list retrieved successfully',
    },
    500: {
      content: {
        'application/json': {
          schema: TickersResponseSchema,
        },
      },
      description: 'Failed to load tickers',
    },
  },
});

tickersRouter.openapi(getTickersRoute, async (c) => {
  try {
    const { tickers, maxAgeSeconds } = await loadTickers();
    c.header(
      'Cache-Control',
      `public, max-age=${maxAgeSeconds}`,
    );
    return c.json(tickers, 200);
  } catch (error) {
    console.error('Failed to load tickers:', error);
    return c.json([], 500);
  }
});
