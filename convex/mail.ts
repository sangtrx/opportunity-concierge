import { AgentMail, type OutboundId } from "@agentmail/convex";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail);
const WAITING_ACTION = "Await reply to AgentMail reminder";
const FOLLOW_UP_ACTION = "Review AgentMail reply and draft follow-up";
const OPPORTUNITY_LABEL = "opportunity-id-";
const REMINDER_LABEL = "reminder-key-";

export const sendReminder = action({
  args: {
    opportunityId: v.id("opportunities"),
    to: v.string(),
  },
  handler: async (ctx, args): Promise<{ outboundId: string; inboxId: string }> => {
    const to = args.to.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Enter a valid email address");

    const detail: {
      title?: string;
      sourceUrl: string;
      deadlineAt?: number;
      eligibility: string;
      missingFacts: string[];
      actions: Array<{ title: string; dueAt?: number; status: string }>;
    } | null = await ctx.runQuery(internal.opportunities.getReminderContext, { id: args.opportunityId });
    if (!detail) throw new Error("Opportunity not found");

    const title = detail.title || new URL(detail.sourceUrl).hostname;
    const deadline = detail.deadlineAt ? new Date(detail.deadlineAt).toISOString().slice(0, 10) : "not confirmed";
    const todo = detail.actions.filter((x) => x.status !== "done" && x.status !== "skipped").slice(0, 6);
    const lines = [
      `Opportunity: ${title}`,
      `Eligibility: ${detail.eligibility}`,
      `Deadline: ${deadline}`,
      `Source: ${detail.sourceUrl}`,
      "",
      ...(detail.missingFacts.length ? ["Missing facts:", ...detail.missingFacts.map((x) => `- ${x}`), ""] : []),
      ...(todo.length ? ["Next actions:", ...todo.map((x) => `- ${x.title}${x.dueAt ? ` (due ${new Date(x.dueAt).toISOString().slice(0, 10)})` : ""}`)] : ["No pending actions recorded."])
    ];
    const text = lines.join("\n");
    const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5"><h2>${escapeHtml(title)}</h2><pre style="white-space:pre-wrap;font:inherit">${escapeHtml(text)}</pre></div>`;

    const inboxId = process.env.AGENTMAIL_INBOX_ID?.trim();
    if (!inboxId) throw new Error("AGENTMAIL_INBOX_ID is not configured");
    const subject = `Opportunity reminder — ${title}`;
    const payloadFingerprint = [String(args.opportunityId), to.toLowerCase(), subject, text, html].join("\n---\n");
    const dedupeKey = stableDigest(payloadFingerprint);
    const outboundId = await ctx.runMutation(internal.mailQueue.enqueueReminder, {
      opportunityId: args.opportunityId,
      inboxId,
      to,
      subject,
      text,
      html,
      dedupeKey,
      payloadFingerprint,
    });

    return { outboundId, inboxId };
  },
});

export const sendStatus = query({
  args: { outboundId: v.string() },
  handler: async (ctx, args) => {
    return await agentmail.status(ctx, args.outboundId as OutboundId);
  },
});

export const threadMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.agentmail.lib.listInboundMessages, {
      threadId: args.threadId,
    });
  },
});

export const inboundMessages = query({
  args: {},
  handler: async (ctx) => {
    const inboxId = process.env.AGENTMAIL_INBOX_ID?.trim();
    if (!inboxId) throw new Error("AGENTMAIL_INBOX_ID is not configured");
    return await ctx.runQuery(components.agentmail.lib.listInboundMessages, { inboxId });
  },
});

export const linkOutboundThread = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    outboundId: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("mailThreads")
      .withIndex("by_outbound", (q) => q.eq("outboundId", args.outboundId))
      .first();
    if (!row || row.opportunityId !== args.opportunityId) {
      throw new Error("Reminder send is not linked to this opportunity");
    }

    const linked = await ctx.db
      .query("mailThreads")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .first();
    if (linked && linked._id !== row._id) throw new Error("AgentMail thread is already linked");

    await ctx.db.patch(row._id, {
      threadId: args.threadId,
      status: row.status === "reply_received" ? "reply_received" : "sent",
      updatedAt: Date.now(),
    });
  },
});

export const followUpDraft = query({
  args: {
    opportunityId: v.id("opportunities"),
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const inbound = await ctx.runQuery(components.agentmail.lib.listInboundMessages, { threadId: args.threadId });
    if (inbound.length === 0) return null;

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) return null;
    const linked = await ctx.db
      .query("mailThreads")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .first();
    if (linked && linked.opportunityId !== args.opportunityId) return null;

    const actions = await ctx.db
      .query("actions")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId))
      .take(100);
    const remaining = actions
      .filter((item) => item.status !== "done" && item.status !== "skipped" && item.title !== WAITING_ACTION && item.title !== FOLLOW_UP_ACTION)
      .slice(0, 5);
    const title = opportunity.title || new URL(opportunity.sourceUrl).hostname;
    const deadline = opportunity.deadlineAt ? new Date(opportunity.deadlineAt).toISOString().slice(0, 10) : "not confirmed";
    const text = [
      "Thanks for the reply.",
      "",
      `I’m following up on ${title}.`,
      `Deadline: ${deadline}`,
      `Source: ${opportunity.sourceUrl}`,
      "",
      ...(remaining.length
        ? ["Open items I’m tracking:", ...remaining.map((item) => `- ${item.title}`)]
        : ["There are no other open items recorded right now."]),
      "",
      "Please let me know if there is anything else I should confirm before the next step.",
    ].join("\n");
    return { subject: `Re: Opportunity reminder — ${title}`, text };
  },
});

export const onMessageReceived = internalMutation({
  args: {
    message: v.any(),
    thread: v.any(),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const labels = getLabels(args.thread);
    const rawOpportunityId = labels.find((label) => label.startsWith(OPPORTUNITY_LABEL))?.slice(OPPORTUNITY_LABEL.length);
    const dedupeKey = labels.find((label) => label.startsWith(REMINDER_LABEL))?.slice(REMINDER_LABEL.length);
    if (!rawOpportunityId || !dedupeKey) return null;

    const row = await ctx.db
      .query("mailThreads")
      .withIndex("by_dedupe_key", (q) => q.eq("dedupeKey", dedupeKey))
      .first();
    if (!row || String(row.opportunityId) !== rawOpportunityId) return null;
    if (row.lastEventId === args.eventId) return row._id;

    const threadId = getStructuralString(args.thread, ["thread_id", "threadId", "id"]);
    const inboxId = getStructuralString(args.thread, ["inbox_id", "inboxId"]);
    if (inboxId && inboxId !== row.inboxId) return null;
    if (threadId) {
      const linked = await ctx.db
        .query("mailThreads")
        .withIndex("by_thread", (q) => q.eq("threadId", threadId))
        .first();
      if (linked && linked._id !== row._id) return null;
    }

    const now = Date.now();
    await ctx.db.patch(row._id, {
      threadId: threadId ?? row.threadId,
      status: "reply_received",
      lastEventId: args.eventId,
      lastInboundAt: now,
      updatedAt: now,
    });

    const actions = await ctx.db
      .query("actions")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", row.opportunityId))
      .take(100);
    const waiting = actions.find((item) => item.source === "system" && item.title === WAITING_ACTION);
    if (waiting && waiting.status !== "done") {
      await ctx.db.patch(waiting._id, { status: "done", updatedAt: now });
    }
    const followUp = actions.find((item) => item.source === "system" && item.title === FOLLOW_UP_ACTION);
    if (followUp) {
      if (followUp.status === "done" || followUp.status === "skipped") {
        await ctx.db.patch(followUp._id, { status: "todo", updatedAt: now });
      }
    } else {
      await ctx.db.insert("actions", {
        opportunityId: row.opportunityId,
        title: FOLLOW_UP_ACTION,
        status: "todo",
        source: "system",
        createdAt: now,
        updatedAt: now,
      });
    }

    return row._id;
  },
});

function getLabels(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const labels = (value as Record<string, unknown>).labels;
  return Array.isArray(labels) ? labels.filter((item): item is string => typeof item === "string") : [];
}

function getStructuralString(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

function stableDigest(value: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (code + index), 0x27d4eb2d) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char] as string));
}
