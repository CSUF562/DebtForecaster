import assert from "node:assert/strict";
import test from "node:test";
import { buildSeptember2026ContextBundle } from "../src/context/currentCaseStudy.js";

test("assembles the first real-source context bundle without causal attribution", () => {
  const bundle = buildSeptember2026ContextBundle();

  assert.equal(bundle.items.length, 3);
  assert.equal(bundle.rejected.length, 0);
  assert.equal(bundle.items.every(item => item.causalClaim === false), true);
  assert.equal(
    bundle.items.every(item => item.sourceTier === "primary-government"),
    true
  );
  assert.match(bundle.boundary, /not proof/);
});
