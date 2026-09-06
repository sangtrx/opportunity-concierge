# Opportunity Concierge

A realtime opportunity inbox for hackathons, grants, scholarships, and jobs. Paste an official opportunity URL, preserve the source snapshot, evaluate eligibility without inventing candidate facts, and turn the result into concrete next actions.

Built for the Convex All Gas Hackathon.

## Runtime roles

- **Convex** — realtime opportunity, evidence, action, decision, and source-snapshot state.
- **Firecrawl v2** — captures the official page as markdown.
- **OpenAI Responses API** — strict structured extraction + eligibility reasoning from the source and user-entered facts only.
- **AgentMail** — explicit user-triggered email reminders; never auto-sends during analysis.

The analysis path verifies every model-produced evidence quote as an exact substring of the captured source. If no evidence quote verifies, the result is downgraded to `needs_info`.

## Local setup

```bash
npm install
npx convex dev
```

The first successful Convex project setup generates `convex/_generated/`. Commit that generated directory: the application imports those generated API/server/data-model types, so a clean clone must have them available before `npm run typecheck` can pass without contacting a Convex deployment.

Copy `.env.example` to `.env.local`, configure the generated `NEXT_PUBLIC_CONVEX_URL`, and set Firecrawl/OpenAI/AgentMail credentials in the Convex deployment environment. Then run:

```bash
npm run typecheck
npm run build
npm run dev
```

Do not commit provider keys or Convex deployment secrets.

## Current qualification state

Core Convex schema/UI and the three provider integrations are implemented in source. Live-provider validation and public deployment remain gated on hackathon account credentials/project provisioning. See `hackathon.md`.
