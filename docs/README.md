# CatHub Documentation

This directory holds the project documentation that should stay useful to
maintainers, reviewers, and coding agents. Use this page as the docs index; use
`docs/CONTEXT.md` as the current project truth.

## Start Here

- [`../README.md`](../README.md) - repository quick start.
- [`../VISION.md`](../VISION.md) - product thesis, pillars, roadmap horizons,
  assumptions, and non-goals.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - high-level system boundaries, runtime
  surfaces, and known architecture risks.
- [`CONTEXT.md`](CONTEXT.md) - current implemented behavior, routes, data model,
  commands, validation, and known risks.
- [`DEVELOPMENT.md`](DEVELOPMENT.md) - local development and validation baseline.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) - contribution flow, docs routing,
  validation expectations, and owner approval boundaries.
- [`GITHUB_WORKFLOW.md`](GITHUB_WORKFLOW.md) - issue, branch, PR, checks, and
  merge decision workflow.
- [`adr/README.md`](adr/README.md) - architecture decision record index and
  template.
- [`HISTORY.md`](HISTORY.md) - longer historical implementation notes.

## Current Documentation Roles

- Keep `README.md` short and oriented around first-run commands.
- Keep `CONTRIBUTING.md` focused on how to contribute safely.
- Keep `VISION.md` focused on product direction and roadmap alignment.
- Keep `docs/ARCHITECTURE.md` focused on high-level system boundaries and risks.
- Keep `docs/CONTEXT.md` focused on the current truth of the product and repo.
- Keep `docs/DEVELOPMENT.md` focused on local setup, mock/dev API modes, and
  validation commands.
- Keep ADRs focused on durable technical decisions, tradeoffs, and consequences.
- Keep `DEVLOG.md` short and current; move old implementation detail to
  `docs/HISTORY.md`.

## Owner-Decision Follow-Ups

These docs are intentionally not drafted yet because they require explicit owner
decisions rather than routine maintenance:

- `LICENSE` - requires owner-approved licensing terms.
- `SECURITY.md` - requires an owner-approved security reporting contact and
  disclosure policy.
- `CODE_OF_CONDUCT.md` - requires owner-approved community policy adoption and
  enforcement expectations.

Do not invent these policy commitments in routine maintenance PRs.

## Future Documentation Candidates

Useful next docs can be added through the GitHub-native issue and PR flow:

- Release and deployment runbooks after owner-controlled production choices are
  settled.
- Mobile production readiness docs once EAS, store metadata, reviewer access,
  privacy, moderation, and QA seed data are owner-approved.
- API examples once the mobile API surface stabilizes enough to document as a
  reusable contract.
