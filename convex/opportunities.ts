import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({ args: {}, handler: async (ctx) => {
  const rows = await ctx.db.query("opportunities").withIndex("by_updated").order("desc").take(100);
  return rows;
}});

export const get = query({ args: { id: v.id("opportunities") }, handler: async (ctx, { id }) => {
  const opportunity = await ctx.db.get(id);
  if (!opportunity) return null;
  const [evidence, actions, decisions] = await Promise.all([
    ctx.db.query("evidence").withIndex("by_opportunity", q => q.eq("opportunityId", id)).collect(),
    ctx.db.query("actions").withIndex("by_opportunity", q => q.eq("opportunityId", id)).collect(),
    ctx.db.query("decisions").withIndex("by_opportunity", q => q.eq("opportunityId", id)).order("desc").collect(),
  ]);
  return { opportunity, evidence, actions, decisions };
}});

export const create = mutation({
  args: { sourceUrl: v.string(), kind: v.union(v.literal("hackathon"),v.literal("grant"),v.literal("scholarship"),v.literal("job"),v.literal("other")) },
  handler: async (ctx, args) => {
    let u: URL; try { u = new URL(args.sourceUrl); } catch { throw new Error("Enter a valid URL") }
    if (!["http:","https:"].includes(u.protocol)) throw new Error("Only HTTP(S) opportunity URLs are accepted");
    const now = Date.now();
    return ctx.db.insert("opportunities", { sourceUrl:u.toString(), kind:args.kind, eligibility:"unknown", missingFacts:[], priorityScore:0, status:"new", createdAt:now, updatedAt:now });
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
