# Railway Deployment

This is the recommended first hosted deployment path for Project Enclave.

Railway can build the existing root `Dockerfile`, host the Next.js service, and provide PostgreSQL in the same project.

## Project layout

Create one Railway project with:

1. **Enclave Web**
   - Source: GitHub repository `CSUF562/DebtForecaster`
   - Branch: `main`
   - Build: root `Dockerfile`
   - Public networking: enabled
   - Healthcheck path: `/api/health`

2. **PostgreSQL**
   - Add a Railway PostgreSQL database service.
   - Railway provides `DATABASE_URL`.

3. **Treasury Ingestion**
   - Initially keep the existing GitHub Actions weekday ingestion workflow.
   - A Railway Cron Job can replace it later if centralizing operations becomes desirable.

## Required Web Service Variables

Set:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=require
```

Do not copy a production database URL into source code, Git history, or public issue comments.

Railway injects `PORT`; Next.js will use it through `npm start`.

## First deployment procedure

### 1. Create PostgreSQL

Add PostgreSQL from the Railway project canvas.

Wait until the database is running.

### 2. Create Enclave Web from GitHub

Connect:

```
CSUF562/DebtForecaster
```

Railway should detect the root `Dockerfile` automatically.

### 3. Add database variables

In the Enclave Web service Variables panel, reference the PostgreSQL service's `DATABASE_URL`.

Set:

```
DATABASE_SSL=require
```

### 4. Configure healthcheck

Set the service healthcheck path to:

```
/api/health
```

A healthy deployment should return HTTP 2xx.

### 5. Generate a temporary Railway domain

Use Railway Networking to generate a public domain.

Do not attach the final public Enclave domain until the smoke test succeeds.

### 6. Apply the database migration

Run in the service environment:

```bash
npm run db:migrate
```

### 7. Seed Treasury observations

Run:

```bash
npm run ingest:treasury
```

### 8. Verify health

Open:

```
https://<railway-domain>/api/health
```

Preferred result:

```json
{
  "status": "ok",
  "application": "ok",
  "database": {
    "configured": true,
    "reachable": true
  }
}
```

### 9. Verify evidence snapshot

Open:

```
https://<railway-domain>/api/snapshot
```

Check:

- `dataSource` is `database`
- latest Treasury observation exists
- freshness is visible
- daily brief has a publication state
- unresolved knowledge is present when appropriate
- ERC13 gate results are present

### 10. Run the external smoke test

From any machine with the repository dependencies installed:

```bash
APP_URL=https://<railway-domain> npm run smoke:app
```

The deployment should not be treated as ready merely because the homepage renders.

## Scheduled ingestion

The repository currently includes:

```
.github/workflows/treasury-ingest.yml
```

Add the production Railway PostgreSQL connection as the GitHub repository secret:

```
DATABASE_URL
```

This workflow runs on weekdays and writes ingestion-run audit records.

A future refinement may move this into a Railway Cron Job so application runtime and ingestion live under one operational system.

## Deployment acceptance criteria

The first hosted Enclave deployment is accepted only when all of the following are true:

- Docker build succeeds
- PostgreSQL is reachable
- migration succeeds
- Treasury ingestion succeeds
- `/api/health` is healthy
- `/api/snapshot` reports database provenance
- latest observation validates
- ERC13 output is present
- unresolved knowledge remains visible
- methodology/challenge route works
- `npm run smoke:app` succeeds

## After the first successful deployment

Next priorities:

1. Replace the September 2026 context case with scheduled context ingestion.
2. Add CBO, Federal Reserve, and Treasury context adapters.
3. Persist contextual evidence and revision history.
4. Add release/version metadata to public snapshots.
5. Add a custom domain.
6. Add monitoring and alerting for failed ingestion or stale data.
