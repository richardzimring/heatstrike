import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  TICKERS_BUCKET_NAME,
  POPULAR_TICKERS_COUNT,
  POPULAR_TICKERS_S3_KEY,
  CRYPTO_TICKER_EXCLUSIONS,
} from '../src/constants';

const s3 = new S3Client({});

const YOLOSTOCKS_CSV_URL = 'https://yolostocks.live/downloads/wallstreetbets.csv';

async function loadOptionableSymbols(): Promise<Set<string>> {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: TICKERS_BUCKET_NAME,
      Key: 'tickers.json',
    }),
  );

  const body = await result.Body?.transformToString();
  if (!body) throw new Error('Empty tickers.json');

  const tickers = JSON.parse(body) as { t: string }[];
  return new Set(tickers.map((entry) => entry.t));
}

function parseCsv(raw: string): string[] {
  const lines = raw.trim().split('\n');
  const tickers: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const ticker = lines[i]?.split(',')[0]?.trim();
    if (ticker) tickers.push(ticker);
  }
  return tickers;
}

export const handler = async (): Promise<void> => {
  console.log('Fetching trending tickers from YoloStocks...');

  const response = await fetch(YOLOSTOCKS_CSV_URL);
  if (!response.ok) {
    throw new Error(`YoloStocks returned ${response.status}`);
  }

  const raw = await response.text();
  const ranked = parseCsv(raw);
  console.log(`YoloStocks returned ${ranked.length} tickers`);

  const optionable = await loadOptionableSymbols();
  console.log(`Optionable universe: ${optionable.size} symbols`);

  const filtered = ranked.filter(
    (t) => optionable.has(t) && !CRYPTO_TICKER_EXCLUSIONS.has(t),
  );
  const top = filtered.slice(0, POPULAR_TICKERS_COUNT);

  if (top.length === 0) {
    console.warn(
      'No valid tickers after filtering — skipping write to preserve last good list',
    );
    return;
  }

  console.log(`Top ${top.length}: ${top.join(', ')}`);

  await s3.send(
    new PutObjectCommand({
      Bucket: TICKERS_BUCKET_NAME,
      Key: POPULAR_TICKERS_S3_KEY,
      Body: JSON.stringify(top),
      ContentType: 'application/json',
    }),
  );

  console.log('popular.json written to S3');
};
