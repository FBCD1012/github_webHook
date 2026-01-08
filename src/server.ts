import express from 'express';
import { env, appConfig } from './config/index.js';
import { verifyGitHubSignature } from './webhook/verify.js';
import { webhookHandler } from './webhook/handler.js';

export function createServer() {
  const app = express();

  // 解析 JSON
  app.use(express.json());

  // 请求日志
  app.use((req, _res, next) => {
    if (req.path !== '/health') {
      const time = new Date().toLocaleTimeString('zh-CN');
      console.log(`[${time}] ${req.method} ${req.path}`);
    }
    next();
  });

  // 健康检查
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      monitors: appConfig.monitors.length,
      timestamp: new Date().toISOString(),
    });
  });

  // Webhook 端点
  app.post('/webhook', verifyGitHubSignature, webhookHandler);

  // 404 处理
  app.use((_req, res) => {
    res.status(404).json({ error: '未找到' });
  });

  return app;
}

export function startServer() {
  const app = createServer();

  app.listen(env.port, () => {
    console.log('🌐 服务已启动:');
    console.log(`   本地: http://localhost:${env.port}`);
    console.log(`   Webhook: http://localhost:${env.port}/webhook`);
    console.log(`   健康检查: http://localhost:${env.port}/health`);
    console.log('\n⏳ 等待 GitHub Webhook 事件...\n');
  });
}
