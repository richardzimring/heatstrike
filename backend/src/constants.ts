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
export const QUOTE_CACHE_TTL_MS = 60 * 1000; // 60 seconds for lightweight quote cache
export const PROCESSING_LOCK_TTL_MS = 90 * 1000; // 90 seconds lock for in-flight fetches

// Options Configuration
export const MAX_EXPIRATIONS = 20;
export const TRADIER_CONCURRENCY = 5;

// Home Page Default Tickers (pre-warmed by scheduled Lambda)
export const DEFAULT_HOME_TICKERS = [
  'SPY', 'QQQ', 'IWM', 'DIA',
  'AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'META', 'GOOG', 'AMD',
];

// Feedback Configuration
export const FEEDBACK_RECIPIENT = getEnvironmentVariable('BUG_REPORT_EMAIL');
export const FEEDBACK_SENDER = FEEDBACK_RECIPIENT;
