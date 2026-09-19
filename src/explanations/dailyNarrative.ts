import type { ContextEvidence } from "../context/contextEvidence";
import type { WhatChangedExplanation } from "./whatChanged";
import type { UnresolvedKnowledge } from "../epistemics/unresolvedKnowledge";
import type { WordingCalibration } from "../epistemics/wording";

export interface DailyNarrative {
  version: "1.0.0";
  accounting: string;
  context: string | null;
  unresolved: string;
  evidenceBoundary: string;
}

export interface DailyNarrativeResult {
  narrative: DailyNarrative;
  wording: WordingCalibration[];
}

function joinSentences(values: string[]): string {
  return values
    .map(value => value.trim())
    .filter(Boolean)
    .join(" ");
}

export function buildDailyNarrative(
  explanation: WhatChangedExplanation,
  context: ContextEvidence[],
  unresolved: UnresolvedKnowledge[]
): DailyNarrativeResult {
  const accounting = joinSentences(
    explanation.claims
      .filter(claim =>
        ["total-change", "public-component", "intragov-component"].includes(
          claim.id
        )
      )
      .map(claim => claim.text)
  );

  const contextText =
    context.length === 0
      ? null
      : joinSentences([
          "In the surrounding fiscal and financing environment:",
          ...context.map(item => item.summary),
          "These records are context, not evidence that any one event caused the reported daily debt movement."
        ]);

  const primaryUnresolved = unresolved[0];
  const unresolvedText = primaryUnresolved
    ? joinSentences([
        primaryUnresolved.currentState,
        "A stronger causal explanation remains withheld until direct primary-source evidence links identifiable transactions or financing operations to the observed accounting movement."
      ])
    : "No causal explanation is asserted beyond the verified accounting record.";

  const wording: WordingCalibration[] = context.map(item => ({
    claimId: `narrative-context-${item.id}`,
    requestedStrength: "plausible",
    evidenceClass: "contextual",
    independentOrigins: 1,
    hasCounterevidenceReview: false,
    unresolvedConflict: false
  }));

  return {
    narrative: {
      version: "1.0.0",
      accounting,
      context: contextText,
      unresolved: unresolvedText,
      evidenceBoundary: explanation.evidenceBoundary
    },
    wording
  };
}
