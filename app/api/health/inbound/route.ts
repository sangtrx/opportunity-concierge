import { NextResponse } from "next/server";

const MAX_OPPORTUNITIES = 25;

type ConvexSuccess = {
  status: "success";
  value: unknown;
};

async function convexQuery(path: string, args: Record<string, unknown>) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) throw new Error("Convex URL is not configured");

  const response = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path, args, format: "json" }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Convex query failed");
  const payload = (await response.json()) as Partial<ConvexSuccess>;
  if (payload.status !== "success") throw new Error("Convex query did not succeed");
  return payload.value;
}

export async function GET() {
  try {
    const value = await convexQuery("opportunities:list", {});
    if (!Array.isArray(value)) throw new Error("Unexpected opportunity result");

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
      if (typeof thread !== "object") throw new Error("Unexpected mail thread result");

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
  } catch {
    return NextResponse.json(
      { ok: false, inboundProven: false, failureReason: "reactive_state_unreadable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
