import { NextRequest, NextResponse } from "next/server";

const CALLE_API_BASE = "https://api.heycall-e.com";
const CALL_ID_RE = /^call_[A-Za-z0-9_-]+$/;

type ProviderCall = {
  id?: unknown;
  status?: unknown;
  structured_result?: unknown;
  summary?: unknown;
  task_completed?: unknown;
  completion_confidence?: unknown;
  evidence?: unknown;
  failure_code?: unknown;
  failure_message?: unknown;
  completed_at?: unknown;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ callId: string }> },
) {
  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CALL-E is not configured on this deployment." },
      { status: 503 },
    );
  }

  const { callId } = await context.params;
  if (!CALL_ID_RE.test(callId)) {
    return NextResponse.json({ error: "Invalid call id." }, { status: 400 });
  }

  const providerResponse = await fetch(`${CALLE_API_BASE}/v1/calls/${callId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!providerResponse.ok) {
    return NextResponse.json(
      {
        error: "Unable to read CALL-E call status.",
        providerStatus: providerResponse.status,
      },
      { status: 502 },
    );
  }

  const call = (await providerResponse.json()) as ProviderCall;

  return NextResponse.json({
    callId,
    status: typeof call.status === "string" ? call.status : "unknown",
    structuredResult:
      call.structured_result && typeof call.structured_result === "object"
        ? call.structured_result
        : null,
    summary: typeof call.summary === "string" ? call.summary : null,
    taskCompleted:
      typeof call.task_completed === "boolean" ? call.task_completed : null,
    completionConfidence:
      call.completion_confidence && typeof call.completion_confidence === "object"
        ? call.completion_confidence
        : null,
    evidence: Array.isArray(call.evidence)
      ? call.evidence.filter((item): item is string => typeof item === "string").slice(0, 8)
      : [],
    failureCode:
      typeof call.failure_code === "string" ? call.failure_code : null,
    failureMessage:
      typeof call.failure_message === "string" ? call.failure_message : null,
    completedAt:
      typeof call.completed_at === "string" ? call.completed_at : null,
  });
}
