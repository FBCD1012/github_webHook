import type { Request, Response } from 'express';
import type { GitHubPushPayload, GitHubBranchPayload } from '../types/index.js';
import { getRepoConfig, isRepoMonitored } from '../config/index.js';
import { handlePushEvent } from '../monitor/commit.js';
import { handleBranchEvent } from '../monitor/branch.js';

/**
 * Main webhook handler - routes events to appropriate handlers
 */
export async function webhookHandler(req: Request, res: Response): Promise<void> {
  const event = req.headers['x-github-event'] as string;
  const deliveryId = req.headers['x-github-delivery'] as string;

  console.log(`[${deliveryId}] Received event: ${event}`);

  if (!event) {
    res.status(400).json({ error: 'Missing event header' });
    return;
  }

  try {
    switch (event) {
      case 'push':
        await handlePush(req.body as GitHubPushPayload);
        break;

      case 'create':
      case 'delete':
        await handleBranch(req.body as GitHubBranchPayload, event);
        break;

      case 'ping':
        console.log('Received ping event');
        break;

      default:
        console.log(`Ignoring event: ${event}`);
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePush(payload: GitHubPushPayload): Promise<void> {
  const repoName = payload.repository.full_name;
  console.log(`[Push] Repository: ${repoName}`);

  if (!isRepoMonitored(repoName)) {
    console.log(`Repository ${repoName} is not monitored, skipping`);
    return;
  }

  const config = getRepoConfig(repoName);
  if (!config?.events?.push) {
    console.log(`Push events disabled for ${repoName}`);
    return;
  }

  await handlePushEvent(payload, config);
}

async function handleBranch(
  payload: GitHubBranchPayload,
  eventType: 'create' | 'delete'
): Promise<void> {
  // Only handle branch events, not tags
  if (payload.ref_type !== 'branch') {
    console.log(`Ignoring ${payload.ref_type} event`);
    return;
  }

  const repoName = payload.repository.full_name;
  console.log(`[${eventType}] Repository: ${repoName}, Branch: ${payload.ref}`);

  if (!isRepoMonitored(repoName)) {
    console.log(`Repository ${repoName} is not monitored, skipping`);
    return;
  }

  const config = getRepoConfig(repoName);
  if (!config?.events?.branch) {
    console.log(`Branch events disabled for ${repoName}`);
    return;
  }

  await handleBranchEvent(payload, eventType, config);
}
