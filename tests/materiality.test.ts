import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUnknownMateriality,
  validateContextMateriality
} from "../src/epistemics/materiality.js";
import type { ContextEvidence } from "../src/context/contextEvidence.js";

const context: ContextEvidence = {
  id: "ctx-1",
  eventDate: "2026-09-17",
  title: "Example event",
  summary: "Documented event.",
  sourceName: "U.S. Department of the Treasury",
  sourceUrl: "https://home.treasury.gov/example",
  sourceTier: "primary-government",
  retrievedAt: "2026-09-18T20:00:00Z",
  confidence: "high",
  revisionOfId: null,
  supersededById: null,
  causalClaim: false,
  uncertaintyNote:
    "Documented context does not establish causation."
};

test("defaults context to unknown materiality until magnitude and accounting linkage are known", () => {
  const result = buildUnknownMateriality(context);

  assert.equal(result.assessment, "unknown");
  assert.equal(result.magnitudeKnown, false);
  assert.equal(result.directAccountingLinkKnown, false);
});

test("blocks a material claim without a known accounting link", () => {
  const findings = validateContextMateriality({
    contextId: "ctx-1",
    assessment: "material",
    rationale: "Large event.",
    evidenceIds: ["ctx-1"],
    magnitudeKnown: true,
    directAccountingLinkKnown: false
  });

  assert.match(findings.join(" "), /known accounting link/);
});

test("allows materiality only when supporting evidence and direct linkage exist", () => {
  const findings = validateContextMateriality({
    contextId: "ctx-1",
    assessment: "material",
    rationale:
      "Primary-source accounting evidence directly links this event to the reported debt movement.",
    evidenceIds: ["ctx-1", "obs-1"],
    magnitudeKnown: true,
    directAccountingLinkKnown: true
  });

  assert.deepEqual(findings, []);
});
