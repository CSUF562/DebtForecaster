import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getDatabasePool } from "../src/storage/postgresDebtRepository";

async function main() {
  const migrationDir = path.resolve("db/migrations");
  const files = (await readdir(migrationDir))
    .filter(file => /^\d+_.*\.sql$/.test(file))
    .sort();

  const pool = getDatabasePool();

  try {
    for (const file of files) {
      const sql = await readFile(path.join(migrationDir, file), "utf8");
      await pool.query(sql);

      console.log(
        JSON.stringify({
          migration: file,
          status: "applied",
          completedAt: new Date().toISOString()
        })
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
