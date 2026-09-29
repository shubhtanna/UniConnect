# Built

## PERF-009 — Protected navigation latency reduction (2026-09-28)

- Deduplicated authenticated-user verification across the protected layout and destination page during one navigation.
- Reduced the MongoDB user lookup to the three authentication fields required by navigation guards.
- Server-rendered the first Feed and Student Directory result sets and removed their duplicate browser requests after page load.
- Added a short-lived server cache for the shared directory dataset so filter/navigation traffic does not repeatedly rebuild the same 40-profile source list.
- Added an immediate protected-route loading state so navigation always provides visual feedback during server work or a serverless cold start.
- Verification: 37 tests, TypeScript, lint, and optimized production compilation pass.

## UX-008 — Navigation, discovery, ownership, sharing, and safety pass (2026-09-28)

- Replaced the desktop icon rail with a labelled navigation sidebar and added direct destinations for Student directory, AI people search, Community feed, and the clearer `Venture showcase` experience.
- Collapsed every PGP AIAS year/name variant into one directory cohort and made preloaded-profile URLs browser-safe while retaining compatibility with earlier links.
- Refined the AI search input and redesigned the personal profile presentation with a stronger identity card, profile-strength indicator, clearer skills/interests, and timeline-style experience and education.
- Added server-authorized editing and deletion for a user's own feed posts and comments. Sharing now uses the device share sheet with a copy-link fallback and records a share once rather than toggling it away.
- Post and comment reports now require a reason and retain structured report details for future moderation. Users cannot report their own content.
- Added shared server-side content safety to community posts, venture posts, comments, report reasons, groups, and group messages. It rejects abusive language, executable markup/schemes, shortened or non-HTTPS links, credentialed URLs, local hosts, and IP-address URLs.
- Group creators can edit or archive their group. Message authors can edit/delete their messages, and group creators can remove messages in their rooms.
- Verification: 37 tests, strict TypeScript, lint/type validation, and the complete optimized production build pass.

## PROF-007 — Secure Master CV profile preloading (2026-09-28)

- Added a private `PreloadedProfile` collection keyed by exact official MU email. Staged records are not returned by feed/profile/search queries.
- Added a local-only PDF/DOCX batch preparation tool with strict manifest validation, file signature/size checks, deterministic extraction, private preview reports, duplicate detection, and an explicit `--apply` step.
- The importer never uploads original CVs, retains no raw resume text, and does not call the configured AI provider. Only reviewed structured fields are staged in MongoDB.
- Batch staging is transactional and refuses to overwrite verified users or claimed/conflicted imports. Replacing an unclaimed record requires `--replace-pending`.
- Successful OTP verification atomically claims the exact matching staged record, creates the profile, and marks it complete. No unverified staged profile appears in the network.
- Imported profiles can omit a photo, stored resume, and public contact method while remaining editable. Regular self-onboarding retains its upload/contact requirements.
- Dashboard and profile editing explain that the profile was prepared from the Masters' CV and can be changed. The notice can be acknowledged.
- Added queue-status tooling, conventional database indexes, fallback avatars, and provenance metadata that is not included in search cards.
- Profiles without embeddings remain discoverable by explicit skill keywords through merged Atlas/application candidates; the source CV is not sent to the embedding provider during import.
- Fixed both batch scripts for the project's CommonJS runtime, normalized locally generated experience/education strings to profile limits, and removed a conflicting duplicate MongoDB update path found during the first write attempt.
- The first supplied batch produced a private 39-profile preview. Three already-complete accounts were safely protected from overwrite; 36 structured profiles are staged as `pending` in MongoDB, including one verified-but-incomplete account with no existing profile. Kasim's Gmail-only resume is intentionally excluded. Original CVs and raw extracted text remain local.
- Verification: 23 unit tests, TypeScript, lint, clean local and Vercel production builds, the isolated Phase 2 OTP/upload/profile smoke test, the 39-profile local dry run, and a post-write status check showing exactly 36 pending / 0 claimed / 0 conflicted records pass. With 3 existing complete profiles, all 39 requested people are covered.
- Published the claim feature to Vercel production as deployment `dpl_F7ti4sjn86VwjKYUeEj5MWcacy5e` at the stable alias `https://uniconnect-teal.vercel.app`. Production homepage/login return HTTP 200 and health reports the database connected. A `.vercelignore` explicitly prevents `.data`, environment files, dependencies, and local build output from being uploaded.

## PROF-006 — Field-specific profile validation (2026-09-28)

- Replaced the unlabelled max-30-array save error with field-labelled messages and a structured API `fieldErrors` map.
- Shared client/server validation names nested work/education fields and retains all issues, not just the first.
- Review form shows inline errors, accessible descriptions, a clickable error summary, and focus/scroll to the affected input; entered values remain intact.
- Skills show a live unique count out of 30. Duplicate/blank entries are normalized consistently; excess distinct skills remain available for user review rather than being silently discarded.
- AI extraction requests at most 30 distinct skills; unexpected excess output is surfaced in review. Malformed LinkedIn URLs produce validation errors instead of an exception.
- Added ten regression tests and extended the Phase 2 API smoke script with multiple field errors followed by a corrected retry.
- Verification: 18 unit tests, TypeScript, lint, and production build pass. The isolated memory/local Phase 2 smoke test passed OTP, photo upload, DOCX/PDF extraction, field-specific HTTP 400 errors, corrected profile save, and protected profile HTTP 200. Browser interaction checks are tracked separately in `PENDING.md`.
- Production rollout completed on 2026-09-28: deployment `dpl_ER3zKiWbdqess5x5StzgV6zqrh9U`, https://uniconnect-ik6fu3ex1-shubh-tannas-projects.vercel.app, aliased to https://uniconnect-teal.vercel.app. Vercel reports Ready; stable homepage/login and health return HTTP 200, MongoDB is connected, and unauthenticated `/profile/setup` redirects to `/login` (307). No real email or student-data mutation was used for these production checks.

## Vercel PDF upload packaging fix

- Follow-up production logs confirmed PDF parsing succeeded but AI returned `currentProject` as an array. Project lists now normalize to review-form text; the extraction prompt explicitly specifies field types. Eight tests and TypeScript checks pass, including regression coverage for project lists, missing values, and null.

- Production logs identified `DOMMatrix is not defined` because the PDF parser's canvas dependency was absent from the serverless function.
- Added canvas as a direct production dependency and explicit file tracing for the resume route, including the Linux native binary and PDF worker files.
- Verified PDF text extraction locally and TypeScript validation. A user upload on the replacement deployment remains the final live check.

This document records only work that exists in the repository and has been verified. Planned or partially implemented features stay in [PENDING.md](PENDING.md).

Last reviewed: 2026-09-27

## Project foundation

### DOC-001 — Repository documentation tracker

Status: Complete

- The local workspace is connected to the GitHub repository.
- The project README describes the product, intended stack, privacy rules, and documentation workflow.
- Pending and completed work are tracked separately with stable feature IDs.

Verification:

- The `main` branch tracks `origin/main`.
- `README.md`, `BUILT.md`, and `PENDING.md` exist in the repository.

## Product features

### FOUND-001 — Application foundation

Completed: 2026-09-27

- Next.js App Router application with strict TypeScript and Tailwind CSS.
- Responsive visual foundation, shared styling, metadata, and reusable branding.
- Validated server environment configuration and documented `.env.example`.
- Production, development, lint, and type-check scripts.
- Patched Next.js 15.5 replaces the originally requested but vulnerable Next.js 14 line.

Verification:

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm audit` reports zero known vulnerabilities.

### DATA-001 — MongoDB connection and core models

Completed: 2026-09-27

- Cached Mongoose connection suitable for Next.js development reloads.
- User model with exact MU-domain validation and verification/completion flags.
- Profile model with work history, education, skills, private resume data, and future vector fields.
- Community/Spotlight post model with likes, comments, shares, reports, and Spotlight validation.
- Separate expiring OTP challenge model prevents creating a user before successful verification.
- Useful indexes for unique identities, expiry, feeds, cohort, and skills.

Verification:

- All schemas and database consumers pass strict TypeScript and production compilation.
- Live Atlas connectivity awaits environment credentials and is tracked in `PENDING.md`.

### AUTH-001 — Request an email OTP

Completed: 2026-09-27

- Login UI accepts only the exact `mastersunion.org` domain, case-insensitively.
- API generates a cryptographically random six-digit code.
- Only an HMAC hash is stored, with a 10-minute expiry and 60-second resend delay.
- SMTP delivery is supported; development can safely print the OTP to the server console.
- A development-only in-memory store and on-screen OTP make localhost usable without MongoDB or SMTP; production explicitly rejects this mode.
- Delivery failures remove the unusable challenge and return a non-sensitive error.

Verification:

- A runtime request using a non-MU email returns the expected inline validation error before database access.
- A valid MU address receives a local development OTP when SMTP is not configured.

### AUTH-002 — Verify OTP and establish a session

Completed: 2026-09-27

- Constant-time OTP comparison, expiry checks, and a five-attempt limit.
- Users are created only after successful verification.
- Seven-day signed sessions use HTTP-only, same-site cookies that are secure in production.
- Successful verification redirects to profile setup or the dashboard based on completion state.
- Sign-out invalidates the local session cookie.

Verification:

- Strict type, lint, and production-build checks pass.
- The complete local request → verify → session → profile setup flow returns successfully.
- Live email-to-database verification awaits environment credentials and is tracked in `PENDING.md`.

### AUTH-003 — Protected route enforcement

Completed: 2026-09-27

- Edge middleware rejects unauthenticated private page and API requests.
- Server layouts reload the user from MongoDB before granting completed-profile access.
- Incomplete profiles are forced to `/profile/setup`; stale client-side session claims cannot bypass this check.
- Setup itself requires a verified session and redirects completed profiles to the dashboard.

Verification:

- `/` and `/login` return HTTP 200 without a session.
- `/dashboard` and `/profile/setup` return HTTP 307 to `/login` without a session.

### PROF-001 — Multi-step profile setup

Completed: 2026-09-27

- Three-step photo, resume, and review workflow with a gradient progress indicator.
- Validated name, cohort, skills, experience, education, current project, collaboration interest, LinkedIn URL, and contact details.
- Profile completion is set only after server validation and successful persistence.
- Existing users can reopen the form and edit their profile.

Verification:

- The complete setup payload passes the Phase 2 smoke test and redirects into the protected app.

### PROF-002 — Private profile photo upload

Completed: 2026-09-27

- JPG, PNG, and WebP validation with a 5 MB server-side limit.
- Private local development storage and authenticated Cloudinary production support.
- Authenticated file proxy prevents anonymous access to stored media.

Verification:

- Authenticated upload and retrieval return HTTP 200.
- Anonymous retrieval returns HTTP 401.

### PROF-003 — Resume upload and extraction

Completed: 2026-09-27

- PDF and DOCX validation with a 10 MB server-side limit.
- `pdf-parse` and `mammoth` text extraction with unreadable-file handling.
- Original resume files use private authenticated storage.

Verification:

- `npm run smoke:phase2` successfully parses generated PDF and DOCX resumes.

### PROF-004 — Structured profile extraction

Completed: 2026-09-27

- OpenAI JSON extraction path treats resume contents as untrusted data.
- Extracted output is schema-validated before it reaches the profile form.
- Missing fields remain visible for manual completion and are tracked.
- A deterministic local extractor keeps development usable without an API key.
- The local fallback detects resume sections, skill lists, dated work entries, education records, and project summaries, then opens the populated review form automatically.

Verification:

- The local extraction path pre-fills name and detected skills during the Phase 2 smoke test.
- A representative uploaded PDF produced a name, skills, work experience, and education while correctly flagging its missing current-project field.
- Live OpenAI verification awaits credentials and remains in `PENDING.md`.

### PROF-005 — Private profile view and editing

Completed: 2026-09-27

- Signed-in profile page displays photo, cohort, skills, interests, project, experience, and education.
- Completed profiles can be reopened in edit mode.
- A responsive icon-rail app shell provides Dashboard, Profile, Find Connections, and Feed navigation.
- Profiles and file endpoints require a verified session.

Verification:

- The protected profile page returns HTTP 200 after profile completion.
- Anonymous protected routes remain blocked.

### SEARCH-001 — Profile embeddings

Completed: 2026-09-27

- Profile submission generates and stores an embedding from skills, projects, interests, work, and education.
- OpenAI `text-embedding-3-small` is used when configured.
- A normalized deterministic local embedding provides a development fallback.
- Editing and resaving a profile regenerates its embedding.

Verification:

- Embedding generation and profile persistence pass the Phase 2 smoke test.

### HOME-001 — Six-section public landing page

Completed: 2026-09-27

- Hero, problem statement, four-step explanation, feature grid, community preview, final CTA, and footer.
- MU Coach-inspired dark visual system with one teal-to-amber accent gradient.
- Fine-grid hero texture, bordered dark cards, pill buttons, responsive spacing, and consistent typography.
- Authentication and all signed-in profile screens use the same design tokens.

Verification:

- Public home and login routes return HTTP 200.
- Responsive layouts pass lint, strict TypeScript, and production compilation.
- `npm run build` completes successfully with all Phase 2 routes.

### FEED-001 — Community posts

Completed: 2026-09-27

- Signed-in students can publish text posts with an optional private image.
- The feed includes pagination, load-more behavior, and clear loading, empty, and error states.
- Post cards show the author, cohort, timestamp, content, and optional media.
- Community and Spotlight views use the shared pill-tab pattern and responsive dark design system.

Verification:

- The Phase 4 smoke test creates a Community post and retrieves its protected media.
- Strict TypeScript, lint, and the optimized production build pass.

### FEED-002 — Post interactions

Completed: 2026-09-27

- Authenticated users can like, comment on, share, and report posts.
- Comments can be reported independently.
- Likes, shares, and reports are stored with duplicate-safe user identifiers.
- Input validation and authenticated API access are enforced on every interaction route.

Verification:

- `npm run smoke:phase4` verifies one like, comment, share, post report, and comment report through the live API.

### FEED-003 — Business Spotlight

Completed: 2026-09-27

- Spotlight posts collect business name, link, and category alongside the post content.
- A gradient badge and accent border distinguish Spotlight cards from Community posts.
- The server enforces a maximum of two Spotlight posts per user per calendar day.

Verification:

- The Phase 4 smoke test accepts the first two Spotlight posts and rate-limits the third.
- `npm run build` completes successfully with the feed page and all feed API routes.

### SEARCH-002 — Retrieve matching profiles

Completed: 2026-09-27

- Natural-language queries are embedded and ranked with semantic similarity plus keyword overlap.
- MongoDB Atlas Vector Search is used when available, with automatic application-side cosine fallback.
- Only verified, profile-complete users are eligible and the current user is excluded.
- Search responses contain safe profile summaries and never expose resume files, raw resume text, or embeddings.

Verification:

- `npm run smoke:phase5` ranks the purpose-built ecommerce and growth profile first.
- The application-vector fallback succeeds without MongoDB Atlas or an OpenAI key.

### SEARCH-003 — Grounded connection answers

Completed: 2026-09-27

- The answer provider receives only retrieved profile summaries and untrusted text is isolated in a strict prompt.
- Provider output is schema-validated and unknown or duplicate profile IDs are discarded.
- Names are inserted by trusted server code from retrieved candidates rather than accepted from model output.
- Provider failures and no-result searches return deterministic, non-invented answers.
- Search results render as responsive profile cards linking to private verified-student profile pages.

Verification:

- Grounding unit tests discard invented IDs and duplicate matches.
- The Phase 5 smoke test confirms every returned name belongs to the retrieved result set.

### QUAL-001 — Responsive and accessible behavior

Completed: 2026-09-27

- Desktop icon rail and mobile bottom navigation identify the active page with `aria-current`.
- A keyboard skip link, visible global focus treatment, form labels, live result regions, and descriptive control labels are included.
- Reduced-motion preferences disable nonessential animation and all signed-in pages retain responsive layouts.
- Dark surfaces, off-white text, and the single teal-to-amber accent maintain strong visual contrast.

Verification:

- Next.js accessibility lint passes without warnings.
- Production compilation validates all desktop and responsive component paths.

### QUAL-002 — Security and abuse protections

Completed: 2026-09-27

- MongoDB-backed distributed rate limits cover OTP requests, verification attempts, uploads, profile saves, posts, comments, reports, feed interactions, and search; memory mode provides a local equivalent.
- Cross-site mutation requests are blocked and security, framing, referrer, MIME, transport, and permissions headers are configured.
- Text, URLs, cursors, identifiers, file sizes, MIME types, and binary file signatures are validated server-side.
- Session cookies remain HTTP-only, same-site, and secure in production.
- Local and Cloudinary resume delivery is owner-only; other media remains restricted to verified users.
- Production environment validation rejects memory storage, local files, or missing SMTP credentials.

Verification:

- Invalid domains, malformed models, unauthorized protected access, and the third daily Spotlight post are rejected in automated tests.
- `npm audit` reports zero known vulnerabilities.

### QUAL-003 — Automated tests

Completed: 2026-09-27

- Unit tests cover MU domain enforcement, OTP expiry, redirect decisions, profile and Spotlight validation, daily Spotlight limits, and grounded-search allowlisting.
- Phase 2, Phase 4, and Phase 5 smoke tests cover sign-in, profile setup, private uploads, extraction, protected pages, the feed, interactions, rate limits, and connection search.
- Smoke users use generated or fixed non-sensitive development data only.

Verification:

- `npm test`, `npm run smoke:phase2`, `npm run smoke:phase4`, and `npm run smoke:phase5` pass.

### QUAL-004 — Operational readiness

Completed: 2026-09-27

- `DEPLOYMENT.md` documents providers, environment variables, indexes, deployment order, privacy checks, and production verification.
- A health endpoint reports readiness without returning credentials.
- Structured logging excludes request bodies and secrets in production.
- Database tooling creates query, unique, TTL, rate-limit, and vector-search indexes.
- The optional demo seed is fictional, explicitly confirmed, and blocked in production.

Verification:

- `/api/health` reports HTTP 200 in the configured local environment.
- The optimized production build completes with all Phase 5 and Phase 6 routes.

## How to add completed work

When a pending feature is finished, move its whole entry here and record:

- completion date;
- important files or routes;
- tests or manual checks performed;
- any known limitation that remains.

Do not mark a feature complete merely because its UI exists; its relevant data, validation, access control, and error handling must also work.

### DISC-001 — Browseable student directory

Completed: 2026-09-28

- The Connections area opens with a browseable student directory and retains AI search as a separate tab.
- Students can search and combine batch, exact skill, interest, and looking-for filters, with pagination and clear empty states.
- The directory returns all 40 class profiles: 5 claimed profiles and 35 clearly labelled unclaimed Master CV profiles. A student can also see their own card.
- Unclaimed profiles expose only approved professional profile fields inside the authenticated directory; email, contact/LinkedIn links, resume data/files, filenames, and claim identifiers remain hidden.
- When a student claims a profile, the pending entry disappears and the normal verified editable profile replaces it without duplication.
- Directory requests are authenticated, validated, and rate-limited. Unclaimed entries do not create profile-view tracking and are not sent through AI matching before claim.
- Filter options come from the available profile data instead of a hard-coded taxonomy.

Verification:

- Three directory tests cover cross-field keyword matching, combined filters, case handling, and non-mutation.
- A privacy test verifies an unclaimed published profile contains no email, contact, LinkedIn, resume, filename, or claim data; a live aggregate check returns exactly 40 profiles (5 claimed, 35 unclaimed).
- Strict TypeScript, lint, and the optimized production build pass.

### DISC-002 — Profile interest tags

Completed: 2026-09-28

- Profiles support up to 12 explicit interests, separate from resume-derived skills.
- Setup/review includes an editable interest field with count guidance, deduplication, validation, and backward-compatible empty defaults.
- Interest chips appear on profiles and directory cards and can be used as a directory filter.
- Interests participate in discovery matching without being presented as employment skills.

Verification:

- Profile-validation tests cover interest normalization, deduplication, and limits.
- Existing profiles remain readable without a migration because missing interests resolve to an empty list.

### DISC-003 — Discovery insights

Completed: 2026-09-28

- “Who’s looking for you” ranks students whose stated needs and projects overlap with the signed-in student’s explicit skills or interests.
- Profile visits are recorded for 30 days, with a student-controlled named/anonymous mode for future visits.
- The Insights page shows named recent viewers, a separate anonymous count, and evidence-based reverse-match reasons.
- The feature deliberately avoids popularity scores and does not reveal anonymous identities.

Verification:

- A unit test verifies reverse-discovery ranking from stated needs against skills and interests.
- Duplicate viewer pairs are aggregated safely by database indexes.

### DISC-004 — Brainstorm groups

Completed: 2026-09-28

- Verified students can create focused groups with a purpose, 1–6 topic tags, and open or invite-only access.
- Open groups can be browsed and joined; invite-only groups are visible only to their pre-approved members.
- Members get a persistent chronological discussion, while non-members see group context before joining.
- Creation and posting are rate-limited; groups cap membership at 50, invites at 20 official MU addresses, and messages at 2,000 characters.
- The create form exposes validation/server errors and makes access and invite behavior explicit.

Verification:

- Three group tests cover tag normalization, invite-domain restrictions, tag caps, and message boundaries.
- The full suite passes 31 tests, followed by typecheck, lint, and optimized production compilation.
- Production deployment `dpl_BtJWbA45dfHkKxF6zotzmLBZkMht` is Ready at the stable UniConnect alias; public routes, protected redirects, and connected-service health were verified.

### OPS-005 — Dedicated MongoDB database

Completed: 2026-09-28

- All application and operational connections explicitly select the `uniconnect` database through `MONGODB_DB`; a missing path in `MONGODB_URI` can no longer silently route the app into MongoDB's default `test` database.
- A guarded migration tool copies only UniConnect collections, refuses an occupied destination, preserves object IDs and indexes, verifies document counts/identifiers, and never deletes the source.
- Existing users, completed profiles, pending Master CV profiles, posts, rate-limit records, and profile-view records were copied from `test` to `uniconnect`.
- Production and local configuration now use `MONGODB_DB=uniconnect`; scripts for indexes, service checks, and demo data use the same explicit database.

Verification:

- The migration verified 6 users, 5 completed profiles, 36 preloaded profiles, 1 post, and supporting records in `uniconnect`.
- The `profile_embedding` Atlas index is Ready and queryable in `uniconnect`.
- Production deployment `dpl_HTArqQ17MsAv4VgYZUFtwUw2NHk6` is Ready and healthy; a post-deployment profile-view write appeared in `uniconnect` while the retained `test` counts remained unchanged.

### WEB-002 — Current-product public homepage

Completed: 2026-09-29

- Reframed UniConnect as an intent-based people-discovery product rather than another student social network.
- Replaced placeholder skeleton cards and inaccurate scale claims with a credible AI people-search preview and precise, privacy-safe product language.
- The public journey now explains prepared profile claiming, student-controlled review, interests and collaboration intent, directory browsing, AI search, discovery insights, brainstorm rooms, Community, and Venture Showcase.
- Added clear trust messaging for verified access, private source resumes, editable prepared profiles, and named/anonymous profile-view preferences.
- Tightened every section's spacing and information hierarchy so the page no longer has oversized empty gaps on desktop, while retaining responsive mobile layouts.

Verification:

- All 37 automated tests, strict TypeScript validation, lint, and the optimized production build pass.
- The static homepage remains only 165 B of route-specific JavaScript and 106 kB first-load JavaScript.

### PERF-002 — Sign-in and feature-navigation latency pass

Completed: 2026-09-29

- Email submission changes to the OTP screen immediately while delivery completes, with accurate sending and navigation states instead of an apparently frozen form.
- OTP request rate limits and challenge lookup run concurrently; verification performs its independent security lookup concurrently and removes the duplicate client refresh after success.
- Returning users bypass the MongoDB transaction used only for an actually pending Master CV claim.
- Nodemailer reuses a small warm SMTP connection pool when the serverless instance survives between requests.
- Protected pages reuse the signed session already guarded by their shared security layout instead of querying the user record again on every feature navigation.
- Sidebar links prefetch on intent and show an immediate global navigation progress bar; local Connections mode changes no longer cause a redundant server navigation.

Verification:

- All 37 automated tests, strict TypeScript validation, lint, and the optimized production build pass.

### UI-003 — Compact OTP and student profile redesign

Completed: 2026-09-29

- The desktop login route now uses the dynamic viewport height and a compact flex/grid layout so the full OTP interaction remains visible without page scrolling at standard laptop and desktop heights.
- Smaller screens retain normal document scrolling, and exceptionally short desktop viewports can scroll only the form card instead of losing page controls.
- Student profiles now lead with a compact identity and action header, followed by separate collaboration and current-project summaries.
- Skill overload is reduced by showing the first 12 capabilities and placing the remainder in an accessible native expandable section.
- Interests, experience, and education now have distinct visual hierarchy, empty states, item counts, and timeline presentation.
- Profile-view tracking runs after the response is rendered, preventing the analytics write from delaying profile navigation.

Verification:

- All 37 automated tests, strict TypeScript validation, and lint pass.
