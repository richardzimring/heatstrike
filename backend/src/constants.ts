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

// Options Configuration
export const MAX_EXPIRATION_DATES = 8;
export const STRIKE_RANGE = 5; // Number of strikes above/below current price

// Feedback Configuration
export const FEEDBACK_RECIPIENT = getEnvironmentVariable('BUG_REPORT_EMAIL');
export const FEEDBACK_SENDER = FEEDBACK_RECIPIENT;
