import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AWS_REGION, FEEDBACK_SENDER, FEEDBACK_RECIPIENT } from '../constants';
import type { FeedbackRequest } from '../schemas/feedback';

const sesClient = new SESClient({ region: AWS_REGION });

/**
 * Send a feedback email via AWS SES
 */
export async function sendFeedbackEmail(feedback: FeedbackRequest): Promise<void> {
  const timestamp = new Date().toISOString();
  const typeLabel = feedback.type === 'bug' ? 'Bug Report' : 'Feature Request';

  const bodyLines = [
    `${typeLabel} - ${timestamp}`,
    '━'.repeat(40),
    '',
    'Description:',
    feedback.description,
    '',
  ];

  if (feedback.email) {
    bodyLines.push(`Contact Email: ${feedback.email}`, '');
  }

  if (feedback.userAgent) {
    bodyLines.push(`User Agent: ${feedback.userAgent}`, '');
  }

  const command = new SendEmailCommand({
    Source: FEEDBACK_SENDER,
    Destination: {
      ToAddresses: [FEEDBACK_RECIPIENT],
    },
    Message: {
      Subject: {
        Data: `[Heatstrike ${typeLabel}] ${feedback.description.slice(0, 80)}`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: bodyLines.join('\n'),
          Charset: 'UTF-8',
        },
      },
    },
  });

  await sesClient.send(command);
}
