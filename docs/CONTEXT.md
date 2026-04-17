# CatHub Context

This file is the quick context package for humans and coding agents. For rules, read `AGENTS.md`. For detailed historical notes, read `docs/HISTORY.md`.

---

## Product

CatHub is an AI cat digital-twin platform. The MVP focuses on cat identity, health tracking, social timeline, and breeder-oriented lineage tracking.

Current priority: complete the breeder lineage workflow step by step, verifying each feature slice before starting the next one.

---

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/base-nova style components
- Drizzle ORM
- PostgreSQL / Neon
- Auth.js v5 credentials auth
- Vercel Blob for uploads
- Vercel dev for local environment simulation
- pnpm

Important: this repo uses Next.js 16. Read relevant docs in `node_modules/next/dist/docs/` before editing Next.js code.

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
- External links require responder confirmation before a confirmed edge is created.
- Accepted external links are stored as `sourceType = external`.
- Existing conflicting same-role confirmed parent can be marked `disputed` when a new external claim is accepted.
- Removing internal parent links marks edges `revoked` instead of deleting.
- Ancestor and descendant views are recursive.
- UI display depth is user-selectable: `3`, `4`, `5`, `6`, or `all`.
- Logical cycle detection is not capped by the UI display depth.

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
pnpm db:generate
pnpm db:push
```

Notes:

- `.env.local` is pulled from Vercel and should not be committed.
- The active development database is Neon.
- `pnpm db:migrate` may not work against the current dev database because earlier schema sync used `db:push` before Drizzle migration history was populated.
- Use `pnpm db:push` only when intentionally syncing the active development DB.

---

## Validation Expectations

Before committing code changes:

- Run `pnpm lint`.
- Run `pnpm build`.
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

Next:

- QR code generation for identity codes
- `/connect` scan/manual entry route
- Better lineage request UX after accept/decline/cancel
- Breeding Branch / Litter planning
- Doctor summary and breeder pedigree export templates
- Responsive polish
- SEO metadata

---

## Known Gaps

- QR codes are not implemented yet.
- `/connect` scan/manual entry page does not exist yet.
- External request action buttons were not fully browser-click tested with hydrated UI; server actions and page data visibility were tested.
- Privacy is currently coarse. Fine-grained field visibility is planned but not implemented.
- Export templates are not implemented.
