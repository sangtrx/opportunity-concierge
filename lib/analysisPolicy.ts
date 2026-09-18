export type EvidenceItem = {
  field: string;
  quote: string;
  supports: string;
};

export type AssessmentEligibility = "eligible" | "ineligible" | "needs_info";

export type AssessmentAction = {
  title: string;
  dueAtIso: string | null;
};

export const NO_VERIFIED_EVIDENCE_REASON =
  "The model produced no evidence quote that could be verified verbatim against the official source. Review the source manually.";

export function normalizeCandidateFacts(candidateFacts: string[]): string[] {
  return candidateFacts.map((fact) => fact.trim()).filter(Boolean).slice(0, 40);
}

export function parseIsoMillis(value: string | null): number | undefined {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

export function verifiedEvidence(markdown: string, evidence: EvidenceItem[]): EvidenceItem[] {
  return evidence
    .map((item) => ({ ...item, quote: item.quote.trim() }))
    .filter(
      (item) =>
        item.quote.length > 0 &&
        item.quote.length <= 220 &&
        markdown.includes(item.quote),
    );
}

export function resolveEligibility(
  eligibility: AssessmentEligibility,
  eligibilityReason: string,
  evidence: EvidenceItem[],
): { eligibility: AssessmentEligibility; eligibilityReason: string } {
  if (evidence.length === 0) {
    return {
      eligibility: "needs_info",
      eligibilityReason: NO_VERIFIED_EVIDENCE_REASON,
    };
  }
  return { eligibility, eligibilityReason };
}

export function clampPriorityScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeActions(
  actions: AssessmentAction[],
): Array<{ title: string; dueAt?: number }> {
  return actions
    .slice(0, 10)
    .map((item) => ({
      title: item.title.trim(),
      dueAt: parseIsoMillis(item.dueAtIso),
    }))
    .filter((item) => item.title.length > 0);
}
