/**
 * Tradier API response schemas
 */

import { z } from 'zod';

// Greeks data from options
export const TradierGreeksSchema = z.object({
  delta: z.number(),
  gamma: z.number(),
  theta: z.number(),
  vega: z.number(),
  rho: z.number(),
  phi: z.number(),
  bid_iv: z.number(),
  mid_iv: z.number(),
  ask_iv: z.number(),
  smv_vol: z.number(),
  updated_at: z.string(),
});

export type TradierGreeks = z.infer<typeof TradierGreeksSchema>;

// Raw option data from Tradier
export const TradierOptionDataSchema = z.object({
  symbol: z.string(),
  description: z.string(),
  exch: z.string(),
  type: z.string(),
  last: z.number().nullable(),
  change: z.number().nullable(),
  volume: z.number(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  bid: z.number().nullable(),
  ask: z.number().nullable(),
  underlying: z.string(),
  strike: z.number(),
  change_percentage: z.number().nullable(),
  average_volume: z.number(),
  last_volume: z.number(),
  trade_date: z.number(),
  prevclose: z.number().nullable(),
  week_52_high: z.number(),
  week_52_low: z.number(),
  bidsize: z.number(),
  bidexch: z.string().nullable(),
  bid_date: z.number(),
  asksize: z.number(),
  askexch: z.string().nullable(),
  ask_date: z.number(),
  open_interest: z.number(),
  contract_size: z.number(),
  expiration_date: z.string(),
  expiration_type: z.string(),
  option_type: z.string(),
  root_symbol: z.string(),
  greeks: TradierGreeksSchema.nullable(),
});

export type TradierOptionData = z.infer<typeof TradierOptionDataSchema>;

// Expiration dates response
export const TradierExpirationsResponseSchema = z.object({
  expirations: z
    .object({
      date: z.union([z.array(z.string()), z.string()]),
    })
    .nullable(),
});

export type TradierExpirationsResponse = z.infer<
  typeof TradierExpirationsResponseSchema
>;

// Quote data from Tradier
export const TradierQuoteSchema = z.object({
  symbol: z.string(),
  description: z.string(),
  exch: z.string(),
  type: z.string(),
  last: z.number().nullable(),
  change: z.number().nullable(),
  volume: z.number(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  bid: z.number(),
  ask: z.number(),
  change_percentage: z.number().nullable(),
  average_volume: z.number(),
  last_volume: z.number(),
  trade_date: z.number(),
  prevclose: z.number().nullable(),
  week_52_high: z.number(),
  week_52_low: z.number(),
  bidsize: z.number(),
  bidexch: z.string().nullable(),
  bid_date: z.number(),
  asksize: z.number(),
  askexch: z.string().nullable(),
  ask_date: z.number(),
  root_symbols: z.string(),
});

export type TradierQuote = z.infer<typeof TradierQuoteSchema>;

// Quotes response
export const TradierQuotesResponseSchema = z.object({
  quotes: z.object({
    quote: TradierQuoteSchema.optional(),
    unmatched_symbols: z
      .union([z.array(z.string()), z.object({ symbol: z.string() })])
      .optional(),
  }),
});

export type TradierQuotesResponse = z.infer<typeof TradierQuotesResponseSchema>;

// Options chain response
export const TradierOptionsChainResponseSchema = z.object({
  options: z.object({
    option: z.array(TradierOptionDataSchema),
  }),
});

export type TradierOptionsChainResponse = z.infer<
  typeof TradierOptionsChainResponseSchema
>;
