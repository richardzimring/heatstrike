import { z } from '@hono/zod-openapi';

/**
 * Request schema
 */
export const BugReportRequestSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Description is required')
      .max(2000, 'Description must be 2000 characters or less')
      .openapi({
        example: 'The heatmap does not load for ticker XYZ',
        description: 'Description of the bug',
      }),
    email: z.string().email('Invalid email address').optional().openapi({
      example: 'user@example.com',
      description: 'Optional contact email for follow-up',
    }),
    userAgent: z.string().optional().openapi({
      example: 'Mozilla/5.0 ...',
      description: 'Browser user agent string',
    }),
  })
  .openapi('BugReportRequest');

/**
 * Response schemas
 */
export const BugReportSuccessResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'Bug report submitted successfully' }),
  })
  .openapi('BugReportSuccessResponse');

export const BugReportErrorResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'Failed to submit bug report' }),
  })
  .openapi('BugReportErrorResponse');

// Type exports
export type BugReportRequest = z.infer<typeof BugReportRequestSchema>;
export type BugReportSuccessResponse = z.infer<
  typeof BugReportSuccessResponseSchema
>;
export type BugReportErrorResponse = z.infer<typeof BugReportErrorResponseSchema>;
