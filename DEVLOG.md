# CatHub 开发日志

> **重要规则**: 每次代码改动都必须在本文档中记录具体实现内容。这是强制性的开发流程，任何新会话或接手的 agent 都必须遵守。开始开发前请先阅读本文档了解项目现状。

---

## 开发规范

1. **每次改动必须更新本文档** — 记录做了什么、为什么做、涉及哪些文件
2. **新会话/新 agent 接手前** — 必须先读 `DEVLOG.md` 和 `Cathub.md` 了解上下文
3. **提交代码前** — 确认 `pnpm build` 通过
4. **数据库变更** — 修改 schema 后运行 `pnpm db:generate` 生成迁移

---

## 项目概况

- **项目**: CatHub — AI 猫数字孪生平台
- **仓库**: https://github.com/RayLi-Muye/CatHub
- **技术栈**: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Drizzle ORM + PostgreSQL + Auth.js v5 + Zod 4 + pnpm
- **设计风格**: Mistral AI 暖色系（详见 `frontend/ref/DESIGN.md`）
- **三大 Epic**: 数字身份(Profile) > 健康追踪(Health) > 社交时间线(Social, 待实现)

---

## 变更记录

### 2026-04-09 — 修复中文猫名 slug 路由 404

**Bugfix: Non-ASCII slug causes 404 on Vercel**
- 问题: 用中文名（如"老四"）创建猫 profile 后，slug 保留了中文字符，Vercel 路由层无法匹配非 ASCII 路径，导致点击猫卡片返回 404
- 修复: 引入 `transliteration` 库，中文名自动转拼音（如 `老四` → `lao-si`、`小花猫` → `xiao-hua-mao`），英文名不受影响
- 数据库中已有的中文 slug 已更新为拼音：`老四` → `lao-si`
- 已重新部署到 Vercel 并验证修复生效
- 涉及文件: `src/actions/cat.ts`, `package.json`

### 2026-04-09 — Vercel 部署 + Neon Postgres

**Phase 12: Production Deployment**
- 在 Vercel Dashboard 创建 Neon Postgres 数据库（区域 us-east-1），Vercel 自动注入 `DATABASE_URL` 等环境变量
- `vercel env pull .env.local` 拉取云端环境变量到本地，本地开发可直连云端数据库
- `pnpm db:push` 将 Drizzle schema（5 张表、2 个 enum）推送到 Neon 数据库
- 生成随机 `AUTH_SECRET` 并添加到 Vercel Production + Development 环境变量
- `vercel --prod` 首次生产部署成功，13 个路由全部正常
- 新增 `ref/DEPLOYMENT.md` 部署指南文档，覆盖环境模型、数据库配置、部署流程、迁移工作流和常见问题
- Production URL: `https://cathub-bice.vercel.app`
- 待补充：Preview 环境的 `AUTH_SECRET`（CLI bug 导致无法通过命令行添加，需在 Dashboard 手动设置）
- 涉及文件: `.env.local`, `ref/DEPLOYMENT.md`

### 2026-04-08 — MVP 补全：账户设置页

**Phase 6: Account Settings + 代码整洁**
- 新增 `/settings` 页面，接入已存在的路由保护，提供账户资料设置入口
- 新增用户资料更新 action，可编辑 `displayName` 和 `bio`，并在保存后 revalidate `/settings`、`/dashboard`、`/{username}`
- 扩展用户校验 schema，补充 profile 表单验证逻辑
- Auth.js session callback 改为按 `token.id` 回查最新用户资料，确保导航和会话显示及时反映新的 display name
- 修复 lint 阻塞项：首页注册 CTA 从 `<a>` 改为 `Link`，主题切换移除 `useEffect` 内同步 `setState`
- 验证结果：当时已通过 `pnpm build`；后续 Phase 7 已清理剩余头像相关 lint warning
- 涉及文件: `src/app/(main)/settings/page.tsx`, `src/components/settings/profile-settings-form.tsx`, `src/actions/user.ts`, `src/lib/validators/user.ts`, `src/lib/auth/index.ts`, `src/app/page.tsx`, `src/components/layout/theme-toggle.tsx`

### 2026-04-08 — MVP 补全：猫头像上传

**Phase 7: Local Avatar Upload**
- 为 CatForm 新增头像上传字段，表单改为 `multipart/form-data`，编辑页可看到当前头像并替换
- 新增本地存储工具，使用 `UPLOAD_DIR` 保存头像文件到 `public/uploads`，限制类型为 PNG/JPG/WEBP/GIF，大小上限 5 MB
- `createCat` / `updateCat` / `deleteCat` 现在会同步维护 `cats.avatarUrl`、`cat_images` 记录和本地文件清理
- `next.config.ts` 增加 `experimental.serverActions.bodySizeLimit = "6mb"`，避免 Server Action 默认 1 MB 限制拦截头像上传
- 猫卡片与猫详情头像切换到 `next/image`，清理现存图片相关 lint warning
- 涉及文件: `next.config.ts`, `src/lib/storage/cat-images.ts`, `src/actions/cat.ts`, `src/components/cat/cat-form.tsx`, `src/components/cat/cat-card.tsx`, `src/app/[username]/[catname]/page.tsx`

### 2026-04-08 — MVP 补全：账户凭据管理

**Phase 8: Username / Email / Password Settings**
- `/settings` 页面拆分为公开资料和登录凭据两个表单，避免把 profile 编辑与敏感凭据更新混在一起
- 新增账户凭据更新 action，可修改 `username`、`email`、`password_hash`
- 用户名或邮箱变更前会校验当前密码、唯一性和密码确认；仅修改公开资料时不需要当前密码
- 当 display name 仍跟随旧用户名时，修改用户名会自动同步 display name，避免出现陈旧默认名
- 用户名变更后会 revalidate 用户主页和猫详情/健康页路径，保证公开链接及时反映新用户名
- 验证结果：`pnpm lint` 通过，`pnpm build` 通过
- 涉及文件: `src/actions/user.ts`, `src/lib/validators/user.ts`, `src/components/settings/profile-settings-form.tsx`, `src/components/settings/credentials-settings-form.tsx`, `src/app/(main)/settings/page.tsx`

### 2026-04-08 — 本地开发修复：嵌入式数据库 fallback

**Phase 9: Embedded Postgres For Local Dev**
- 发现注册失败的根因是本机没有运行 PostgreSQL，`DATABASE_URL=localhost:5432` 导致所有查询 `ECONNREFUSED`
- 新增基于 `pg-mem` 的嵌入式 Postgres 实现，开发环境可在无系统 PostgreSQL 的情况下直接跑通注册、登录和 CRUD 流程
- `src/lib/db/index.ts` 现在支持通过 `LOCAL_DB_MODE=embedded` 切换到内存数据库；默认保留原有 `pg` 连接方式，生产路径不变
- 为避免 Next dev 热更新时内存库被重复重建，嵌入式数据库单例缓存到 `globalThis`
- `.env.local` 增加 `LOCAL_DB_MODE=embedded`，本地启动默认走嵌入式数据库
- 涉及文件: `package.json`, `pnpm-lock.yaml`, `src/lib/db/index.ts`, `src/lib/db/embedded.ts`, `src/lib/db/embedded-schema.ts`, `.env.local`

### 2026-04-08 — 本地开发策略调整：切回 Vercel Dev

**Phase 10: Revert Embedded DB / Prepare Vercel Dev**
- 嵌入式 `pg-mem` fallback 已移除，数据库入口恢复为真实 PostgreSQL 连接，避免本地运行路径继续偏离真实部署环境
- 新增 `pnpm dev:vercel` 脚本，统一使用 `vercel dev` 作为本地 Vercel 运行环境模拟入口
- 当前机器验证结果：Vercel CLI 44.7.3 可用，但尚未登录；未登录时 `vercel dev` 会直接报 `No existing credentials found`
- 后续启动路径已经明确为 `vercel login` -> `vercel link` -> `vercel env pull .env.local` -> `pnpm dev:vercel`
- 涉及文件: `package.json`, `pnpm-lock.yaml`, `src/lib/db/index.ts`, `.env.local`

### 2026-04-08 — Vercel 本地仿真继续推进

**Phase 11: Link Project / Fix Framework Detection**
- 已在 Vercel 团队 `ray's projects` 下创建并链接 `cathub` 项目，`frontend/.vercel/project.json` 已写入项目与团队 ID
- 验证发现新建项目的 Framework Preset 默认为 `Other`，`vercel dev` 在 Windows 上因此误落到默认开发命令路径，并触发 `yarn` 命令不存在的问题
- 新增 `vercel.json`，显式将框架声明为 `nextjs`，让本地 `vercel dev` 按 Next.js 路径运行
- 当前云端环境变量仍为空；真实业务流程仍需要可用的 PostgreSQL `DATABASE_URL`
- 涉及文件: `vercel.json`, `.vercel/project.json`

### 2026-04-08 — 初始 MVP 搭建

**Phase 0: 项目脚手架**
- 初始化 Next.js 16 项目（App Router, TypeScript, Tailwind v4）
- 安装 shadcn/ui，配置 Mistral 暖色系主题
- CSS 变量: 暖象牙背景 `#fffaeb`、品牌橙 `#fa520f`、零圆角、金色阴影
- 核心依赖: drizzle-orm, pg, next-auth@beta, bcryptjs, zod
- `.npmrc` 设置 `node-linker=hoisted` 解决 pnpm + Turbopack 兼容问题
- 涉及文件: `package.json`, `globals.css`, `next.config.ts`, `.npmrc`

**Phase 1: 数据库 & 认证**
- Drizzle schema: 5 张表 (users, cats, cat_images, health_records, weight_logs)
- 2 个 enum: cat_sex, health_record_type
- SQL 迁移文件: `drizzle/0000_lonely_rumiko_fujikawa.sql`
- Auth.js v5: JWT 策略 + Credentials provider
- 注册/登录页面 + Server Actions + Zod 验证
- `proxy.ts` 路由保护 (Next.js 16 convention, 替代旧 middleware.ts)
- 涉及文件: `src/lib/db/schema.ts`, `src/lib/auth/index.ts`, `src/actions/auth.ts`, `src/proxy.ts`, `src/app/(auth)/*`

**Phase 2: 核心布局 & 导航**
- ThemeProvider (next-themes) 支持 light/dark/system
- Navbar: 品牌渐变色块 + CatHub logo + 主题切换 + 用户下拉菜单
- Footer 组件
- Root layout 统一 Navbar + main + Footer
- 涉及文件: `src/components/providers.tsx`, `src/components/layout/*`, `src/app/layout.tsx`

**Phase 3: 猫 Profile CRUD**
- Zod 验证: `src/lib/validators/cat.ts`
- Server Actions: createCat, updateCat, deleteCat（含 slug 生成和唯一性检查）
- CatForm 组件: 名字、品种、性别、生日、花色、芯片号、绝育状态
- CatCard 组件: 卡片展示含年龄自动计算
- Dashboard: 猫列表网格（从 DB 读取）
- 猫 Profile 详情页: Tab 布局（概览/健康/时间线占位）
- 用户公开主页: `/{username}` 展示公开猫列表
- 编辑页: 含删除确认
- 涉及文件: `src/actions/cat.ts`, `src/components/cat/*`, `src/app/[username]/*`, `src/app/(main)/dashboard/*`, `src/app/(main)/cats/new/*`

**Phase 4: 健康追踪**
- Zod 验证: `src/lib/validators/health.ts`
- Server Actions: createHealthRecord, deleteHealthRecord, logWeight
- 健康记录表单: 类型(6种)、标题、日期、兽医信息
- 健康时间线: 按时间倒序展示，带类型图标
- 体重记录: 内联表单 + SVG 折线图
- 猫概览页显示最近 3 条健康记录
- 涉及文件: `src/actions/health.ts`, `src/components/health/*`, `src/app/[username]/[catname]/health/*`

**Phase 5: 收尾**
- Loading 状态: 品牌色块动画
- 404 页面: 风格化 not-found
- Error 页面: 错误边界 + 重试
- 涉及文件: `src/app/loading.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`

---

## 当前路由表

| 路由 | 类型 | 说明 |
|------|------|------|
| `/` | 公开 | 首页 Landing |
| `/login` | 公开 | 登录 |
| `/register` | 公开 | 注册 |
| `/dashboard` | 需登录 | 我的猫列表 |
| `/cats/new` | 需登录 | 创建猫档案 |
| `/settings` | 需登录 | 账户设置 |
| `/{username}` | 公开 | 用户主页 |
| `/{username}/{catname}` | 公开/私有 | 猫 Profile 详情 |
| `/{username}/{catname}/edit` | 仅主人 | 编辑猫档案 |
| `/{username}/{catname}/health` | 公开/私有 | 健康时间线 |
| `/{username}/{catname}/health/new` | 仅主人 | 添加健康记录 |

---

## 待完成

- [x] ~~数据库部署~~ → Neon Postgres via Vercel Storage（2026-04-09 完成）
- [x] ~~Vercel 部署配置~~ → Production: `cathub-bice.vercel.app`（2026-04-09 完成）
- [ ] Preview 环境 `AUTH_SECRET` 配置（Dashboard 手动添加）
- [ ] 头像上传迁移到 Vercel Blob（当前本地文件系统在 Serverless 环境不持久化）
- [ ] 社交时间线 (Phase 6, Tab 占位已留)
- [ ] 响应式细节优化
- [ ] SEO metadata 完善
