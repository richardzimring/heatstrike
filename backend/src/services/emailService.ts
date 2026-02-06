import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AWS_REGION, BUG_REPORT_SENDER, BUG_REPORT_RECIPIENT } from '../constants';
import type { BugReportRequest } from '../schemas/bugReport';

const sesClient = new SESClient({ region: AWS_REGION });

/**
 * Send a bug report email via AWS SES
 */
export async function sendBugReportEmail(report: BugReportRequest): Promise<void> {
  const timestamp = new Date().toISOString();

  const bodyLines = [
    `Bug Report - ${timestamp}`,
    '━'.repeat(40),
    '',
    'Description:',
    report.description,
    '',
  ];

  if (report.email) {
    bodyLines.push(`Contact Email: ${report.email}`, '');
  }

  if (report.userAgent) {
    bodyLines.push(`User Agent: ${report.userAgent}`, '');
  }

  const command = new SendEmailCommand({
    Source: BUG_REPORT_SENDER,
    Destination: {
      ToAddresses: [BUG_REPORT_RECIPIENT],
    },
    Message: {
      Subject: {
        Data: `[Heatstrike Bug Report] ${report.description.slice(0, 80)}`,
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
