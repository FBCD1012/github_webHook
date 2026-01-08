import TelegramBot from 'node-telegram-bot-api';
import { env } from '../config/index.js';
import type { NotificationMessage } from '../types/index.js';

let bot: TelegramBot | null = null;

function getBot(): TelegramBot | null {
  if (!env.telegramBotToken) {
    return null;
  }

  if (!bot) {
    bot = new TelegramBot(env.telegramBotToken);
  }

  return bot;
}

/**
 * Build Telegram message with Markdown formatting
 */
function buildTelegramMessage(message: NotificationMessage): string {
  const eventEmoji = {
    push: '📦',
    branch_create: '🌱',
    branch_delete: '🗑️',
  }[message.eventType];

  const lines: string[] = [
    `${eventEmoji} *${escapeMarkdown(message.title)}*`,
    '',
    `📁 *Repo:* [${escapeMarkdown(message.repo)}](${message.repoUrl})`,
    `🌿 *Branch:* \`${escapeMarkdown(message.branch)}\``,
    `👤 *Author:* ${escapeMarkdown(message.author)}`,
    '',
    `📝 *Details:*`,
    `\`\`\``,
    escapeMarkdown(truncate(message.details, 500)),
    `\`\`\``,
  ];

  // Add file changes
  if (message.files) {
    const { added, modified, removed } = message.files;
    const totalFiles = added.length + modified.length + removed.length;

    if (totalFiles > 0) {
      lines.push('', `📄 *Changed Files (${totalFiles}):*`);

      const maxFiles = 10;
      let shown = 0;

      for (const f of added.slice(0, maxFiles - shown)) {
        lines.push(`\\+ \`${escapeMarkdown(f)}\``);
        shown++;
      }
      for (const f of modified.slice(0, maxFiles - shown)) {
        lines.push(`~ \`${escapeMarkdown(f)}\``);
        shown++;
      }
      for (const f of removed.slice(0, maxFiles - shown)) {
        lines.push(`\\- \`${escapeMarkdown(f)}\``);
        shown++;
      }

      if (totalFiles > maxFiles) {
        lines.push(`_\\.\\.\\. and ${totalFiles - maxFiles} more files_`);
      }
    }
  }

  // Add matched patterns
  if (message.matchedPatterns && message.matchedPatterns.length > 0) {
    lines.push('', `🎯 *Matched:* ${message.matchedPatterns.map((p) => `\`${escapeMarkdown(p)}\``).join(', ')}`);
  }

  // Add link
  if (message.url) {
    lines.push('', `[View on GitHub →](${message.url})`);
  }

  return lines.join('\n');
}

/**
 * Escape special characters for Telegram MarkdownV2
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Send Telegram notification
 */
export async function sendTelegram(
  message: NotificationMessage,
  chatId?: string
): Promise<boolean> {
  const telegramBot = getBot();

  if (!telegramBot) {
    console.warn('Telegram bot not configured, skipping Telegram notification');
    return false;
  }

  const targetChatId = chatId || env.telegramDefaultChatId;

  if (!targetChatId) {
    console.warn('No Telegram chat ID specified');
    return false;
  }

  try {
    await telegramBot.sendMessage(targetChatId, buildTelegramMessage(message), {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    });

    console.log(`Telegram message sent to: ${targetChatId}`);
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}
