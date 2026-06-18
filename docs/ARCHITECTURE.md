# CatHub Architecture

This page summarizes the current architecture on `main` plus accepted pull
requests. For the canonical current feature list, routes, commands, and risks,
use `docs/CONTEXT.md`. For product direction, use `VISION.md`.

## System Shape

CatHub is a pnpm workspace with three main surfaces:

- Root Next.js app: web UI, server actions, API routes, database access, auth,
  and media upload integration.
- Expo mobile app in `mobile/`: native/mobile-web client for daily companion
  workflows.
- Shared package in `packages/shared/`: cross-platform constants, payload
  shapes, and schemas used by mobile and server code.

The current production-oriented data and API authority stays in the Next.js
app. Mobile is intentionally a thin client over explicit mobile JSON APIs,
with a mock/dev API mode for local UI-only preview work.

## Runtime Boundaries

```text
Web browser
  -> Next.js App Router pages and server actions
  -> Auth.js session, Drizzle, PostgreSQL/Neon, Vercel Blob

Expo mobile app
  -> mobile/src/lib/api.ts
  -> /api/mobile/* JSON routes with Bearer tokens
  -> Drizzle, PostgreSQL/Neon, Vercel Blob where server routes need uploads

Mobile mock preview
  -> EXPO_PUBLIC_MOBILE_API_MODE=mock
  -> mobile/src/lib/mock-api.ts
  -> no Next.js server, database, Blob, or network dependency for first slice
```

## Repository Map

- `src/app/` - Next.js App Router pages and API routes.
- `src/actions/` - server actions for web workflows.
- `src/components/` - web UI components.
- `src/lib/auth/` - Auth.js configuration and helpers.
- `src/lib/db/` - Drizzle database client and schema.
- `src/lib/lineage/` - lineage graph and request helpers.
- `src/lib/media/` and `src/lib/storage/` - media validation and storage
  integration.
- `mobile/app/` - Expo Router screens.
- `mobile/src/lib/api.ts` - mobile live API client.
- `mobile/src/lib/mock-api.ts` - mobile mock API first slice.
- `mobile/src/lib/token-store.ts` - native/web token persistence.
- `packages/shared/src/` - shared constants, types, and schemas.
- `scripts/` - local validation guards.
- `docs/` - project documentation and decision records.

## Auth And Authorization

Web auth uses Auth.js credentials sessions. Mobile auth uses explicit
`/api/mobile/*` JSON endpoints and Bearer tokens instead of browser cookies.

Every Server Action must perform its own authentication and authorization
checks. Mobile API routes should also authenticate the token and authorize the
specific resource on every request. Resource ownership and public/private cat
visibility are part of the API boundary, not just UI state.

## Data And Storage

Drizzle ORM maps CatHub data to PostgreSQL/Neon. Current core domains include:

- users
- cats
- cat images
- health records
- weight logs
- timeline posts
- daily check-ins
- lineage edges
- identity codes
- lineage connection requests

Vercel Blob is used for uploaded media. Production data, cloud resources, and
sensitive credentials require separate explicit owner approval before use.

## Mobile API Strategy

Mobile should stay a fast daily companion while Next.js remains the backend/API
authority for now.

Current mobile API strategy:

- Prefer explicit `/api/mobile/*` routes for mobile contracts.
- Keep shared payload types in `packages/shared` when they need to cross
  mobile/server boundaries.
- Use `mobile:dev-api:check` to guard local live API URL fallback behavior.
- Use `EXPO_PUBLIC_MOBILE_API_MODE=mock` for first-slice UI-only previews.
- Use `mobile:mock-api:check` and `mobile:mock-preview:check` to guard the mock
  boundary.

The current mock slice covers login, register, current user, and dashboard. It
intentionally does not pretend to cover cat detail, create/edit, timeline,
health, weight, lineage, QR scan, or media upload paths yet.

## Documentation And Validation

Architecture-affecting changes should update:

- `docs/CONTEXT.md` for current behavior, routes, commands, and risks.
- `docs/ARCHITECTURE.md` when system boundaries change.
- `docs/adr/README.md` or a new ADR when a decision should be preserved with
  context and tradeoffs.
- `DEVLOG.md` for current status and validation.

Default validation for code changes remains:

```bash
pnpm lint
pnpm build
```

Use focused checks from `docs/DEVELOPMENT.md` when editing mobile, shared,
schema, mock/dev API, or docs-only surfaces.

## Known Architecture Risks

- `docs/CONTEXT.md` is still the current truth; this overview can drift if it is
  not updated alongside boundary changes.
- Some mobile production-readiness work may exist in local dirty workspaces or
  unmerged branches. Treat only `main` plus merged PRs as public repo truth.
- Mobile mock mode is intentionally partial. Do not treat unsupported paths as
  implemented mock coverage.
- Splitting mobile into an independent backend is a non-goal unless a concrete
  issue proves it reduces development or production risk.
- License, security disclosure, and code of conduct docs require owner-approved
  policy decisions before they are added.
