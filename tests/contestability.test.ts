import assert from "node:assert/strict";
import test from "node:test";
import { validateContestability } from "../src/epistemics/contestability.js";

test("accepts an inspectable, revisable, contestable output", () => {
  const findings = validateContestability({
    outputId: "brief-1",
    evidenceInspectable: true,
    assumptionsInspectable: true,
    unresolvedVisible: true,
    revisionPathVisible: true,
    challengePathVisible: true,
    automatedDecisionBinding: false,
    humanOverrideAvailable: true,
    notes:
      "Users can inspect evidence, uncertainty, and revision history; editorial review remains available."
  });

  assert.deepEqual(findings, []);
});

test("fails when a published output has no challenge path", () => {
  const findings = validateContestability({
    outputId: "brief-1",
    evidenceInspectable: true,
    assumptionsInspectable: true,
    unresolvedVisible: true,
    revisionPathVisible: true,
    challengePathVisible: false,
    automatedDecisionBinding: false,
    humanOverrideAvailable: true,
    notes: "No challenge path configured."
  });

  assert.match(findings.join(" "), /challenge or contest/);
});

test("fails binding automation without human override", () => {
  const findings = validateContestability({
    outputId: "decision-1",
    evidenceInspectable: true,
    assumptionsInspectable: true,
    unresolvedVisible: true,
    revisionPathVisible: true,
    challengePathVisible: true,
    automatedDecisionBinding: true,
    humanOverrideAvailable: false,
    notes: "Automated decision is binding."
  });

  assert.match(findings.join(" "), /human override or review path/);
});
