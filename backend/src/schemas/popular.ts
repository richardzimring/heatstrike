import { z } from '@hono/zod-openapi';

/** Quote fields used by the home ticker launcher. */
export const OptionsTickerSummarySchema = z
  .object({
    ticker: z.string().openapi({ example: 'NVDA' }),
    description: z.string().openapi({ example: 'NVIDIA Corp' }),
    price: z.string().openapi({ example: '223.78' }),
    change_percentage: z.string().openapi({ example: '+2.27' }),
  })
  .openapi('OptionsTickerSummary');

export type OptionsTickerSummary = z.infer<typeof OptionsTickerSummarySchema>;

export const OptionsSummariesResponseSchema = z
  .array(OptionsTickerSummarySchema)
  .openapi('OptionsSummariesResponse');

export type OptionsSummariesResponse = z.infer<
  typeof OptionsSummariesResponseSchema
>;

/** Symbol list stored in S3 popular.json (ranking only). */
export type PopularTickerList = string[];
