import { fetchRecentDebtObservations } from "../src/fiscal/debt.js";
import { getPostgresDebtRepository } from "../src/storage/postgresDebtRepository.js";

async function main() {
  const repository = getPostgresDebtRepository();
  const observations = await fetchRecentDebtObservations({ pageSize: 45 });

  let inserted = 0;
  let duplicates = 0;
  let rejected = 0;

  for (const observation of observations) {
    if (observation.validationStatus === "fail") {
      rejected += 1;
      continue;
    }

    const result = await repository.save(observation);

    if (result === "inserted") inserted += 1;
    else duplicates += 1;
  }

  console.log(
    JSON.stringify(
      {
        source: "Debt to the Penny",
        received: observations.length,
        inserted,
        duplicates,
        rejected,
        completedAt: new Date().toISOString()
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
