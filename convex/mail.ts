import { AgentMail, type OutboundId } from "@agentmail/convex";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, query } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail);

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

    const inbox = await agentmail.createInbox(ctx, {
      clientId: "opportunity-concierge-v1",
      displayName: "Opportunity Concierge",
    });
    const outboundId = await ctx.runMutation(internal.mailQueue.enqueueReminder, {
      inboxId: inbox.inbox_id,
      to,
      subject: `Opportunity reminder — ${title}`,
      text,
      html,
    });

    return { outboundId, inboxId: inbox.inbox_id };
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char] as string));
}
