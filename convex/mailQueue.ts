import { AgentMail } from "@agentmail/convex";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail);
const WAITING_ACTION = "Await reply to AgentMail reminder";

export const enqueueReminder = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    inboxId: v.string(),
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    html: v.string(),
    dedupeKey: v.string(),
    payloadFingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mailThreads")
      .withIndex("by_dedupe_key", (q) => q.eq("dedupeKey", args.dedupeKey))
      .first();
    if (existing) {
      if (existing.payloadFingerprint !== args.payloadFingerprint) {
        throw new Error("Reminder idempotency collision");
      }
      return existing.outboundId;
    }

    const outboundId = await agentmail.sendMessage(ctx, args.inboxId, {
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
      labels: [
        "opportunity-concierge",
        "deadline-reminder",
        `opportunity-id-${args.opportunityId}`,
        `reminder-key-${args.dedupeKey}`,
      ],
    });

    const now = Date.now();
    await ctx.db.insert("mailThreads", {
      opportunityId: args.opportunityId,
      inboxId: args.inboxId,
      recipient: args.to,
      dedupeKey: args.dedupeKey,
      payloadFingerprint: args.payloadFingerprint,
      outboundId,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });

    const actions = await ctx.db
      .query("actions")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId))
      .take(100);
    const waiting = actions.find((item) => item.source === "system" && item.title === WAITING_ACTION);
    if (waiting) {
      await ctx.db.patch(waiting._id, { status: "doing", updatedAt: now });
    } else {
      await ctx.db.insert("actions", {
        opportunityId: args.opportunityId,
        title: WAITING_ACTION,
        status: "doing",
        source: "system",
        createdAt: now,
        updatedAt: now,
      });
    }

    return outboundId;
  },
});
