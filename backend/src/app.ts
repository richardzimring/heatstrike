import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { optionsRouter, bugReportRouter, tickersRouter } from './routes/index';

// Create main Hono app with OpenAPI support
export const app = new OpenAPIHono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Mount routes
app.route('/', optionsRouter);
app.route('/', bugReportRouter);
app.route('/', tickersRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// OpenAPI documentation endpoint (for development)
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Options Heatmap API',
    description:
      'API for fetching stock options chain data for heatmap visualization',
  },
  servers: [
    {
      url: 'https://2i7z2aank8.execute-api.us-east-2.amazonaws.com',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
});
