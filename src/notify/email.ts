import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/index.js';
import type { NotificationMessage } from '../types/index.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.host || !env.smtp.user) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return transporter;
}

/**
 * Build HTML email content (Chinese)
 */
function buildEmailHtml(message: NotificationMessage): string {
  const eventConfig = {
    push: { text: '新提交推送', color: '#2ea44f' },
    branch_create: { text: '分支创建', color: '#1f6feb' },
    branch_delete: { text: '分支删除', color: '#cf222e' },
  }[message.eventType] || { text: '事件通知', color: '#6e7781' };

  // 只取第一行作为标题
  const commitTitle = message.details.split('\n')[0];

  let filesHtml = '';
  if (message.files) {
    const { added, modified, removed } = message.files;
    const fileItems: string[] = [];

    added.forEach((f) => fileItems.push(`<div style="color: #1a7f37; padding: 4px 0;">+ ${f}</div>`));
    modified.forEach((f) => fileItems.push(`<div style="color: #9a6700; padding: 4px 0;">~ ${f}</div>`));
    removed.forEach((f) => fileItems.push(`<div style="color: #cf222e; padding: 4px 0;">- ${f}</div>`));

    if (fileItems.length > 0) {
      filesHtml = `
        <div style="margin-top: 20px;">
          <div style="font-weight: 600; margin-bottom: 10px; color: #24292f;">变更文件 (${fileItems.length})</div>
          <div style="background: #f6f8fa; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px;">
            ${fileItems.join('')}
          </div>
        </div>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;">
  <div style="max-width: 560px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- 头部 -->
    <div style="background: ${eventConfig.color}; padding: 20px 24px;">
      <div style="color: rgba(255,255,255,0.9); font-size: 13px; margin-bottom: 4px;">${eventConfig.text}</div>
      <div style="color: #ffffff; font-size: 18px; font-weight: 600;">${message.repo}</div>
    </div>

    <!-- 内容 -->
    <div style="padding: 24px;">

      <!-- 提交信息 -->
      <div style="background: #f6f8fa; padding: 16px; border-radius: 8px; border-left: 4px solid ${eventConfig.color};">
        <div style="font-size: 15px; color: #24292f; font-weight: 500;">${commitTitle}</div>
      </div>

      <!-- 详细信息 -->
      <div style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 120px;">
          <div style="color: #57606a; font-size: 12px; margin-bottom: 4px;">分支</div>
          <div style="color: #24292f; font-size: 14px; font-weight: 500;">${message.branch}</div>
        </div>
        <div style="flex: 1; min-width: 120px;">
          <div style="color: #57606a; font-size: 12px; margin-bottom: 4px;">作者</div>
          <div style="color: #24292f; font-size: 14px; font-weight: 500;">${message.author}</div>
        </div>
      </div>

      ${filesHtml}

      <!-- 查看按钮 -->
      ${message.url ? `
      <div style="margin-top: 24px;">
        <a href="${message.url}" style="display: inline-block; background: ${eventConfig.color}; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">查看详情</a>
      </div>
      ` : ''}

    </div>

    <!-- 底部 -->
    <div style="padding: 16px 24px; background: #f6f8fa; border-top: 1px solid #d0d7de;">
      <div style="color: #57606a; font-size: 12px;">此邮件由 Git Webhook Monitor 自动发送</div>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Send email notification
 */
export async function sendEmail(
  message: NotificationMessage,
  recipients: string[]
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.warn('Email not configured, skipping email notification');
    return false;
  }

  try {
    await transport.sendMail({
      from: env.emailFrom,
      to: recipients.join(', '),
      subject: `[${message.repo}] ${message.title}`,
      html: buildEmailHtml(message),
    });

    console.log(`Email sent to: ${recipients.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
