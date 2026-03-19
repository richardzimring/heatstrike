import { gzipSync, gunzipSync } from 'node:zlib';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  OPTIONS_TABLE_NAME,
  TICKERS_BUCKET_NAME,
  CACHE_TTL_MS,
  PROCESSING_LOCK_TTL_MS,
  MAX_EXPIRATIONS,
} from '../constants';
import {
  fetchExpirationDates,
  fetchQuote,
  fetchOptionData,
} from '../requests/index';
import { fetchEarnings } from '../requests/getEarnings';
import { stringifyDates, getOptionsCacheTtlMs } from '../utils/index';
import type {
  OptionsDataResponse,
  ErrorResponse,
  ProcessingResponse,
} from '../schemas/options';

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const s3Client = new S3Client();

interface CacheMetadata {
  ticker: string;
  status: 'ready' | 'processing';
  s3Key: string;
  ttl: number;
}

function getCacheTTL(): number {
  return getOptionsCacheTtlMs(CACHE_TTL_MS);
}

function s3Key(ticker: string): string {
  return `options-cache/${ticker}.json.gz`;
}

async function getMetadata(ticker: string): Promise<CacheMetadata | null> {
  const { Item } = await ddbDocClient.send(
    new GetCommand({
      TableName: OPTIONS_TABLE_NAME,
      Key: { ticker },
    }),
  );

  if (!Item) return null;
  return Item as CacheMetadata;
}

async function readFromS3(key: string): Promise<OptionsDataResponse> {
  const { Body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: TICKERS_BUCKET_NAME,
      Key: key,
    }),
  );

  if (!Body) throw new Error('Empty S3 response body');
  const bytes = await Body.transformToByteArray();
  const json = gunzipSync(Buffer.from(bytes)).toString('utf-8');
  return JSON.parse(json) as OptionsDataResponse;
}

async function writeToS3(
  key: string,
  data: OptionsDataResponse,
): Promise<void> {
  const compressed = gzipSync(JSON.stringify(data));
  await s3Client.send(
    new PutObjectCommand({
      Bucket: TICKERS_BUCKET_NAME,
      Key: key,
      Body: compressed,
      ContentType: 'application/json',
      ContentEncoding: 'gzip',
    }),
  );
}

async function acquireProcessingLock(ticker: string): Promise<boolean> {
  const lockTtl = Math.floor((Date.now() + PROCESSING_LOCK_TTL_MS) / 1000);
  try {
    await ddbDocClient.send(
      new PutCommand({
        TableName: OPTIONS_TABLE_NAME,
        Item: {
          ticker,
          status: 'processing',
          s3Key: s3Key(ticker),
          ttl: lockTtl,
        },
        ConditionExpression:
          'attribute_not_exists(ticker) OR #s <> :processing OR #ttl < :now',
        ExpressionAttributeNames: { '#s': 'status', '#ttl': 'ttl' },
        ExpressionAttributeValues: {
          ':processing': 'processing',
          ':now': Math.floor(Date.now() / 1000),
        },
      }),
    );
    return true;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      err.name === 'ConditionalCheckFailedException'
    ) {
      return false;
    }
    throw err;
  }
}

async function saveMetadata(
  ticker: string,
  data: OptionsDataResponse,
): Promise<void> {
  const ttl = Math.floor((Date.now() + getCacheTTL()) / 1000);
  await ddbDocClient.send(
    new PutCommand({
      TableName: OPTIONS_TABLE_NAME,
      Item: {
        ticker,
        status: 'ready',
        s3Key: s3Key(ticker),
        price: data.price,
        description: data.description,
        change: data.change,
        change_percentage: data.change_percentage,
        ttl,
      },
    }),
  );
}

async function fetchFreshData(
  ticker: string,
): Promise<OptionsDataResponse> {
  const [allExpirationDates, stockData, earningsResult] = await Promise.all([
    fetchExpirationDates(ticker),
    fetchQuote(ticker),
    fetchEarnings(ticker).catch(() => ({
      ticker,
      date: null,
      eps_estimated: null,
      revenue_estimated: null,
    })),
  ]);

  const expirationDates = allExpirationDates.slice(0, MAX_EXPIRATIONS);
  const expirationDatesStringified = stringifyDates(expirationDates);

  const optionData = await fetchOptionData(
    ticker,
    expirationDates,
    expirationDatesStringified,
  );

  return {
    ...stockData,
    expirationDates,
    expirationDatesStringified,
    ...optionData,
    earnings_date: earningsResult.date,
  };
}

export type GetOptionsResult =
  | OptionsDataResponse
  | ErrorResponse
  | ProcessingResponse;

export async function getOptionsData(
  ticker: string,
): Promise<GetOptionsResult> {
  const metadata = await getMetadata(ticker);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (metadata && metadata.ttl > nowSeconds) {
    if (metadata.status === 'ready') {
      console.log('Cache hit for:', ticker);
      try {
        return await readFromS3(metadata.s3Key);
      } catch (err) {
        console.error('Failed to read from S3, will re-fetch:', err);
      }
    }

    if (metadata.status === 'processing') {
      console.log('Already processing:', ticker);
      return { status: 'processing', ticker };
    }
  }

  const lockAcquired = await acquireProcessingLock(ticker);
  if (!lockAcquired) {
    console.log('Lock contention for:', ticker);
    return { status: 'processing', ticker };
  }

  try {
    console.log('Fetching fresh data for:', ticker);
    const data = await fetchFreshData(ticker);
    await writeToS3(s3Key(ticker), data);
    await saveMetadata(ticker, data);
    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching options data for ${ticker}:`, error);
    const errorResponse: ErrorResponse = {
      ticker,
      updated_at: new Date().toISOString(),
      message: errorMessage,
    };
    // Clear the processing lock so retries can re-attempt
    await ddbDocClient.send(
      new PutCommand({
        TableName: OPTIONS_TABLE_NAME,
        Item: { ticker, status: 'error', s3Key: '', ttl: nowSeconds },
      }),
    );
    return errorResponse;
  }
}
