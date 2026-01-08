import type { GitHubPushPayload, RepoMonitorConfig, NotificationMessage } from '../types/index.js';
import { aggregateFileChanges, matchFilePatterns } from './file.js';
import { sendNotification } from '../notify/index.js';

/**
 * Handle push event - process commits and send notifications
 */
export async function handlePushEvent(
  payload: GitHubPushPayload,
  config: RepoMonitorConfig
): Promise<void> {
  // Skip if no commits (e.g., branch deletion via push)
  if (payload.commits.length === 0) {
    console.log('No commits in push event, skipping');
    return;
  }

  // Extract branch name from ref (refs/heads/main -> main)
  const branch = payload.ref.replace('refs/heads/', '');

  // Aggregate file changes from all commits
  const allChanges = aggregateFileChanges(payload.commits);

  // Check if any changed files match configured patterns
  const { matched, matchedPatterns, matchedFiles } = matchFilePatterns(
    allChanges,
    config.files || []
  );

  if (!matched && config.files && config.files.length > 0) {
    console.log('No files matched configured patterns, skipping notification');
    return;
  }

  // Build notification message
  const commitCount = payload.commits.length;
  const commitWord = commitCount === 1 ? 'commit' : 'commits';
  const latestCommit = payload.head_commit || payload.commits[payload.commits.length - 1];

  const message: NotificationMessage = {
    repo: payload.repository.full_name,
    repoUrl: payload.repository.html_url,
    eventType: 'push',
    branch,
    author: payload.pusher.name,
    title: `${commitCount} new ${commitWord} pushed to ${branch}`,
    details: latestCommit?.message || 'No commit message',
    files: matchedFiles,
    matchedPatterns: config.files?.length ? matchedPatterns : undefined,
    url: latestCommit?.url,
  };

  // Log commits
  console.log(`[Push] ${message.title}`);
  payload.commits.forEach((commit) => {
    console.log(`  - ${commit.id.substring(0, 7)}: ${commit.message.split('\n')[0]}`);
  });

  // Send notification
  await sendNotification(message, config);
}
