import { NextRequest, NextResponse } from "next/server";

const CALLE_API_BASE = "https://api.heycall-e.com";
const E164_RE = /^\+[1-9]\d{7,14}$/;
const REQUEST_ID_RE = /^[A-Za-z0-9-]{16,80}$/;

type ClarifyRequest = {
  phone?: unknown;
  organization?: unknown;
  question?: unknown;
  context?: unknown;
  consent?: unknown;
  requestId?: unknown;
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CALL-E is not configured on this deployment." },
      { status: 503 },
    );
  }

  let body: ClarifyRequest;
  try {
    body = (await request.json()) as ClarifyRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const phone = text(body.phone, 32);
  const organization = text(body.organization, 120);
  const question = text(body.question, 600);
  const context = text(body.context, 1000);
  const requestId = text(body.requestId, 80);

  if (body.consent !== true) {
    return NextResponse.json(
      { error: "Explicit authorization is required before placing a real call." },
      { status: 400 },
    );
  }
  if (!E164_RE.test(phone)) {
    return NextResponse.json(
      { error: "Phone number must be valid E.164, for example +14155550100." },
      { status: 400 },
    );
  }
  if (organization.length < 2 || question.length < 12) {
    return NextResponse.json(
      { error: "Provide an organization and one concrete clarification question." },
      { status: 400 },
    );
  }
  if (!REQUEST_ID_RE.test(requestId)) {
    return NextResponse.json({ error: "Invalid request id." }, { status: 400 });
  }

  const task = [
    `Call ${organization} as an AI assistant for an opportunity applicant.`,
    "At the beginning, clearly say that you are an AI calling assistant.",
    `Ask exactly this clarification question: ${question}`,
    context ? `Relevant non-sensitive context: ${context}` : "",
    "Keep the call focused on this single clarification. Do not negotiate, make commitments, request payment, or ask for passwords, account credentials, government identifiers, or other sensitive personal data.",
    "If the person cannot answer, ask for the best public next step or callback channel. Do not invent an answer.",
  ]
    .filter(Boolean)
    .join("\n");

  const providerResponse = await fetch(`${CALLE_API_BASE}/v1/calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `opportunity-clarifier-${requestId}`,
    },
    body: JSON.stringify({
      task,
      recipients: [{ phones: [phone] }],
      result_schema: {
        type: "object",
        required: ["answer_status", "answer", "needs_follow_up", "next_action"],
        properties: {
          answer_status: {
            type: "string",
            enum: ["answered", "unclear", "not_reached"],
            description:
              "answered only when the recipient gave a clear answer; unclear when reached but no clear answer; not_reached when the intended recipient was not reached.",
          },
          answer: {
            type: "string",
            description:
              "A concise factual paraphrase of what the recipient said. Do not infer missing facts.",
          },
          needs_follow_up: {
            type: "string",
            enum: ["yes", "no", "unknown"],
            description:
              "Whether another action is required to resolve the original clarification.",
          },
          next_action: {
            type: "string",
            description:
              "The concrete next step stated or supported by the call evidence, or 'none' when resolved.",
          },
        },
        additionalProperties: false,
      },
      metadata: {
        workflow: "opportunity_deadline_clarifier",
        request_id: requestId,
      },
    }),
    cache: "no-store",
  });

  if (!providerResponse.ok) {
    return NextResponse.json(
      {
        error: "CALL-E rejected the call request.",
        providerStatus: providerResponse.status,
      },
      { status: 502 },
    );
  }

  const call = (await providerResponse.json()) as {
    id?: unknown;
    status?: unknown;
  };
  if (typeof call.id !== "string" || !call.id.startsWith("call_")) {
    return NextResponse.json(
      { error: "CALL-E returned an unexpected response." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    callId: call.id,
    status: typeof call.status === "string" ? call.status : "queued",
  });
}
