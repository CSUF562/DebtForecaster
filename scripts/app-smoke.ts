const baseUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function readJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" }
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      `${path} returned HTTP ${response.status}: ${JSON.stringify(body)}`
    );
  }

  return body;
}

async function main() {
  const health = await readJson("/api/health");

  if (!["ok", "degraded"].includes(health.status)) {
    throw new Error(`Unexpected health state: ${health.status}`);
  }

  const snapshot = await readJson("/api/snapshot");

  if (!snapshot.generatedAt) {
    throw new Error("Snapshot is missing generatedAt provenance.");
  }

  if (!["database", "treasury-live"].includes(snapshot.dataSource)) {
    throw new Error(
      `Snapshot has unexpected dataSource: ${snapshot.dataSource}`
    );
  }

  if (!snapshot.latest?.recordDate) {
    throw new Error("Snapshot is missing a latest validated observation.");
  }

  if (!snapshot.brief?.governance?.results) {
    throw new Error("Snapshot is missing ERC13 governance results.");
  }

  const failedGates = snapshot.brief.governance.results.filter(
    (gate: { status: string }) => gate.status === "fail"
  );

  if (snapshot.brief.publicationStatus === "publishable" && failedGates.length > 0) {
    throw new Error(
      "Brief is marked publishable despite one or more failed ERC13 gates."
    );
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        appUrl: baseUrl,
        health: health.status,
        database: health.database,
        dataSource: snapshot.dataSource,
        recordDate: snapshot.latest.recordDate,
        freshness: snapshot.freshness?.status ?? null,
        publicationStatus: snapshot.brief.publicationStatus,
        erc13: snapshot.brief.governance.results.map(
          (gate: { gate: string; status: string }) => ({
            gate: gate.gate,
            status: gate.status
          })
        )
      },
      null,
      2
    )
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
