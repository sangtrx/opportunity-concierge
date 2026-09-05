"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function agentMail(path: string, init: RequestInit): Promise<any> {
  const response = await fetch(`https://api.agentmail.to/v0${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env("AGENTMAIL_API_KEY")}`,
      "content-type": "application/json",
      ...(init.headers ?? {})
    },
    signal: AbortSignal.timeout(30_000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`AgentMail failed (${response.status}): ${payload?.message ?? payload?.error ?? "unknown error"}`);
  return payload;
}

async function getOrCreateInbox(): Promise<{ inbox_id: string; email?: string }> {
  return agentMail("/inboxes", {
    method: "POST",
    body: JSON.stringify({
      client_id: process.env.AGENTMAIL_INBOX_CLIENT_ID?.trim() || "opportunity-concierge-v1",
      display_name: "Opportunity Concierge"
    })
  });
}

export const sendReminder = action({
  args: {
    opportunityId: v.id("opportunities"),
    to: v.string()
  },
  handler: async (ctx, args): Promise<{ messageId: string | null; inboxId: string }> => {
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

    const inbox = await getOrCreateInbox();
    const sent = await agentMail(`/inboxes/${encodeURIComponent(inbox.inbox_id)}/messages/send`, {
      method: "POST",
      body: JSON.stringify({
        to,
        subject: `Opportunity reminder — ${title}`,
        text,
        html,
        labels: ["opportunity-concierge"]
      })
    });
    return { messageId: sent.message_id ?? null, inboxId: inbox.inbox_id };
  }
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char] as string));
}
