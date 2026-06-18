# CatHub Development

This guide is the local development and validation baseline for CatHub. The
current product truth lives in `docs/CONTEXT.md`; this file focuses on how to
run and verify the repo.

## Prerequisites

- Node.js compatible with the pinned workspace dependencies.
- pnpm. If it is not installed globally, use the pinned package manager through
  `npx pnpm@10.33.2 <command>`.
- For local web runtime that mirrors Vercel behavior, use Vercel CLI through the
  existing package scripts.
- For native iOS Simulator work, install full Xcode, select it with
  `xcode-select`, open Xcode once, and install an iOS runtime.

Install dependencies:

```bash
pnpm install
```

## Web Development

Preferred local web runtime:

```bash
pnpm dev:vercel
```

The root app is the current Next.js web/API surface. This project uses Next.js
16; before editing Next.js code, read the relevant guide in
`node_modules/next/dist/docs/`.

Every Server Action must perform its own authentication and authorization
checks.

## Mobile Development

Start Expo:

```bash
pnpm mobile
```

Focused mobile commands:

```bash
pnpm mobile:ios
pnpm mobile:ios:run
pnpm mobile:android
pnpm mobile:web
```

Mobile auth uses explicit `/api/mobile/*` JSON endpoints with Bearer tokens.
Keep mobile API auth and resource authorization checks explicit when changing
mobile routes or clients.

## Mobile API Modes

Use real API mode when testing against a running CatHub API and development
database. The mobile API client falls back to localhost when no full base URL is
set:

```bash
EXPO_PUBLIC_API_PORT=3100 pnpm mobile
pnpm mobile:dev-api:check
```

Use the full base URL override when testing from a physical device or remote
preview:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<host>:<port> pnpm mobile
```

Use mock mode for the first local UI-only preview path when the API, database,
Blob, or auth path is unavailable:

```bash
EXPO_PUBLIC_MOBILE_API_MODE=mock pnpm mobile
pnpm mobile:mock-api:check
pnpm mobile:mock-preview:check
```

The current mock slice covers login, register, current user, and dashboard. It
intentionally returns a clear unsupported error for cat detail, create/edit,
timeline, health, weight, lineage, QR scan, and media upload paths.

## Validation Matrix

Before code changes are merged:

```bash
pnpm lint
pnpm build
```

Focused checks:

```bash
pnpm --filter @cathub/shared typecheck
pnpm --filter @cathub/mobile typecheck
pnpm --filter @cathub/mobile exec expo install --check
pnpm mobile:dev-api:check
pnpm mobile:mock-api:check
pnpm mobile:mock-preview:check
```

For docs-only changes:

```bash
git diff --check
```

## Database And Schema

For schema changes:

```bash
pnpm db:generate
```

Use `pnpm db:push` only when intentionally syncing the active development
database. Do not use production data or production cloud resources without
separate explicit owner approval.

## Documentation Updates

Every code change should update documentation:

- `DEVLOG.md` for current summary, validation, and next step.
- `docs/CONTEXT.md` when product behavior, architecture, routes, commands, data
  model, roadmap, decisions, or risks change.
- `docs/HISTORY.md` for detailed historical notes that should not remain in the
  short devlog.

## Safety Boundaries

Never commit `.env*`, logs, build output, test scratch files, secrets, tokens,
private reviewer credentials, production data, or raw personal data.

Separate explicit owner approval is required for production deploys, formal
releases/tags/package publishing, real production/cloud resource operations,
sensitive credential use, destructive git operations, major product direction
changes, and policy documents such as `LICENSE`, `SECURITY.md`, or
`CODE_OF_CONDUCT.md`.
