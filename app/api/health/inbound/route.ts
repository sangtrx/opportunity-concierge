import { NextResponse } from "next/server";

const MAX_OPPORTUNITIES = 25;

type ConvexSuccess = {
  status: "success";
  value: unknown;
};

class HealthProbeError extends Error {
  constructor(
    readonly stage: "convex_url_missing" | "convex_http_error" | "convex_function_error",
    readonly convexHttpStatus?: number,
  ) {
    super(stage);
  }
}

async function convexQuery(path: string, args: Record<string, unknown>) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) throw new HealthProbeError("convex_url_missing");

  const response = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path, args, format: "json" }),
    cache: "no-store",
  });

  if (!response.ok) throw new HealthProbeError("convex_http_error", response.status);
  const payload = (await response.json()) as Partial<ConvexSuccess>;
  if (payload.status !== "success") throw new HealthProbeError("convex_function_error", response.status);
  return payload.value;
}

export async function GET() {
  try {
    const value = await convexQuery("opportunities:list", {});
    if (!Array.isArray(value)) throw new HealthProbeError("convex_function_error");

    let scannedOpportunityCount = 0;
    let mailThreadCount = 0;
    let replyReceivedCount = 0;
    let inboundTimestampCount = 0;

    for (const opportunity of value.slice(0, MAX_OPPORTUNITIES)) {
      if (!opportunity || typeof opportunity !== "object") continue;
      const opportunityId = (opportunity as Record<string, unknown>)._id;
      if (typeof opportunityId !== "string" || !opportunityId) continue;

      scannedOpportunityCount += 1;
      const thread = await convexQuery("mail:latestThread", { opportunityId });
      if (thread == null) continue;
      if (typeof thread !== "object") throw new HealthProbeError("convex_function_error");

      mailThreadCount += 1;
      const row = thread as Record<string, unknown>;
      if (row.status === "reply_received") replyReceivedCount += 1;
      if (typeof row.lastInboundAt === "number") inboundTimestampCount += 1;
    }

    return NextResponse.json(
      {
        ok: true,
        opportunityCount: value.length,
        scannedOpportunityCount,
        scanComplete: value.length <= MAX_OPPORTUNITIES,
        mailThreadCount,
        replyReceivedCount,
        inboundTimestampCount,
        inboundProven: replyReceivedCount > 0 && inboundTimestampCount > 0,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const probeError = error instanceof HealthProbeError ? error : null;
    return NextResponse.json(
      {
        ok: false,
        inboundProven: false,
        failureReason: "reactive_state_unreadable",
        failureStage: probeError?.stage ?? "unexpected_error",
        ...(probeError?.convexHttpStatus !== undefined
          ? { convexHttpStatus: probeError.convexHttpStatus }
          : {}),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
