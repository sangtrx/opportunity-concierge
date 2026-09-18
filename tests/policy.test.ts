import test from "node:test";
import assert from "node:assert/strict";

import {
  clampPriorityScore,
  NO_VERIFIED_EVIDENCE_REASON,
  normalizeActions,
  normalizeCandidateFacts,
  resolveEligibility,
  verifiedEvidence,
} from "../lib/analysisPolicy";
import { stableDigest } from "../lib/mailPolicy";

test("candidate facts are only normalized, never invented", () => {
  const input = [" Vietnam ", "", "8+ years", "   ", ...Array.from({ length: 45 }, (_, i) => `fact-${i}`)];
  const output = normalizeCandidateFacts(input);
  assert.deepEqual(output.slice(0, 2), ["Vietnam", "8+ years"]);
  assert.equal(output.length, 40);
  assert.ok(output.every((fact) => input.some((raw) => raw.trim() === fact)));
});

test("evidence must be an exact verbatim source substring", () => {
  const markdown = "Eligibility: applicants must be based in Vietnam. Deadline: October 1.";
  const evidence = verifiedEvidence(markdown, [
    { field: "location", quote: " applicants must be based in Vietnam. ", supports: "eligible" },
    { field: "case-change", quote: "Applicants must be based in Vietnam.", supports: "eligible" },
    { field: "invented", quote: "Remote applicants are accepted.", supports: "eligible" },
    { field: "blank", quote: "   ", supports: "eligible" },
  ]);
  assert.deepEqual(evidence, [
    { field: "location", quote: "applicants must be based in Vietnam.", supports: "eligible" },
  ]);
});

test("unverified model claims fail closed to needs_info", () => {
  const result = resolveEligibility("eligible", "Looks eligible", []);
  assert.deepEqual(result, {
    eligibility: "needs_info",
    eligibilityReason: NO_VERIFIED_EVIDENCE_REASON,
  });
});

test("verified evidence preserves the assessed eligibility", () => {
  const evidence = [{ field: "deadline", quote: "Deadline: October 1.", supports: "deadline" }];
  assert.deepEqual(resolveEligibility("ineligible", "Deadline passed", evidence), {
    eligibility: "ineligible",
    eligibilityReason: "Deadline passed",
  });
});

test("priority and actions are bounded deterministically", () => {
  assert.equal(clampPriorityScore(101.6), 100);
  assert.equal(clampPriorityScore(-3), 0);
  assert.equal(clampPriorityScore(49.6), 50);

  assert.deepEqual(
    normalizeActions([
      { title: " Apply ", dueAtIso: "2026-10-01T00:00:00Z" },
      { title: "   ", dueAtIso: null },
      { title: "Confirm eligibility", dueAtIso: "not-a-date" },
    ]),
    [
      { title: "Apply", dueAt: Date.parse("2026-10-01T00:00:00Z") },
      { title: "Confirm eligibility", dueAt: undefined },
    ],
  );
});

test("AgentMail reminder dedupe digest is deterministic and payload-sensitive", () => {
  const payload = "opportunity-1\n---\nuser@example.com\n---\nsubject\n---\nbody";
  const first = stableDigest(payload);
  assert.equal(first, stableDigest(payload));
  assert.match(first, /^[0-9a-f]{16}$/);
  assert.notEqual(first, stableDigest(payload + "!"));
});
