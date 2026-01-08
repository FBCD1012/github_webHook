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
 * Build Telegram message with HTML format (Chinese)
 */
function buildTelegramMessage(message: NotificationMessage): string {
  const eventText = {
    push: '新提交推送',
    branch_create: '分支创建',
    branch_delete: '分支删除',
  }[message.eventType];

  const lines: string[] = [
    `📦 <b>${eventText}</b>`,
    '',
    `📁 仓库: ${escapeHtml(message.repo)}`,
    `🌿 分支: ${escapeHtml(message.branch)}`,
    `👤 作者: ${escapeHtml(message.author)}`,
    '',
    `📝 说明:`,
    escapeHtml(truncate(message.details.split('\n')[0], 200)),
  ];

  // Add file changes with italic style
  if (message.files) {
    const { added, modified, removed } = message.files;
    const totalFiles = added.length + modified.length + removed.length;

    if (totalFiles > 0) {
      lines.push('', `📄 变更文件 (${totalFiles}):`);

      const maxFiles = 10;
      let shown = 0;

      for (const f of added.slice(0, maxFiles - shown)) {
        lines.push(`<i>+ ${escapeHtml(f)}</i>`);
        shown++;
      }
      for (const f of modified.slice(0, maxFiles - shown)) {
        lines.push(`<i>~ ${escapeHtml(f)}</i>`);
        shown++;
      }
      for (const f of removed.slice(0, maxFiles - shown)) {
        lines.push(`<i>- ${escapeHtml(f)}</i>`);
        shown++;
      }

      if (totalFiles > maxFiles) {
        lines.push(`<i>... 还有 ${totalFiles - maxFiles} 个文件</i>`);
      }
    }
  }

  // Add link
  if (message.url) {
    lines.push('', `🔗 <a href="${message.url}">查看详情</a>`);
  }

  return lines.join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    console.log(`Telegram message sent to: ${targetChatId}`);
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}
