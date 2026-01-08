import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import type { AppConfig, RepoMonitorConfig, DefaultsConfig } from '../types/index.js';

// Bun automatically loads .env files

// Environment configuration
export const env = {
  // GitHub
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',

  // SMTP
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  emailFrom: process.env.EMAIL_FROM || 'Git Monitor <noreply@example.com>',

  // Telegram
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramDefaultChatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || '',

  // Server
  port: parseInt(process.env.PORT || '3000', 10),
};

// Default configuration
const defaultConfig: DefaultsConfig = {
  events: {
    push: true,
    branch: true,
  },
  notify: {
    telegram: true,
    email: false,
  },
};

// Load YAML configuration
function loadYamlConfig(): AppConfig {
  const configPath = './config.yaml';

  if (!existsSync(configPath)) {
    console.warn('config.yaml not found, using defaults');
    return {
      defaults: defaultConfig,
      monitors: [],
    };
  }

  const content = readFileSync(configPath, 'utf-8');
  const parsed = parse(content) as Partial<AppConfig>;

  return {
    defaults: { ...defaultConfig, ...parsed.defaults },
    monitors: parsed.monitors || [],
  };
}

// Merged configuration
export const appConfig = loadYamlConfig();

// Get config for a specific repository
export function getRepoConfig(repoFullName: string): RepoMonitorConfig | null {
  const repoConfig = appConfig.monitors.find(
    (m) => m.repo.toLowerCase() === repoFullName.toLowerCase()
  );

  if (!repoConfig) {
    return null;
  }

  // Merge with defaults
  return {
    ...repoConfig,
    events: { ...appConfig.defaults.events, ...repoConfig.events },
    notify: { ...appConfig.defaults.notify, ...repoConfig.notify },
  };
}

// Check if a repo is monitored
export function isRepoMonitored(repoFullName: string): boolean {
  return appConfig.monitors.some(
    (m) => m.repo.toLowerCase() === repoFullName.toLowerCase()
  );
}
