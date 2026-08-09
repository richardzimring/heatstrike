/**
 * Environment variable helper with runtime validation
 */
const getEnvironmentVariable = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable "${key}" is not defined.`);
  }
  return value;
};

// AWS Configuration
export const AWS_REGION = process.env.AWS_REGION ?? 'us-east-2';

// DynamoDB
export const OPTIONS_TABLE_NAME = getEnvironmentVariable('OPTIONS_TABLE_NAME');

// S3
export const TICKERS_BUCKET_NAME = getEnvironmentVariable('TICKERS_BUCKET_NAME');

// Tradier API
export const TRADIER_KEY = getEnvironmentVariable('TRADIER_KEY');
export const TRADIER_BASE_URL = 'https://sandbox.tradier.com/v1/markets';

// Cache Configuration
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds
export const PROCESSING_LOCK_TTL_MS = 90 * 1000; // 90 seconds lock for in-flight fetches

// Options Configuration
export const MAX_EXPIRATIONS = 20;
export const TRADIER_CONCURRENCY = 5;

// Index ETFs shown on the home page. Also warmed as options chains (with
// popular tickers) so explorer opens stay snappy for common index symbols.
export const INDEX_TICKERS = ['SPY', 'QQQ', 'IWM', 'DIA'] as const;

// Popular tickers (YoloStocks / home launcher). Keep in sync with the
// frontend fallback list in use-popular-tickers.ts.
export const POPULAR_TICKERS_FALLBACK = [
  'AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'META', 'GOOG', 'AMD',
];
export const POPULAR_TICKERS_COUNT = 8;
export const POPULAR_TICKERS_S3_KEY = 'popular.json';

// Crypto tickers that collide with real stocks but refer to crypto on Reddit
export const CRYPTO_TICKER_EXCLUSIONS = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'DOGE', 'AVAX', 'LINK', 'MATIC',
]);

// Feedback Configuration
export const FEEDBACK_RECIPIENT = getEnvironmentVariable('BUG_REPORT_EMAIL');
export const FEEDBACK_SENDER = FEEDBACK_RECIPIENT;
