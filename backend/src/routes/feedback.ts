import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  FeedbackRequestSchema,
  FeedbackSuccessResponseSchema,
  FeedbackErrorResponseSchema,
} from '../schemas/feedback';
import { sendFeedbackEmail } from '../services/emailService';

// Create router for feedback endpoints
export const feedbackRouter = new OpenAPIHono();

/**
 * POST /feedback
 * Submit feedback (bug report or feature request) via email
 */
const postFeedbackRoute = createRoute({
  method: 'post',
  path: '/feedback',
  tags: ['Feedback'],
  summary: 'Submit feedback',
  description:
    'Sends a feedback email (bug report or feature request) with the provided description and optional contact info.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: FeedbackRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: FeedbackSuccessResponseSchema,
        },
      },
      description: 'Feedback submitted successfully',
    },
    500: {
      content: {
        'application/json': {
          schema: FeedbackErrorResponseSchema,
        },
      },
      description: 'Failed to submit feedback',
    },
  },
});

feedbackRouter.openapi(postFeedbackRoute, async (c) => {
  const body = c.req.valid('json');

  try {
    await sendFeedbackEmail(body);
    return c.json({ message: 'Feedback submitted successfully' }, 200);
  } catch (error) {
    console.error('Failed to send feedback email:', error);
    return c.json({ message: 'Failed to submit feedback' }, 500);
  }
});
