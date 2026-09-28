# UniConnect — Complete Project Handoff

Initial snapshot: 27 September 2026. Updated: 28 September 2026 after the field-validation fix and its production deployment. Prepared for continuing this project in another AI chat, editor, or development environment.

## 1. Read this first

UniConnect is a private, verified Masters' Union (MU) student discovery application. The important problem is: **“There are people on campus who think like me or want to explore similar things, but I do not know who they are or how to find them.”**

The owner, Shubh Tanna, explicitly does **not** want “another LinkedIn for MU.” Resume search and a community feed are the existing foundation, not the final product vision. The next product direction should prioritize shared interests, intentions, curiosity, and useful conversations over public achievements, follower counts, or engagement feeds.

The initial six implementation phases exist locally and the app has been deployed to Vercel. This does **not** mean every edge case, security property, or production flow is fully verified. The reported profile-validation UX bug was fixed and deployed on 28 September; browser interaction checks and further hardening remain separate work below.

**Latest implemented user request:** when saving a profile fails, show exactly which field is invalid, rather than only a generic error such as `Array must contain at most 30 element(s)`. Local code now includes shared validation, structured API errors, inline messages, focus links, a skills counter, and duplicate normalization without removing distinct skills.

**Current continuation point:** visually verify the deployed field-error fix with an authorized account, then address the remaining privacy/reliability issues and decide the first like-minded-matching slice. No future product feature should be assumed complete merely because it is described here.

**New staged and deployed feature, 28 September:** a secure Master CV preload backend is live in Vercel production deployment `dpl_F7ti4sjn86VwjKYUeEj5MWcacy5e`. A local manifest tool parses PDF/DOCX files without calling OpenAI or uploading source CVs, produces a private preview, and writes only structured fields to a private `preloadedprofiles` collection after an explicit `--apply`. Records stay outside all search/feed/profile queries until the exact MU email verifies OTP. Verification atomically claims the data into a complete editable profile and shows a review notice. The first supplied ZIP was extracted privately and 39 of 40 resumes passed the dry run. Three existing complete profiles were protected from overwrite; 36 profiles are staged as `pending`, including Nisarg's verified-but-incomplete account with no prior profile. This covers all 39 requested people. Shubh's address was supplied separately and Kasim is intentionally excluded because only Gmail is available. Some locally unparsed fields remain for student review. Production homepage/login/health checks pass and MongoDB indexes are ready. The remaining rollout step is one consented end-to-end claim test before inviting the entire cohort.

### What this file can and cannot replace

This file supplies the project context, requirements, architecture, setup, history, and continuation plan without requiring the old chat or screenshots. It is not a copy of the application source, database, uploaded files, or credentials.

**Critical portability warning:** at this snapshot, the local Git history contains only `cb762a4 Initial commit`. `README.md` is modified and most application files, scripts, tests, and other documentation are untracked. The working implementation was deployed from the local folder using the Vercel CLI. A fresh GitHub clone may therefore NOT contain the working application.

To continue elsewhere, provide this file **and the actual source snapshot**: either deliberately commit/push the reviewed source or transfer a source archive. Transfer secrets separately through a secure channel/environment manager; never paste them into this document or commit them. A database backup/restore or account transfer is a separate operation, not part of copying source.

## 2. Project identity and current locations

| Item | Value / meaning |
| --- | --- |
| Product | UniConnect |
| Audience | Students with a verified `@mastersunion.org` email |
| GitHub remote | https://github.com/shubhtanna/UniConnect |
| Original local folder | `D:\SHUBH (2)\SHUBH\UniConnect` |
| Local development URL | http://localhost:3000 — start the server first; port 3001 was used earlier when 3000 was occupied |
| Stable production URL | https://uniconnect-teal.vercel.app |
| Last known deployed snapshot | https://uniconnect-ik6fu3ex1-shubh-tannas-projects.vercel.app |
| Last known deployment ID | `dpl_ER3zKiWbdqess5x5StzgV6zqrh9U` |
| Vercel scope / project | `shubh-tannas-projects` / `uniconnect` |
| Production database | MongoDB Atlas, existing `Cluster0`, dedicated database `uniconnect` |
| Atlas project seen during setup | `Dealspouch` — this cluster is shared with other applications; do not alter their databases |
| Vector index | `profile_embedding` on `uniconnect.profiles.resumeEmbedding` |

Deployment URLs and service state are historical context, not a guarantee of current availability. Recheck them when resuming. Older immutable Vercel deployment URLs continue serving older code; use the stable production URL when testing the current release.

All code paths below are **repository-relative**, so the guide remains usable after moving the folder.

## 3. User decisions and working preferences

- Build incrementally, phase by phase, and verify each change.
- Maintain `README.md`, `BUILT.md`, and `PENDING.md` together. README explains the app; BUILT records completed work/evidence; PENDING records unfinished work.
- Keep this handoff updated when major behavior, deployment, or next priorities change.
- Use **Vercel** for hosting.
- Use **Nodemailer with SMTP** for email. The user explicitly said Resend is not needed. Do not switch email providers without a reason and approval.
- Reuse the existing MongoDB Atlas cluster with a separate UniConnect database. A new cluster is not required just for this project.
- Real credentials were added to local `.env.local` and Vercel environment settings. Do not ask the user to repaste all keys into chat, print their values, or replace them blindly.
- Follow the MU Coach-inspired dark UI described below.
- Explain failures in usable language and identify the affected field. Do not blame a resume file for a server/provider failure.
- Future features must solve finding like-minded people; generic social-network feature expansion is not the objective.

## 4. Original first-release requirements and built state

The original brief described a private campus network across many cohorts, where useful student skills and interests were scattered across chats, social profiles, and chance meetings. It requested email OTP, resume-assisted onboarding, searchable profiles, and Community/Business Spotlight feeds.

| Phase / area | Implemented foundation | Important qualification |
| --- | --- | --- |
| 1 — Foundation/authentication | Next.js project, MongoDB models, exact MU-domain email OTP, session cookies, protected pages | Provider authentication is connected; full delivery/abuse coverage is not established by unit tests |
| 2 — Profile onboarding | Photo upload, PDF/DOCX parsing, AI/local field extraction, review/edit form, profile save, embeddings, private profile view | Field-specific save errors were deployed on 28 September; authenticated visual verification remains pending |
| 3 — Public UI | Six-part landing experience and shared MU-style dark design system | Responsive code/lint are not substitutes for a complete device/accessibility audit |
| 4 — Feed | Community/Spotlight tabs, posts, images, comments, likes, shares, reports, two-Spotlight-post daily rule | No full moderation workflow or general messaging system |
| 5 — Find Connections | Natural-language search, vector + keyword ranking, explained profile cards, private profile detail | This is resume/goal-based retrieval, not the proposed interest/intention matching product |
| 6 — Release foundations | Rate limits, headers, validation, health endpoint, service/index scripts, smoke/unit tests, deployment documentation | Operational readiness/security still require the follow-up work listed below |

### Current end-to-end journey

1. Visit the public homepage or login page.
2. Enter an official MU email; request and verify a six-digit OTP.
3. A verified user with an incomplete profile is sent to `/profile/setup`.
4. Step 1: upload a photo. Step 2: upload a PDF/DOCX resume. Step 3: review extracted fields and fill missing details.
5. Saving validates the profile, generates an embedding, persists the profile, and marks the user complete.
6. Completed users reach the dashboard, their profile, Find Connections, and the feed.
7. Users can edit their own profile; resaving regenerates the embedding.
8. Find Connections returns existing verified, profile-complete people and links to their private profile/contact information. It does not implement a mutual connection-request workflow.

### Original exclusions, still not implemented

Alumni tier, private direct messaging, a full admin moderation dashboard, and a complete notifications interface were outside the initial release. A separate sophisticated directory/filter system, saved connections, and interest circles should not be assumed present. Existing reports are stored, but there is no complete administrative resolution workflow.

## 5. Design system to preserve

The user wants UniConnect to feel familiar to MU students, inspired by the MU Coach LMS visual language. This is a styling requirement, not an integration with the LMS or a claim of official endorsement.

- Near-black background with a fine grid texture in hero/marketing areas.
- Dark cards, thin borders, rounded corners around 12–16px, occasional gradient top strips.
- One brand accent: teal `#2DD4BF` to amber `#FBBF24`. Avoid introducing unrelated brand colors.
- Off-white primary text and muted gray supporting text.
- Bold geometric sans-serif headings, large homepage headline, comfortable body text and spacing.
- Public pages use a top navigation bar; signed-in pages use a compact left icon rail and mobile navigation.
- Pill-shaped gradient primary buttons; outlined secondary buttons; circular icon controls.
- Circular avatars, cohort labels, and skill chips on profile cards.
- Pill tabs for Community/Spotlight; distinguish Spotlight with a badge/accent.
- Dark form fields, visible focus states, and a three-step onboarding indicator.
- No white logged-in surfaces or generic Bootstrap styling.

Actual Tailwind tokens in `tailwind.config.ts`: `app=#0A0A0A`, `surface=#151515`, `elevated=#1A1A1A`, `line=#2A2A2A`, `ink=#F5F5F4`, `muted=#9CA3AF`, `teal=#2DD4BF`, `amber=#FBBF24`. Shared classes are in `src/app/globals.css`. Some current error feedback uses semantic red; do not mistake that for a second brand palette. Review any visual changes against accessibility needs.

The user suggested considering shadcn/ui, but the current app uses custom React/Tailwind components. Do not assume shadcn is installed.

## 6. Actual technology stack

| Layer | Current implementation |
| --- | --- |
| Web framework | Next.js App Router, package range `^15.5.24`; previous build resolved 15.5.26 |
| UI | React 18.3, TypeScript 5.7, Tailwind CSS 3.4, PostCSS |
| Backend | Next.js route handlers in the same application; no separate Express service |
| Database | MongoDB Atlas + Mongoose 8.9; cached connection and development-only memory stores |
| Validation | Zod 3.24 |
| Sessions | `jose` signed JWT in HTTP-only cookies |
| Email | Nodemailer 10 + SMTP |
| Media | Cloudinary authenticated storage; local filesystem mode for development |
| Resume text | `pdf-parse` 2.4.5, `mammoth` 1.13, and direct `@napi-rs/canvas` dependency for PDF runtime support |
| AI | Server-side HTTP requests to OpenAI chat completions and embeddings APIs |
| Tests | Node test runner through `tsx`; API smoke scripts |
| Hosting | Vercel Node.js functions + Next.js deployment |

The original brief named Next.js 14; implementation uses the 15.5 line. Preserve `package-lock.json` and use `npm ci` for reproducibility. Do not treat earlier dependency-audit results as current security guarantees.

`package.json` declares Node `>=20.9.0`; Node 24.4.1 was used during the deployment work. Use a currently supported compatible runtime and align local/Vercel versions. Check native PDF dependency compatibility before changing Node or the parser packages. `next lint` works now but emits a deprecation notice for Next.js 16.

## 7. Code map and routes

### Main implementation files

| Concern | Where to start |
| --- | --- |
| Homepage / global layout | `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css` |
| Authentication UI | `src/components/auth/LoginForm.tsx`, `src/app/login/page.tsx` |
| Onboarding/review form | `src/components/profile/ProfileSetupForm.tsx`, `src/app/profile/setup/page.tsx` |
| Signed-in layout/navigation | `src/app/(protected)/layout.tsx`, `src/components/app/AppShell.tsx` |
| Feed UI | `src/components/feed/FeedClient.tsx` |
| Search UI | `src/components/connections/ConnectionsClient.tsx` |
| Auth/OTP/session logic | `src/lib/auth.ts`, `auth-store.ts`, `api-auth.ts`, `otp.ts`, `email.ts`, `session.ts`, `session-token.ts`, `validation.ts`, `navigation.ts` |
| Environment/database | `src/lib/env.ts`, `src/lib/db.ts` |
| Profile contract and persistence | `src/lib/profile-types.ts`, `profile-validation.ts`, `profile-store.ts` |
| Resume and embeddings | `src/lib/resume.ts`, `src/lib/embeddings.ts` |
| Uploads/private delivery | `src/lib/file-storage.ts`, `src/lib/file-signatures.ts`, file/profile API routes |
| Matching | `src/lib/connection-search.ts`, `connection-types.ts`, `connection-validation.ts`, profile-store retrieval methods |
| Feed persistence/validation | `src/lib/feed-store.ts`, `feed-types.ts`, `feed-validation.ts` |
| Protections/logging | `middleware.ts`, `next.config.mjs`, `src/lib/rate-limit.ts`, `src/lib/logger.ts` |
| Data models | `src/models/User.ts`, `Profile.ts`, `Post.ts`, `EmailOtp.ts`, `RateLimit.ts` |
| Scripts/tests | `scripts/`, `tests/quality.test.ts`, `tests/resume.test.ts` |

Page routes: `/`, `/login`, `/profile/setup`, `/dashboard`, `/profile`, `/feed`, `/connections`, `/connections/[userId]`. The `(protected)` folder is a route group and does not appear in URLs. There is no independent `/directory` page in this snapshot.

### API routes

| Route | Purpose |
| --- | --- |
| `POST /api/auth/request-otp` | Validate email and send/create OTP challenge |
| `POST /api/auth/verify-otp` | Verify challenge, create/find user, establish session |
| `POST /api/auth/sign-out` | Clear session cookie |
| `POST /api/profile/upload-photo` | Multipart upload with a `file` field |
| `POST /api/profile/upload-resume` | Multipart `file`; returns URL, extracted fields, missing fields, extraction mode |
| `POST /api/profile/complete` | Validate/save profile and embedding |
| `GET /api/files/[...parts]` | Authenticated local-file response or Cloudinary signed-URL redirect |
| `GET/POST /api/feed` | Paginated feed / create post |
| `POST /api/feed/upload-media` | Upload feed image |
| `/api/feed/[postId]/like`, `/share`, `/comments`, `/report` | Post interactions; inspect handlers for exact request payloads |
| `POST /api/feed/[postId]/comments/[commentId]/report` | Report a comment |
| `POST /api/connections/search` | Search with a natural-language query |
| `GET /api/health` | Database ping plus non-secret service-configuration status |

## 8. Data, authentication, and matching behavior

### Collections

- `users`: email, verification/completion flags, timestamps.
- `emailotps`: unique email, hashed code, expiry, resend availability, attempts; expiry TTL index.
- `profiles`: unique `userId`, name, photo/resume URLs, cohort, skills, work experience, education, current project, `lookingFor`, LinkedIn/contact links, manual-field metadata, embedding, timestamps.
- `posts`: author, type, content, media, Spotlight business fields, likes/shares/reports, embedded comments and comment reports.
- `ratelimits`: hashed counter identity/key, counter and expiry, TTL index.

`preloadedprofiles` is a private staging collection for the Master CV workflow. It stores the exact MU claim email, source filename, cohort, reviewed structured profile fields, an empty/local embedding field, batch ID, status (`pending`, `claimed`, or `conflict`), and claim metadata. It stores neither the original CV nor raw extracted text. No application API lists staged records. Only a matching OTP-verified email can trigger a claim.

Work entries are `{ company, role, duration, description }`. Education entries are `{ institution, degree, year }`. Resume URL and embedding are hidden by default in Mongoose selections and deliberately selected only where needed. Search cards omit the original resume and embedding. Resume raw text is processed for extraction, not a separate persisted profile field in the current model.

### Authentication rules

- Exact `mastersunion.org` email domain, case-insensitive; not arbitrary subdomains or lookalike suffixes.
- Cryptographically generated six-digit OTP, HMAC hashing with `OTP_PEPPER`, ten-minute expiry, sixty-second resend cooldown, five challenge attempts.
- Seven-day signed sessions; HTTP-only, same-site cookies, secure in production.
- Database verification/completion checks supplement route middleware. Incomplete users go to setup before entering protected app pages.
- No passwords, Google sign-in, or other OAuth integration.
- Development without SMTP can log/return the OTP locally. Never enable development OTP disclosure in production. Recheck the login UI's placement of the development code if needed; API/console availability is not proof it is visible on the correct step.

### Resume pipeline

`PDF/DOCX → text extraction → OpenAI JSON extraction (or local heuristic) → schema validation → editable review → completion validation → embedding → MongoDB`

Current server limits: photo 5 MB, resume 10 MB, feed image 8 MB. These are application limits, not proof the hosting platform accepts requests that large. Scanned/image-only PDFs have no OCR implementation; insufficient readable text returns an error. The AI prompt receives at most 45,000 characters of resume text and treats that text as untrusted input.

### Current connection matching

1. Embed the search query.
2. Try Atlas Vector Search using the configured index; retrieve a candidate set and filter to eligible users, excluding the requester.
3. If Atlas is unavailable or yields no candidates, load up to 500 eligible profiles and use application-side ranking.
4. Combine semantic score (72%) with keyword overlap (28%) and keep up to six results.
5. Optionally ask the chat model for concise match reasons using only retrieved summaries.
6. Allowlist returned profile IDs, discard unknown/duplicate IDs, and insert names from trusted stored profiles.
7. Fall back to deterministic reason text if the answer model fails.

These are ranking heuristics, not a validated “compatibility percentage.” The local fallback embedding is 384-dimensional; the configured OpenAI embedding is 1,536-dimensional. Do not mix these representations or models in one index. Resave/backfill profiles when switching embedding providers/dimensions, with a migration plan before modifying real data.

The answer fallback does not cover every upstream error: if configured OpenAI query embedding fails, search can fail before retrieval. Allowlisted identities also do not prove every generated explanation is factually correct. Relevance thresholds, cross-cohort quality, scaling, and explanation grounding need evaluation.

## 9. Reported blocker and local fix: field-specific profile errors

**Update 28 September:** the changes below are implemented, covered by regression tests, and deployed to production. The API now returns `{ error, fieldErrors }`; the UI shares the validation schema, highlights invalid inputs, shows all issue paths with readable labels, focuses the first error, and revalidates as values/rows change. Skills have a live unique counter and duplicate normalization. Oversized distinct lists are preserved for review. Invalid LinkedIn URL parsing no longer throws. The new tests are in `tests/profile-validation.test.ts`; the Phase 2 smoke script checks field-specific API errors and a successful corrected retry. Browser automation could not initialize, so actual focus/mobile interaction checks remain pending. Vercel Ready status, the stable production alias, homepage/login/health HTTP 200, and anonymous setup redirect were verified after deployment.

The user's latest screenshot shows profile review followed by:

> Array must contain at most 30 element(s)

The error does not say which field to fix. The screenshot alone cannot prove the field. In `completeProfileSchema`, both `skills` and `fieldsFilledManually` have a maximum of 30. Too many extracted skills is the likely ordinary user-flow cause, but this must be confirmed from the actual validation issue path, not guessed.

### Original cause (before the 28 September fix)

- `src/app/api/profile/complete/route.ts` returns only `parsed.error.issues[0]?.message` with HTTP 400.
- It drops the issue's field path and all remaining validation issues.
- `ProfileSetupForm.tsx` displays a single error banner after the form.
- Skills are entered as comma-separated text and split/trimmed before sending. The form does not currently explain the 30-item limit beside the control.
- The AI extraction schema accepts an unrestricted skills array, while completion caps it at 30. The heuristic extractor already limits its own skills output; the AI path does not enforce the same limit.

### Implemented behavior / browser acceptance checklist

1. Return structured, field-addressable errors from the completion API while keeping a friendly general summary.
2. Preserve paths for nested entries, for example `education.2.year` and `workExperience.0.company`.
3. Map technical paths to user-facing labels: “Skills,” “Education entry 3 — Year,” etc.
4. Show errors beside the affected control; highlight it accessibly with `aria-invalid` and `aria-describedby`.
5. Provide a summary linking/focusing/scrolling to the first invalid field. Make the mobile layout usable.
6. Show the skills count and limit. Deduplicate/trim deliberately; do not silently delete the user's extracted or entered skills simply to make submission pass.
7. Apply consistent client/server validation. Keep server validation authoritative.
8. Preserve all entered data after failure; clear or update stale errors as fields change and rows are added/removed.
9. Keep upstream/storage/embedding failures separate from user-correctable field errors.
10. Test too many skills, long skill text, missing nested values, URL/contact errors, multiple simultaneous errors, retry after correction, and a successful save.

Implemented example copy: **“Skills: You added 34 unique skills. Keep up to 30; remove 4 to continue.”** The count is calculated from submitted skills, not hardcoded.

### Relevant current limits

| Field | Current completion rule |
| --- | --- |
| Name | 2–120 characters |
| Cohort | 2–120 characters |
| Skills | 1–30 entries, each 1–60 characters |
| Work experience | Up to 20 entries; company/role 1–120, duration 1–100, description up to 1,000 characters |
| Education | Up to 20 entries; institution/degree 1–160, year 1–40 characters |
| Current project | Up to 1,000 characters, may be empty |
| Looking for | 2–500 characters |
| LinkedIn URL | Empty or HTTP(S) URL, up to 300 characters; current schema does not restrict the hostname to LinkedIn |
| Contact | Required email, mailto, or HTTP(S) link, up to 300 characters |
| Photo/resume URL | Must start with `/api/files/`; stronger ownership/existence validation is pending |
| Manual-field metadata | Up to 30 strings, each up to 80 characters |

The generic save-validation problem is separate from the earlier upload/parsing HTTP 422 problems.

## 10. Troubleshooting history: avoid repeating old investigations

### Local CSS looked completely unstyled

An earlier local page displayed raw HTML. Development and production builds sharing `.next` can leave stale/inconsistent output. Stop the relevant dev server before running a local production build, then restart the appropriate server and verify stylesheet requests. If cleanup is necessary, resolve and remove only this project's generated `.next` directory, never a broad folder. This is troubleshooting context, not proof every future CSS failure has that cause.

### Production resume upload failure 1: missing PDF runtime support

Production logs showed `DOMMatrix is not defined` while PDF parsing. The serverless bundle lacked the needed canvas/native support.

Fix present in the source:

- `@napi-rs/canvas` is a direct production dependency.
- `next.config.mjs` lists `pdf-parse`, `pdfjs-dist`, and `@napi-rs/canvas` in `serverExternalPackages`.
- `outputFileTracingIncludes` for `/api/profile/upload-resume` includes canvas, its Linux x64 GNU binary package, and the PDF.js legacy build/worker files.
- The upload route explicitly uses the Node.js runtime.

Do not remove those packaging settings merely because PDF extraction works on Windows locally. Verify the Linux deployment bundle too.

### Production resume upload failure 2: unexpected AI field type

After the parser fix, AI returned `currentProject` as an array instead of the string expected by the review form. Zod rejected it.

Fix present in `src/lib/resume.ts`:

- Missing/null project values become an empty string.
- Arrays of strings or objects containing name/title/description become newline-separated project text.
- Project text is bounded for the review field; the prompt explicitly requests string/array field types.
- `extractedProfileSchema` is exported and regression-tested.

This only hardens the documented project-field cases. It is not complete normalization of arbitrary AI output; other fields can still return invalid types or oversize values.

### Last known live outcome

After the above fixes, a production resume-upload request was observed returning HTTP 200 on the 27 September deployment `dpl_33pkqUuucWMQGcvBfRxtc98CA5cy`. That proves that request succeeded, not that all PDFs, DOCX files, providers, or onboarding edge cases are solved. The later screenshot reaches profile review and exposes the separate save-validation message problem. The 28 September deployment checks were read-only; a fresh authenticated production resume upload was not repeated.

The upload handler still maps broadly caught parser, storage, and AI exceptions to the same generic HTTP 422 message. Improve stage-specific diagnostics and safe user messages rather than repeatedly asking users to retry the same file.

## 11. Environment variables and services

No real secret values are included in this handoff. `.env.local` exists on the original machine and is ignored; Vercel has its own environment settings. New environments need securely supplied credentials or intentionally isolated development fallbacks.

| Variable | What to supply |
| --- | --- |
| `DATABASE_MODE` | `mongodb` for connected/production operation; `memory` only for disposable local development |
| `MONGODB_URI` | Atlas application connection string, including the intended `/uniconnect` database and URL-encoded credentials |
| `SESSION_SECRET` | Independently generated random secret of at least 32 characters; not an API key from a provider |
| `OTP_PEPPER` | A different independently generated random secret of at least 32 characters |
| `SMTP_HOST` | Current Gmail setup: `smtp.gmail.com`; otherwise the selected SMTP provider's host |
| `SMTP_PORT` | `465` with secure TLS for the current Gmail setup; match your provider |
| `SMTP_SECURE` | `true` for the current port-465 setup; use the correct setting for any alternative provider |
| `SMTP_USER` | Full email address of the account sending OTPs; not the student's recipient address |
| `SMTP_PASSWORD` | SMTP credential; for the current Gmail approach, an App Password, not a normal account password |
| `SMTP_FROM` | Authorized sender, for example `UniConnect <your-sender@gmail.com>`; normally align with `SMTP_USER` |
| `STORAGE_MODE` | `cloudinary` in production; `local` only in development |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary product environment/cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `OPENAI_API_KEY` | Server-side project key with usable billing/quota for the configured operations |
| `OPENAI_CHAT_MODEL` | Current default: `gpt-4o-mini`; verify account availability before changing |
| `OPENAI_EMBEDDING_MODEL` | Current default: `text-embedding-3-small` |
| `OPENAI_EMBEDDING_DIMENSIONS` | `1536`; must match stored vectors and Atlas index |
| `ATLAS_VECTOR_INDEX` | `profile_embedding`; an index name, not a password or key |
| `NODE_ENV` | Managed by the runtime/Next.js; production must not be forced into development |

All credentials remain server-side. Do not rename them to `NEXT_PUBLIC_*` or expose them through API responses. The sample sender `no-reply@mastersunion.org` in older templates does not grant permission to send as that domain; use an actually authorized sender.

Generate each local secret separately with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in a private terminal and copy it directly into the environment configuration. Do not put generated values in shared logs/docs. Rotating `SESSION_SECRET` invalidates existing sessions; changing `OTP_PEPPER` invalidates outstanding code checks.

Production validation rejects memory database mode, local storage, and missing SMTP credentials. Cloudinary mode requires its credentials. OpenAI is optional in the current schema, even in production; absence activates local extraction/embeddings. For the intended AI experience it must be configured, and an already-configured provider failure does not automatically become offline mode everywhere.

### MongoDB setup

Reuse the existing cluster. Keep UniConnect records in `uniconnect`; do not choose unrelated collections such as the other application's coupons/leads. Use a least-privilege database user and suitable deployment network access.

The conventional unique/query/TTL indexes were created during setup. The user created the Atlas vector index manually; an earlier screenshot showed Pending. Its final Ready/Queryable status was not independently established by this handoff. Check that status before attributing every search failure to AI.

Index name: `profile_embedding`; collection: `uniconnect.profiles`; index type: Vector Search; definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "resumeEmbedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

The application generates embeddings itself. Atlas automatic embedding or a separately billed auto-embedding workflow is not required by this code. Do not create an index on a different field merely because its name resembles `profile_embedding`.

`scripts/create-indexes.mjs` creates conventional indexes and attempts the search index. Its final “MongoDB indexes are ready” message is not proof the vector step succeeded; that step can warn and continue. Run deliberately against the intended database, not every shared database.

### Cloudinary / AI privacy

Resume files are sent to Cloudinary; extracted resume text is sent to OpenAI when configured. Explain these processors to users and establish consent, retention, and deletion rules before a broad rollout. Do not use real student resumes as committed test fixtures.

## 12. Running locally in a new environment

1. Obtain the full source and lockfile, not just this Markdown or an old GitHub clone.
2. Install a compatible Node.js runtime and dependencies with `npm ci`.
3. Create `.env.local` from a sanitized template, without overwriting an existing working file. The original `.env.example` exists locally, but current `.gitignore` ends in `.env*`, which also ignores that template. Add a reviewed exception such as `!.env.example` before sharing a sanitized template through Git.
4. Choose one mode:
   - **Connected mode:** use MongoDB, Cloudinary, SMTP, and OpenAI credentials. Prefer separate development resources; using production credentials makes local actions affect real data and send real email.
   - **Disposable UI/demo mode:** `DATABASE_MODE=memory`, `STORAGE_MODE=local`, unset SMTP host and OpenAI key, and provide development session/OTP secrets. Users/data reset when the process restarts. Local files may remain in `.data/uploads`, but the in-memory file metadata is not durable across restart.
5. Run `npm run dev`; open http://localhost:3000 and use the actual port printed if 3000 is occupied.
6. Restart after editing environment variables; `getServerEnv()` caches validated configuration in-process.

Next.js loads `.env.local`; standalone scripts generally do not. For the index script use:

```text
node --env-file=.env.local scripts/create-indexes.mjs
```

The package alias `npm run db:indexes` is also usable when the environment is already exported. Do not assume it loads `.env.local` automatically. The service check does load that file:

```text
npm run services:check
```

This authenticates/checks providers without sending an OTP email. OpenAI authentication/model-list access alone does not prove extraction, embeddings, quotas, or model availability end to end.

For Windows process issues, inspect the exact listener on the relevant port and its process before stopping it. Do not terminate all Node processes; this machine may run other projects.

## 13. Verification commands and evidence

### Rechecked during the 28 September field-validation fix

- `npm test`: **18 tests passed**, zero failures (including ten new validation regressions).
- `npm run typecheck`: passed.
- `npm run lint`: passed with no lint errors/warnings; the command itself prints a `next lint` deprecation notice.
- `npm run build`: passed on 28 September with the validation fix.
- Phase 2 API smoke test: passed against an isolated local memory database and local file storage, with SMTP/OpenAI disabled. Verified named errors for 34 skills, missing education year, and malformed LinkedIn URL, followed by a successful corrected profile save. OTP, photo, PDF/DOCX extraction, and protected profile HTTP 200 also passed.

The original handoff creation did not deploy or mutate production. The 28 September fix was subsequently deployed with explicit user approval. Read-only production checks confirmed homepage/login/health HTTP 200, MongoDB connected, and anonymous setup redirect to login. These checks did not send real email or mutate student records. The in-app browser helper failed to initialize; do not claim its interaction checks passed.

### Earlier recorded checks

- Production builds completed during implementation/deployment.
- Local phase 2/4/5 smoke flows were recorded as passing during development.
- MongoDB, Cloudinary, SMTP, and OpenAI authentication checks were recorded as successful.
- Production health returned HTTP 200 with MongoDB connected and storage/email/AI configured.
- A production resume upload returned HTTP 200 after the two fixes above.

These are historical checks, not substitutes for retesting the new environment. `/api/health` actively pings MongoDB, but email/AI/storage fields largely describe configuration, not live delivery/extraction/upload success. Earlier “zero vulnerabilities” audit statements are point-in-time observations only.

### Commands and safe use

```text
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Stop the dev server before a local production build; `npm start` is for the resulting production build. Do not share `.next` output between simultaneous dev/build processes.

Smoke scripts: `npm run smoke:phase2`, `npm run smoke:phase4`, `npm run smoke:phase5`. Inspect their setup before running: they use development OTP behavior and create test users/content. Run against an isolated disposable local environment, not production SMTP or a real student database. They are not a comprehensive browser automation suite.

Optional demo seeding: `scripts/seed-demo.mjs`, gated by `ALLOW_DEMO_SEED=true`, refuses `NODE_ENV=production`. That flag alone does not make a production database safe: verify the actual connection target and use a separate development database.

### Master CV batch commands

Use `scripts/master-cv-manifest.example.json` as the shape reference. Every profile requires an exact official MU email and a local PDF/DOCX path. A batch default supplies cohort/looking-for text; per-student overrides can correct name, cohort, skills, work experience, education, project, LinkedIn, and intent.

```text
npm run master-cv:import -- --manifest <manifest.json>
npm run master-cv:import -- --manifest <manifest.json> --apply
npm run master-cv:status
```

The first command is a dry run and writes a timestamped private report under `.data/master-cv-imports/`. Review every record. `--apply` stages the complete validated batch transactionally; failures write nothing. `--replace-pending` is an explicit replacement only for still-unclaimed staged entries and cannot replace a claimed/conflicted entry or a verified user. The importer is deliberately local-extraction-only: do not silently modify it to send classmates' resume text/files to OpenAI, Cloudinary, or another service. Obtain explicit informed approval before adding that processing. After a profile is claimed, ordinary connection search can send a retrieved structured profile summary to its configured answer provider; it does not receive the source CV or raw import text.

After the backend is deployed and indexes are created, OTP verification checks for the exact staged email. A successful claim creates a profile with `origin=masters_cv`, no public contact/photo/stored-resume by default, and a persistent review banner until acknowledged. It becomes eligible for search only after verification. Existing verified accounts are rejected from batch staging to avoid overwrites.

### Minimum checks after the next functional change

- Regression tests for the reported field-error case and successful retry.
- Typecheck, lint, tests, production build.
- Real browser check of desktop/mobile inline errors, keyboard focus, and retained values.
- Authorized MU account: request/verify OTP, photo/resume, review/save/edit, profile, search, feed.
- Anonymous requests cannot access private pages/files/API data; cross-user resume ownership is enforced using trusted data.
- Check the stable production URL only after an authorized deployment and confirm it points to the intended version.

## 14. Vercel deployment continuation

The project is already hosted. On 28 September the user explicitly approved publishing the tested validation fix, and deployment completed successfully. For future changes, confirm the current requested scope before deploying, transferring secrets, or changing shared services. Writing the original handoff did not itself deploy anything.

Original local deployment method:

```text
npx vercel@latest deploy --prod --yes --scope shubh-tannas-projects --no-color
```

The CLI uploads the current local source. CLI version 60.1.3 was used in previous work. On another machine, authenticate to the correct account and link/select the existing `uniconnect` project in `shubh-tannas-projects`; do not create an accidental second production project. `.vercel/project.json` is local linkage metadata and is ignored.

On 28 September an initial deployment without explicit scope returned “Not authorized” despite valid login/project access. Selecting `--scope shubh-tannas-projects` resolved it; no secrets, account permissions, or project linkage needed changing. The resulting production deployment is `dpl_ER3zKiWbdqess5x5StzgV6zqrh9U`.

Before deployment: verify source state, correct project, environment scope (Production versus Preview), database target, build/tests, and PDF native dependency tracing. Environment-setting changes normally require a new deployment to affect deployed functions. Do not bulk overwrite user-entered secrets.

After deployment: check build logs, runtime logs, health, and one authorized end-to-end journey. Do not use a successful homepage as proof private uploads/search work. Function request-size/duration limits must be checked against the actual Vercel plan/runtime before promising that every 10 MB upload will succeed.

GitHub/Vercel integration may trigger deployments when code is pushed. Since the current local implementation is not committed, reconcile the source intentionally before relying on Git-based deployment. Never commit `.env.local`, production exports, `.data`, or uploaded student files.

## 15. Known gaps and hardening priorities

These are continuation items, not claims that fixes already exist. Some are code-review concerns, not demonstrated production exploits.

### P0 / before expanding real-student use

- **Field-specific profile validation UI check:** fix is deployed; verify authenticated browser focus/mobile interactions (section 9).
- **Trusted file authorization:** `file-storage.ts` encodes Cloudinary resource type, public ID, owner, and kind in a base64 token. The token itself is not signed/stored as trusted metadata; the current check trusts its decoded owner/kind. Base64 is not an authorization boundary. Use server-side trusted asset records and ownership checks (or a carefully authenticated token design), validate file kinds/resource IDs, and test cross-user access. Existing “owner-only” documentation describes the intended rule, not a completed security proof.
- **Profile upload references:** completion currently checks `/api/files/` prefixes, not that each referenced asset exists and belongs to the submitting user. Enforce that using trusted asset records.
- **Source portability:** safely version/transfer the working source and sanitized environment template. Do not assume the initial GitHub commit is enough.
- **Master CV consent and first rollout:** the backend is local only and contains no classmates' data yet. Before import, obtain the exact email mapping and correct cohort, review local extraction, confirm authorization to write the structured profiles into the connected database, deploy the claim code, and test once with a consenting account. Do not upload raw CVs or send them to an AI provider by default.
- **Error clarity:** distinguish unreadable documents, invalid AI output, AI/provider failures, storage failures, and invalid form fields without exposing secrets or private resume contents.

### P1 / reliability and operations

- Expand AI-output validation beyond `currentProject`; reconcile extraction/review/save limits without silently discarding data.
- Add upstream timeouts, bounded retries where appropriate, and actionable failure states. Consider safe recovery for partial upload/extraction success and orphaned assets.
- Verify Atlas index readiness and embedding consistency; design a backfill before switching models/dimensions.
- Calibrate search relevance/no-match thresholds. Current normalized cosine plus a low cutoff can label weak matches as relevant; the 500-profile fallback is not a campus-scale index.
- Review Cloudinary redirect URL lifetime/sharing behavior and caching against intended privacy requirements.
- Audit logs: `logServerError` prints `error.message` and a development stack, not a comprehensive redaction pass. Do not assume the word “sanitized” in an older doc guarantees no sensitive provider details can appear.
- Make rate/interaction invariants concurrency-safe. The daily Spotlight count-then-create flow can race; read/modify/save interactions deserve concurrent-request tests.
- Define reporting/moderation ownership, retention/deletion, account deletion, backups/restore, and privacy notice/consent.
- Test browser/mobile/accessibility and real service integration more thoroughly; eight focused unit tests do not cover the entire application.
- Review host upload/body limits; consider authorized direct-to-storage uploads if necessary. OCR is a separate capability, not currently present.
- Pin/verify deployment runtime and monitor dependency advisories. Do not perform a major framework migration merely to fix the current form bug.

### Documentation caveats

Older README/BUILT/PENDING/DEPLOYMENT statements are partially stale: some still say credentials/deployment are pending; others describe the release as fully complete or claim stronger privacy/log guarantees than the code review supports. `DEPLOYMENT.md` mentions alternative email services, but the user's decision is Nodemailer/SMTP. This handoff records the latest understood state; reconcile the older docs as functional work continues, using evidence rather than sweeping “complete” labels.

## 16. Product direction: find like-minded people, not a LinkedIn clone

The owner first asked for additional features, then rejected generic social-network expansion. The clarified goal is discovering people with similar interests, mindsets, and intentions. Do not interpret the earlier broad brainstorm as approval to implement every feature.

### What should change conceptually

Resume data answers **“What has this person done?”** The desired product also needs to answer **“What are they curious about, what do they want to do next, and are they looking for the same kind of interaction as me?”**

Example target experience: “I am curious about building an affordable consumer brand and want someone to explore the problem with—not necessarily a co-founder today.” UniConnect should find a small number of relevant students and explain the shared interest and compatible intent using information they explicitly chose to share.

### Proposed future features — not built or fully specified

| Feature | Why it addresses the real problem | Boundary |
| --- | --- | --- |
| Interest/intention onboarding | Collect current curiosity, problems, topics, and what sort of person/conversation someone wants | Explicit user input; do not infer sensitive beliefs or personality labels from resumes |
| Explained like-minded matches | A short list with specific shared interests and compatible intentions | Evidence-based reasons; no fake certainty or popularity ranking |
| “Unfinished thought” matching | Let someone share an early question/idea without needing a polished startup or achievement | Opt-in visibility; not a new performance-oriented feed |
| Mutual “let's talk” introductions | Lower the barrier between discovery and a real conversation | Consent from both sides; no automatic unsolicited contact |
| Contextual conversation starters | Suggest a first question about the actual overlap | Do not invent commonalities or send messages automatically |
| Small interest circles | Optional groups of roughly 3–5 people around a shared question or short exploration | Later experiment; avoid another noisy campus group directory |
| Relevance feedback | Learn whether a suggestion was useful, mistimed, or not relevant | Minimal, transparent feedback; no hidden reputational score |

First recommended product slice, after reliability fixes: **interest/intention onboarding → a small set of explained matches → a mutual introduction flow.** A possible headline is “People you'd genuinely want to talk to.” Keep the existing feed usable, but do not make feed engagement the organizing goal. Do not delete the feed or change mandatory onboarding requirements without an explicit product decision.

### Suggested implementation sequence, not existing code

1. Define a minimal matching profile with explicit interests, current curiosity, interaction intent, optional availability, and visibility preferences. Decide which fields are optional and how existing users are invited to complete them.
2. Extend validation, database/types, profile editing, and tests together. Backward compatibility matters for existing profiles.
3. Keep intent/interest representation distinguishable from resume evidence. Do not blindly reuse a single old resume embedding for every matching purpose.
4. Build a small recommendation surface with clear reasons, “not relevant” feedback, and an honest empty state when the campus dataset is small.
5. Add introduction state and permissions: request, accept/decline, cancel, duplicate prevention, abuse controls, and notification/channel choices. No messaging provider is required until the actual flow is decided.
6. Pilot with a small consenting cohort and evaluate conversations/meetings and relevance—not likes, followers, or number of connections.
7. Only then test circles or richer matching behavior based on evidence from the pilot.

Open decisions before building that slice: exact onboarding questions; whether/when resume remains mandatory; whether “like-minded” means shared interests, compatible working style, complementary skills, or a blend; introduction channel; availability/visibility controls; matching cadence; feedback retention. The direction is clear, but these details are not previously finalized requirements.

## 17. Ordered continuation checklist

1. Obtain the real source snapshot and securely configure an isolated development environment.
2. Inspect the current branch/uncommitted changes; preserve existing work. Read this file and the relevant implementation before assuming prior fixes exist remotely.
3. Verify the existing field-specific validation fix with synthetic data and the Phase 2 smoke script. Check real-browser focus/mobile behavior before marking rollout complete.
4. Address trusted upload ownership/privacy before expanding student access, then verify upload and save diagnostics.
5. Run the test/type/lint/build and browser checks; update README, BUILT, PENDING, and this handoff with actual results.
6. Deploy only when authorized, to the existing Vercel project; verify the stable URL and production runtime behavior.
7. Agree the small interest/intention matching slice, then implement it incrementally. Avoid generic social-network feature creep.

## 18. Copyable starting prompt for the next AI/developer

> Continue the existing UniConnect project using this handoff and the provided source. Do not rebuild it from scratch. It is a private MU-only Next.js/MongoDB/Cloudinary/Nodemailer/OpenAI app hosted on Vercel, with a dark teal-to-amber MU-inspired UI. Its real goal is helping students find like-minded people, not becoming another LinkedIn. First confirm you have the current source, because most of it was uncommitted at the handoff snapshot. Field-specific validation feedback on profile save was implemented locally on 28 September with 18 passing unit tests: inspect that fix and verify browser behavior/production rollout rather than starting it again. The generic max-30-array screenshot alone does not prove which field failed. Preserve the PDF packaging and AI project-normalization fixes. Keep credentials out of code/chat, protect existing data, and check trusted file authorization before broader rollout. Maintain README.md, BUILT.md, PENDING.md, and PROJECT_HANDOFF.md. After stabilizing onboarding, propose a small interest/intention matching and mutual-introduction slice; do not invent approval for unrelated features or silently deploy shared changes.

---

This is a point-in-time handoff, not an automatic progress log. Update its date, verification evidence, deployment reference, current blocker, and pending roadmap as the project changes.

## 19. Discovery expansion implemented on 2026-09-28

The previously proposed discovery direction is now partially implemented and supersedes the “not built” label in section 16 for the following four capabilities:

1. **Browse students:** `/connections` now defaults to a paginated directory with keyword, cohort, skill, interest, and looking-for filters; AI search remains available in a second tab.
2. **Interest tags:** profiles have a separate, explicit `interests` list (maximum 12), editable during profile review and usable in filtering/matching. Existing profiles default safely to an empty list.
3. **Discovery insights:** `/insights` provides evidence-based “Who’s looking for you” reverse matches plus a 30-day viewer history. Users choose named or anonymous mode for future profile visits; anonymous viewers are counted but never identified.
4. **Brainstorm groups:** `/groups` supports focused open or invite-only groups, purpose/tags, controlled joining, and a persistent chronological member discussion. Creation, membership, invite, and posting limits are enforced.

Research-informed boundaries: directory filters stay profile-first; interests remain explicit rather than inferred; viewer privacy is visible and controllable; groups are focused persistent spaces rather than another algorithmic feed. There are no popularity scores, follower mechanics, or automatic messages.

Verification: 31 unit tests pass, along with strict TypeScript, lint, and local/remote optimized production builds. Conventional MongoDB indexes cover interests, profile views, groups, and group messages. Deployment `dpl_BtJWbA45dfHkKxF6zotzmLBZkMht` is Ready at `https://uniconnect-teal.vercel.app`; homepage/login, protected redirects, and connected-service health were verified. Authenticated browser verification with consenting accounts remains in `PENDING.md`, along with group moderation/lifecycle controls and a small relevance pilot.
