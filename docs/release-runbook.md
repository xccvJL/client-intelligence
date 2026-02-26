# Production Runbook (125-User Target)

## Launch gates
1. CI green (`lint`, `build`, `test`) on `main`.
2. Staging deployment healthy.
3. Smoke checks pass:
   - Auth-protected API returns `401` without auth.
   - Authenticated account CRUD works.
   - Cron route rejects invalid secret and runs with valid secret.
   - Lead webhook rejects invalid key and handles retries idempotently.

## Rollout stages
1. Internal users only (24-48 hours).
2. Pilot cohort (10-20 users).
3. Full rollout to 125 users.

## Monitoring checks
- API 5xx rate.
- `/api/cron/process-sources` failure count.
- `/api/webhooks/lead-form` failure count.
- AI parse failure rate.
- Queue backlog (`processing_queue` in `failed` or long-running `processing`).

## Incident response
1. Acknowledge incident and assign owner.
2. Triage scope: auth/data integrity/availability.
3. Mitigate:
   - Disable problematic source (`knowledge_sources.enabled=false`) if ingestion issue.
   - Rotate compromised secret.
   - Roll back to prior deployment when needed.
4. Recover:
   - Replay failed queue items after fix.
   - Verify no duplicate intelligence/deals were created.
5. Post-incident:
   - Root cause summary.
   - Corrective actions and timeline.

## Rollback procedure
1. Re-deploy last known good Vercel deployment.
2. Keep new traffic on rollback build.
3. If schema migration caused issue, apply backward-compatible hotfix migration.
4. Re-run smoke checks.

## Secret rotation cadence
- `CRON_SECRET`, `WEBHOOK_API_KEY`: every 90 days or after incident.
- `GEMINI_API_KEY`, Google OAuth refresh credentials: every 90 days or provider event.
- `SUPABASE_SERVICE_ROLE_KEY`: rotate immediately on personnel/security event.
