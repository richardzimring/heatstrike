import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { OPTIONS_TABLE_NAME } from '../constants';
import { fetchQuotes, type QuoteSummary } from '../requests/getQuote';
import type { QuoteTickerSummary } from '../schemas/popular';

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient());

/** Home quote cache TTL — short so prices stay reasonably fresh. */
const QUOTE_SUMMARY_TTL_SECONDS = 60;

function summaryKey(ticker: string): string {
  return `quote-summary:${ticker}`;
}

function summaryFromQuote(quote: QuoteSummary): QuoteTickerSummary {
  return {
    ticker: quote.ticker.toUpperCase(),
    description: quote.description || quote.ticker,
    price: quote.price,
    change_percentage: quote.change_percentage,
  };
}

async function saveQuoteSummary(
  summary: QuoteTickerSummary,
  ttlSeconds: number,
): Promise<void> {
  await ddbDocClient.send(
    new PutCommand({
      TableName: OPTIONS_TABLE_NAME,
      Item: {
        ...summary,
        ticker: summaryKey(summary.ticker),
        ttl: ttlSeconds,
      },
    }),
  );
}

async function getQuoteSummaries(
  tickers: string[],
): Promise<Map<string, QuoteTickerSummary>> {
  const result = new Map<string, QuoteTickerSummary>();
  if (tickers.length === 0) return result;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))];
  const keys = unique.map((ticker) => ({ ticker: summaryKey(ticker) }));

  for (let i = 0; i < keys.length; i += 100) {
    const batch = keys.slice(i, i + 100);
    const response = await ddbDocClient.send(
      new BatchGetCommand({
        RequestItems: {
          [OPTIONS_TABLE_NAME]: {
            Keys: batch,
          },
        },
      }),
    );

    const items = response.Responses?.[OPTIONS_TABLE_NAME] ?? [];
    for (const item of items) {
      const ttl = typeof item.ttl === 'number' ? item.ttl : 0;
      if (ttl <= nowSeconds) continue;

      const ticker =
        typeof item.ticker === 'string'
          ? item.ticker.replace(/^quote-summary:/, '')
          : null;
      if (!ticker) continue;

      const price = typeof item.price === 'string' ? item.price : '';
      if (!price) continue;

      result.set(ticker, {
        ticker,
        description: String(item.description ?? ticker),
        price,
        change_percentage: String(item.change_percentage ?? ''),
      });
    }
  }

  return result;
}

/** Prefer Dynamo quote cache; hydrate misses with a single Tradier quotes batch. */
export async function resolveQuoteSummaries(
  tickers: string[],
): Promise<Map<string, QuoteTickerSummary>> {
  const summaries = await getQuoteSummaries(tickers);
  const missing = tickers
    .map((t) => t.toUpperCase())
    .filter((t) => !summaries.has(t));

  if (missing.length === 0) return summaries;

  try {
    const quotes = await fetchQuotes(missing);
    const ttl = Math.floor(Date.now() / 1000) + QUOTE_SUMMARY_TTL_SECONDS;

    await Promise.all(
      quotes.map(async (quote) => {
        const summary = summaryFromQuote(quote);
        summaries.set(summary.ticker, summary);
        await saveQuoteSummary(summary, ttl).catch(() => undefined);
      }),
    );
  } catch (err) {
    console.error('Failed to hydrate quote summaries from Tradier:', err);
  }

  return summaries;
}

export function placeholderQuoteSummary(ticker: string): QuoteTickerSummary {
  return {
    ticker,
    description: ticker,
    price: '',
    change_percentage: '',
  };
}
