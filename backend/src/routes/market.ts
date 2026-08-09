import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { QuoteSummariesResponseSchema } from '../schemas/popular';
import {
  resolveQuoteSummaries,
  placeholderQuoteSummary,
} from '../services/quoteSummary';

const MAX_TICKERS = 30;

export const marketRouter = new OpenAPIHono();

const getMarketSummariesRoute = createRoute({
  method: 'get',
  path: '/market/summaries',
  tags: ['Market'],
  summary: 'Get batch ticker quote summaries',
  description:
    'Returns cached quote summaries for the requested symbols (home watchlist, recent, and indexes).',
  request: {
    query: z.object({
      tickers: z.string().openapi({
        example: 'AAPL,SPY,COIN',
        description: 'Comma-separated ticker symbols (max 30)',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: QuoteSummariesResponseSchema,
        },
      },
      description: 'Quote summaries in request order',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'Validation error',
    },
  },
});

marketRouter.openapi(getMarketSummariesRoute, async (c) => {
  const { tickers: raw } = c.req.valid('query');

  const tickers = [
    ...new Set(
      raw
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter((t) => t.length > 0),
    ),
  ];

  if (tickers.length === 0) {
    return c.json({ error: 'tickers parameter is required' }, 400);
  }

  if (tickers.length > MAX_TICKERS) {
    return c.json({ error: `Maximum ${MAX_TICKERS} tickers allowed` }, 400);
  }

  const summaries = await resolveQuoteSummaries(tickers);
  const payload = tickers.map(
    (ticker) => summaries.get(ticker) ?? placeholderQuoteSummary(ticker),
  );

  c.header('Cache-Control', 'public, max-age=60');
  return c.json(payload, 200);
});
