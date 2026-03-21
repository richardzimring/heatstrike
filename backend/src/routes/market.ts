import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  BatchWriteCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { OPTIONS_TABLE_NAME } from '../constants';
import { QuotesResponseSchema } from '../schemas/market';
import type { QuotesResponse } from '../schemas/market';
import { fetchBatchQuotes } from '../requests/getQuote';
import { fetchEarnings } from '../requests/getEarnings';
import { getQuoteCacheTtlMs } from '../utils/marketHours';

const MAX_TICKERS = 30;
const EARNINGS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

function quoteKey(ticker: string): string {
  return `quote:${ticker}`;
}

function earningsKey(ticker: string): string {
  return `earnings:${ticker}`;
}

export const marketRouter = new OpenAPIHono();

const getMarketQuotesRoute = createRoute({
  method: 'get',
  path: '/market/quotes',
  tags: ['Market'],
  summary: 'Get batch stock quotes',
  description:
    'Returns lightweight quote summaries for the requested tickers. Reads from DynamoDB cache first, falls back to Tradier batch quotes for misses.',
  request: {
    query: z.object({
      tickers: z
        .string()
        .openapi({
          example: 'SPY,QQQ,AAPL,TSLA',
          description: 'Comma-separated ticker symbols (max 30)',
        }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: QuotesResponseSchema,
        },
      },
      description: 'Array of quote summaries in the same order as requested',
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

marketRouter.openapi(getMarketQuotesRoute, async (c) => {
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
    return c.json(
      { error: `Maximum ${MAX_TICKERS} tickers allowed` },
      400,
    );
  }

  try {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const quoteCacheTtlMs = getQuoteCacheTtlMs();

    // 1. BatchGetItem from DynamoDB for all requested tickers
    const cacheResult = await ddbDocClient.send(
      new BatchGetCommand({
        RequestItems: {
          [OPTIONS_TABLE_NAME]: {
            Keys: tickers.map((t) => ({ ticker: quoteKey(t) })),
          },
        },
      }),
    );

    const cachedItems = cacheResult.Responses?.[OPTIONS_TABLE_NAME] ?? [];
    const cacheMap = new Map<string, Record<string, unknown>>();
    for (const item of cachedItems) {
      const record = item as Record<string, unknown>;
      const key = record.ticker as string;
      const symbol = key.replace('quote:', '');
      if (record.ttl && (record.ttl as number) > nowSeconds) {
        cacheMap.set(symbol, record);
      }
    }

    // 2. Identify cache misses
    const misses = tickers.filter((t) => !cacheMap.has(t));

    // 3. Fetch misses from Tradier in one batch call
    const freshQuotes = new Map<string, Record<string, unknown>>();
    if (misses.length > 0) {
      const tradierQuotes = await fetchBatchQuotes(misses);
      const ttl = Math.floor((Date.now() + quoteCacheTtlMs) / 1000);

      // 4. Write fresh quotes to DynamoDB cache
      const writeRequests = [...tradierQuotes.entries()].map(
        ([symbol, quote]) => {
          const item = {
            ...quote,
            ticker: quoteKey(symbol),
            ttl,
          };
          freshQuotes.set(symbol, item);
          return { PutRequest: { Item: item } };
        },
      );

      // BatchWriteItem supports max 25 items per call
      for (let i = 0; i < writeRequests.length; i += 25) {
        const batch = writeRequests.slice(i, i + 25);
        await ddbDocClient.send(
          new BatchWriteCommand({
            RequestItems: { [OPTIONS_TABLE_NAME]: batch },
          }),
        );
      }
    }

    // 5. Look up earnings dates from DynamoDB cache (24h TTL, separate from quote cache)
    const earningsDateMap = new Map<string, string | null>();
    const earningsCacheResult = await ddbDocClient.send(
      new BatchGetCommand({
        RequestItems: {
          [OPTIONS_TABLE_NAME]: {
            Keys: tickers.map((t) => ({ ticker: earningsKey(t) })),
          },
        },
      }),
    );

    const earningsCached =
      earningsCacheResult.Responses?.[OPTIONS_TABLE_NAME] ?? [];
    const earningsMisses: string[] = [];
    for (const item of earningsCached) {
      const record = item as Record<string, unknown>;
      const key = record.ticker as string;
      const symbol = key.replace('earnings:', '');
      if (record.ttl && (record.ttl as number) > nowSeconds) {
        const data = record.data as { date?: string | null } | undefined;
        earningsDateMap.set(symbol, data?.date ?? null);
      } else {
        earningsMisses.push(symbol);
      }
    }
    for (const t of tickers) {
      if (!earningsDateMap.has(t) && !earningsMisses.includes(t)) {
        earningsMisses.push(t);
      }
    }

    // Fetch earnings cache misses from FMP and write back to DynamoDB
    if (earningsMisses.length > 0) {
      const earningsTtl = Math.floor(
        (Date.now() + EARNINGS_CACHE_TTL_MS) / 1000,
      );
      const results = await Promise.allSettled(
        earningsMisses.map(async (t) => {
          const earnings = await fetchEarnings(t);
          earningsDateMap.set(t, earnings.date);
          await ddbDocClient.send(
            new PutCommand({
              TableName: OPTIONS_TABLE_NAME,
              Item: {
                ticker: earningsKey(t),
                data: earnings,
                ttl: earningsTtl,
              },
            }),
          );
        }),
      );
      for (const r of results) {
        if (r.status === 'rejected') {
          console.error('Failed to fetch/cache earnings:', r.reason);
        }
      }
    }

    // 6. Merge cached + fresh results in requested order
    const response: QuotesResponse = tickers.flatMap((t) => {
      const cached = cacheMap.get(t);
      const fresh = freshQuotes.get(t);
      const record = cached ?? fresh;

      if (!record) return [];

      return [
        {
          ticker: t,
          description: (record.description as string) ?? '',
          price: (record.price as string) ?? '0',
          change: (record.change as string) ?? '0',
          change_percentage: (record.change_percentage as string) ?? '0',
          volume: (record.volume as number) ?? 0,
          average_volume: (record.average_volume as number) ?? 0,
          week_52_high: (record.week_52_high as number) ?? 0,
          week_52_low: (record.week_52_low as number) ?? 0,
          prev_close: (record.prev_close as number) ?? 0,
          open: (record.open as number | null) ?? null,
          high: (record.high as number | null) ?? null,
          low: (record.low as number | null) ?? null,
          earnings_date: earningsDateMap.get(t) ?? null,
        },
      ];
    });

    c.header(
      'Cache-Control',
      `public, max-age=${Math.floor(quoteCacheTtlMs / 1000)}`,
    );
    return c.json(response, 200);
  } catch (error) {
    console.error('Failed to fetch market quotes:', error);
    return c.json([], 200);
  }
});
