import assert from "node:assert/strict";
import test from "node:test";
import { buildLiveContextStressTest } from "../src/governance/liveStressTest.js";

test("keeps all first live context items at unknown materiality", () => {
  const result = buildLiveContextStressTest();

  assert.equal(result.contextAccepted, 3);
  assert.equal(result.contextRejected, 0);
  assert.equal(
    result.materiality.every(item => item.assessment === "unknown"),
    true
  );
});
