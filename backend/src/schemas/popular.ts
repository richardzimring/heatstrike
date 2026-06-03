import { z } from '@hono/zod-openapi';

export const PopularTickersResponseSchema = z
  .array(z.string())
  .openapi('PopularTickersResponse');

export type PopularTickersResponse = z.infer<typeof PopularTickersResponseSchema>;
