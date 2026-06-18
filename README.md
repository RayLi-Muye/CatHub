# CatHub

CatHub turns each cat into a durable digital identity for owner-controlled
profiles, care records, social timeline sharing, lineage tracking, and a native
mobile companion.

The long-term direction is an AI cat digital-twin platform, but the current
MVP is focused on trustworthy records, explicit authorization boundaries, and
mobile workflows that can run against either real dev APIs or representative
mock data.

## Jump To

- [What CatHub Does](#what-cathub-does)
- [Who It Is For](#who-it-is-for)
- [Getting Started](#getting-started)
- [Local Development](#local-development)
- [Validation](#validation)
- [Documentation And Resources](#documentation-and-resources)
- [Status And Roadmap](#status-and-roadmap)
- [Contributing And Security Boundaries](#contributing-and-security-boundaries)

## What CatHub Does

- **Durable cat identity**: accounts, cat profiles, avatars, public owner/cat
  pages, slugs, and owner-controlled visibility.
- **Care reference**: health records, weight logs, daily check-ins, notes, and
  summary surfaces intended for long-term reference.
- **Social timeline**: text, image, and video posts with health-alert tagging
  and daily activity context.
- **Lineage graph**: internal parent links, owner identity codes, external
  lineage requests, responder approval, disputed/revoked history, and cycle
  protection.
- **Mobile-first companion**: Expo app scaffold for auth, dashboard, cat
  creation/editing/detail, posting, health/weight/check-in entry, lineage
  inbox, identity-code connect, and QR scan flows.
- **Shared API contracts**: explicit `/api/mobile/*` JSON endpoints, Bearer
  token mobile auth, and a shared package for cross-platform payloads and
  constants.
- **Mock/dev API workflow**: mobile development can target a real local API or
  a first mock slice for login/current-user/dashboard previews without a
  running database, Blob store, or API server.

## Who It Is For

- Cat owners who want one place for profile, care, timeline, and relationship
  records.
- Breeders, lineage-conscious owners, and multi-cat households that need
  confirmed parent links without transferring ownership.
- Mobile maintainers who need a fast local path for UI work while real API,
  auth, database, or upload services are unavailable.
- Future AI/graph work that needs clean consent, privacy, and data-quality
  foundations before model or virtual-pet features are treated as product
  commitments.

## Getting Started

Install dependencies:

```bash
pnpm install
```

If `pnpm` is not installed globally, use the pinned package manager through
`npx`:

```bash
npx pnpm@10.33.2 install
```

Run the preferred local web environment:

```bash
pnpm dev:vercel
```

Run the Expo mobile app:

```bash
pnpm mobile
```

## Local Development

Use mock mode for mobile UI-only work that should not depend on a running
CatHub API, database, auth path, or Blob configuration:

```bash
EXPO_PUBLIC_MOBILE_API_MODE=mock pnpm mobile
pnpm mobile:mock-api:check
pnpm mobile:mock-preview:check
```

Use the real local mobile API on a non-default port when port `3000` is busy:

```bash
EXPO_PUBLIC_API_PORT=3100 pnpm mobile
pnpm mobile:dev-api:check
```

Use the full base URL override for a physical phone or remote preview:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<host>:<port> pnpm mobile
```

The root app is the Next.js web/API surface. The `mobile/` workspace contains
the Expo React Native app, and `packages/shared/` contains cross-platform API
payloads and constants.

## Validation

Run these before code changes are merged:

```bash
pnpm lint
pnpm build
```

Common focused checks:

```bash
pnpm --filter @cathub/mobile typecheck
pnpm shared:typecheck
pnpm mobile:dev-api:check
pnpm mobile:mock-api:check
pnpm mobile:mock-preview:check
```

Schema changes require:

```bash
pnpm db:generate
```

Use `pnpm db:push` only when intentionally syncing the active development
database.

For docs-only changes:

```bash
git diff --check
```

## Documentation And Resources

- [Project vision](VISION.md)
- [Documentation index](docs/README.md)
- [Current context](docs/CONTEXT.md)
- [Development guide](docs/DEVELOPMENT.md)
- [GitHub workflow](docs/GITHUB_WORKFLOW.md)
- [Contributing guide](CONTRIBUTING.md)
- [Current devlog](DEVLOG.md)
- [Historical notes](docs/HISTORY.md)

The docs index also tracks owner-decision follow-ups such as licensing,
security reporting policy, and code of conduct policy. Those commitments are
not invented in routine maintenance PRs.

## Status And Roadmap

CatHub is in MVP development.

Current public repo focus:

- Keep the Next.js web product stable.
- Harden mobile auth, mobile API contracts, resource authorization, and local
  development flows.
- Finish mock/dev API decoupling so mobile UI work can continue when the real
  API, database, Blob, or auth path is unavailable.
- Keep GitHub issues, pull requests, checks, and docs aligned with the
  documented maintenance flow.

Read [VISION.md](VISION.md) for roadmap horizons and [docs/CONTEXT.md](docs/CONTEXT.md)
for the current implemented routes, data model, known gaps, and validation
expectations.

## Contributing And Security Boundaries

Routine maintenance follows the GitHub-native flow: issue, `codex/` topic
branch, pull request, checks, then review or low-risk green merge under the
standing authorization documented in [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md).

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening changes.

Production deploys, formal releases/tags/package publishing, real
production/cloud resource operations, sensitive credential use, destructive git
operations, and major product direction changes still require separate explicit
owner approval.

Do not include secrets, tokens, production data, raw personal data, private
reviewer credentials, or cloud credentials in issues, pull requests, comments,
logs, or committed files.
