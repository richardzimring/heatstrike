import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  BugReportRequestSchema,
  BugReportSuccessResponseSchema,
  BugReportErrorResponseSchema,
} from '../schemas/bugReport';
import { sendBugReportEmail } from '../services/emailService';

// Create router for bug report endpoints
export const bugReportRouter = new OpenAPIHono();

/**
 * POST /bug-report
 * Submit a bug report via email
 */
const postBugReportRoute = createRoute({
  method: 'post',
  path: '/bug-report',
  tags: ['Bug Report'],
  summary: 'Submit a bug report',
  description: 'Sends a bug report email with the provided description and optional contact info.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: BugReportRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: BugReportSuccessResponseSchema,
        },
      },
      description: 'Bug report submitted successfully',
    },
    500: {
      content: {
        'application/json': {
          schema: BugReportErrorResponseSchema,
        },
      },
      description: 'Failed to submit bug report',
    },
  },
});

bugReportRouter.openapi(postBugReportRoute, async (c) => {
  const body = c.req.valid('json');

  try {
    await sendBugReportEmail(body);
    return c.json({ message: 'Bug report submitted successfully' }, 200);
  } catch (error) {
    console.error('Failed to send bug report email:', error);
    return c.json({ message: 'Failed to submit bug report' }, 500);
  }
});
