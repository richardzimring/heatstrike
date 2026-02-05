import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  OPTIONS_TABLE_NAME,
  AWS_REGION,
  CACHE_TTL_MS,
  TIMEZONE_OFFSET_MS,
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
const client = new DynamoDBClient({ region: AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

/**
 * Check if cached data is still valid (within cache TTL)
 */
function isCacheValid(updatedAt: string): boolean {
  const cacheTime = new Date(updatedAt).getTime() - TIMEZONE_OFFSET_MS;
  const now = Date.now();
  return cacheTime > now - CACHE_TTL_MS;
}

/**
 * Get options data from cache
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

  if (Item && Item.updated_at && isCacheValid(Item.updated_at as string)) {
    console.log('Using cached data from DynamoDB');
    return Item as OptionsDataResponse | ErrorResponse;
  }

  return null;
}

/**
 * Save data to cache
 */
async function saveToCache(
  data: OptionsDataResponse | ErrorResponse,
): Promise<void> {
  console.log('Saving to DynamoDB cache');
  await ddbDocClient.send(
    new PutCommand({
      TableName: OPTIONS_TABLE_NAME,
      Item: data,
    }),
  );
}

/**
 * Fetch fresh options data from Tradier API
 */
async function fetchFreshData(ticker: string): Promise<OptionsDataResponse> {
  console.log('Fetching fresh data from Tradier API');

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
    updated_at: new Date(Date.now() + TIMEZONE_OFFSET_MS).toISOString(),
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
    return cachedData;
  }

  try {
    // Fetch fresh data
    const response = await fetchFreshData(ticker);

    // Cache the response (don't await to avoid blocking response)
    void saveToCache(response);

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = createErrorResponse(ticker, errorMessage);

    // Cache the error response
    void saveToCache(errorResponse);

    return errorResponse;
  }
}
