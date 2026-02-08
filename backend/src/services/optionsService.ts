import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  OPTIONS_TABLE_NAME,
  CACHE_TTL_MS,
  MAX_EXPIRATION_DATES,
} from '../constants';
import {
  fetchExpirationDates,
  fetchQuote,
  fetchOptionData,
} from '../requests/index';
import { stringifyDates } from '../utils/index';
import type { OptionsDataResponse, ErrorResponse } from '../schemas/options';

// Initialize DynamoDB client
const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

/**
 * Get cache TTL based on market hours.
 * During market hours (9:30 AM - 4:00 PM ET, weekdays): 1 hour
 * Outside market hours: time until next market open
 */
function getCacheTTL(): number {
  // Market Hours (Eastern Time)
  const MARKET_OPEN_HOUR = 9;
  const MARKET_OPEN_MINUTE = 30;
  const MARKET_CLOSE_HOUR = 16;
  const MARKET_CLOSE_MINUTE = 0;

  const now = new Date();
  const eastern = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
  const day = eastern.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = eastern.getHours();
  const minutes = eastern.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const marketOpen = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE; // 9:30 = 570
  const marketClose = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE; // 16:00 = 960

  const isWeekday = day >= 1 && day <= 5;
  const isDuringMarketHours =
    currentMinutes >= marketOpen && currentMinutes < marketClose;

  if (isWeekday && isDuringMarketHours) {
    return CACHE_TTL_MS;
  }

  // Calculate time until next market open
  let daysUntilOpen = 0;
  if (day === 6) {
    // Saturday -> Monday
    daysUntilOpen = 2;
  } else if (day === 0) {
    // Sunday -> Monday
    daysUntilOpen = 1;
  } else if (currentMinutes >= marketClose) {
    // After close on weekday -> next day (or Monday if Friday)
    daysUntilOpen = day === 5 ? 3 : 1;
  }
  // Before open on weekday: daysUntilOpen stays 0

  const nextOpen = new Date(eastern);
  nextOpen.setDate(nextOpen.getDate() + daysUntilOpen);
  nextOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);

  return nextOpen.getTime() - eastern.getTime();
}

/**
 * Get options data from cache if not expired
 */
async function getCachedData(
  ticker: string,
): Promise<OptionsDataResponse | ErrorResponse | null> {
  const { Item } = await ddbDocClient.send(
    new GetCommand({
      TableName: OPTIONS_TABLE_NAME,
      Key: { ticker },
    }),
  );

  // Check if item exists and hasn't expired
  // (DynamoDB TTL deletion can be delayed, so we check manually too)
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Item && (!Item.ttl || (Item.ttl as number) > nowSeconds)) {
    console.log('Using cached data from DynamoDB');
    return Item as OptionsDataResponse | ErrorResponse;
  }

  return null;
}

/**
 * Save data to cache with TTL
 */
async function saveToCache(
  data: OptionsDataResponse | ErrorResponse,
): Promise<void> {
  const ttl = Math.floor((Date.now() + getCacheTTL()) / 1000);

  await ddbDocClient.send(
    new PutCommand({
      TableName: OPTIONS_TABLE_NAME,
      Item: { ...data, ttl },
    }),
  );
}

/**
 * Fetch fresh options data from Tradier API
 */
async function fetchFreshData(ticker: string): Promise<OptionsDataResponse> {
  // Fetch expiration dates and quote data concurrently
  const [allExpirationDates, stockData] = await Promise.all([
    fetchExpirationDates(ticker),
    fetchQuote(ticker),
  ]);

  // Limit to first N expiration dates
  const expirationDates = allExpirationDates.slice(0, MAX_EXPIRATION_DATES);
  const expirationDatesStringified = stringifyDates(expirationDates);

  // Fetch options chains for all expiration dates
  const optionData = await fetchOptionData(
    ticker,
    stockData.price,
    expirationDates,
    expirationDatesStringified,
  );

  return {
    ...stockData,
    expirationDates,
    expirationDatesStringified,
    ...optionData,
  };
}

/**
 * Create an error response with timestamp
 */
function createErrorResponse(ticker: string, message: string): ErrorResponse {
  return {
    ticker,
    updated_at: new Date().toISOString(),
    message,
  };
}

/**
 * Main service function to get options data for a ticker
 * - Returns cached data if valid
 * - Otherwise fetches fresh data and caches it
 * - Handles errors and caches error responses
 */
export async function getOptionsData(
  ticker: string,
): Promise<OptionsDataResponse | ErrorResponse> {
  // Check cache first
  const cachedData = await getCachedData(ticker);
  if (cachedData) {
    console.log('Using cached data from DynamoDB for ticker:', ticker);
    return cachedData;
  }

  try {
    // Fetch fresh data
    console.log('Fetching fresh data from Tradier API for ticker:', ticker);
    const response = await fetchFreshData(ticker);

    await saveToCache(response);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log the actual error for observability
    console.error(`Error fetching options data for ${ticker}:`, error);

    const errorResponse = createErrorResponse(ticker, errorMessage);

    await saveToCache(errorResponse);

    return errorResponse;
  }
}
