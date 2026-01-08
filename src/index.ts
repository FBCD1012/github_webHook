import { startServer } from './server.js';
import { appConfig, env } from './config/index.js';

// 启动横幅
console.log('\n' + '='.repeat(50));
console.log('  [*] Git Webhook Monitor v1.0.0');
console.log('='.repeat(50));

// 检查配置
const checks = {
  '仓库配置': appConfig.monitors.length > 0,
  'Telegram': !!env.telegramBotToken,
  '邮件 SMTP': !!env.smtp.host && !!env.smtp.user,
};

console.log('\n[i] 配置检查:');
Object.entries(checks).forEach(([name, ok]) => {
  console.log(`    ${ok ? '[✓]' : '[!]'} ${name}: ${ok ? '已配置' : '未配置'}`);
});

// 显示监控仓库
if (appConfig.monitors.length > 0) {
  console.log('\n[i] 监控仓库:');
  appConfig.monitors.forEach((m) => {
    const notify = [];
    if (m.notify?.telegram) notify.push('Telegram');
    if (m.notify?.email) notify.push('邮件');
    console.log(`    - ${m.repo} -> ${notify.join(', ') || '无通知'}`);
  });
}

console.log('');

// 启动服务
startServer();
