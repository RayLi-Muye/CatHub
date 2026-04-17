# CatHub Devlog

> Documentation maintenance rules live in `AGENTS.md`.
> Current project truth lives in `docs/CONTEXT.md`.
> Full historical notes live in `docs/HISTORY.md`.

---

## Current Status

CatHub is in MVP development. The app currently supports account auth, cat profiles, avatar uploads through Vercel Blob, health records, weight logs, social timeline posts, daily check-ins, video posts, and lineage tracking.

The lineage system now supports:

- Internal parent links for cats owned by the same user.
- Recursive ancestor and descendant views with user-selectable display depth.
- Owner-only identity codes.
- External identity-code connection requests that require the shared cat owner to accept before an external lineage edge is confirmed.

---

## Recent Changes

### 2026-04-17 - Global Frosted Glass + Cat Paw Cursor

- Added `src/components/layout/cat-paw-overlay.tsx` exporting `CatPawOverlay` and `GlassOverlay`.
- `CatPawOverlay` renders an SVG cat paw (semi-realistic, cute, 5-claw) that lerps toward the pointer, rotates to face it, and performs a claw-swipe pulse on fast pointer motion or after ~2.5s idle with cursor on screen.
- Per-swipe color randomized from a warm palette (brand orange, flame, sunshine 700, bright yellow, pink variants) that fits DESIGN.md warm spectrum.
- `GlassOverlay` is a full-screen fixed layer (`z-index: 1`) with `backdrop-filter: blur(26px) saturate(1.25)` that blurs the paw painted below it, leaving page content sharp.
- Added `.glass-overlay` utility in `globals.css` with light/dark tinted variants.
- Root layout wraps content in `relative z-10` wrapper so Navbar/main/Footer stay above the glass.
- Gated by `(pointer: fine)` and `prefers-reduced-motion: no-preference` — overlay is inert on touch-only devices and users who opt out of motion.

Validation:

- Lint / build not run in this worktree (node_modules not installed here). User to run `pnpm install && pnpm lint && pnpm build` before commit.
- Manual smoke test recommended: landing page pointer tracking, dashboard readability, lineage page contrast.

### 2026-04-12 - Documentation Structure For Multi-Agent Work

- `AGENTS.md` expanded into the single source of truth for all coding-agent rules.
- `CLAUDE.md` remains a pointer to `AGENTS.md`.
- Old detailed `DEVLOG.md` moved to `docs/HISTORY.md`.
- New `docs/CONTEXT.md` added as the quick project context file for humans and agents.
- `DEVLOG.md` reduced to a short current-progress entry point.

Validation:

- Documentation-only change.
- `git diff --check` passed.

### 2026-04-12 - External Lineage Connection Requests

- Added `lineage_connection_requests` and `lineage_connection_status`.
- Added owner-only external identity-code request form on the Lineage page.
- Added Dashboard incoming/outgoing lineage request review.
- Added request / accept / decline / cancel Server Actions with action-level auth checks.
- Confirming a request writes an external `cat_lineage_edges` row only after responder approval.
- Cycle checks recurse through the full confirmed descendant path and are not limited by UI display depth.

Validation:

- `pnpm db:generate`
- `pnpm db:push`
- `pnpm lint`
- `pnpm build`
- Database transaction tests for pending request constraints, accepted external edge, and 30-generation cycle detection.
- Vercel dev logged-in smoke test for Dashboard request visibility and owner Lineage external request form.

### 2026-04-12 - Owner Identity Codes

- Added `cat_identity_codes` and `cat_identity_code_visibility`.
- Added owner-only identity code card on the Lineage page.
- Non-owners cannot see identity codes on public Lineage pages.

Validation:

- `pnpm db:generate`
- `pnpm db:push`
- `pnpm lint`
- `pnpm build`
- Database uniqueness checks and Vercel dev public privacy smoke test.

### 2026-04-12 - Internal Lineage Graph

- Added `cat_lineage_edges` DAG model for parent -> child relationships.
- Added internal sire/dam linking for cats owned by the same user.
- Added recursive ancestor and descendant display.
- Added display-depth selector with `?generations=3|4|5|6|all`.

Validation:

- `pnpm db:generate`
- `pnpm db:push`
- `pnpm lint`
- `pnpm build`
- Recursive query and constraint transaction tests.

---

## Next Step

Recommended next feature slice:

1. Generate QR codes for existing owner identity codes.
2. Add a `/connect` entry page for scanned or manually entered identity codes.
3. Reuse the existing external request / accept / decline / cancel flow.

---

## Useful Links

- Current context: `docs/CONTEXT.md`
- Full history: `docs/HISTORY.md`
- Agent rules: `AGENTS.md`
- Deployment notes: `ref/DEPLOYMENT.md`
