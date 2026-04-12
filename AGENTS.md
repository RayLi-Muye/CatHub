<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CatHub Agent Rules

## Single Source Of Truth

`AGENTS.md` is the authoritative rule file for all coding agents in this repo.

Do not duplicate or redefine these rules in other agent-specific files. If an agent-specific entry file is needed, it must point back to `AGENTS.md`.

`CLAUDE.md` intentionally only references `AGENTS.md`.

## Required Reading Order

Before making changes, read:

1. `AGENTS.md`
2. `docs/CONTEXT.md`
3. `DEVLOG.md`
4. Relevant source files for the task

For Next.js changes, also read the relevant guide in `node_modules/next/dist/docs/` before editing code.

## Documentation Rules

Every code change must update project documentation.

Use this routing:

- Update `DEVLOG.md` with the current work summary, validation results, and next step.
- Update `docs/CONTEXT.md` when current product behavior, architecture, routes, commands, data model, roadmap, or decisions change.
- Update `docs/HISTORY.md` for detailed historical notes that should not live in the short `DEVLOG.md`.
- Keep `DEVLOG.md` short and current. Do not let it become the full archive again.

## DEVLOG.md Shape

`DEVLOG.md` should contain only:

- Current status summary
- Recent changes, usually latest 3-5 items
- Current next step
- Links to `docs/CONTEXT.md` and `docs/HISTORY.md`
- Latest validation status

Move older detailed entries to `docs/HISTORY.md`.

## CONTEXT.md Shape

`docs/CONTEXT.md` should describe the current truth of the project:

- Product purpose
- Current implemented features
- Current routes
- Data model highlights
- Local development commands
- Validation commands
- Current roadmap
- Confirmed product decisions
- Known gaps or risks

## Development Rules

- This project uses Next.js 16. Do not assume framework behavior from memory.
- Every Server Action must perform its own authentication and authorization checks.
- Before committing code, run `pnpm lint` and `pnpm build`.
- For schema changes, run `pnpm db:generate`.
- Use `pnpm db:push` only when intentionally syncing the active development database.
- Never commit `.env*`, logs, build output, or test scratch files.
- Preserve user changes. Do not revert unrelated work.
