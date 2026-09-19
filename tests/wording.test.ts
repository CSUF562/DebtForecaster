import assert from "node:assert/strict";
import test from "node:test";
import { validateWordingCalibration } from "../src/epistemics/wording.js";

test("blocks established wording for a contextual claim", () => {
  const findings = validateWordingCalibration({
    claimId: "c1",
    requestedStrength: "established",
    evidenceClass: "contextual",
    independentOrigins: 2,
    hasCounterevidenceReview: true,
    unresolvedConflict: false
  });

  assert.match(findings.join(" "), /Only observed or deterministic derived/);
});

test("requires corroboration for strongly-supported wording", () => {
  const findings = validateWordingCalibration({
    claimId: "c1",
    requestedStrength: "strongly-supported",
    evidenceClass: "hypothesis",
    independentOrigins: 1,
    hasCounterevidenceReview: true,
    unresolvedConflict: false
  });

  assert.match(findings.join(" "), /two independent evidence origins/);
});

test("forces speculative language when conflict remains unresolved", () => {
  const findings = validateWordingCalibration({
    claimId: "c1",
    requestedStrength: "plausible",
    evidenceClass: "hypothesis",
    independentOrigins: 2,
    hasCounterevidenceReview: true,
    unresolvedConflict: true
  });

  assert.match(findings.join(" "), /must remain speculative/);
});
