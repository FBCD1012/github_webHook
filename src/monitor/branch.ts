import type { GitHubBranchPayload, RepoMonitorConfig, NotificationMessage } from '../types/index.js';
import { sendNotification } from '../notify/index.js';

/**
 * Handle branch create/delete event
 */
export async function handleBranchEvent(
  payload: GitHubBranchPayload,
  eventType: 'create' | 'delete',
  config: RepoMonitorConfig
): Promise<void> {
  const action = eventType === 'create' ? 'created' : 'deleted';

  const message: NotificationMessage = {
    repo: payload.repository.full_name,
    repoUrl: payload.repository.html_url,
    eventType: eventType === 'create' ? 'branch_create' : 'branch_delete',
    branch: payload.ref,
    author: payload.sender.login,
    title: `Branch ${payload.ref} ${action}`,
    details: `Branch ${payload.ref} was ${action} by ${payload.sender.login}`,
    url: `${payload.repository.html_url}/tree/${payload.ref}`,
  };

  console.log(`[Branch] ${message.title} by ${message.author}`);

  await sendNotification(message, config);
}
