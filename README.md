# CatHub

CatHub is an AI cat digital-twin platform for cat identity, care records,
social timeline sharing, lineage tracking, and a native mobile companion.

## Start Here

- [Project vision](VISION.md)
- [Current context](docs/CONTEXT.md)
- [GitHub workflow](docs/GITHUB_WORKFLOW.md)

## Quick Start

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

For mobile UI-only work that should not depend on a running CatHub API,
database, or Blob configuration, enable the first mock slice:

```bash
EXPO_PUBLIC_MOBILE_API_MODE=mock pnpm mobile
pnpm mobile:mock-api:check
pnpm mobile:mock-preview:check
```

For real mobile API testing on a non-default local port:

```bash
EXPO_PUBLIC_API_PORT=3100 pnpm mobile
pnpm mobile:dev-api:check
```

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

## Documentation Map

- [VISION.md](VISION.md) - product thesis, roadmap horizons, and maintenance
  alignment.
- [docs/CONTEXT.md](docs/CONTEXT.md) - current product truth, routes, data
  model, local commands, validation, and known risks.
- [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) - issue, branch, PR,
  check, merge, and owner authorization rules.
- [DEVLOG.md](DEVLOG.md) - current status, recent changes, validation, and next
  step.
- [docs/HISTORY.md](docs/HISTORY.md) - longer historical implementation notes.

## Maintenance Boundaries

Routine maintenance follows the GitHub-native flow: issue, `codex/` topic
branch, pull request, checks, then review or low-risk green merge under the
standing authorization documented in [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md).

Production deploys, formal releases/tags/package publishing, real
production/cloud resource operations, sensitive credential use, destructive git
operations, and major product direction changes still require separate explicit
owner approval.
