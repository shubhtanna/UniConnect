# UniConnect

UniConnect is a verified student network for Masters' Union. It helps students discover people by skills and experience, find collaborators, share what they are building, and spotlight their businesses or projects.

## Project status

Latest release (2026-09-28): the discovery expansion adds a 40-person filterable class directory, explicit interest tags, privacy-aware “Who’s looking for you” insights, and focused brainstorm groups. The directory combines claimed profiles with clearly labelled unclaimed Master CV profiles; unclaimed entries never expose email, contact links, LinkedIn URLs, resume files, filenames, or claim identifiers.

This release is deployed at https://uniconnect-teal.vercel.app. Database deployment `dpl_HTArqQ17MsAv4VgYZUFtwUw2NHk6` explicitly selects the `uniconnect` database; existing UniConnect records were copied and verified there on 2026-09-28 while the former `test` records were retained temporarily as a rollback copy. The 31-test suite, TypeScript, lint, local/remote production builds, database/vector indexes, and production service health were verified. Authenticated visual interaction checks with consenting test accounts remain pending.

### Master CV profile preloading

The local backend supports preparing profiles from class Master CVs before students sign in. Each manifest row must include the student's exact official MU email, the local PDF/DOCX path, and a cohort (or use the batch default). Staged records remain outside the searchable `profiles` collection. After that exact address passes OTP verification, the backend atomically claims the staged record, creates the profile, marks the user complete, and shows a review/edit notice.

Original CV files and raw resume text are not uploaded or retained by the import tool. Extraction is local-only by default; only structured profile fields are staged in MongoDB. The official email is used only to claim the record and is not automatically exposed as a contact link. Imported students may add a photo, resume, or contact method when they choose. Once a profile is claimed, normal UniConnect search behavior applies: the configured search-answer provider may receive a retrieved structured profile summary, but never the source CV file or raw resume text from this importer.

1. Copy `scripts/master-cv-manifest.example.json` outside `scripts/`, give the batch a unique `batchId`, and add one item per student.
2. Run `npm run master-cv:import -- --manifest <path-to-manifest.json>` without `--apply`.
3. Review the private report in `.data/master-cv-imports/`. Resolve every failure or incorrect field.
4. Run the same command with `--apply`. Add `--replace-pending` only when intentionally replacing records that are still unclaimed.
5. Check the queue with `npm run master-cv:status`.

The importer validates the complete batch before writing and stages it within one MongoDB transaction. It refuses verified accounts, claimed/conflicted records, duplicate manifest emails, unsupported files, and unapproved replacement of existing pending records. Do not place resumes, manifests, or preview reports in Git.

Phases 1–6 are implemented: secure MU-only authentication, resume-assisted profile setup, private profile views, the public landing page, Community and Business Spotlight feeds, grounded connection search, and release-readiness protections. The discovery expansion now also includes a filterable student directory, explicit interest tags, privacy-aware discovery insights, and focused brainstorm groups.

- [What is built](BUILT.md) — verified, completed work only
- [What is pending](PENDING.md) — prioritized implementation checklist

These three documents are maintained together. A feature is removed from `PENDING.md` and added to `BUILT.md` only after its implementation has been verified.

## Planned experience

1. A student signs in using a verified `@mastersunion.org` email and a one-time password.
2. They upload a profile photo and resume.
3. UniConnect extracts resume details and prepares a profile for review.
4. The student completes their profile and gains access to the private network.
5. They can search for relevant people, post in the community feed, and promote a project through Business Spotlight.

## Core product areas

- Public six-section landing page
- Passwordless email-OTP authentication
- Resume-assisted profile creation
- Verified, private student directory
- Directory browsing with batch, skill, interest, and intention filters
- AI-assisted connection search
- Interest tags and reverse “Who’s looking for you” matches
- Named or anonymous profile-view preferences and 30-day viewer insights
- Open or invite-only brainstorm groups with persistent discussions
- Community and Business Spotlight feeds
- Like, comment, share, and report interactions
- Mobile-responsive interface

## Stack

- Next.js 15.5, React, TypeScript, and Tailwind CSS
- Next.js API routes or Node.js with Express
- MongoDB Atlas with Mongoose
- Cloudinary for profile photos and resumes
- OpenAI embeddings and structured resume extraction
- MongoDB Atlas Vector Search, with a suitable fallback if unavailable
- Nodemailer, Resend, or SendGrid for OTP delivery

The original specification named Next.js 14. The project uses the patched Next.js 15.5 line because the remaining Next.js 14 releases are affected by unresolved security advisories.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add your MongoDB, session, OTP, and SMTP values.
3. Start the development server with `npm run dev`.
4. Open `http://localhost:3000`.

SMTP may be left unset during local development; the OTP will be written to the server console. SMTP is mandatory in production.

For a zero-setup local demo, set `DATABASE_MODE=memory`. Local users and OTPs then reset whenever the development server restarts, and the OTP is displayed on the verification screen. Production rejects this mode and requires MongoDB.

Set `STORAGE_MODE=local` for private development uploads. Production rejects local storage and requires Cloudinary. Without an OpenAI key, resume extraction and embeddings use deterministic local fallbacks; adding the key activates the configured OpenAI models.

## Quality checks

- `npm run typecheck` — TypeScript validation
- `npm run lint` — Next.js and accessibility-oriented lint rules
- `npm run build` — optimized production build
- `npm audit` — dependency advisory check
- `npm run smoke:phase2` — complete local auth, upload, PDF/DOCX extraction, profile save, and protected-view check (requires the development server)
- `npm run smoke:phase4` — create posts, upload private media, exercise interactions, and verify the daily Spotlight limit (requires the development server)
- `npm run smoke:phase5` — validate protected access, create two profiles, and verify grounded connection search (requires the development server)
- `npm test` — unit coverage for domain rules, OTP expiry, redirects, validation, Spotlight limits, and grounded-answer constraints
- `npm run services:check` — authenticate MongoDB, Cloudinary, SMTP, and OpenAI without exposing secrets or sending an email

Production setup, required service credentials, indexes, and deployment checks are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

## Privacy and access rules

- Only `@mastersunion.org` email addresses may create accounts.
- Profiles and resumes must never be publicly accessible.
- Users with incomplete profiles must be redirected to profile setup from every protected route.
- Authentication is email-OTP only; third-party OAuth and stored passwords are out of scope.

## Phase 2 and later

Alumni access, direct messaging, a full moderation dashboard, and a complete notification system are intentionally outside the first release.

## Documentation workflow

For every implementation change:

1. Use the feature ID in `PENDING.md` while developing the feature.
2. Verify its acceptance criteria.
3. Move the completed item to `BUILT.md` with the verification evidence and date.
4. Update this README if the product behavior, setup, architecture, or user journey changed.
