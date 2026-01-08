import express from 'express';
import { env } from './config/index.js';
import { verifyGitHubSignature } from './webhook/verify.js';
import { webhookHandler } from './webhook/handler.js';

export function createServer() {
  const app = express();

  // Parse JSON body
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Webhook endpoint with signature verification
  app.post('/webhook', verifyGitHubSignature, webhookHandler);

  return app;
}

export function startServer() {
  const app = createServer();

  app.listen(env.port, () => {
    console.log(`Git Webhook Monitor started on port ${env.port}`);
    console.log(`Webhook URL: http://localhost:${env.port}/webhook`);
  });
}
