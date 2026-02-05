import { handle } from 'hono/aws-lambda';
import { app } from '../src/app';

/**
 * AWS Lambda handler for the Options API
 * This is a thin wrapper around the Hono app
 */
export const handler = handle(app);
