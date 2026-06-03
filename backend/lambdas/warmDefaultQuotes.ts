import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import {
  OPTIONS_TABLE_NAME,
  INDEX_TICKERS,
  POPULAR_TICKERS_FALLBACK,
  TICKERS_BUCKET_NAME,
  POPULAR_TICKERS_S3_KEY,
} from '../src/constants';
import { fetchBatchQuotes } from '../src/requests/getQuote';
import { getQuoteCacheTtlMs } from '../src/utils/marketHours';

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const s3 = new S3Client({});

function quoteKey(ticker: string): string {
  return `quote:${ticker}`;
}

async function loadPopularTickers(): Promise<string[]> {
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: TICKERS_BUCKET_NAME,
        Key: POPULAR_TICKERS_S3_KEY,
      }),
    );
    const body = await result.Body?.transformToString();
    if (body) {
      const parsed = JSON.parse(body) as string[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // popular.json doesn't exist yet
  }
  return [...POPULAR_TICKERS_FALLBACK];
}

export const handler = async (): Promise<void> => {
  const popularTickers = await loadPopularTickers();
  const tickers = [...new Set([...INDEX_TICKERS, ...popularTickers])];
  console.log(`Warming cache for ${tickers.length} tickers (${INDEX_TICKERS.length} index + ${popularTickers.length} popular)...`);

  const quotes = await fetchBatchQuotes(tickers);
  const ttl = Math.floor((Date.now() + getQuoteCacheTtlMs()) / 1000);

  console.log(`Fetched ${quotes.size} quotes, TTL=${ttl}`);

  const writeRequests = [...quotes.entries()].map(([symbol, quote]) => ({
    PutRequest: {
      Item: {
        ...quote,
        ticker: quoteKey(symbol),
        ttl,
      },
    },
  }));

  for (let i = 0; i < writeRequests.length; i += 25) {
    const batch = writeRequests.slice(i, i + 25);
    await ddbDocClient.send(
      new BatchWriteCommand({
        RequestItems: { [OPTIONS_TABLE_NAME]: batch },
      }),
    );
  }

  console.log('Default quote cache warmed successfully');
};
