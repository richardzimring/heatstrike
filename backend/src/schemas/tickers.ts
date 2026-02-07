import { z } from '@hono/zod-openapi';

/**
 * Schema for a single ticker entry
 */
export const TickerEntrySchema = z
  .object({
    t: z.string().openapi({ example: 'AAPL', description: 'Ticker symbol' }),
    n: z.string().openapi({ example: 'Apple Inc', description: 'Company name' }),
  })
  .openapi('TickerEntry');

/**
 * Schema for the full tickers list response
 */
export const TickersResponseSchema = z
  .array(TickerEntrySchema)
  .openapi('TickersResponse');

// Type exports
export type TickerEntry = z.infer<typeof TickerEntrySchema>;
export type TickersResponse = z.infer<typeof TickersResponseSchema>;
