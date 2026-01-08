# Git Webhook Monitor

一个基于 TypeScript + Bun 的 GitHub Webhook 监控服务，支持多仓库监控，通过邮件和 Telegram 发送通知。

## 功能特性

- **多仓库支持** - 统一端点接收多个仓库的 Webhook
- **事件监控** - 支持 Push 提交、分支创建/删除
- **文件过滤** - 支持 glob 模式匹配特定文件变动
- **多渠道通知** - 邮件 + Telegram Bot
- **签名验证** - GitHub Webhook 签名验证确保安全

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

```env
# GitHub Webhook 密钥
GITHUB_WEBHOOK_SECRET=your_secret

# 邮件配置 (QQ邮箱示例)
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_qq@qq.com
SMTP_PASS=your_authorization_code
EMAIL_FROM=Git Monitor <your_qq@qq.com>

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_DEFAULT_CHAT_ID=your_chat_id

# 服务端口
PORT=3001
```

### 3. 配置监控规则

编辑 `config.yaml`：

```yaml
defaults:
  events:
    push: true
    branch: true
  notify:
    telegram: true
    email: false

monitors:
  - repo: "your-org/your-repo"
    files:
      - pattern: "src/**/*.ts"
      - pattern: "package.json"
    notify:
      email:
        - dev@example.com
      telegram: true
```

### 4. 启动服务

```bash
# 开发模式 (热重载)
bun run dev

# 生产模式
bun run start
```

### 5. 配置 GitHub Webhook

1. 进入仓库 Settings → Webhooks → Add webhook
2. **Payload URL**: 你的服务地址 + `/webhook`
3. **Content type**: `application/json`
4. **Secret**: 与 `.env` 中 `GITHUB_WEBHOOK_SECRET` 一致
5. **Events**: 选择 Push 和 Branch 相关事件

## 本地开发

本地开发时需要暴露服务给 GitHub 访问，推荐使用 smee.io：

```bash
# 安装 smee-client
bun add -g smee-client

# 获取 channel URL
curl -s https://smee.io/new

# 启动代理
smee -u https://smee.io/your-channel -t http://localhost:3001/webhook
```

## 项目结构

```
├── src/
│   ├── index.ts           # 入口文件
│   ├── server.ts          # Express 服务器
│   ├── config/            # 配置加载
│   ├── types/             # 类型定义
│   ├── webhook/           # Webhook 处理
│   │   ├── handler.ts     # 事件路由
│   │   └── verify.ts      # 签名验证
│   ├── monitor/           # 监控逻辑
│   │   ├── commit.ts      # 提交监控
│   │   ├── branch.ts      # 分支监控
│   │   └── file.ts        # 文件匹配
│   └── notify/            # 通知发送
│       ├── email.ts       # 邮件通知
│       └── telegram.ts    # Telegram 通知
├── config.yaml            # 监控配置
├── .env                   # 环境变量
└── package.json
```

## 技术栈

- **运行时**: Bun
- **语言**: TypeScript
- **框架**: Express
- **邮件**: Nodemailer
- **Telegram**: node-telegram-bot-api

## License

ISC
