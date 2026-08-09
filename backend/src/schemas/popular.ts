import { z } from '@hono/zod-openapi';

/** Quote fields used by the home ticker launcher. */
export const QuoteTickerSummarySchema = z
  .object({
    ticker: z.string().openapi({ example: 'NVDA' }),
    description: z.string().openapi({ example: 'NVIDIA Corp' }),
    price: z.string().openapi({ example: '223.78' }),
    change_percentage: z.string().openapi({ example: '+2.27' }),
  })
  .openapi('QuoteTickerSummary');

export type QuoteTickerSummary = z.infer<typeof QuoteTickerSummarySchema>;

export const QuoteSummariesResponseSchema = z
  .array(QuoteTickerSummarySchema)
  .openapi('QuoteSummariesResponse');

export type QuoteSummariesResponse = z.infer<
  typeof QuoteSummariesResponseSchema
>;

/** Symbol list stored in S3 popular.json (ranking only). */
export type PopularTickerList = string[];
