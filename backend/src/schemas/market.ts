import { z } from '@hono/zod-openapi';

export const QuoteSummarySchema = z
  .object({
    ticker: z.string().openapi({ example: 'AAPL' }),
    description: z.string().openapi({ example: 'Apple Inc' }),
    price: z.string().openapi({ example: '213.25' }),
    change: z.string().openapi({ example: '+1.23' }),
    change_percentage: z.string().openapi({ example: '+0.58' }),
    volume: z.number().openapi({ example: 47994892 }),
    average_volume: z.number().openapi({ example: 50967638 }),
    week_52_high: z.number().openapi({ example: 277.32 }),
    week_52_low: z.number().openapi({ example: 169.21 }),
    prev_close: z.number().openapi({ example: 212.02 }),
    open: z.number().nullable().openapi({ example: 213.0 }),
    high: z.number().nullable().openapi({ example: 215.3 }),
    low: z.number().nullable().openapi({ example: 211.8 }),
    earnings_date: z.string().nullable().openapi({ example: '2026-04-24' }),
  })
  .openapi('QuoteSummary');

export const QuotesResponseSchema = z
  .array(QuoteSummarySchema)
  .openapi('QuotesResponse');

export type QuoteSummary = z.infer<typeof QuoteSummarySchema>;
export type QuotesResponse = z.infer<typeof QuotesResponseSchema>;
