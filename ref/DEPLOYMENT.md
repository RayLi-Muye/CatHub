# CatHub Vercel 部署指南

## 架构概览

```
GitHub (main) ──push──▶ Vercel (自动构建 + 部署)
                              │
                              ├── Production  ← main 分支自动部署
                              ├── Preview     ← PR / 非 main 分支自动部署
                              └── Development ← 本地 `vercel dev`
                              │
                              ▼
                        Neon Postgres (Vercel Storage)
```

---

## 环境模型

| 环境 | 触发方式 | 数据库 | URL |
|------|----------|--------|-----|
| **Production** | push to `main` | Neon Postgres (生产) | `cathub-*.vercel.app` |
| **Preview** | 打开 PR / push 非 main 分支 | 同一 Neon 实例（共享，或可配分支数据库） | `cathub-*-preview.vercel.app` |
| **Development** | 本地 `pnpm dev:vercel` | 同 Preview 环境变量 | `localhost:3000` |

> Vercel 的环境变量可以按 Production / Preview / Development 分别设置。
> Neon 支持数据库分支（Database Branching），Preview 部署可以用独立的分支数据库避免污染生产数据。

---

## 前置条件

- Node.js >= 20
- pnpm（`npm install -g pnpm`）
- Vercel CLI（`npm install -g vercel`）
- GitHub 仓库已关联 Vercel 项目

---

## 一、Vercel 项目配置

### 1. 登录 & 链接

```bash
vercel login          # 浏览器授权登录
vercel link           # 将本地目录链接到 Vercel 项目
```

链接后会生成 `.vercel/project.json`，包含项目和团队 ID。

### 2. 框架设置

`vercel.json` 已声明框架：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs"
}
```

### 3. 根目录（Root Directory）

项目根目录即为 Next.js 应用根目录，Vercel Root Directory 保持默认（`.`）即可。

---

## 二、数据库配置（Neon Postgres）

### 1. 创建数据库

1. Vercel Dashboard → 选择 **cathub** 项目 → **Storage** 标签
2. **Create Database** → 选择 **Neon Postgres**
3. 区域选择 **Washington, D.C. (iad1)**（与 Vercel 默认函数区域匹配，降低延迟）
4. 创建完成后 Vercel 自动注入以下环境变量：

| 变量名 | 用途 |
|--------|------|
| `POSTGRES_URL` | 主连接字符串（含 SSL） |
| `POSTGRES_URL_NON_POOLING` | 非连接池版本（适合迁移） |
| `POSTGRES_USER` | 用户名 |
| `POSTGRES_PASSWORD` | 密码 |
| `POSTGRES_HOST` | 主机地址 |
| `POSTGRES_DATABASE` | 数据库名 |

### 2. 拉取环境变量到本地

```bash
cd frontend
vercel env pull .env.local
```

这会将 Vercel 上配置的环境变量写入 `.env.local`，本地开发即可连接云端数据库。

### 3. 数据库连接代码

`src/lib/db/index.ts` 使用 `DATABASE_URL` 环境变量连接 PostgreSQL：

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

Neon 注入的变量名是 `POSTGRES_URL`，需要确保代码中引用的变量名与之一致，或在 Vercel 环境变量中额外添加 `DATABASE_URL` 指向同一值。

### 4. 推送 Schema 到数据库

```bash
# 方式 1: 直接推送（开发阶段推荐，自动同步 schema 到数据库）
pnpm db:push

# 方式 2: 生成迁移文件后执行（生产环境推荐，可追踪变更历史）
pnpm db:generate
pnpm db:migrate
```

### 5. Drizzle Studio（可视化数据库管理）

```bash
pnpm db:studio
```

浏览器打开 `https://local.drizzle.studio` 即可查看和编辑数据。

---

## 三、环境变量清单

| 变量 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | 是 | Auth.js 签名密钥（生产必须随机生成） | `openssl rand -base64 32` |
| `AUTH_URL` | 否 | Auth.js 回调 URL（Vercel 自动推断，本地需设） | `http://localhost:3000` |
| `UPLOAD_DIR` | 否 | 本地头像存储路径（仅本地开发用） | `./public/uploads` |

### 生成 AUTH_SECRET

```bash
openssl rand -base64 32
```

将生成的值设置到 Vercel 的 Production + Preview + Development 环境变量中。

---

## 四、部署流程

### 自动部署（推荐）

Vercel 与 GitHub 集成后，每次 push 自动触发：

```bash
git add .
git commit -m "feat: your changes"
git push origin main        # → 触发 Production 部署
git push origin feature-x   # → 触发 Preview 部署
```

### 手动部署（CLI）

```bash
vercel             # Preview 部署
vercel --prod      # Production 部署
```

### 查看部署状态

```bash
vercel ls                    # 列出最近部署
vercel inspect <deploy-url>  # 查看部署详情
vercel logs <deploy-url>     # 查看运行时日志
```

---

## 五、本地开发

### 使用 Vercel Dev（连接云端环境变量）

```bash
pnpm dev:vercel
```

等效于 `vercel dev`，会自动加载 Vercel 项目的环境变量，模拟 Serverless Functions 运行时。

### 使用 Next.js Dev（手动管理环境变量）

```bash
pnpm dev
```

需要 `.env.local` 中配置好所有必要的环境变量。

---

## 六、数据库迁移工作流

### 开发阶段

```bash
# 修改 src/lib/db/schema.ts 后
pnpm db:push          # 直接同步到开发数据库（快速迭代）
```

### 生产发布

```bash
# 修改 schema 后
pnpm db:generate      # 生成 SQL 迁移文件到 drizzle/
# 检查生成的 SQL 是否符合预期
pnpm db:migrate       # 执行迁移（需要 DATABASE_URL 指向目标数据库）
git add drizzle/
git commit -m "db: add migration for ..."
git push
```

---

## 七、常见问题

### Q: Preview 和 Production 共用同一个数据库安全吗？

MVP 阶段可以共用。后续可以：
- 在 Neon 中创建数据库分支，让 Preview 部署使用独立的数据分支
- 在 Vercel 中为 Preview 环境单独设置 `DATABASE_URL` 指向分支数据库

### Q: 头像上传在 Vercel 上能用吗？

当前头像存储在 `public/uploads/`（本地文件系统）。Vercel 的 Serverless Functions 是无状态的，文件系统不持久化。生产环境需要迁移到：
- **Vercel Blob**（最简单，Vercel 原生）
- **AWS S3 / Cloudflare R2**（更灵活）

MVP 阶段可暂时跳过头像功能，或使用 Vercel Blob 替代。

### Q: `pnpm build` 本地能过但 Vercel 构建失败？

1. 检查 Vercel 构建日志（Dashboard → Deployments → 点击失败的部署）
2. 确认 Root Directory 设置为 `.`（项目根目录）
3. 确认 Node.js 版本匹配（Vercel Settings → General → Node.js Version）
4. 确认所有环境变量已在 Vercel 中配置

### Q: 如何回滚部署？

```bash
vercel rollback <deployment-url>
```

或在 Dashboard 中点击之前的部署 → Promote to Production。

---

## 八、项目特殊配置

| 配置 | 文件 | 说明 |
|------|------|------|
| 框架声明 | `vercel.json` | `"framework": "nextjs"` |
| Server Action 体积限制 | `next.config.ts` | `bodySizeLimit: "6mb"`（头像上传） |
| pnpm 兼容 | `.npmrc` | `node-linker=hoisted`（Turbopack 兼容） |
| 路由保护 | `src/proxy.ts` | Next.js 16 convention（替代 middleware.ts） |
