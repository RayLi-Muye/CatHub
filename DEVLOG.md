# CatHub Devlog

> Documentation maintenance rules live in `AGENTS.md`.
> Current project truth lives in `docs/CONTEXT.md`.
> Full historical notes live in `docs/HISTORY.md`.

---

## Current Status

CatHub is in MVP development. The web app currently supports account auth, cat profiles, avatar uploads through Vercel Blob, health records, weight logs, social timeline posts, daily check-ins, video posts, and lineage tracking. The Expo React Native mobile app now has mobile auth endpoints, login/register screens, token storage, dashboard cat list, manual identity-code connect, and QR-code scanning for lineage connection requests.

The lineage system now supports:

- Internal parent links for cats owned by the same user.
- Recursive ancestor and descendant views with user-selectable display depth.
- Owner-only identity codes.
- External identity-code connection requests that require the shared cat owner to accept before an external lineage edge is confirmed.

---

## Recent Changes

### 2026-04-30 - Mobile QR Scan For Identity Codes

- Added `expo-camera` (`~55.0.16`) to the mobile workspace and configured the camera permission via the `expo-camera` config plugin in `mobile/app.json`.
- Added `mobile/app/scan.tsx`: a `CameraView` QR scanner that accepts either the `cathub://connect?code=...` deep link or a raw `CAT-XXXX-XXXX-XXXX` payload, validates with `identityCodeSchema` from `@cathub/shared`, and forwards to `/connect` with the parsed code.
- Permission flow handles unprompted, can-ask-again, and denied states with a manual-entry fallback.
- Added a "Scan QR" tertiary button on `mobile/app/connect.tsx` and a Scan QR / Enter code action row on `mobile/app/dashboard.tsx`.
- The full lineage connection request flow is now: scan QR → /connect prefilled → cat lookup → choose own cat + sire/dam → submit.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm --filter @cathub/mobile exec expo install --check`
- `pnpm lint`
- `pnpm build`
- Camera and on-device scanning not yet exercised; an iOS dev build is required (Xcode currently not available on this machine).

### 2026-04-30 - Local API Server + Identity QR

- Started the local Next.js API server on `localhost:3000` in a detached `screen` session named `cathub-api`.
- Verified `/api/mobile/auth/me` returns `401 Not authenticated`, confirming the mobile API layer is reachable without touching the database.
- Added QR rendering to the owner-only identity code card using `qrcode`.
- QR payload opens `cathub://connect?code=...`; mobile `/connect` now pre-fills the code from that deep-link query.

Validation:

- `pnpm --filter @cathub/mobile typecheck`
- `pnpm --filter @cathub/shared typecheck`
- `pnpm lint`
- `pnpm build`

### 2026-04-29 - Mobile Manual Identity Connect

- Added `/api/mobile/connect/identity-code` for authenticated identity-code lookup and external lineage request creation.
- Added `mobile/app/connect.tsx` with manual identity-code search, parent preview, own-cat selection, sire/dam selection, optional note, and request submission.
- Added a Dashboard entry point for mobile identity-code connection.
- Extended shared mobile API types for identity-code lookup and lineage request responses.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm --filter @cathub/mobile exec expo install --check`
- `pnpm lint`
- `pnpm build`

### 2026-04-29 - Mobile Auth + Dashboard Slice

- Added mobile JSON APIs: `/api/mobile/auth/login`, `/api/mobile/auth/register`, `/api/mobile/auth/me`, and `/api/mobile/dashboard`.
- Added `src/lib/mobile-auth.ts` with signed mobile Bearer tokens; mobile auth is intentionally separate from Auth.js browser cookies.
- Added mobile login, registration, session restore, sign-out, and dashboard cat-list screens.
- Added `expo-secure-store` for native token storage, with `localStorage` fallback for Expo Web previews.
- Added `pnpm mobile:ios:run` for local iOS simulator development builds once full Xcode is installed.
- Confirmed this machine currently points at Command Line Tools only, so `xcodebuild` and `xcrun simctl` are unavailable until full Xcode is installed and selected.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm --filter @cathub/mobile exec expo install --check`
- `pnpm lint`
- `pnpm build`

### 2026-04-29 - Mobile Workspace Scaffold

- Added `pnpm-workspace.yaml` with `mobile/` and `packages/*` workspaces while leaving the current Next.js web app at the repository root.
- Added `mobile/` as an Expo SDK 55 TypeScript app using Expo Router, typed routes, and the `cathub://` scheme.
- Added `packages/shared/` with shared app constants, lineage role/sex types, identity-code validation, and an `ApiResult<T>` response shape.
- Added root mobile scripts: `pnpm mobile`, `pnpm mobile:ios`, `pnpm mobile:android`, and `pnpm mobile:web`.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm --filter @cathub/mobile exec expo install --check`
- `pnpm lint`
- `pnpm build`

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

---

## Next Step

Recommended next feature slice:

1. Mobile cat detail / health / timeline read-only screens, fed by new `/api/mobile/cats/[id]` endpoints.
2. Mobile timeline post creation with `expo-image-picker` + Vercel Blob direct upload via signed URLs from a new `/api/mobile/blob/sign` endpoint.
3. Daily check-in form on mobile.
4. Mobile token refresh/revocation or session table before production use.
5. iOS dev build via EAS once Xcode is available, to exercise the camera scanner end-to-end.

---

## Useful Links

- Current context: `docs/CONTEXT.md`
- Full history: `docs/HISTORY.md`
- Agent rules: `AGENTS.md`
- Deployment notes: `ref/DEPLOYMENT.md`
