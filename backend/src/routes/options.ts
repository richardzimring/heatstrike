import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  TickerParamSchema,
  OptionsDataResponseSchema,
  ErrorResponseSchema,
} from '../schemas/options';
import { getOptionsData } from '../services/index';

// Create router for options endpoints
export const optionsRouter = new OpenAPIHono();

/**
 * GET /data/{ticker}
 * Fetch options chain data for a stock ticker
 */
const getOptionsRoute = createRoute({
  method: 'get',
  path: '/data/{ticker}',
  tags: ['Options'],
  summary: 'Get options chain data',
  description:
    'Fetches options chain data for a given stock ticker, including expiration dates, strikes, and Greeks. Data is cached for 1 hour.',
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

  // Check if response is an error
  if ('message' in result) {
    return c.json(result, 400);
  }

  return c.json(result, 200);
});
