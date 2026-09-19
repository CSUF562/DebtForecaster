# Initial Deployment Checklist

## Required environment

- Node.js 22 or Docker
- PostgreSQL
- `DATABASE_URL`
- outbound HTTPS access to the U.S. Treasury Fiscal Data API

## Fastest reproducible local stack

The repository now includes a deployment-neutral Docker setup.

Start PostgreSQL and the application:

```bash
docker compose up -d db app
```

Apply the database migration:

```bash
docker compose --profile tools run --rm migrate
```

Seed recent Treasury observations:

```bash
docker compose --profile tools run --rm ingest
```

Then open:

```
http://localhost:3000
```

Health:

```
http://localhost:3000/api/health
```

Snapshot:

```
http://localhost:3000/api/snapshot
```

Convenience commands are also available through the Makefile:

```bash
make dev-up
make migrate
make ingest
make logs
```

The local Compose credentials are development-only and must not be reused in production.

## Non-container deployment

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables from `.env.example`.

3. Apply the database migration:

   ```bash
   npm run db:migrate
   ```

4. Run deterministic validation:

   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

5. Seed recent Treasury observations:

   ```bash
   npm run ingest:treasury
   ```

6. Start the application.

## Readiness checks

### Application / storage health

`GET /api/health`

Expected production result:

- `status: ok`
- database configured
- database reachable

A degraded response means the web app can still use its Treasury-live fallback, but persistence is unavailable.

### Evidence snapshot

`GET /api/snapshot`

Check:

- `dataSource`
- latest observation
- freshness
- publication state
- unresolved knowledge
- ERC13 gate results

## Scheduled ingestion

GitHub Actions workflow:

`.github/workflows/treasury-ingest.yml`

Required repository secret:

- `DATABASE_URL`

The workflow currently runs on weekdays and may also be triggered manually.

## Deployment principle

A deployment is not considered healthy merely because the webpage renders.

A healthy Enclave deployment requires:

- authoritative data retrieval,
- validation,
- persistence,
- observable freshness,
- source provenance,
- successful editorial-gate evaluation,
- visible uncertainty,
- and a functioning contestability path.
