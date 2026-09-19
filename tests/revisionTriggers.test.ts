import assert from "node:assert/strict";
import test from "node:test";
import { validateRevisionTrigger } from "../src/epistemics/revisionTriggers.js";

test("requires reassessment when new primary evidence arrives", () => {
  const findings = validateRevisionTrigger({
    id: "rt-1",
    targetId: "brief-1",
    triggerType: "new-primary-evidence",
    evidenceIds: ["e-new"],
    detectedAt: "2026-09-18T23:00:00Z",
    requiresReassessment: false,
    rationale: "New evidence exists."
  });

  assert.match(findings.join(" "), /must require reassessment/);
});

test("requires source evidence for non-manual triggers", () => {
  const findings = validateRevisionTrigger({
    id: "rt-2",
    targetId: "brief-1",
    triggerType: "counterevidence",
    evidenceIds: [],
    detectedAt: "2026-09-18T23:00:00Z",
    requiresReassessment: true,
    rationale: "Counterevidence was detected."
  });

  assert.match(findings.join(" "), /must reference the evidence/);
});

test("accepts a well-formed source revision trigger", () => {
  const findings = validateRevisionTrigger({
    id: "rt-3",
    targetId: "brief-1",
    triggerType: "source-revision",
    evidenceIds: ["treasury-revision-2"],
    detectedAt: "2026-09-18T23:00:00Z",
    requiresReassessment: true,
    rationale: "Treasury revised the underlying historical observation."
  });

  assert.deepEqual(findings, []);
});
