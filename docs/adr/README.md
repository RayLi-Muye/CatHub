# Architecture Decision Records

Use this directory for architecture decision records (ADRs) when a change
introduces a durable technical direction, tradeoff, or boundary that future
maintainers should not have to rediscover from code history.

No ADRs are recorded yet. Current architecture context lives in
`docs/ARCHITECTURE.md` and current project truth lives in `docs/CONTEXT.md`.

## When To Add An ADR

Add an ADR when a pull request changes or commits to one of these areas:

- Web/API/mobile boundary.
- Auth, authorization, privacy, or resource ownership model.
- Database schema strategy or migration approach.
- Storage, upload, or media processing architecture.
- Mobile mock/dev API strategy.
- Release, deployment, or environment model.
- Major dependency, framework, or package layout choice.

Do not use an ADR for routine implementation notes. Put short current status in
`DEVLOG.md` and detailed history in `docs/HISTORY.md`.

## File Naming

Use a monotonic, zero-padded filename:

```text
0001-short-decision-title.md
```

## Template

```markdown
# ADR 0001: Short Decision Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded

## Context

What problem or tradeoff forced a decision?

## Decision

What are we choosing?

## Consequences

What improves, what becomes harder, and what must future maintainers remember?

## Validation

Which tests, checks, docs, or runtime proof support the decision?

## Rollback Or Supersession

How can this be reverted or superseded later?
```
