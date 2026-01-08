// Configuration types
export interface EventsConfig {
  push: boolean;
  branch: boolean;
}

export interface FilePattern {
  pattern: string;
}

export interface TelegramNotifyConfig {
  chatId?: string;
}

export interface NotifyConfig {
  email?: string[] | boolean;
  telegram?: TelegramNotifyConfig | boolean;
}

export interface RepoMonitorConfig {
  repo: string;
  events?: EventsConfig;
  files?: FilePattern[];
  notify?: NotifyConfig;
}

export interface DefaultsConfig {
  events: EventsConfig;
  notify: NotifyConfig;
}

export interface AppConfig {
  defaults: DefaultsConfig;
  monitors: RepoMonitorConfig[];
}

// GitHub Webhook payload types
export interface GitHubUser {
  name: string;
  email: string;
  username?: string;
}

export interface GitHubCommit {
  id: string;
  message: string;
  timestamp: string;
  url: string;
  author: GitHubUser;
  added: string[];
  removed: string[];
  modified: string[];
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
}

export interface GitHubPushPayload {
  ref: string;
  before: string;
  after: string;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  commits: GitHubCommit[];
  head_commit: GitHubCommit | null;
  repository: GitHubRepository;
  pusher: GitHubUser;
  sender: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubBranchPayload {
  ref: string;
  ref_type: 'branch' | 'tag';
  master_branch: string;
  repository: GitHubRepository;
  sender: {
    login: string;
    avatar_url: string;
  };
}

// Notification types
export interface NotificationMessage {
  repo: string;
  repoUrl: string;
  eventType: 'push' | 'branch_create' | 'branch_delete';
  branch: string;
  author: string;
  title: string;
  details: string;
  files?: {
    added: string[];
    modified: string[];
    removed: string[];
  };
  matchedPatterns?: string[];
  url?: string;
}
