import { createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/index.js';

/**
 * Verify GitHub webhook signature (HMAC SHA-256)
 */
export function verifyGitHubSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    res.status(401).json({ error: 'Missing signature header' });
    return;
  }

  if (!env.githubWebhookSecret) {
    console.warn('GITHUB_WEBHOOK_SECRET not configured, skipping verification');
    next();
    return;
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature =
    'sha256=' +
    createHmac('sha256', env.githubWebhookSecret).update(payload).digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    console.error('Invalid webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}
