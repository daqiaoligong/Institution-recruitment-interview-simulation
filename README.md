# 沪面冲鸭

上海事业单位面试模拟网站。当前仓库采用前后端分离 monorepo：

- `apps/web`: React + Vite + TypeScript 前端
- `apps/api`: NestJS + Prisma 后端
- `packages/shared`: 前后端共享类型、常量和枚举
- `docs`: PRD、架构设计、开发实施计划

## 本地启动

当前环境可以直接使用 npm workspaces：

```powershell
npm install
npm run dev:web
```

前端默认运行在 `http://localhost:5173`。

## 后端与数据库

Phase 4 已接入 NestJS + Prisma + PostgreSQL。登录、岗位信息、题库、面试记录、作答保存和录音上传都有对应 API。

1. 准备 PostgreSQL，并按 `.env.example` 配置 `.env`：

```powershell
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/humian_chongya
JWT_SECRET=replace-with-a-long-random-secret
PORT=3001
UPLOAD_ROOT=uploads
```

2. 初始化 Prisma Client、执行 migration、导入真题种子：

```powershell
npm run prisma:generate -w @humian/api
npm run prisma:migrate -w @humian/api
npm run prisma:seed -w @humian/api
```

3. 启动后端：

```powershell
npm run dev:api
```

后端默认运行在 `http://localhost:3001/api`，本地音频上传目录为 `apps/api/uploads/audio`。

## DeepSeek AI

Phase 5 已接入后端 AI 代理。所有 DeepSeek 调用都发生在 `apps/api`，前端不会暴露 API Key。

在 `.env` 中配置：

```powershell
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

如果没有配置 `DEEPSEEK_API_KEY`，后端会返回开发期兜底结果，保证页面流程不中断。配置 Key 后，以下接口会调用真实 DeepSeek：

- `POST /api/ai/review-answer`
- `POST /api/ai/generate-questions`
- `POST /api/ai/generate-report`

录音转文字需要单独的 ASR 服务，DeepSeek 文本模型不直接转写音频。当前已预留 `POST /api/ai/transcribe-audio` 和面试结束后的“生成复盘”等待页；未配置 ASR 时，系统会保留录音并提示可手动补充转写文本。

## 百炼 Qwen3 ASR

当前默认 ASR 使用百炼 `qwen3-asr-flash`，通过 OpenAI 兼容接口调用。前端会在面试结束等待页把本地录音转成 Base64 发给后端，所以开发期不需要 OSS 或公网音频 URL。

在 `.env` 中填写：

```powershell
ASR_PROVIDER=qwen3-asr-flash
DASHSCOPE_API_KEY=你的百炼 API Key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_ASR_MODEL=qwen3-asr-flash
```

百炼 Key 只放在后端 `.env`，不要写进前端代码。

## 阿里云录音文件识别备用方案

项目也保留了阿里云智能语音交互录音文件识别驱动。根据阿里云接口要求，音频必须能通过公网 URL 访问，本地 `localhost`、`127.0.0.1` 或本机文件路径不能被云端服务拉取。

如需切换到该方案，在 `.env` 中填写：

```powershell
ASR_PROVIDER=aliyun
ALIYUN_ACCESS_KEY_ID=你的阿里云 AccessKey ID
ALIYUN_ACCESS_KEY_SECRET=你的阿里云 AccessKey Secret
ALIYUN_NLS_APP_KEY=你的智能语音交互 AppKey
ALIYUN_NLS_ENDPOINT=http://filetrans.cn-shanghai.aliyuncs.com
PUBLIC_ASSET_BASE_URL=公网可访问的音频文件根地址
```

开发期如果只填 `ALIYUN_NLS_APP_KEY`，接口会提示还缺少 AccessKey。正式使用时建议把录音上传到 OSS，再把 OSS 公网/签名 URL 交给阿里云转写。

## 已完成

- Phase 0: 文档、工程结构和共享类型
- Phase 1: 前端页面原型
- Phase 2: 前端本地面试流程闭环
- Phase 3: 逐题录音、IndexedDB 本地音频保存、复盘播放
- Phase 4: NestJS + Prisma 后端核心 API、PostgreSQL schema、migration SQL、seed 数据
- Phase 5: DeepSeek AI 后端代理、岗位生题、单题点评、整场报告
