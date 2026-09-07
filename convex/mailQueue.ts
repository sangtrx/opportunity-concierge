import { AgentMail } from "@agentmail/convex";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail);

export const enqueueReminder = internalMutation({
  args: {
    inboxId: v.string(),
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    return await agentmail.sendMessage(ctx, args.inboxId, {
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
      labels: ["opportunity-concierge", "deadline-reminder"],
    });
  },
});
