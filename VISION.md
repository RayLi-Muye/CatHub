# CatHub Vision

CatHub is an AI cat digital-twin platform. The current product turns each cat into a durable digital identity with owner-controlled profile, health, timeline, and lineage data. The long-term product hypothesis is that this identity layer can grow into a trusted cat data network for social discovery, breeder lineage, care reference, and eventually AI digital-twin experiences.

This document is a maintainer alignment guide. It separates current product truth from roadmap assumptions so future issues and pull requests can stay grounded in the repository instead of inventing product direction.

## Product Thesis

CatHub should make a real cat's identity useful across care, social, and lineage workflows:

- Cat owners get one place to maintain identity, health, weight, check-in, timeline, and relationship records.
- Breeders and multi-cat households can track lineage and external parent claims without losing ownership boundaries.
- Mobile users can quickly share, browse, scan Cat Pass identities, and manage care actions without depending on the web UI.
- Over time, collected identity, media, behavior, and relationship data may support AI-powered cat recognition, behavior modeling, virtual pet interactions, and a global cat graph.

The near-term product must stay practical: reliable records, stable mobile workflows, resource authorization, privacy, moderation, and release readiness come before speculative AI model work.

## Current Product Truth

Implemented or documented in the repository today:

- Next.js web app for accounts, cat profiles, media uploads, health records, weight logs, daily check-ins, timeline posts, public profile pages, and lineage views.
- Lineage model with internal owner-created parent links, owner identity codes, external lineage requests, responder approval, disputed/revoked edge history, and cycle protection.
- Expo mobile app scaffold with explicit mobile APIs, token-based mobile auth, dashboard, cat creation/editing/detail, timeline posting, health/weight/check-in entry, lineage inbox, manual identity-code connect, and QR scan flow.
- Shared package for cross-platform mobile/web API payloads and constants.
- PostgreSQL/Drizzle persistence, Auth.js web auth, Vercel Blob upload paths, and pnpm workspace tooling.
- GitHub-native maintenance flow through issue templates, pull request template, and `docs/GITHUB_WORKFLOW.md`.

Some newer mobile production-readiness work may exist in local branches or unmerged worktrees. Treat `main` plus accepted pull requests as the public repo truth, and call out local-only evidence explicitly when using it for planning.

## Target Users

- Cat owners who want a reliable personal record and social identity for each cat.
- Breeders or lineage-conscious owners who need external lineage confirmation without transferring cat ownership.
- Multi-cat households that benefit from quick mobile care logging and relationship views.
- Future AI/graph users who may want recognition, similarity, behavior, and virtual-pet features once the data foundation is trustworthy.

## Product Pillars

1. Durable Cat Identity
   - Stable cat profiles, media, owner identity, slugs, Cat Pass, and future identity embeddings.
   - Owner-controlled visibility and clear ownership boundaries.

2. Care Reference
   - Health records, weight history, daily check-ins, notes, and summaries designed for long-term reference.
   - Veterinary-adjacent language should remain careful: CatHub can organize records, but should not imply diagnosis without explicit clinical validation.

3. Social Timeline
   - Timeline posts, images, comments, likes, saves, follows, and feed surfaces can make CatHub worth opening daily.
   - Moderation, blocking, reporting, privacy, and account deletion must be first-class before production release.

4. Lineage And Relationship Graph
   - Confirmed parent links, external requests, disputed/revoked history, and future custom relationship edges.
   - Graph validation must prioritize data integrity over visual shortcuts.

5. Mobile-First Companion
   - Mobile should be the fast daily surface for posting, logging, scanning, browsing, and account/session management.
   - Development should support both real-data API testing and mock/dev API preview independence.

6. AI Digital Twin Foundation
   - Long-term AI capabilities depend on data quality, permissioning, privacy, and enough representative multimodal data.
   - Vision, voice, behavior, personality, and virtual-pet work should stay behind explicit research/product gates until validated.

## Roadmap Horizons

### Horizon 1: Trustworthy MVP

Focus:

- Keep the current web product stable.
- Harden mobile auth, mobile API contracts, resource authorization, and local development flows.
- Finish mobile mock/dev API decoupling so UI work can continue when the real API, database, Blob, or auth path is unavailable.
- Keep docs, release gates, and issue/PR workflow aligned with current maintenance practice.

Success signals:

- Local mobile development can run either against real dev data or representative mock data.
- New maintenance work links to an issue and describes tests, docs impact, risk, and rollback.
- Mobile API changes keep explicit auth and resource authorization checks.

### Horizon 2: Production Mobile Candidate

Focus:

- Complete mobile release readiness: EAS configuration, owner-controlled app/store identifiers, policy URLs, support contact, reviewer access, QA seed data, privacy review, moderation operations, screenshots, and release-candidate device QA.
- Expand social surfaces only when moderation and privacy boundaries remain clear.
- Keep analytics privacy-gated and free of sensitive fields.

Success signals:

- Non-secret release gates pass in CI.
- Store preflight blocks until owner inputs are present, then passes with recorded evidence.
- Device QA validates auth, session restore, posting, uploads, care logs, lineage, graph, reporting/blocking, and deletion.

### Horizon 3: Cat Graph And Social Depth

Focus:

- Improve feeds, relationship discovery, owner/pet following, notifications, graph layout, and custom relationship workflows.
- Add richer lineage, breeder planning, pedigree export, and doctor/breeder summaries where the data model supports them.
- Make Arena and virtual pet loops more meaningful only after core identity/social/care loops are stable.

Success signals:

- Users can discover relevant cats and owners without exposing private data.
- Graph interactions are accurate, understandable, and reversible.
- Export and summary features are useful without making unsupported medical or breeding claims.

### Horizon 4: AI Digital Twin Research

Focus:

- Explore cat identity embeddings from images/video.
- Explore voice and behavior embeddings only with consent, privacy review, and clear data-retention policy.
- Prototype virtual pet behavior from owned data after the identity and care records are reliable.

Success signals:

- Research inputs, consent, model limits, and privacy boundaries are documented before implementation.
- AI outputs are labeled clearly and do not replace owner/veterinary judgment.
- Features can be evaluated with measurable quality criteria instead of novelty alone.

## Explicit Assumptions

These ideas come from project notes and current direction, but are not commitments until backed by approved issues, data, and validation:

- Cat identity embeddings may become useful for recognition or similarity search.
- Voice and behavior embeddings may enrich digital-twin state.
- Arena may evolve from a local prototype into social challenges or leaderboards.
- A global cat identity graph may become a core network asset.
- AI virtual pet experiences may become a future product layer.

## Non-Goals For Current Maintenance

- Do not build independent AI model infrastructure before the identity, data, privacy, and consent foundations are ready.
- Do not split mobile into a standalone backend unless a concrete issue proves it reduces development or production risk.
- Do not bypass Next.js mobile API auth/resource checks for convenience.
- Do not use production data, cloud resources, release credentials, or store credentials without separate explicit owner approval.
- Do not treat store submission as ready until owner-controlled inputs, release evidence, and manual QA are complete.

## Maintenance Alignment

Future issues should state which vision pillar and roadmap horizon they advance. If a task does not map to a pillar, it should explain why it is necessary maintenance, risk reduction, or developer-experience work.

For routine maintenance, the project context owner may create issues, branches, commits, pull requests, fix CI, and merge low-risk green PRs under the standing authorization. Separate owner approval is still required for production deploys, formal releases/tags/package publishes, sensitive credential use, production or cloud resource operations, destructive git operations, and major customer/user-visible direction changes.
