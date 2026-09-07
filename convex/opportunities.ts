import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const factStatus = v.union(v.literal("confirmed"), v.literal("missing"), v.literal("conflicting"));
const reminderStatus = v.union(v.literal("scheduled"), v.literal("sent"), v.literal("dismissed"));
const reminderChannel = v.union(v.literal("in_app"), v.literal("email"));

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
  const [evidence, actions, decisions, eligibilityFacts, reminders, sourceSnapshots] = await Promise.all([
    ctx.db.query("evidence").withIndex("by_opportunity", q => q.eq("opportunityId", id)).take(100),
    ctx.db.query("actions").withIndex("by_opportunity", q => q.eq("opportunityId", id)).take(100),
    ctx.db.query("decisions").withIndex("by_opportunity", q => q.eq("opportunityId", id)).order("desc").take(50),
    ctx.db.query("eligibilityFacts").withIndex("by_opportunity", q => q.eq("opportunityId", id)).take(100),
    ctx.db.query("reminders").withIndex("by_opportunity", q => q.eq("opportunityId", id)).order("desc").take(100),
    ctx.db.query("sourceSnapshots").withIndex("by_opportunity", q => q.eq("opportunityId", id)).order("desc").take(20),
  ]);
  return { opportunity, evidence, actions, decisions, eligibilityFacts, reminders, sourceSnapshots };
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

export const upsertEligibilityFact = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    key: v.string(),
    value: v.optional(v.string()),
    status: factStatus,
    evidenceId: v.optional(v.id("evidence")),
  },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) throw new Error("Opportunity not found");

    const key = args.key.trim();
    if (!key) throw new Error("Eligibility fact key is required");
    const value = args.value?.trim() || undefined;

    if (args.evidenceId) {
      const evidence = await ctx.db.get(args.evidenceId);
      if (!evidence || evidence.opportunityId !== args.opportunityId) {
        throw new Error("Evidence must belong to the same opportunity");
      }
    }

    const existing = await ctx.db
      .query("eligibilityFacts")
      .withIndex("by_opportunity_key", q => q.eq("opportunityId", args.opportunityId).eq("key", key))
      .first();
    const now = Date.now();
    const payload = {
      value,
      status: args.status,
      source: "user" as const,
      evidenceId: args.evidenceId,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return ctx.db.insert("eligibilityFacts", {
      opportunityId: args.opportunityId,
      key,
      ...payload,
      createdAt: now,
    });
  },
});

export const removeEligibilityFact = mutation({
  args: { id: v.id("eligibilityFacts") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Eligibility fact not found");
    await ctx.db.delete(id);
  },
});

export const scheduleReminder = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    actionId: v.optional(v.id("actions")),
    title: v.string(),
    remindAt: v.number(),
    channel: reminderChannel,
  },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) throw new Error("Opportunity not found");
    const title = args.title.trim();
    if (!title) throw new Error("Reminder title is required");
    if (!Number.isFinite(args.remindAt)) throw new Error("Reminder time must be finite");

    if (args.actionId) {
      const action = await ctx.db.get(args.actionId);
      if (!action || action.opportunityId !== args.opportunityId) {
        throw new Error("Reminder action must belong to the same opportunity");
      }
    }

    const now = Date.now();
    return ctx.db.insert("reminders", {
      opportunityId: args.opportunityId,
      actionId: args.actionId,
      title,
      remindAt: args.remindAt,
      status: "scheduled",
      channel: args.channel,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setReminderStatus = mutation({
  args: { id: v.id("reminders"), status: reminderStatus },
  handler: async (ctx, { id, status }) => {
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Reminder not found");
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
  },
});

export const getForAnalysis = internalQuery({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    return row ? { sourceUrl: row.sourceUrl } : null;
  }
});

export const listDueReminders = internalQuery({
  args: { now: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 50), 100));
    return ctx.db
      .query("reminders")
      .withIndex("by_status_time", q => q.eq("status", "scheduled").lte("remindAt", args.now))
      .take(limit);
  },
});

export const getReminderContext = internalQuery({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return null;
    const [actions, eligibilityFacts, reminders] = await Promise.all([
      ctx.db.query("actions").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100),
      ctx.db.query("eligibilityFacts").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100),
      ctx.db.query("reminders").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100),
    ]);
    return {
      title: row.title,
      sourceUrl: row.sourceUrl,
      deadlineAt: row.deadlineAt,
      eligibility: row.eligibility,
      missingFacts: row.missingFacts,
      eligibilityFacts: eligibilityFacts.map(({ key, value, status, source }) => ({ key, value, status, source })),
      actions: actions.map(({ _id, title, dueAt, status }) => ({ id: _id, title, dueAt, status })),
      reminders: reminders.map(({ _id, actionId, title, remindAt, status, channel }) => ({ id: _id, actionId, title, remindAt, status, channel })),
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

    const [oldEvidence, oldActions, oldFacts, snapshots] = await Promise.all([
      ctx.db.query("evidence").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100),
      ctx.db.query("actions").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100),
      ctx.db.query("eligibilityFacts").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(100),
      ctx.db.query("sourceSnapshots").withIndex("by_opportunity", q => q.eq("opportunityId", args.id)).take(20)
    ]);
    for (const item of oldEvidence) await ctx.db.delete(item._id);
    for (const item of oldActions) if (item.source === "ai") await ctx.db.delete(item._id);
    for (const item of oldFacts) if (item.source === "ai") await ctx.db.delete(item._id);

    const now = Date.now();
    if (!snapshots.some((item) => item.contentHash === args.contentHash)) {
      await ctx.db.insert("sourceSnapshots", {
        opportunityId: args.id,
        sourceUrl: args.sourceUrl,
        contentHash: args.contentHash,
        ...(args.title ? { title: args.title } : {}),
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
    const uniqueMissingFacts = [...new Set(args.missingFacts.map(item => item.trim()).filter(Boolean))];
    for (const key of uniqueMissingFacts) {
      await ctx.db.insert("eligibilityFacts", {
        opportunityId: args.id,
        key,
        status: "missing",
        source: "ai",
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.id, {
      ...(args.title ? { title:args.title } : {}),
      ...(args.organizer ? { organizer:args.organizer } : {}),
      ...(args.deadlineAt ? { deadlineAt:args.deadlineAt } : {}),
      eligibility: args.eligibility,
      eligibilityReason: args.eligibilityReason,
      missingFacts: uniqueMissingFacts,
      priorityScore: args.priorityScore,
      status: "reviewing",
      updatedAt: now
    });
  }
});
