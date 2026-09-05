import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const eligibility = v.union(v.literal("eligible"), v.literal("ineligible"), v.literal("needs_info"), v.literal("unknown"));
const actionStatus = v.union(v.literal("todo"), v.literal("doing"), v.literal("done"), v.literal("skipped"));

export default defineSchema({
  opportunities: defineTable({
    sourceUrl: v.string(),
    title: v.optional(v.string()),
    organizer: v.optional(v.string()),
    kind: v.union(v.literal("hackathon"), v.literal("grant"), v.literal("scholarship"), v.literal("job"), v.literal("other")),
    deadlineAt: v.optional(v.number()),
    eligibility,
    eligibilityReason: v.optional(v.string()),
    missingFacts: v.array(v.string()),
    priorityScore: v.number(),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("pursue"), v.literal("skip"), v.literal("submitted")),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_updated", ["updatedAt"]).index("by_deadline", ["deadlineAt"]),
  evidence: defineTable({
    opportunityId: v.id("opportunities"),
    sourceUrl: v.string(),
    quote: v.string(),
    field: v.string(),
    supports: v.string(),
    capturedAt: v.number(),
  }).index("by_opportunity", ["opportunityId"]),
  sourceSnapshots: defineTable({
    opportunityId: v.id("opportunities"),
    sourceUrl: v.string(),
    contentHash: v.string(),
    title: v.optional(v.string()),
    markdown: v.string(),
    fetchedAt: v.number(),
  }).index("by_opportunity", ["opportunityId"]),
  actions: defineTable({
    opportunityId: v.id("opportunities"),
    title: v.string(),
    status: actionStatus,
    dueAt: v.optional(v.number()),
    source: v.union(v.literal("ai"), v.literal("user"), v.literal("system")),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_opportunity", ["opportunityId"]).index("by_due", ["dueAt"]),
  decisions: defineTable({
    opportunityId: v.id("opportunities"),
    decision: v.union(v.literal("pursue"), v.literal("skip"), v.literal("needs_info")),
    rationale: v.string(),
    decidedBy: v.union(v.literal("ai"), v.literal("user")),
    createdAt: v.number(),
  }).index("by_opportunity", ["opportunityId"]),
});
