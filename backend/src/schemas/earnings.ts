import { z } from '@hono/zod-openapi';

export const EarningsResponseSchema = z
  .object({
    ticker: z.string(),
    date: z.string().nullable(),
    eps_estimated: z.number().nullable(),
    revenue_estimated: z.number().nullable(),
  })
  .openapi('EarningsResponse');

export type EarningsResponse = z.infer<typeof EarningsResponseSchema>;
