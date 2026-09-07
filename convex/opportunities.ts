import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeSourceUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP(S) opportunity URLs are accepted");
  }
  url.hash = "";
  url.searchParams.sort();
  return url.toString();
}

export const list = query({ args: {}, handler: async (ctx) => {
  return ctx.db.query("opportunities").withIndex("by_updated").order("desc").take(100);
}});

export const get = query({ args: { id: v.id("opportunities") }, handler: async (ctx, { id }) => {
  const opportunity = await ctx.db.get(id);
  if (!opportunity) return null;
  const [evidence, actions, decisions] = await Promise.all([
    ctx.db.query("evidence").withIndex("by_opportunity", q => q.eq("opportunityId", id)).take(100),
    ctx.db.query("actions").withIndex("by_opportunity", q => q.eq("opportunityId", id)).take(100),
    ctx.db.query("decisions").withIndex("by_opportunity", q => q.eq("opportunityId", id)).order("desc").take(50),
  ]);
  return { opportunity, evidence, actions, decisions };
}});

export const create = mutation({
  args: { sourceUrl: v.string(), kind: v.union(v.literal("hackathon"),v.literal("grant"),v.literal("scholarship"),v.literal("job"),v.literal("other")) },
  handler: async (ctx, args) => {
    const sourceUrl = normalizeSourceUrl(args.sourceUrl);
    const existing = await ctx.db
      .query("opportunities")
      .withIndex("by_source_url", q => q.eq("sourceUrl", sourceUrl))
      .first();
    const now = Date.now();

    if (existing) {
      if (existing.kind !== args.kind) {
        await ctx.db.patch(existing._id, { kind: args.kind, updatedAt: now });
      }
      return existing._id;
    }

    return ctx.db.insert("opportunities", {
      sourceUrl,
      kind:args.kind,
      eligibility:"unknown",
      missingFacts:[],
      priorityScore:0,
      status:"new",
      createdAt:now,
      updatedAt:now
    });
  },
});

export const setDecision = mutation({
  args: { id:v.id("opportunities"), decision:v.union(v.literal("pursue"),v.literal("skip"),v.literal("needs_info")), rationale:v.string() },
  handler: async (ctx, args) => {
    const row=await ctx.db.get(args.id); if(!row) throw new Error("Opportunity not found");
    const now=Date.now();
    await ctx.db.insert("decisions", { opportunityId:args.id, decision:args.decision, rationale:args.rationale.trim(), decidedBy:"user", createdAt:now });
    await ctx.db.patch(args.id, { status: args.decision === "pursue" ? "pursue" : args.decision === "skip" ? "skip" : "reviewing", updatedAt:now });
  },
});

export const getForAnalysis = internalQuery({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    return row ? { sourceUrl: row.sourceUrl } : null;
  }
});

export const getReminderContext = internalQuery({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return null;
    const actions = await ctx.db.query("actions").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100);
    return {
      title: row.title,
      sourceUrl: row.sourceUrl,
      deadlineAt: row.deadlineAt,
      eligibility: row.eligibility,
      missingFacts: row.missingFacts,
      actions: actions.map(({ title, dueAt, status }) => ({ title, dueAt, status }))
    };
  }
});

export const applyAnalysis = internalMutation({
  args: {
    id: v.id("opportunities"),
    title: v.optional(v.string()),
    organizer: v.optional(v.string()),
    deadlineAt: v.optional(v.number()),
    eligibility: v.union(v.literal("eligible"), v.literal("ineligible"), v.literal("needs_info")),
    eligibilityReason: v.string(),
    missingFacts: v.array(v.string()),
    priorityScore: v.number(),
    sourceUrl: v.string(),
    contentHash: v.string(),
    markdown: v.string(),
    evidence: v.array(v.object({ field:v.string(), quote:v.string(), supports:v.string() })),
    actions: v.array(v.object({ title:v.string(), dueAt:v.optional(v.number()) }))
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Opportunity not found");

    const [oldEvidence, oldActions, snapshots] = await Promise.all([
      ctx.db.query("evidence").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100),
      ctx.db.query("actions").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100),
      ctx.db.query("sourceSnapshots").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(20)
    ]);
    for (const item of oldEvidence) await ctx.db.delete(item._id);
    for (const item of oldActions) if (item.source === "ai") await ctx.db.delete(item._id);

    const now = Date.now();
    if (!snapshots.some((item) => item.contentHash === args.contentHash)) {
      await ctx.db.insert("sourceSnapshots", {
        opportunityId: args.id,
        sourceUrl: args.sourceUrl,
        contentHash: args.contentHash,
        markdown: args.markdown,
        fetchedAt: now
      });
    }
    for (const item of args.evidence) {
      await ctx.db.insert("evidence", { opportunityId:args.id, sourceUrl:args.sourceUrl, ...item, capturedAt:now });
    }
    for (const item of args.actions) {
      await ctx.db.insert("actions", { opportunityId:args.id, ...item, status:"todo", source:"ai", createdAt:now, updatedAt:now });
    }

    await ctx.db.patch(args.id, {
      ...(args.title ? { title:args.title } : {}),
      ...(args.organizer ? { organizer:args.organizer } : {}),
      ...(args.deadlineAt ? { deadlineAt:args.deadlineAt } : {}),
      eligibility: args.eligibility,
      eligibilityReason: args.eligibilityReason,
      missingFacts: args.missingFacts,
      priorityScore: args.priorityScore,
      status: "reviewing",
      updatedAt: now
    });
  }
});
