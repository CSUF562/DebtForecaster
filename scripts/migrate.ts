import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDatabasePool } from "../src/storage/postgresDebtRepository.js";

async function main() {
  const migrationPath = resolve(
    process.cwd(),
    "db/migrations/001_debt_observations.sql"
  );

  const sql = await readFile(migrationPath, "utf8");
  const pool = getDatabasePool();

  await pool.query(sql);

  console.log(
    JSON.stringify(
      {
        migration: "001_debt_observations.sql",
        status: "applied",
        completedAt: new Date().toISOString()
      },
      null,
      2
    )
  );

  await pool.end();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
