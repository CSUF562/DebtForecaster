import assert from "node:assert/strict";
import test from "node:test";
import { validateCorroborationSet } from "../src/epistemics/corroboration.js";

test("counts shared-origin reports as one independent origin", () => {
  const findings = validateCorroborationSet({
    claimId: "claim-1",
    requiredIndependentOrigins: 2,
    evidence: [
      {
        evidenceId: "e1",
        originId: "treasury-release-1",
        publisherId: "treasury",
        derivedFromEvidenceIds: []
      },
      {
        evidenceId: "e2",
        originId: "treasury-release-1",
        publisherId: "news-a",
        derivedFromEvidenceIds: ["e1"]
      }
    ]
  });

  assert.match(findings.join(" "), /1 independent origin/);
});

test("accepts genuinely independent origins", () => {
  const findings = validateCorroborationSet({
    claimId: "claim-1",
    requiredIndependentOrigins: 2,
    evidence: [
      {
        evidenceId: "e1",
        originId: "treasury-release-1",
        publisherId: "treasury",
        derivedFromEvidenceIds: []
      },
      {
        evidenceId: "e2",
        originId: "cbo-analysis-1",
        publisherId: "cbo",
        derivedFromEvidenceIds: []
      }
    ]
  });

  assert.deepEqual(findings, []);
});
