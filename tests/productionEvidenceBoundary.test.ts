import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getContextSnapshot } from "../src/application/contextSnapshot";

test("shared context contract exposes all primary context channels", async () => {
  const snapshot = await getContextSnapshot(null);

  assert.equal(snapshot.items.length, 0);
  assert.equal(snapshot.coverage.total, 3);
  assert.equal(snapshot.coverage.available, 0);
  assert.equal(snapshot.coverage.live, 0);
  assert.equal(snapshot.coverage.status, "unavailable");

  assert.deepEqual(
    snapshot.status.map(item => item.sourceKey).sort(),
    [
      "cbo-monthly-budget-review",
      "fed-fomc-statement",
      "treasury-yield-curve"
    ]
  );

  assert.ok(
    snapshot.status.every(item => item.status === "not-applicable")
  );
});

test("production surfaces do not import static currentCaseStudy context", async () => {
  const productionFiles = [
    "app/page.tsx",
    "app/api/snapshot/route.ts"
  ];

  for (const relativePath of productionFiles) {
    const source = await readFile(path.resolve(relativePath), "utf8");

    assert.equal(
      source.includes("currentCaseStudy"),
      false,
      `${relativePath} must not import static case-study context into production.`
    );

    assert.equal(
      source.includes("buildSeptember2026ContextBundle"),
      false,
      `${relativePath} must use the shared live/persisted context pipeline.`
    );
  }
});

test("homepage and snapshot API both use shared contextSnapshot service", async () => {
  const homepage = await readFile(path.resolve("app/page.tsx"), "utf8");
  const snapshotRoute = await readFile(
    path.resolve("app/api/snapshot/route.ts"),
    "utf8"
  );

  assert.match(homepage, /getContextSnapshot/);
  assert.match(snapshotRoute, /getContextSnapshot/);
});
