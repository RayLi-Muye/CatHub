# CatHub Context

This file is the quick context package for humans and coding agents. For rules, read `AGENTS.md`. For detailed historical notes, read `docs/HISTORY.md`.

---

## Product

CatHub is an AI cat digital-twin platform. The MVP focuses on cat identity, health tracking, social timeline, breeder-oriented lineage tracking, and a native mobile companion.

Current priority: build the mobile app foundation as a thin React Native client over explicit mobile APIs, while keeping the existing Next.js web app stable.

---

## Stack

- Next.js 16 App Router
- React 19
- Expo SDK 55 / React Native 0.83 mobile scaffold
- TypeScript
- Tailwind CSS v4
- shadcn/base-nova style components
- Drizzle ORM
- PostgreSQL / Neon
- Auth.js v5 credentials auth
- Vercel Blob for uploads
- Vercel dev for local environment simulation
- pnpm workspaces

Important: this repo uses Next.js 16. Read relevant docs in `node_modules/next/dist/docs/` before editing Next.js code.

Workspace layout:

- Root project remains the existing Next.js web app for now.
- `mobile/` contains the Expo React Native app.
- `packages/shared/` contains cross-platform constants, types, and schemas intended for both web/API/mobile use.

---

## Current Features

### Auth And Accounts

- Register and login with credentials.
- JWT-based Auth.js session.
- Account settings for profile and credentials.
- User avatar upload via Vercel Blob.

### Cat Profiles

- Create, edit, and delete cat profiles.
- Cat avatar upload via Vercel Blob.
- Public user pages at `/{username}`.
- Cat detail pages at `/{username}/{catname}`.
- Non-ASCII cat names are transliterated into ASCII slugs.

### Health

- Health records by type.
- Weight logs with SVG chart.
- Recent health summary on cat overview.

### Timeline

- Text posts.
- Image posts.
- Video posts with client-side validation.
- Health-alert tagging.
- Daily check-ins for appetite, energy, bowel status, mood, and notes.

### Global Visual Layer

- Site-wide frosted glass overlay blurs a fixed background layer; page content sits above the glass and stays sharp.
- An SVG cat paw follows the pointer with damped lerp and rotates to face the cursor; on fast motion or ~2.5s idle it performs a claw-swipe pulse in a random warm color.
- Gated by `(pointer: fine)` and honors `prefers-reduced-motion`.
- Implementation: `src/components/layout/cat-paw-overlay.tsx`, `.glass-overlay` utility in `src/app/globals.css`, mounted from `src/app/layout.tsx`.

### Lineage

- `cat_lineage_edges` models parent -> child relationships as a directed acyclic graph.
- Internal lineage: owner can link sire/dam from cats they own.
- External lineage: owner can request a parent link using another owner's identity code.
- Owner identity codes render as both text and QR; QR payload opens `cathub://connect?code=...`.
- External links require responder confirmation before a confirmed edge is created.
- Accepted external links are stored as `sourceType = external`.
- Existing conflicting same-role confirmed parent can be marked `disputed` when a new external claim is accepted.
- Removing internal parent links marks edges `revoked` instead of deleting.
- Ancestor and descendant views are recursive.
- UI display depth is user-selectable: `3`, `4`, `5`, `6`, or `all`.
- Logical cycle detection is not capped by the UI display depth.

### Mobile

- `mobile/` is initialized as an Expo SDK 55 TypeScript app.
- Expo Router is configured with typed routes and the `cathub://` deep-link scheme.
- The mobile app has login, registration, session restore, sign-out, and dashboard cat-list screens.
- Mobile auth uses explicit `/api/mobile/*` JSON endpoints with Bearer tokens instead of Auth.js browser cookies.
- Tokens are stored with `expo-secure-store` on native and `localStorage` on web previews.
- Mobile connect supports manual identity-code lookup and external lineage request creation.
- Mobile connect can prefill an identity code from `cathub://connect?code=...` deep links.
- Mobile QR scanning is wired via `expo-camera` at `mobile/app/scan.tsx`; scans accept the `cathub://connect?code=...` deep link or a raw `CAT-XXXX-XXXX-XXXX` payload, validate via `identityCodeSchema`, and forward to `/connect`.
- Camera permission is configured through the `expo-camera` config plugin in `mobile/app.json`.
- Mobile cat detail screen at `mobile/app/cats/[catId]/index.tsx` shows hero, latest check-in (owner only), recent weights (last 5), recent health records (last 5), and recent timeline posts (last 10), via `GET /api/mobile/cats/[catId]`.
- The detail endpoint allows owners on any cat and other authenticated users on public cats only.
- Owners can create timeline posts from `mobile/app/cats/[catId]/post-new.tsx` with optional image (JPEG/PNG/WEBP/GIF, 5 MB cap) via `expo-image-picker` + `POST /api/mobile/cats/[catId]/timeline`.
- Owners can record daily check-ins from `mobile/app/cats/[catId]/checkin-new.tsx` (date, appetite/energy 1-5, bowel status, mood emoji, notes) via `POST /api/mobile/cats/[catId]/checkins`. Same-day duplicates rejected with 409.
- Owners can add health records from `mobile/app/cats/[catId]/health-new.tsx` (type, title, date, vet name, vet clinic, description) via `POST /api/mobile/cats/[catId]/health`.
- Owners can log weights from `mobile/app/cats/[catId]/weight-new.tsx` (weightKg, recordedAt, notes) via `POST /api/mobile/cats/[catId]/weights`. Weight bounded to 0-50 kg with up to 2 decimals.
- Mobile lineage inbox at `mobile/app/inbox.tsx` shows pending incoming and outgoing requests in tabs. Responders can accept/decline incoming; requesters can cancel outgoing. Accept reuses the same edge creation logic as the web action (cycle check, role/sex validation, disputed-takeover when an existing same-role parent conflicts).
- Dashboard exposes a "Lineage inbox" entry below the connect actions.
- Owners can edit cat profiles from `mobile/app/cats/[catId]/edit.tsx` (name, breed, sex, birthdate, color, microchip, description, neutered toggle, public toggle) via `PATCH /api/mobile/cats/[catId]`. Renaming regenerates the slug; same-owner slug collisions get a timestamp suffix.
- Detail screen exposes an owner-only "Edit" button in the top bar.
- Owners can create new cats from `mobile/app/cats/new.tsx` via `POST /api/mobile/cats`. Dashboard exposes "Add cat" alongside "Lineage inbox" and refreshes the cat list on focus.
- Detail screen sections (Timeline, Health, Weight) each link to a full-list screen via "View all →":
  - `mobile/app/cats/[catId]/timeline.tsx` — paginated post list with "Load more"
  - `mobile/app/cats/[catId]/health.tsx` — paginated health record list with "Load more"
  - `mobile/app/cats/[catId]/weights.tsx` — full weight history (up to 200) with summary card (latest/min/max) and per-row bar visualizing weight relative to range
- The timeline POST endpoint accepts multipart/form-data (`content`, optional `image` file, optional `isHealthAlert`, optional `tags`), uploads images to Vercel Blob server-side, and inserts the post.
- Photo library permission is configured through the `expo-image-picker` config plugin in `mobile/app.json`.

---

## Current Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/dashboard` | Auth required | My cats and lineage request inbox/outbox |
| `/cats/new` | Auth required | Create cat profile |
| `/settings` | Auth required | Account settings |
| `/{username}` | Public | User public page |
| `/{username}/{catname}` | Public/private | Cat profile |
| `/{username}/{catname}/edit` | Owner only | Edit cat |
| `/{username}/{catname}/health` | Public/private | Health timeline |
| `/{username}/{catname}/health/new` | Owner only | Add health record |
| `/{username}/{catname}/lineage` | Public/private | Lineage graph, identity code, internal/external lineage tools |
| `/{username}/{catname}/timeline` | Public/private | Timeline and daily check-ins |
| `/api/mobile/auth/login` | Public | Mobile login JSON endpoint |
| `/api/mobile/auth/register` | Public | Mobile registration JSON endpoint |
| `/api/mobile/auth/me` | Mobile token required | Current mobile user |
| `/api/mobile/dashboard` | Mobile token required | Current user and owned cats for mobile dashboard |
| `/api/mobile/cats` (POST) | Mobile token required | Create a cat profile owned by the authenticated user |
| `/api/mobile/cats/[catId]` (GET) | Mobile token required | Cat detail summary (cat, recent timeline, recent health, recent weights, latest check-in) |
| `/api/mobile/cats/[catId]` (PATCH) | Mobile token required, owner only | Edit cat profile fields (name, breed, sex, birthdate, color, microchip, neutered, public toggle); regenerates slug on rename |
| `/api/mobile/cats/[catId]/timeline` (GET) | Mobile token required (public cat ok) | Paginated timeline posts (`offset`, `limit`, returns `nextOffset`) |
| `/api/mobile/cats/[catId]/timeline` (POST) | Mobile token required, owner only | Create a timeline post with optional image upload |
| `/api/mobile/cats/[catId]/checkins` (POST) | Mobile token required, owner only | Create a daily check-in (one per day per cat) |
| `/api/mobile/cats/[catId]/health` (GET) | Mobile token required (public cat ok) | Paginated health records (`offset`, `limit`, returns `nextOffset`) |
| `/api/mobile/cats/[catId]/health` (POST) | Mobile token required, owner only | Create a health record |
| `/api/mobile/cats/[catId]/weights` (GET) | Mobile token required (public cat ok) | Up to 200 most recent weight logs |
| `/api/mobile/cats/[catId]/weights` (POST) | Mobile token required, owner only | Create a weight log |
| `/api/mobile/lineage/requests` (GET) | Mobile token required | List pending incoming and outgoing lineage connection requests |
| `/api/mobile/lineage/requests/[requestId]` (PATCH) | Mobile token required | Accept/decline (responder) or cancel (requester) a pending request |
| `/api/mobile/connect/identity-code` | Mobile token required | Look up identity code and create external lineage request |

---

## Data Model Highlights

Core tables:

- `users`
- `cats`
- `cat_images`
- `health_records`
- `weight_logs`
- `timeline_posts`
- `daily_checkins`
- `cat_lineage_edges`
- `cat_identity_codes`
- `lineage_connection_requests`

Lineage-specific tables:

- `cat_lineage_edges`: confirmed/pending/disputed/revoked parent-child edges.
- `cat_identity_codes`: stable owner-only identity codes, globally unique.
- `lineage_connection_requests`: external connection requests requiring both sides before creating external confirmed edges.

Lineage-specific enums:

- `lineage_parent_role`: `sire`, `dam`, `unknown`
- `lineage_status`: `pending`, `confirmed`, `disputed`, `revoked`
- `lineage_source_type`: `internal`, `external`, `registry`, `import`
- `cat_identity_code_visibility`: `private`, `public`
- `lineage_connection_status`: `pending`, `accepted`, `declined`, `canceled`

---

## Key Files

- Schema: `src/lib/db/schema.ts`
- DB client: `src/lib/db/index.ts`
- Auth: `src/lib/auth/index.ts`
- Lineage graph helpers: `src/lib/lineage/graph.ts`
- Lineage recursive queries: `src/lib/lineage/queries.ts`
- Lineage request queries: `src/lib/lineage/connection-queries.ts`
- Internal lineage actions: `src/actions/lineage.ts`
- Identity code actions: `src/actions/identity-code.ts`
- External request actions: `src/actions/lineage-connections.ts`
- Lineage page: `src/app/[username]/[catname]/lineage/page.tsx`
- Dashboard: `src/app/(main)/dashboard/page.tsx`
- Mobile app entry: `mobile/app/_layout.tsx`, `mobile/app/index.tsx`
- Mobile screens: `mobile/app/login.tsx`, `mobile/app/register.tsx`, `mobile/app/dashboard.tsx`, `mobile/app/connect.tsx`, `mobile/app/scan.tsx`, `mobile/app/inbox.tsx`, `mobile/app/cats/new.tsx`, `mobile/app/cats/[catId]/index.tsx`, `mobile/app/cats/[catId]/edit.tsx`, `mobile/app/cats/[catId]/post-new.tsx`, `mobile/app/cats/[catId]/checkin-new.tsx`, `mobile/app/cats/[catId]/health-new.tsx`, `mobile/app/cats/[catId]/weight-new.tsx`, `mobile/app/cats/[catId]/timeline.tsx`, `mobile/app/cats/[catId]/health.tsx`, `mobile/app/cats/[catId]/weights.tsx`
- Mobile API client: `mobile/src/lib/api.ts`
- Mobile token store: `mobile/src/lib/token-store.ts`
- Mobile auth helpers: `src/lib/mobile-auth.ts`
- Shared package: `packages/shared/src/index.ts`
- Workspace config: `pnpm-workspace.yaml`

---

## Local Development

Preferred local runtime:

```powershell
pnpm dev:vercel
```

Useful commands:

```powershell
pnpm lint
pnpm build
pnpm mobile
pnpm mobile:ios
pnpm mobile:ios:run
pnpm mobile:android
pnpm mobile:web
pnpm shared:typecheck
pnpm db:generate
pnpm db:push
```

Notes:

- `.env.local` is pulled from Vercel and should not be committed.
- The active development database is Neon.
- `pnpm db:migrate` may not work against the current dev database because earlier schema sync used `db:push` before Drizzle migration history was populated.
- Use `pnpm db:push` only when intentionally syncing the active development DB.
- If pnpm is not installed globally, `npx pnpm@10.33.2 <command>` works with the pinned package manager version.
- Expo dependency compatibility can be checked with `pnpm --filter @cathub/mobile exec expo install --check`.
- Mobile API calls default to `http://localhost:3000`; run the Next.js app on port 3000 while testing authenticated mobile screens.
- For a physical phone, set `EXPO_PUBLIC_API_BASE_URL=http://<computer-lan-ip>:3000` and run Next.js on a reachable host.
- iOS Simulator requires full Xcode, not only Command Line Tools. After installing Xcode, run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`, open Xcode once, install an iOS runtime in Xcode Settings > Platforms, then verify with `xcrun simctl list devices available`.

---

## Validation Expectations

Before committing code changes:

- Run `pnpm lint`.
- Run `pnpm build`.
- Run `pnpm --filter @cathub/shared typecheck` when editing shared code.
- Run `pnpm --filter @cathub/mobile typecheck` and `pnpm --filter @cathub/mobile exec expo install --check` when editing mobile code.
- For schema changes, run `pnpm db:generate`.
- For DB behavior, use transaction-based smoke tests and roll back temporary data.
- For runtime behavior, prefer `vercel dev` smoke tests.

For docs-only changes:

- Run `git diff --check`.

---

## Confirmed Product Decisions

- External lineage connections require both owners to participate: requester sends, responder confirms.
- Visibility of shared data should be owner-controlled.
- Identity code ownership does not transfer cat ownership.
- Multiple lineage claims can exist over time; one confirmed canonical edge per sire/dam role is enforced, with disputed/revoked history retained.
- UI display depth is user-controlled; logical graph validation must not depend on display depth.
- Next feature priority is QR code / scan entry on top of the existing external request flow.

---

## Roadmap

Done:

- Auth and account settings
- Cat profile CRUD
- Avatar upload via Vercel Blob
- Health records and weight logs
- Timeline posts, images, videos
- Daily check-ins
- Internal lineage graph
- Owner identity codes
- External identity-code lineage requests
- Expo React Native mobile scaffold
- Shared workspace package scaffold
- Mobile auth API and login/register screens
- Mobile dashboard cat list API and screen
- Mobile manual identity-code connect API and screen
- QR code display for owner identity codes

Next:

- QR scan entry using the existing mobile manual connect flow
- Better lineage request UX after accept/decline/cancel
- Breeding Branch / Litter planning
- Doctor summary and breeder pedigree export templates
- Responsive polish
- SEO metadata

---

## Known Gaps

- Mobile manual identity-code entry exists; web `/connect` and native QR scanner are not implemented yet.
- Mobile auth is token-based but does not yet support refresh tokens, server-side revocation, or device/session management.
- Mobile app has no media upload or QR scanner yet.
- External request action buttons were not fully browser-click tested with hydrated UI; server actions and page data visibility were tested.
- Privacy is currently coarse. Fine-grained field visibility is planned but not implemented.
- Export templates are not implemented.
