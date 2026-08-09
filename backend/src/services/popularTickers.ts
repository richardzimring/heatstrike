import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import {
  TICKERS_BUCKET_NAME,
  POPULAR_TICKERS_S3_KEY,
  POPULAR_TICKERS_FALLBACK,
} from '../constants';

const s3 = new S3Client({});

/** Read ranked popular symbols from S3, or the static fallback. */
export async function readPopularSymbolsFromS3(): Promise<string[]> {
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
