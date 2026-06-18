# Contributing To CatHub

CatHub uses a GitHub-native maintenance flow: issue, topic branch, pull request,
checks, then review or merge decision. This guide is an onboarding summary. The
authoritative project rules remain in `AGENTS.md`, and the current project truth
remains in `docs/CONTEXT.md`.

## Start Here

Before opening non-trivial work, read:

- `AGENTS.md` for agent and development rules.
- `README.md` for quick-start commands.
- `VISION.md` for product pillars, roadmap horizons, and non-goals.
- `docs/CONTEXT.md` for current routes, data model, local commands, validation,
  and known risks.
- `docs/GITHUB_WORKFLOW.md` for issue, PR, checks, and owner authorization
  boundaries.

## Picking Work

Open or link a GitHub issue before starting non-trivial changes. The issue
should state:

- Problem and impact.
- Vision pillar or maintenance reason.
- In-scope and out-of-scope work.
- Acceptance criteria.
- Docs and validation expectations.
- Risks, rollback, and owner decision needs.

Keep pull requests focused. Split broad work when a smaller PR can be reviewed,
tested, and rolled back independently.

## Branches And Pull Requests

Use a topic branch. Agent-maintained branches should use the `codex/` prefix
unless the owner asks otherwise.

Every PR should:

- Link the issue it closes or advances.
- Describe exact scope.
- List local validation commands and GitHub/Vercel check status.
- Explain docs impact.
- Describe risk and rollback.
- Call out owner decisions that are still required.

GitHub/Vercel checks are gates. Triage and fix failing checks before expanding
scope.

## Local Development

Common commands:

```bash
pnpm install
pnpm dev:vercel
pnpm mobile
pnpm lint
pnpm build
```

Focused mobile mock/dev API checks:

```bash
pnpm mobile:dev-api:check
pnpm mobile:mock-api:check
pnpm mobile:mock-preview:check
```

Use `EXPO_PUBLIC_MOBILE_API_MODE=mock` for the first mobile UI-only preview path
when the real CatHub API, database, or Blob setup is unavailable. Use
`EXPO_PUBLIC_API_PORT=3100` or `EXPO_PUBLIC_API_BASE_URL=...` when testing
against a real local API on a non-default host or port.

For schema changes, run:

```bash
pnpm db:generate
```

Use `pnpm db:push` only when intentionally syncing the active development
database.

## Documentation Expectations

Every code change should update documentation.

- Update `DEVLOG.md` with the current work summary, validation, and next step.
- Update `docs/CONTEXT.md` when behavior, architecture, routes, commands, data
  model, roadmap, decisions, or risks change.
- Move detailed historical notes to `docs/HISTORY.md` instead of letting
  `DEVLOG.md` become a long archive.
- Keep README and CONTRIBUTING as entry points; keep `docs/CONTEXT.md` as the
  current project truth.

For docs-only changes, `git diff --check` is the minimum local validation unless
the issue or PR calls for more.

## Framework Notes

This project uses Next.js 16. Before editing Next.js code, read the relevant
guide in `node_modules/next/dist/docs/` and do not rely on older framework
conventions from memory.

Every Server Action must perform its own authentication and authorization
checks. Mobile APIs should keep explicit Bearer-token auth and resource
authorization checks.

## Safety Boundaries

Do not commit `.env*`, logs, build output, test scratch files, secrets, tokens,
private reviewer credentials, production data, or raw personal data.

Routine maintenance standing authorization allows creating or updating issues,
branches, commits, pushes, pull requests, CI fixes, ready/draft state, and
low-risk green PR merges when the work stays inside the documented issue.

These actions still require separate explicit owner approval:

- Production deploys.
- Formal releases, tags, or package publishing.
- Real production or cloud resource operations.
- Reading or using sensitive credentials.
- Store submission or store metadata changes.
- Destructive git operations.
- Major customer- or user-visible product direction changes.
- License, security disclosure, or code of conduct policy adoption.

Security-sensitive reports should not include secrets or raw personal data in
public issues. A formal security reporting policy and contact path still need an
owner-approved `SECURITY.md`.
