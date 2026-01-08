import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/index.js';
import type { NotificationMessage } from '../types/index.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.host || !env.smtp.user) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }

  return transporter;
}

/**
 * Build HTML email content
 */
function buildEmailHtml(message: NotificationMessage): string {
  const eventEmoji = {
    push: '📦',
    branch_create: '🌱',
    branch_delete: '🗑️',
  }[message.eventType];

  let filesHtml = '';
  if (message.files) {
    const { added, modified, removed } = message.files;
    const fileItems: string[] = [];

    added.forEach((f) => fileItems.push(`<li style="color: #22863a;">+ ${f}</li>`));
    modified.forEach((f) => fileItems.push(`<li style="color: #b08800;">~ ${f}</li>`));
    removed.forEach((f) => fileItems.push(`<li style="color: #cb2431;">- ${f}</li>`));

    if (fileItems.length > 0) {
      filesHtml = `
        <h3>Changed Files:</h3>
        <ul style="font-family: monospace; font-size: 12px;">
          ${fileItems.join('\n')}
        </ul>
      `;
    }
  }

  let patternsHtml = '';
  if (message.matchedPatterns && message.matchedPatterns.length > 0) {
    patternsHtml = `
      <p style="color: #666; font-size: 12px;">
        Matched patterns: ${message.matchedPatterns.map((p) => `<code>${p}</code>`).join(', ')}
      </p>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #24292e; color: white; padding: 15px; border-radius: 6px 6px 0 0; }
        .content { background: #f6f8fa; padding: 20px; border-radius: 0 0 6px 6px; }
        code { background: #e1e4e8; padding: 2px 6px; border-radius: 3px; }
        a { color: #0366d6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${eventEmoji} ${message.title}</h2>
        </div>
        <div class="content">
          <p><strong>Repository:</strong> <a href="${message.repoUrl}">${message.repo}</a></p>
          <p><strong>Branch:</strong> ${message.branch}</p>
          <p><strong>Author:</strong> ${message.author}</p>
          <p><strong>Details:</strong></p>
          <pre style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${message.details}</pre>
          ${filesHtml}
          ${patternsHtml}
          ${message.url ? `<p><a href="${message.url}">View on GitHub →</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send email notification
 */
export async function sendEmail(
  message: NotificationMessage,
  recipients: string[]
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.warn('Email not configured, skipping email notification');
    return false;
  }

  try {
    await transport.sendMail({
      from: env.emailFrom,
      to: recipients.join(', '),
      subject: `[${message.repo}] ${message.title}`,
      html: buildEmailHtml(message),
    });

    console.log(`Email sent to: ${recipients.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
