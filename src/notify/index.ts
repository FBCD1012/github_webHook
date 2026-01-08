import type { NotificationMessage, RepoMonitorConfig, TelegramNotifyConfig } from '../types/index.js';
import { sendEmail } from './email.js';
import { sendTelegram } from './telegram.js';

/**
 * Send notification through all configured channels
 */
export async function sendNotification(
  message: NotificationMessage,
  config: RepoMonitorConfig
): Promise<void> {
  const notify = config.notify;

  if (!notify) {
    console.log('No notification config, skipping');
    return;
  }

  const promises: Promise<boolean>[] = [];

  // Email notification
  console.log('[debug] notify.email:', notify.email);
  if (notify.email) {
    const recipients = Array.isArray(notify.email) ? notify.email : [];
    console.log('[debug] email recipients:', recipients);
    if (recipients.length > 0) {
      promises.push(sendEmail(message, recipients));
    }
  }

  // Telegram notification
  if (notify.telegram) {
    let chatId: string | undefined;

    if (typeof notify.telegram === 'object') {
      chatId = (notify.telegram as TelegramNotifyConfig).chatId;
    }

    promises.push(sendTelegram(message, chatId));
  }

  // Wait for all notifications to complete
  const results = await Promise.allSettled(promises);

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && r.value === true
  ).length;
  const failed = results.length - successful;

  console.log(`Notifications sent: ${successful} successful, ${failed} failed`);
}
