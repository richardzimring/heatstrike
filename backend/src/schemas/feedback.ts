import { z } from '@hono/zod-openapi';

/**
 * Request schema
 */
export const FeedbackRequestSchema = z
  .object({
    type: z.enum(['bug', 'feature_request']).openapi({
      example: 'bug',
      description: 'Type of feedback: bug report or feature request',
    }),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(2000, 'Description must be 2000 characters or less')
      .openapi({
        example: 'The heatmap does not load for ticker XYZ',
        description: 'Description of the feedback',
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
  .openapi('FeedbackRequest');

/**
 * Response schemas
 */
export const FeedbackSuccessResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'Feedback submitted successfully' }),
  })
  .openapi('FeedbackSuccessResponse');

export const FeedbackErrorResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'Failed to submit feedback' }),
  })
  .openapi('FeedbackErrorResponse');

// Type exports
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
export type FeedbackSuccessResponse = z.infer<
  typeof FeedbackSuccessResponseSchema
>;
export type FeedbackErrorResponse = z.infer<typeof FeedbackErrorResponseSchema>;
