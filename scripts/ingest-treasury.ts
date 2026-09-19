import { fetchRecentDebtObservations } from "../src/fiscal/debt.js";
import {
  getPostgresDebtRepository,
  recordIngestionRun
} from "../src/storage/postgresDebtRepository.js";

async function main() {
  const startedAt = new Date();
  const repository = getPostgresDebtRepository();

  let received = 0;
  let inserted = 0;
  let duplicates = 0;
  let rejected = 0;

  try {
    const observations = await fetchRecentDebtObservations({ pageSize: 45 });
    received = observations.length;

    for (const observation of observations) {
      if (observation.validationStatus === "fail") {
        rejected += 1;
        continue;
      }

      const result = await repository.save(observation);

      if (result === "inserted") inserted += 1;
      else duplicates += 1;
    }

    const completedAt = new Date();
    const status = rejected > 0 ? "partial" : "success";

    await recordIngestionRun({
      sourceDataset: "Debt to the Penny",
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      status,
      recordsReceived: received,
      recordsInserted: inserted,
      recordsRejected: rejected,
      errorMessage: null,
      adapterVersion: "1.0.0"
    });

    console.log(
      JSON.stringify(
        {
          source: "Debt to the Penny",
          received,
          inserted,
          duplicates,
          rejected,
          status,
          completedAt: completedAt.toISOString()
        },
        null,
        2
      )
    );
  } catch (error) {
    const completedAt = new Date();
    const message =
      error instanceof Error ? error.message : "Unknown ingestion failure";

    try {
      await recordIngestionRun({
        sourceDataset: "Debt to the Penny",
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        status: "failed",
        recordsReceived: received,
        recordsInserted: inserted,
        recordsRejected: rejected,
        errorMessage: message,
        adapterVersion: "1.0.0"
      });
    } catch (auditError) {
      console.error("Failed to persist ingestion audit record:", auditError);
    }

    throw error;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
