import type { ContextEvidence } from "./contextEvidence";
import { validateContextEvidence } from "./contextEvidence";
import { classifyContextSource } from "./sourceRegistry";

export interface ContextWindow {
  startDate: string;
  endDate: string;
}

export interface DailyContextBundle {
  evidenceClass: "contextual";
  window: ContextWindow;
  items: ContextEvidence[];
  rejected: Array<{
    id: string;
    findings: string[];
  }>;
  boundary: string;
}

function withinWindow(
  eventDate: string,
  window: ContextWindow
): boolean {
  return eventDate >= window.startDate && eventDate <= window.endDate;
}

export function assembleDailyContext(
  candidates: ContextEvidence[],
  window: ContextWindow
): DailyContextBundle {
  const accepted: ContextEvidence[] = [];
  const rejected: Array<{ id: string; findings: string[] }> = [];

  for (const candidate of candidates) {
    if (!withinWindow(candidate.eventDate, window)) continue;

    const registeredTier = classifyContextSource(candidate.sourceUrl);
    const normalized: ContextEvidence = {
      ...candidate,
      sourceTier:
        candidate.sourceTier === "other"
          ? registeredTier
          : candidate.sourceTier
    };

    const findings = validateContextEvidence(normalized);

    if (
      normalized.sourceTier === "other" &&
      normalized.confidence === "high"
    ) {
      findings.push(
        "Unregistered source cannot enter the daily context bundle at high confidence without corroboration."
      );
    }

    if (findings.length > 0) {
      rejected.push({ id: normalized.id, findings });
      continue;
    }

    accepted.push(normalized);
  }

  accepted.sort((a, b) => {
    const byDate = b.eventDate.localeCompare(a.eventDate);
    return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
  });

  return {
    evidenceClass: "contextual",
    window,
    items: accepted,
    rejected,
    boundary:
      "Context items document events relevant to the same period. Inclusion indicates temporal or subject-matter relevance, not proof that an item caused the reported debt movement."
  };
}
