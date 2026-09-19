import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyNarrative } from "../src/explanations/dailyNarrative";
import type { WhatChangedExplanation } from "../src/explanations/whatChanged";

const explanation: WhatChangedExplanation = {
  version: "1.0.0",
  currentObservationId: "current",
  priorObservationId: "prior",
  recordDate: "2026-09-17",
  priorRecordDate: "2026-09-16",
  totalDebtChange: {
    fromObservationId: "prior",
    toObservationId: "current",
    fromRecordDate: "2026-09-16",
    toRecordDate: "2026-09-17",
    intervalDays: 1,
    absoluteChange: "100.00",
    percentChange: "0.000000",
    evidenceClass: "derived",
    sourceObservationIds: ["prior", "current"],
    formulaVersion: "1.0.0"
  },
  publicDebtChange: "+$60.00",
  intragovernmentalChange: "+$40.00",
  claims: [
    {
      id: "total-change",
      evidenceClass: "observed",
      text: "Total public debt increased by $100.00.",
      sourceObservationIds: ["prior", "current"],
      confidence: "high",
      causal: false
    },
    {
      id: "public-component",
      evidenceClass: "observed",
      text: "Debt held by the public increased by $60.00.",
      sourceObservationIds: ["prior", "current"],
      confidence: "high",
      causal: false
    },
    {
      id: "intragov-component",
      evidenceClass: "observed",
      text: "Intragovernmental holdings increased by $40.00.",
      sourceObservationIds: ["prior", "current"],
      confidence: "high",
      causal: false
    }
  ],
  evidenceBoundary:
    "Treasury accounting establishes what changed, not why it changed."
};

test("daily narrative keeps accounting, context, and unresolved causation separate", () => {
  const result = buildDailyNarrative(
    explanation,
    [
      {
        id: "ctx-fed",
        eventDate: "2026-09-16",
        title: "FOMC statement",
        summary: "The Federal Reserve published a monetary-policy statement.",
        sourceName: "Federal Reserve",
        sourceUrl: "https://www.federalreserve.gov/example",
        sourceTier: "primary-government",
        retrievedAt: "2026-09-19T00:00:00Z",
        confidence: "high",
        revisionOfId: null,
        supersededById: null,
        causalClaim: false,
        uncertaintyNote: "Context does not establish daily debt causation."
      }
    ],
    [
      {
        id: "unk",
        reason: "causation-unresolved",
        question: "What caused it?",
        currentState:
          "The accounting movement is established, but a complete causal explanation is not.",
        missingEvidence: [],
        conflictingEvidenceIds: [],
        relatedObservationIds: ["prior", "current"],
        relatedContextIds: ["ctx-fed"],
        resolvable: true,
        resolutionCriteria: ["Direct primary-source transaction evidence."],
        createdAt: "2026-09-19T00:00:00Z",
        revisedAt: "2026-09-19T00:00:00Z"
      }
    ]
  );

  assert.match(result.narrative.accounting, /increased by \$100\.00/);
  assert.match(result.narrative.context ?? "", /context, not evidence/);
  assert.match(result.narrative.unresolved, /causal explanation/);
  assert.equal(result.wording.length, 1);
  assert.equal(result.wording[0].requestedStrength, "plausible");
});
