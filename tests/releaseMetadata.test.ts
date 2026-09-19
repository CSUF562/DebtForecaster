import assert from "node:assert/strict";
import test from "node:test";
import { getReleaseMetadata } from "../src/application/releaseMetadata";

test("release metadata exposes governance and test-gate policy", () => {
  const release = getReleaseMetadata();

  assert.equal(release.erc13ProtocolVersion, "1.0.0");
  assert.equal(release.productionTestGate, "npm-test-before-build");
});
