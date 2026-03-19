import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { OPTIONS_TABLE_NAME, DEFAULT_HOME_TICKERS } from '../src/constants';
import { fetchBatchQuotes } from '../src/requests/getQuote';
import { getQuoteCacheTtlMs } from '../src/utils/marketHours';

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient());

function quoteKey(ticker: string): string {
  return `quote:${ticker}`;
}

export const handler = async (): Promise<void> => {
  console.log(`Warming cache for ${DEFAULT_HOME_TICKERS.length} default tickers...`);

  const quotes = await fetchBatchQuotes(DEFAULT_HOME_TICKERS);
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
