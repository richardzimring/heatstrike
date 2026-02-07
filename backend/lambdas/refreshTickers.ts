import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TICKERS_BUCKET_NAME } from '../src/constants';

const s3 = new S3Client({});

const OCC_URL =
  'https://marketdata.theocc.com/delo-download?prodType=EU&downloadFields=US;SN;EXCH&format=txt';

// Major exchanges — keep tickers that have at least one of these
const MAJOR_EXCHANGES = new Set([
  'A', // AMEX
  'B', // BOX
  'C', // CBOE
  'P', // NYSE Arca
  'Q', // NASDAQ
  'W', // C2
  'X', // PHLX
  'Z', // BATS
]);

interface Ticker {
  t: string; // ticker symbol
  n: string; // company name
}

/**
 * Parse the OCC tab-delimited text into ticker objects.
 * Each line has: TICKER\tCOMPANY NAME\tEXCHANGES
 * The first two lines are headers which we skip.
 */
function parseOccData(raw: string): Ticker[] {
  const lines = raw.split('\n');
  const seen = new Map<string, Ticker>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split by tab — OCC format uses tab-delimited columns
    const parts = trimmed.split('\t');
    if (parts.length < 2) continue;

    const rawTicker = parts[0];
    const rawName = parts[1];
    if (!rawTicker || !rawName) continue;

    const ticker = rawTicker.trim();
    const name = rawName.trim();
    const exchanges = parts[2]?.trim() ?? '';

    // Skip header lines (they typically contain "Symbol" or don't look like tickers)
    if (!ticker || ticker === 'Symbol' || ticker === 'US') continue;

    // Filter: keep only tickers listed on at least one major exchange
    if (exchanges) {
      const hasMainExchange = [...exchanges].some((ch) => MAJOR_EXCHANGES.has(ch));
      if (!hasMainExchange) continue;
    }

    // Deduplicate — keep the first occurrence
    if (!seen.has(ticker)) {
      seen.set(ticker, { t: ticker, n: name });
    }
  }

  // Sort alphabetically by ticker
  return [...seen.values()].sort((a, b) => a.t.localeCompare(b.t));
}

export const handler = async (): Promise<void> => {
  console.log('Fetching ticker list from OCC...');

  const response = await fetch(OCC_URL);
  if (!response.ok) {
    throw new Error(`OCC API returned ${response.status}: ${response.statusText}`);
  }

  const raw = await response.text();
  console.log(`Received ${raw.length} bytes from OCC`);

  const tickers = parseOccData(raw);
  console.log(`Parsed ${tickers.length} unique tickers`);

  const json = JSON.stringify(tickers);
  console.log(`JSON size: ${json.length} bytes`);

  await s3.send(
    new PutObjectCommand({
      Bucket: TICKERS_BUCKET_NAME,
      Key: 'tickers.json',
      Body: json,
      ContentType: 'application/json',
    }),
  );

  console.log('Uploaded tickers.json to S3 successfully');
};
