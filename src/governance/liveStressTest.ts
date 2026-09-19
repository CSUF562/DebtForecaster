import { buildSeptember2026ContextBundle } from "../context/currentCaseStudy";
import type { DebtObservation } from "../fiscal/debt";
import { buildDailyAccountingBrief } from "../application/dailyBrief";
import { buildUnknownMateriality } from "../epistemics/materiality";

export interface StressTestResult {
  contextAccepted: number;
  contextRejected: number;
  sourceTiers: string[];
  materiality: Array<{
    contextId: string;
    assessment: string;
  }>;
  note: string;
}

export function buildLiveContextStressTest(): StressTestResult {
  const context = buildSeptember2026ContextBundle();
  const materiality = context.items.map(buildUnknownMateriality);

  return {
    contextAccepted: context.items.length,
    contextRejected: context.rejected.length,
    sourceTiers: [...new Set(context.items.map(item => item.sourceTier))],
    materiality: materiality.map(item => ({
      contextId: item.contextId,
      assessment: item.assessment
    })),
    note:
      "All accepted context remains non-causal and defaults to unknown materiality until a direct accounting link is established."
  };
}

export function runStressTestWithDebtHistory(
  history: DebtObservation[]
) {
  const contextBundle = buildSeptember2026ContextBundle();
  return buildDailyAccountingBrief(history, contextBundle.items);
}
