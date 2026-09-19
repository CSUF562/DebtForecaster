export interface CounterevidenceReview {
  questionId: string;
  hypothesisId: string;
  searched: boolean;
  searchScope: string[];
  counterEvidenceIds: string[];
  noCounterevidenceFoundRationale: string | null;
  reviewedAt: string;
}

export function validateCounterevidenceReview(
  review: CounterevidenceReview
): string[] {
  const findings: string[] = [];

  if (!review.searched) {
    findings.push("Counterevidence search must be performed before synthesis.");
  }

  if (review.searchScope.length === 0) {
    findings.push("Counterevidence review must document its search scope.");
  }

  if (
    review.searched &&
    review.counterEvidenceIds.length === 0 &&
    !review.noCounterevidenceFoundRationale?.trim()
  ) {
    findings.push(
      "A review that finds no counterevidence must document why that result is credible and what was searched."
    );
  }

  return findings;
}
