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

## 已完成

- Phase 0: 文档、工程结构和共享类型
- Phase 1: 前端页面原型
- Phase 2: 前端本地面试流程闭环
- Phase 3: 逐题录音、IndexedDB 本地音频保存、复盘播放
- Phase 4: NestJS + Prisma 后端核心 API、PostgreSQL schema、migration SQL、seed 数据
