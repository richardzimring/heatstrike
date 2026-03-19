import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  TickerParamSchema,
  OptionsDataResponseSchema,
  ProcessingResponseSchema,
  ErrorResponseSchema,
} from '../schemas/options';
import type { OptionsDataResponse } from '../schemas/options';
import { getOptionsData } from '../services/index';

export const optionsRouter = new OpenAPIHono();

const getOptionsRoute = createRoute({
  method: 'get',
  path: '/data/{ticker}',
  tags: ['Options'],
  summary: 'Get options chain data',
  description:
    'Fetches the full options chain for a ticker (all expirations and strikes). Returns 202 while data is being fetched for the first time.',
  request: {
    params: TickerParamSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OptionsDataResponseSchema,
        },
      },
      description: 'Options data retrieved successfully',
    },
    202: {
      content: {
        'application/json': {
          schema: ProcessingResponseSchema,
        },
      },
      description: 'Data is being fetched — poll again shortly',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid ticker or API error',
    },
  },
});

optionsRouter.openapi(getOptionsRoute, async (c) => {
  const { ticker } = c.req.valid('param');

  const result = await getOptionsData(ticker);

  if ('status' in result && result.status === 'processing') {
    return c.json({ status: result.status, ticker: result.ticker }, 202);
  }

  if ('message' in result) {
    console.error(`Options error for ${ticker}:`, result.message);
    return c.json(
      {
        ticker: result.ticker,
        updated_at: result.updated_at,
        message: 'An unexpected error occurred. Please try again.',
      },
      400,
    );
  }

  return c.json(result as OptionsDataResponse, 200);
});
