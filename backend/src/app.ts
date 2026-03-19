import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import { logger } from 'hono/logger';
import {
  optionsRouter,
  feedbackRouter,
  tickersRouter,
  marketRouter,
} from './routes/index';

export const app = new OpenAPIHono();

app.use('*', cors());
app.use('*', compress());
app.use('*', logger());

app.route('/', optionsRouter);
app.route('/', feedbackRouter);
app.route('/', tickersRouter);
app.route('/', marketRouter);

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

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
      url: 'https://api.heatstrike.rzimring.com',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
});
