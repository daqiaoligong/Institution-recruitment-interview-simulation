# 沪面冲鸭

上海事业单位面试模拟网站。当前仓库采用前后端分离 monorepo：

- `apps/web`: React + Vite + TypeScript 前端 MVP
- `apps/api`: NestJS + Prisma 后端骨架
- `packages/shared`: 前后端共享类型、常量、枚举
- `docs`: PRD、技术架构、开发实施计划

## 本地运行

当前环境未安装 `pnpm` 时，可直接使用 npm workspaces：

```powershell
npm install
npm run dev:web
```

安装 pnpm 后也可以：

```powershell
corepack enable
pnpm install
pnpm dev:web
```

前端默认运行在 `http://localhost:5173`。

## 当前阶段

已落地 Phase 0 与前端 MVP 基础：页面、题库、自由组题、岗位信息、本地登录、听题/看题模拟、历史复盘。后端、数据库、DeepSeek AI 和正式录音上传按开发计划后续接入。
