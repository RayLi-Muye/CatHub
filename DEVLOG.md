# CatHub Devlog

> Documentation maintenance rules live in `AGENTS.md`.
> Current project truth lives in `docs/CONTEXT.md`.
> Full historical notes live in `docs/HISTORY.md`.

---

## Current Status

CatHub is in MVP development. The web app currently supports account auth, cat profiles, avatar uploads through Vercel Blob, health records, weight logs, social timeline posts, daily check-ins, video posts, and lineage tracking. The Expo React Native mobile app now has mobile auth endpoints, login/register screens, token storage, dashboard cat list, read-only cat detail screen with timeline/health/weight/check-in summary, owner-only timeline post creation with image upload, owner-only daily check-in entry, owner-only health record entry, owner-only weight log entry, owner-only cat profile editing, lineage inbox with accept/decline/cancel, manual identity-code connect, and QR-code scanning for lineage connection requests.

The lineage system now supports:

- Internal parent links for cats owned by the same user.
- Recursive ancestor and descendant views with user-selectable display depth.
- Owner-only identity codes.
- External identity-code connection requests that require the shared cat owner to accept before an external lineage edge is confirmed.

---

## Recent Changes

### 2026-05-02 - Mobile Cat Profile Editing

- Added `PATCH /api/mobile/cats/[catId]` accepting JSON with optional fields name, breed, sex, birthdate, description, colorMarkings, microchipId, isNeutered, isPublic. Owner-only; partial updates allowed.
- Renaming a cat re-runs the same `slugify` from `transliteration` used by the web action; same-owner slug collisions get a `${slug}-${timestamp}` suffix.
- Added `MobileCatUpdateInput`, `MobileCatUpdatePayload`, and `cat*Max` constants to `@cathub/shared`.
- Added `updateCat` in the mobile API client.
- Added `mobile/app/cats/[catId]/edit.tsx` with name/breed/birthdate/color/microchip/description text inputs, sex chip grid, neutered + public toggles, prefilled from `getCatDetail`. Non-owner access is rejected at load time.
- Detail screen top bar now shows an owner-only "Edit" button next to "Back".

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm lint`
- `pnpm build`
- End-to-end PATCH not exercised here; needs a logged-in mobile session against a real `DATABASE_URL`.

### 2026-05-02 - Mobile Lineage Inbox (Accept / Decline / Cancel)

- Added `GET /api/mobile/lineage/requests` returning pending incoming and outgoing lineage connection requests for the authenticated user, reusing the existing `getLineageConnectionInbox` query helper.
- Added `PATCH /api/mobile/lineage/requests/[requestId]` accepting `{ action: "accept" | "decline" | "cancel", responseNote? }`. Responder-only for accept/decline; requester-only for cancel. Accept replays the web action's full edge-creation logic: role/sex validation, cycle check, same-pair-other-role detection, and disputed-takeover when an existing same-role parent conflicts.
- Added `MobileLineageRequestSummary`, `MobileLineageInboxPayload`, `MobileLineageRespondAction`, and `MobileLineageRespondPayload` to `@cathub/shared`, plus `lineageResponseNoteMax`.
- Added `getLineageInbox` and `respondLineageRequest` in the mobile API client. Hardened the `request()` helper Content-Type check against undefined bodies.
- Added `mobile/app/inbox.tsx` with incoming/outgoing tabs, per-card accept/decline (incoming) or cancel (outgoing) actions, success/error banners, and post-action refresh.
- Dashboard now shows a "Lineage inbox" entry below the connect actions.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm lint`
- `pnpm build` (routes appear as `/api/mobile/lineage/requests` and `/api/mobile/lineage/requests/[requestId]`)
- End-to-end accept/decline/cancel not exercised here; needs a logged-in mobile session against a real `DATABASE_URL`.

### 2026-04-30 - Mobile Health Record + Weight Log Entry

- Added `POST /api/mobile/cats/[catId]/health` accepting JSON `{ type, title, date, description?, vetName?, vetClinic? }`. Owner-only.
- Added `POST /api/mobile/cats/[catId]/weights` accepting JSON `{ weightKg, recordedAt, notes? }`. Owner-only. `weightKg` validated as a positive number (≤ 50 kg) with up to 2 decimals.
- Added `healthRecordTypeValues`, `HealthRecordType`, `weightLog*` constants, `MobileHealthCreatePayload`, and `MobileWeightCreatePayload` to `@cathub/shared`.
- Added `createHealthRecord` and `createWeightLog` in the mobile API client.
- Added `mobile/app/cats/[catId]/health-new.tsx` (type chip grid, title, date, vet name/clinic, description) and `mobile/app/cats/[catId]/weight-new.tsx` (decimal-pad weight input, date, notes).
- Detail screen Health and Weight sections now show owner-only "New record" / "Log weight" actions, including when no prior entries exist.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm lint`
- `pnpm build` (routes appear as `/api/mobile/cats/[catId]/health` and `/api/mobile/cats/[catId]/weights`)
- End-to-end submission not exercised here; needs a logged-in mobile session against a real `DATABASE_URL`.

### 2026-04-30 - Mobile Daily Check-in Entry

- Added `POST /api/mobile/cats/[catId]/checkins` accepting JSON `{ date, appetiteScore (1-5), energyScore (1-5), bowelStatus, moodEmoji?, notes? }`. Owner-only. Same-day duplicates return 409.
- Added `bowelStatusValues`, `BowelStatus` type, `dailyCheckin*` constants, and `MobileCheckinCreatePayload` to `@cathub/shared`.
- Added `createDailyCheckin` in the mobile API client.
- Added `mobile/app/cats/[catId]/checkin-new.tsx` with date input (defaults to today), 1-5 appetite/energy tick selectors, bowel status options, emoji preset row plus custom emoji entry, and notes textarea.
- Detail screen now shows an owner-only "New check-in" action on the Latest check-in section, including when no prior check-in exists.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm lint`
- `pnpm build` (route appears as `/api/mobile/cats/[catId]/checkins`)
- End-to-end check-in submission not exercised here; needs a logged-in mobile session against a real `DATABASE_URL`.

### 2026-04-30 - Mobile Timeline Post Creation

- Added `POST /api/mobile/cats/[catId]/timeline` accepting multipart/form-data with `content`, optional `image` (JPEG/PNG/WEBP/GIF, 5 MB cap), optional `isHealthAlert`, and optional comma-delimited `tags`. Owner-only.
- Server uploads any attached image to Vercel Blob via `put()`, then inserts the timeline post and returns the created row as `MobileTimelineCreatePayload`.
- Added `expo-image-picker` (`~55.0.19`) to the mobile workspace and configured the photos permission via the `expo-image-picker` config plugin in `mobile/app.json`.
- Added `MOBILE_TIMELINE_*` constants and `MobileTimelineCreatePayload` to `@cathub/shared`.
- Updated the mobile API client `request()` helper to leave Content-Type unset when the body is FormData (so fetch generates the multipart boundary).
- Added `createTimelinePost` and `MobileTimelineImageInput` in `mobile/src/lib/api.ts`.
- Restructured `mobile/app/cats/[catId].tsx` into `mobile/app/cats/[catId]/index.tsx` and added `mobile/app/cats/[catId]/post-new.tsx` with content textarea, image picker preview, health-alert toggle, and submit flow that returns to the detail screen on success.
- Detail screen now exposes an owner-only "New post" action button on the Timeline section.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm --filter @cathub/mobile exec expo install --check`
- `pnpm lint`
- `pnpm build` (route appears as `/api/mobile/cats/[catId]/timeline`)
- End-to-end image upload not exercised here; needs a logged-in mobile session and a real `BLOB_READ_WRITE_TOKEN` in the API server environment.

### 2026-04-30 - Mobile Cat Detail Screen

- Added `GET /api/mobile/cats/[catId]` returning cat record, owner brief, last 10 timeline posts, last 5 health records, last 30 weight logs, and the latest daily check-in (owner only).
- Access rule: owners see any of their cats; other authenticated users only see cats with `isPublic = true`.
- Added `MobileCatDetailPayload` and supporting row types (`MobileCatTimelinePost`, `MobileCatHealthRecord`, `MobileCatWeightLog`, `MobileCatCheckin`) to `@cathub/shared`.
- Added `getCatDetail(catId)` in the mobile API client.
- Added `mobile/app/cats/[catId].tsx`: hero (avatar, owner, neutered/public flags, description), latest check-in card (owner only), recent weights, recent health, recent timeline posts.
- Dashboard cat rows are now `Pressable` and route to `/cats/{id}`.

Validation:

- `pnpm --filter @cathub/shared typecheck`
- `pnpm --filter @cathub/mobile typecheck`
- `pnpm lint`
- `pnpm build`
- The new route shows up as `/api/mobile/cats/[catId]` in the Next.js build output.

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

1. Paginated mobile feed lists (full timeline / full health / full weight chart) past the detail summary cap.
2. Switch mobile image upload to Vercel Blob client direct upload via a signed-URL endpoint to bypass the route-handler body size limit and lift the 5 MB cap toward video support.
3. Mobile cat avatar replace (separate slice from profile editing because it needs the image picker + multipart flow).
4. Mobile cat creation (currently only edit, not create — web is still the only place to add a cat).
5. Mobile token refresh/revocation or session table before production use.
6. iOS dev build via EAS once Xcode is available, to exercise scanner / image picker / forms / inbox / edit end-to-end.

---

## Useful Links

- Current context: `docs/CONTEXT.md`
- Full history: `docs/HISTORY.md`
- Agent rules: `AGENTS.md`
- Deployment notes: `ref/DEPLOYMENT.md`
