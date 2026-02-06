import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TickersResponseSchema } from '../schemas/tickers';
import type { TickersResponse } from '../schemas/tickers';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.TICKERS_BUCKET_NAME ?? '';

// In-memory cache so we don't re-read S3 on every invocation within the same Lambda instance
let cachedTickers: TickersResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function loadTickers(): Promise<TickersResponse> {
  const now = Date.now();
  if (cachedTickers && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedTickers;
  }

  const result = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'tickers.json',
    }),
  );

  const body = await result.Body?.transformToString();
  if (!body) {
    throw new Error('Empty response from S3');
  }

  cachedTickers = JSON.parse(body) as TickersResponse;
  cacheTimestamp = now;
  return cachedTickers;
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
    const tickers = await loadTickers();
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json(tickers, 200);
  } catch (error) {
    console.error('Failed to load tickers:', error);
    return c.json([], 500);
  }
});
