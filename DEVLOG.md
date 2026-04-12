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
- **设计风格**: Mistral AI 暖色系（详见 `ref/DESIGN.md`）
- **三大 Epic**: 数字身份(Profile) > 健康追踪(Health) > 社交时间线(Social)

---

## 变更记录

### 2026-04-12 — Profile 增强 Phase 2: Lineage Graph 内部血缘关联

**数据库变更:**
- 新增枚举: `lineage_parent_role` (sire/dam/unknown), `lineage_status` (pending/confirmed/disputed/revoked), `lineage_source_type` (internal/external/registry/import)
- 新增表: `cat_lineage_edges` — 使用 parent -> child 有向边表达猫的血缘 DAG，而不是在 `cats` 表上写死 father/mother 字段
- 约束与索引:
  - `lineage_edges_no_self_parent_check` 防止直接自引用
  - `parent_cat_id`, `child_cat_id`, `created_by_user_id` 外键列均建索引
  - `child_cat_id + parent_role + status`、`parent_cat_id + status` 复合索引用于递归查询
  - partial unique index 限制每只猫最多一个 confirmed sire、一个 confirmed dam，并限制同一 parent-child confirmed 边重复写入
- 迁移文件: `drizzle/0002_flowery_gideon.sql`

**新增功能:**
- 新增 `/{username}/{catname}/lineage` 页面和 Profile Tabs 中的 Lineage tab
- 主人可为当前猫从自己名下已有猫中选择 Sire/Dam，完成内部血缘关联
- Server Action 写入前校验:
  - 当前用户必须拥有 child 和 parent
  - parent 不能等于 child
  - sire 不能选择 female，dam 不能选择 male
  - 同一 parent-child 不能以不同角色重复确认
  - 使用 recursive CTE 检测是否会形成祖先/后代循环
- Lineage 页面支持三代祖先和三代后代递归查询展示；非主人只能看到公开猫，主人可看到自己私有猫关系
- Lineage 页面现在支持用户选择展示深度，默认 3 代，可通过 `?generations=3|4|5|6|all` 查看更多代；`all` 使用 25 代安全上限防止异常图拖垮页面
- 移除父母链接时不会物理删除边，而是将 confirmed edge 标记为 `revoked`，保留未来审计/快照扩展空间

**涉及文件:**
- Schema: `src/lib/db/schema.ts`
- 新建: `src/actions/lineage.ts`, `src/lib/lineage/queries.ts`, `src/lib/validators/lineage.ts`, `src/app/[username]/[catname]/lineage/page.tsx`, `src/components/lineage/lineage-cat-card.tsx`, `src/components/lineage/lineage-parent-form.tsx`, `src/components/lineage/lineage-generation-selector.tsx`
- 修改: `src/components/cat/profile-tabs.tsx`, `drizzle/meta/_journal.json`

**验证结果:**
- `pnpm db:generate` 通过
- `pnpm lint` 通过
- `pnpm build` 通过
- 2026-04-12 追加验证:
  - `pnpm db:migrate` 因历史库使用过 `db:push` 且 Drizzle migration history 为空，不能从 0000 重放；随后使用当前项目既有方式 `pnpm db:push` 成功将 lineage schema 同步到 Neon
  - 直接查询 Neon 确认 `cat_lineage_edges` 表、外键、check constraint、partial unique index 和递归查询索引均已存在
  - 事务内最小数据测试通过：三代祖先递归、三代后代递归、confirmed sire 唯一约束、自引用 check、循环检测 CTE 均通过，事务已 rollback
  - Vercel dev 页面烟测通过：插入临时公开猫谱后访问 `/{username}/{catname}/lineage` 返回 200，页面包含三代祖先数据；临时测试用户已删除，dev server 已停止

### 2026-04-12 — Profile 增强 Phase 3: Owner-only Identity Codes

**数据库变更:**
- 新增枚举: `cat_identity_code_visibility` (private/public)
- 新增表: `cat_identity_codes` — 为每只猫保存稳定、随机、不可枚举的全球身份码，用于后续二维码和外部连接请求
- 约束与索引:
  - `code` 全局唯一，避免跨用户重复
  - `cat_identity_codes_cat_active_idx` partial unique index 限制每只猫最多一个 active code
  - `cat_id`、`created_by_user_id` 外键列均建索引
- 迁移文件: `drizzle/0003_unique_tenebrous.sql`

**新增功能:**
- 新增 owner-only 身份码卡片，只在猫主人访问 Lineage 页面时显示
- 主人可为当前猫生成 private identity code；已有 active code 时复用，不重复生成
- 生成 action 处理并发重复提交：如果 active-code 唯一索引冲突，会重新读取并复用现有 code
- 身份码格式为 `CAT-XXXX-XXXX-XXXX`，使用排除易混字符的随机字母表
- 非主人访问公开 Lineage 页面时不会看到 identity code 卡片，也不会泄露 code
- 前端显示使用服务端生成的稳定日期字符串，避免 locale 差异造成水合不一致

**涉及文件:**
- Schema: `src/lib/db/schema.ts`
- 新建: `src/actions/identity-code.ts`, `src/components/lineage/identity-code-card.tsx`
- 修改: `src/app/[username]/[catname]/lineage/page.tsx`, `drizzle/meta/_journal.json`

**验证结果:**
- `pnpm db:generate` 通过
- `pnpm db:push` 成功将 `cat_identity_codes` schema 同步到 Neon
- 直接查询 Neon 确认表、enum、unique index、active-code partial unique index 均已存在
- 事务内约束测试通过：同一只猫不能有多个 active code，code 全局唯一
- Vercel dev 未登录公开页烟测通过：`/{username}/{catname}/lineage` 返回 200，但不显示 Global Identity 卡片、不泄露 code；临时测试用户已删除，dev server 已停止
- 复测通过：并发复用逻辑与稳定日期显示改动后，重新跑 `pnpm lint`、`pnpm build`、身份码约束测试、Vercel dev 公开页隐私烟测
- `pnpm lint` 通过
- `pnpm build` 通过

### 2026-04-11 — Profile 增强 Phase 1: 日常打卡 + 视频支持 + 媒体压缩

**数据库变更:**
- 新增枚举: `post_media_type` (none/image/video), `bowel_status` (normal/soft/hard/diarrhea/constipation/none)
- 新增表: `daily_checkins` — 每日状态打卡（食欲1-5、精力1-5、排便状态、心情emoji、备注），每猫每天限一条（唯一索引 catId+date）
- 扩展表: `timeline_posts` 新增列 — `video_url`, `media_type`, `is_health_alert`, `tags`
- 迁移文件: `drizzle/0001_lush_zodiak.sql`

**媒体压缩管线:**
- 图片: `browser-image-compression` 客户端自动压缩（WebP, ≤1MB, max 1920px），所有上传入口统一走压缩
- 视频: 客户端预检（30s/720p/20MB），通过 Vercel Blob 客户端直传（绕过 serverless 内存限制）
- 改造: cat-form、profile-settings-form、post-form 均接入压缩管线

**新增功能:**
- 每日打卡表单: emoji 选择食欲/精力/心情 + 排便分段按钮 + 可选备注，无需打字即可记录
- 视频帖子: 时间线支持上传视频（MP4/WebM/MOV），原生 video 播放器
- 健康警示标签: 发帖时可标记"Health Alert"，时间线中醒目显示红色标签
- 打卡摘要卡片: 已打卡时显示今日状态摘要，未打卡时显示打卡表单

**涉及文件:**
- Schema: `src/lib/db/schema.ts`
- 新建: `src/lib/media/compress.ts`, `src/lib/media/video-check.ts`, `src/lib/validators/checkin.ts`, `src/lib/validators/timeline.ts`, `src/app/api/blob/upload/route.ts`, `src/actions/checkin.ts`, `src/components/checkin/daily-checkin-form.tsx`, `src/components/checkin/checkin-summary.tsx`, `src/components/timeline/video-player.tsx`
- 修改: `src/actions/timeline.ts`, `src/components/timeline/post-form.tsx`, `src/components/cat/cat-form.tsx`, `src/components/settings/profile-settings-form.tsx`, `src/app/[username]/[catname]/timeline/page.tsx`
- 依赖: `browser-image-compression`

### 2026-04-10 — 社交时间线 MVP

**Phase 15: Social Timeline**
- 新增 `timeline_posts` 表（content, image_url, cat_id, author_id, created_at）
- 发帖 Server Action：文字必填（最长 1000 字符）+ 可选图片（Vercel Blob 存储）
- 删帖 Server Action：验证所有权，清理 Blob 图片
- Timeline 页面 `/{username}/{catname}/timeline`：时间线列表 + 发帖表单（仅主人可见）
- 启用 Profile Tabs 中的 Timeline tab（之前为 disabled 占位）
- 涉及文件: `src/lib/db/schema.ts`, `src/actions/timeline.ts`, `src/app/[username]/[catname]/timeline/page.tsx`, `src/components/timeline/post-form.tsx`, `src/components/timeline/delete-post-button.tsx`, `src/components/cat/profile-tabs.tsx`

### 2026-04-11 — 自定义域名 cathub.ai 上线

- Vercel 添加 `cathub.ai` + `www.cathub.ai` 自定义域名
- Cloudflare DNS 配置完成：A 记录 `@` → `76.76.21.21`，CNAME `www` → `cname.vercel-dns.com`（均为 DNS only 模式）
- Vercel 自动签发 SSL 证书，HTTPS 可用
- 域名已生效，项目正式上线 **https://cathub.ai**

### 2026-04-10 — 项目结构扁平化 + GitHub 自动部署

**Phase 14: Flatten & Auto-Deploy**
- 将 `frontend/` 子目录的所有内容移到项目根目录，消除不必要的 monorepo 结构
- Vercel Git Integration 连接 GitHub 仓库，`git push origin main` 自动触发 Production 部署
- 更新 `DEVLOG.md`、`ref/DEPLOYMENT.md` 中所有 `frontend/` 路径引用
- 首次自动部署验证通过（48s，● Ready）
- 涉及文件: 全部文件从 `frontend/` 移至根目录

### 2026-04-10 — 用户头像上传 + Vercel Blob 存储迁移

**Phase 13: Avatar Upload & Cloud Storage**
- 图片存储从本地文件系统（`public/uploads/`）迁移到 **Vercel Blob**（云端持久化）
  - `cat-images.ts` 重写：`fs.writeFile` → `@vercel/blob` 的 `put`/`del`
  - 猫头像上传路径 `cats/{filename}`，用户头像 `users/{filename}`
  - `deleteStoredAvatar()` 只处理 `https://` URL，兼容旧本地路径
- 在 Vercel Dashboard 创建 **cathub-blob** Blob Store（public, iad1 区域），连接到所有环境
- `next.config.ts` 添加 `*.public.blob.vercel-storage.com` 图片域名白名单
- 新增**用户头像上传**功能：
  - Settings 页面 Profile Settings 区域新增头像上传 UI（预览 + 文件选择）
  - `updateProfile` action 处理 multipart/form-data，上传到 Vercel Blob，更新 `users.avatar_url`
  - 上传新头像时自动删除旧头像（从 Blob store 清理）
- 用户头像显示在三个位置：导航栏 UserMenu、Settings 页面、公开 Profile 页面（`/{username}`）
- Auth.js session callback 已有 `image: user.avatarUrl` 映射，无需额外改动
- 涉及文件: `src/lib/storage/cat-images.ts`, `src/actions/user.ts`, `src/components/settings/profile-settings-form.tsx`, `src/components/layout/user-menu.tsx`, `src/app/[username]/page.tsx`, `src/app/(main)/settings/page.tsx`, `next.config.ts`, `package.json`

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
- 已在 Vercel 团队 `ray's projects` 下创建并链接 `cathub` 项目，`.vercel/project.json` 已写入项目与团队 ID
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
| `/{username}/{catname}/lineage` | 公开/私有 | 三代血缘图谱与内部父母关联 |
| `/{username}/{catname}/timeline` | 公开/私有 | 社交时间线 + 日常打卡 |

---

## 待完成

- [x] ~~数据库部署~~ → Neon Postgres via Vercel Storage（2026-04-09 完成）
- [x] ~~Vercel 部署配置~~ → Production: `cathub-bice.vercel.app`（2026-04-09 完成）
- [x] ~~Preview 环境 `AUTH_SECRET` 配置~~ → Dashboard 手动添加（2026-04-10 完成）
- [x] ~~头像上传迁移到 Vercel Blob~~ → 用户 + 猫头像均已迁移（2026-04-10 完成）
- [x] ~~GitHub 自动部署~~ → Vercel Git Integration，push 自动触发（2026-04-10 完成）
- [x] ~~项目结构扁平化~~ → `frontend/` 移至根目录（2026-04-10 完成）
- [x] ~~社交时间线~~ → Timeline MVP 完成（2026-04-10）
- [x] ~~内部血缘关联~~ → Lineage Graph Phase 2 完成（2026-04-12）
- [x] ~~主人身份码生成~~ → Owner-only Identity Codes 完成（2026-04-12）
- [ ] 外部二维码连接请求
- [ ] Breeding Branch / Litter 繁育计划
- [ ] 医生三代摘要 / 繁育五代血统书导出
- [ ] 响应式细节优化
- [ ] SEO metadata 完善
