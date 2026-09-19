# Smoke Testing a Deployment

After Enclave is deployed, verify the application with:

```bash
APP_URL=https://your-enclave-host.example npm run smoke:app
```

The smoke test checks:

- application health endpoint,
- database readiness state,
- snapshot availability,
- explicit data-source provenance,
- latest validated Treasury record date,
- freshness state,
- daily brief publication state,
- presence of ERC13 gate results,
- and the invariant that a publishable brief cannot contain a failed gate.

A degraded health state is allowed during bootstrap because Enclave can fall back to live Treasury data. Production should normally report `ok` with a reachable database.
