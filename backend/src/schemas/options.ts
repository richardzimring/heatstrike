import { z } from '@hono/zod-openapi';

/**
 * Request schemas
 */
export const TickerParamSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(5)
    .transform((val) => val.toUpperCase())
    .openapi({
      param: {
        name: 'ticker',
        in: 'path',
      },
      example: 'AAPL',
      description: 'Stock ticker symbol',
    }),
});

/**
 * Response schemas
 */
export const OptionSchema = z.object({
  symbol: z.string().openapi({ example: 'AAPL' }),
  direction: z.string().openapi({ example: 'call' }),
  date: z.string().openapi({ example: '2024-01-19' }),
  date_str: z.string().openapi({ example: 'Jan 19' }),
  strike: z.string().openapi({ example: '185' }),
  volume: z.string().openapi({ example: '1234' }),
  open_interest: z.string().openapi({ example: '5678' }),
  bid: z.string().nullable().openapi({ example: '3.40' }),
  ask: z.string().nullable().openapi({ example: '3.50' }),
  price: z.string().nullable().openapi({ example: '3.45' }),
  spread: z.string().nullable().openapi({ example: '0.05' }),
  delta: z.string().nullable().openapi({ example: '0.523456' }),
  gamma: z.string().nullable().openapi({ example: '0.045678' }),
  theta: z.string().nullable().openapi({ example: '-0.012345' }),
  vega: z.string().nullable().openapi({ example: '0.234567' }),
  rho: z.string().nullable().openapi({ example: '0.056789' }),
  phi: z.string().nullable().openapi({ example: '-0.034567' }),
  mid_iv: z.string().nullable().openapi({ example: '0.325000' }),
});

export const OptionChainSchema = z.object({
  calls: z.array(OptionSchema.nullable()),
  puts: z.array(OptionSchema.nullable()),
});

export const OptionsDataResponseSchema = z
  .object({
    ticker: z.string().openapi({ example: 'AAPL' }),
    description: z.string().openapi({ example: 'Apple Inc' }),
    price: z.string().openapi({ example: '185.50' }),
    change: z.string().openapi({ example: '+2.50' }),
    change_percentage: z.string().openapi({ example: '+1.25' }),
    expirationDates: z.array(z.string()).openapi({
      example: ['2024-01-19', '2024-01-26', '2024-02-02'],
    }),
    expirationDatesStringified: z.array(z.string()).openapi({
      example: ['Jan 19', 'Jan 26', 'Feb 2'],
    }),
    strikes: z.array(z.string()).openapi({
      example: ['$180', '$181', '$182', '$183', '$184', '$185'],
    }),
    updated_at: z.string().openapi({ example: '2024-01-15T14:30:00.000Z' }),
    options: z.array(OptionChainSchema),
  })
  .openapi('OptionsDataResponse');

export const ErrorResponseSchema = z
  .object({
    ticker: z.string().openapi({ example: 'INVALID' }),
    updated_at: z.string().openapi({ example: '2024-01-15T14:30:00.000Z' }),
    message: z.string().openapi({ example: 'Invalid ticker' }),
  })
  .openapi('ErrorResponse');

// Type exports for use in services
export type Option = z.infer<typeof OptionSchema>;
export type OptionChain = z.infer<typeof OptionChainSchema>;
export type OptionsDataResponse = z.infer<typeof OptionsDataResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
