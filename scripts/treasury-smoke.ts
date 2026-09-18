import {
  fetchRecentDebtObservations,
  selectLatestPublishableObservation
} from "../src/fiscal/debt.js";

async function main() {
  const observations = await fetchRecentDebtObservations({ pageSize: 5 });

  if (observations.length === 0) {
    throw new Error("Treasury Debt to the Penny returned no observations");
  }

  const latest = selectLatestPublishableObservation(observations);

  if (!latest) {
    throw new Error("No publishable Treasury observation passed validation");
  }

  console.log(
    JSON.stringify(
      {
        source: latest.sourceDataset,
        recordDate: latest.recordDate,
        validationStatus: latest.validationStatus,
        retrievedAt: latest.retrievedAt,
        observationsChecked: observations.length
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
