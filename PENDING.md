# Pending

This is the prioritized implementation checklist for UniConnect. Completed and verified work is moved to [BUILT.md](BUILT.md).

Last reviewed: 2026-09-28

## Latest fix rollout

- [ ] **PROF-006-UI — Visually verify deployed field-specific validation**
  - Published to the existing Vercel production project on 2026-09-28; deployment `dpl_ER3zKiWbdqess5x5StzgV6zqrh9U` is Ready and the stable alias was verified.
  - Local implementation, 18 unit tests, typecheck, lint, production build, and isolated Phase 2 API smoke test pass. Live homepage/login/health return HTTP 200; anonymous setup redirects to login.
  - In the browser, verify excess skills, nested education/work errors, first-invalid-field focus, preserved input, row removal, mobile layout, and successful retry.
  - The in-app browser automation helper failed to initialize during this fix; browser interaction verification remains pending.

## Master CV import rollout

- [x] **PROF-007-DATA — Prepare and stage the first Master CV batch**
  - The first private batch contains 40 PDFs and a 53-address class list. A deterministic filename/email match plus the owner-provided Shubh address prepared 39 profiles for `PGP AIAS 2026-27`; Kasim is intentionally excluded because only a personal Gmail address is available.
  - The local dry run succeeds for all 39 included files, and the two PDF-contaminated names have explicit corrections. Some profiles still have locally unparsed work, education, or project fields and many reached the 30-skill cap; students can correct these after claiming.
  - On 2026-09-28 the owner explicitly approved import. Three already-complete accounts (Shubh, Siddharth, and Sneha) were protected from overwrite. Nisarg's verified but incomplete account had no profile, so its preload was safely staged without changing the account.
  - Final verification: `preloadedprofiles` contains exactly 36 records, all `pending`, with none claimed or conflicted. Together with the 3 existing complete profiles, all 39 requested people are covered. Kasim remains excluded. Raw resumes remain local and were not uploaded.

- [ ] **PROF-007-DEPLOY — Deploy and verify profile claiming**
  - Deployed the claim backend to Vercel production on 2026-09-28 as `dpl_F7ti4sjn86VwjKYUeEj5MWcacy5e`; stable alias `https://uniconnect-teal.vercel.app` serves the release.
  - Created the conventional MongoDB indexes and verified the `profile_embedding` Atlas vector index against the intended database.
  - Production homepage/login return HTTP 200 and `/api/health` reports `ok` with the database connected.
  - With a consenting test MU account, verify: wrong email cannot claim, exact email + OTP claims once, dashboard notice appears, imported profile is editable without photo/resume/contact, notice acknowledgement persists, and profile becomes searchable only after verification.
  - Do not use a classmate's email or resume for testing without their permission.

## Environment verification

## Discovery expansion rollout

Deployment `dpl_BtJWbA45dfHkKxF6zotzmLBZkMht` published the four-feature expansion to `https://uniconnect-teal.vercel.app` on 2026-09-28. The stable homepage/login return HTTP 200; anonymous directory, insights, and groups requests redirect to login; `/api/health` reports MongoDB, Cloudinary, email, and AI connected.

- [ ] **DISC-005 — Authenticated browser verification**
  - With consenting test accounts, verify directory filter combinations, interest editing, named/anonymous view behavior, reverse-match explanations, open-group joining, invite-only visibility, and group posting on desktop and mobile.
  - Confirm anonymous views never disclose identity and future mode changes do not rewrite earlier view records.
  - Do not use classmates’ accounts or emails for testing without permission.

- [ ] **DISC-006 — Group moderation and lifecycle**
  - Add message/group reporting, creator moderation, member removal, group editing, archiving, and invite management before broad cohort rollout.
  - Add notifications only after the owner chooses an approved delivery channel; do not turn groups into another noisy feed.
  - Consider real-time updates only if pilot use shows that refresh-based chronological discussion is insufficient.

- [ ] **DISC-007 — Relevance pilot**
  - Pilot directory interests and reverse discovery with a small consenting group and collect explicit relevance feedback.
  - Measure useful conversations and collaborations, not profile views or engagement rankings.
  - Tune matching only from volunteered profile data; do not infer sensitive personality or belief labels.

- [ ] **OPS-001 — Connect live Phase 1 services**
  - Local MongoDB Atlas authentication and conventional indexes were verified on 2026-09-27.
  - Add production SMTP credentials and verify delivery to an actual `@mastersunion.org` inbox.
  - Run the complete request-code → verify-code → setup redirect flow against the connected services.
  - Confirm production secrets are stored only in the deployment environment.

- [ ] **OPS-002 — Connect live Phase 2 services**
  - Local Cloudinary and OpenAI authentication were verified on 2026-09-27.
  - Verify authenticated photo and resume delivery through the deployed application.
  - Verify live structured resume extraction and `text-embedding-3-small` generation with a real test profile.
  - Confirm private file URLs cannot be retrieved without a verified session.

## Explicitly out of scope for the first release

- Alumni access tier
- Direct messaging between users
- Admin moderation dashboard
- Full notification interface (the data model should remain extensible for it)
