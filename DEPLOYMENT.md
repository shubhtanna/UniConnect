# UniConnect deployment

This guide covers the production services, secrets, indexes, checks, and deployment order for the first complete release.

## Required production services

1. **MongoDB Atlas** stores users, OTP challenges, profiles, embeddings, posts, comments, reports, and distributed rate-limit counters.
2. **Cloudinary** stores authenticated profile photos, resumes, and feed images.
3. **SMTP email provider** delivers login codes. Resend, SendGrid, Amazon SES, or another provider with SMTP credentials can be used.
4. **OpenAI API** provides structured resume extraction, embeddings, and grounded connection-search ranking explanations.
5. **A Node.js host** runs the Next.js application. Vercel, Render, Railway, Fly.io, or an equivalent Node 20+ platform is suitable.

No OAuth, payment, maps, analytics, or messaging provider is required for the current product scope.

## Production environment variables

```env
NODE_ENV=production
DATABASE_MODE=mongodb
MONGODB_URI=mongodb+srv://...
MONGODB_DB=uniconnect

SESSION_SECRET=<unique random value of at least 32 characters>
OTP_PEPPER=<different random value of at least 32 characters>

SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM=UniConnect <no-reply@your-verified-domain.com>

STORAGE_MODE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

OPENAI_API_KEY=...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
ATLAS_VECTOR_INDEX=profile_embedding
```

Generate `SESSION_SECRET` and `OTP_PEPPER` independently. Never commit `.env.local`, provider secrets, database credentials, or production exports.

## Database preparation

Run this once with the production `MONGODB_URI` available to create unique, query, TTL, and Atlas Vector Search indexes:

```bash
npm run db:indexes
```

The MongoDB Atlas user needs permission to manage search indexes for the vector-index step. If that permission is unavailable, create an Atlas Vector Search index named `profile_embedding` on `profiles.resumeEmbedding` with cosine similarity and 1,536 dimensions. UniConnect automatically falls back to application-side cosine and keyword matching if Atlas Vector Search is temporarily unavailable.

## Deployment order

1. Provision MongoDB Atlas, Cloudinary, the email provider, OpenAI, and the Node host.
2. Add all environment variables to the host's encrypted settings.
3. Allow the host's network access in MongoDB Atlas and verify the SMTP sender/domain.
4. Run `npm ci`, `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
5. Run `npm run services:check` locally to verify provider authentication without sending an email.
6. Run `npm run db:indexes` against Atlas.
7. Deploy and check `/api/health`.
8. Test a real MU email OTP, private upload retrieval, resume extraction, feed posting, and connection search.
9. Confirm an unauthenticated request cannot open profiles, resumes, the feed, or search.

## Optional local demo data

`npm run db:seed-demo` creates three fictional profiles only when `ALLOW_DEMO_SEED=true` and refuses to run when `NODE_ENV=production`. Never seed real resumes or student details.

## Operational notes

- MongoDB-backed rate-limit counters work across multiple application instances and expire through TTL indexes.
- `/api/health` reports only provider readiness states and never returns credentials.
- Logs contain event names and sanitized error metadata, not request bodies or secrets.
- Cloudinary assets use authenticated delivery; resumes remain accessible only to their owner.
- Back up MongoDB and define data-retention/deletion procedures before inviting real students.
