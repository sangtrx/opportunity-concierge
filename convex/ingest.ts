"use node";

import { createHash } from "node:crypto";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import OpenAI from "openai";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";

const MAX_SOURCE_CHARS = 90_000;
const firecrawl = new FirecrawlClient(components.firecrawl);

const assessmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: ["string", "null"] },
    organizer: { type: ["string", "null"] },
    deadlineIso: { type: ["string", "null"] },
    eligibility: { type: "string", enum: ["eligible", "ineligible", "needs_info"] },
    eligibilityReason: { type: "string" },
    missingFacts: { type: "array", items: { type: "string" } },
    priorityScore: { type: "number", minimum: 0, maximum: 100 },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string" },
          quote: { type: "string" },
          supports: { type: "string" }
        },
        required: ["field", "quote", "supports"]
      }
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          dueAtIso: { type: ["string", "null"] }
        },
        required: ["title", "dueAtIso"]
      }
    }
  },
  required: [
    "title", "organizer", "deadlineIso", "eligibility", "eligibilityReason",
    "missingFacts", "priorityScore", "evidence", "actions"
  ]
} as const;

type Assessment = {
  title: string | null;
  organizer: string | null;
  deadlineIso: string | null;
  eligibility: "eligible" | "ineligible" | "needs_info";
  eligibilityReason: string;
  missingFacts: string[];
  priorityScore: number;
  evidence: Array<{ field: string; quote: string; supports: string }>;
  actions: Array<{ title: string; dueAtIso: string | null }>;
};

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function publicHttpUrl(raw: string): URL {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP(S) URLs are supported");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "::1") {
    throw new Error("Local/private URLs are not supported");
  }
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
    throw new Error("Local/private URLs are not supported");
  }
  const m = host.match(/^172\.(\d{1,3})\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) throw new Error("Local/private URLs are not supported");
  return url;
}

async function scrapeOfficialPage(
  ctx: Parameters<typeof firecrawl.scrape>[0],
  sourceUrl: string
): Promise<{ markdown: string; title?: string }> {
  const url = publicHttpUrl(sourceUrl);
  const page = await firecrawl.scrape(ctx, url.toString(), {
    formats: ["markdown"],
    onlyMainContent: true,
    timeout: 30_000,
  });
  const markdown = page.markdown?.trim();
  if (!markdown) throw new Error("Firecrawl returned no markdown content");
  return {
    markdown: markdown.slice(0, MAX_SOURCE_CHARS),
    title: page.metadata?.title,
  };
}

async function assessWithOpenAI(sourceUrl: string, markdown: string, candidateFacts: string[]): Promise<Assessment> {
  const client = new OpenAI({ apiKey: env("OPENAI_API_KEY") });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna",
    instructions: [
      "You are an opportunity eligibility analyst.",
      "Use ONLY the supplied source text and candidate facts.",
      "Never invent candidate facts. If a requirement cannot be matched from candidateFacts, mark needs_info and name the missing fact.",
      "Evidence quote values must be exact verbatim substrings from sourceMarkdown, at most 220 characters each.",
      "Do not treat marketing copy as binding rules when explicit eligibility/rules text is present.",
      "Priority score is 0-100 based on fit, deadline urgency, prize/value, and confidence; uncertainty lowers the score.",
      "Actions must be concrete next steps, not generic advice."
    ].join("\n"),
    input: JSON.stringify({ sourceUrl, candidateFacts, sourceMarkdown: markdown }),
    store: false,
    max_output_tokens: 4000,
    reasoning: { effort: "low" },
    text: {
      format: {
        type: "json_schema",
        name: "opportunity_assessment",
        strict: true,
        schema: assessmentSchema
      }
    }
  });
  if (!response.output_text) throw new Error("OpenAI returned no structured output");
  return JSON.parse(response.output_text) as Assessment;
}

function parseIsoMillis(value: string | null): number | undefined {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

function verifiedEvidence(markdown: string, evidence: Assessment["evidence"]): Assessment["evidence"] {
  return evidence
    .map((item) => ({ ...item, quote: item.quote.trim() }))
    .filter((item) => item.quote.length > 0 && item.quote.length <= 220 && markdown.includes(item.quote));
}

export const analyze = action({
  args: {
    opportunityId: v.id("opportunities"),
    candidateFacts: v.array(v.string())
  },
  handler: async (ctx, args): Promise<{ eligibility: string; evidenceCount: number; contentHash: string }> => {
    const opportunity: { sourceUrl: string } | null = await ctx.runQuery(internal.opportunities.getForAnalysis, {
      id: args.opportunityId
    });
    if (!opportunity) throw new Error("Opportunity not found");

    const facts = args.candidateFacts.map((fact) => fact.trim()).filter(Boolean).slice(0, 40);
    const scraped = await scrapeOfficialPage(ctx, opportunity.sourceUrl);
    const contentHash = createHash("sha256").update(scraped.markdown).digest("hex");
    const assessment = await assessWithOpenAI(opportunity.sourceUrl, scraped.markdown, facts);
    const evidence = verifiedEvidence(scraped.markdown, assessment.evidence);

    const eligibility = evidence.length === 0 ? "needs_info" : assessment.eligibility;
    const eligibilityReason = evidence.length === 0
      ? "The model produced no evidence quote that could be verified verbatim against the official source. Review the source manually."
      : assessment.eligibilityReason;

    await ctx.runMutation(internal.opportunities.applyAnalysis, {
      id: args.opportunityId,
      title: assessment.title ?? scraped.title,
      organizer: assessment.organizer ?? undefined,
      deadlineAt: parseIsoMillis(assessment.deadlineIso),
      eligibility,
      eligibilityReason,
      missingFacts: assessment.missingFacts.slice(0, 20),
      priorityScore: Math.max(0, Math.min(100, Math.round(assessment.priorityScore))),
      sourceUrl: opportunity.sourceUrl,
      contentHash,
      markdown: scraped.markdown,
      evidence,
      actions: assessment.actions.slice(0, 10).map((item) => ({
        title: item.title.trim(),
        dueAt: parseIsoMillis(item.dueAtIso)
      })).filter((item) => item.title.length > 0)
    });

    return { eligibility, evidenceCount: evidence.length, contentHash };
  }
});
