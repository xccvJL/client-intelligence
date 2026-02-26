# Environment and Secret Management Policy

## Environments
- `local`: developer machine only (`.env.local`).
- `staging`: production-like validation before release.
- `production`: customer traffic.

## Required controls
- Keep all non-local secrets in Vercel/Supabase secret stores only.
- `ALLOW_DEV_HEADER_AUTH` must be `false` in `staging` and `production`.
- Never copy production keys into `local` or `staging`.
- Rotate `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `WEBHOOK_API_KEY`, and `GEMINI_API_KEY` on incident or role changes.
- Use different Supabase projects for `staging` and `production`.

## Release flow
1. Merge into `main` only after CI (`lint`, `build`, `test`) passes.
2. Deploy to `staging` and run smoke tests.
3. Promote to `production` only from green `staging`.

## Secret rotation checklist
1. Create a new secret value.
2. Update the secret in Vercel/Supabase.
3. Redeploy `staging` and validate.
4. Redeploy `production`.
5. Revoke the old secret.
