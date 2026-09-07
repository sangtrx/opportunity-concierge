# Opportunity Concierge

A realtime opportunity inbox for hackathons, grants, scholarships, and jobs. Paste an official opportunity URL, preserve the source snapshot, evaluate eligibility without inventing candidate facts, and turn the result into concrete next actions.

Built for the Convex All Gas Hackathon.

## Runtime roles

- **Convex** — realtime opportunity, evidence, action, decision, source-snapshot, email-delivery, and inbound-reply state.
- **Firecrawl Convex Component** — captures the official page as markdown through `FirecrawlClient`.
- **OpenAI Responses API** — strict structured extraction + eligibility reasoning from the source and user-entered facts only.
- **AgentMail Convex Component** — explicit user-triggered reminders, durable delivery state, webhook-backed inbox sync, and reactive replies.

The analysis path verifies every model-produced evidence quote as an exact substring of the captured source. If no evidence quote verifies, the result is downgraded to `needs_info`.

## Local setup

```bash
npm install
npx convex dev
```

The first successful Convex project setup generates `convex/_generated/`, including component bindings. Commit that generated directory: the application imports those generated API/server/data-model/component types, so a clean clone must have them available before `npm run typecheck` can pass without contacting a Convex deployment.

Copy `.env.example` to `.env.local`, configure the generated `NEXT_PUBLIC_CONVEX_URL`, and set Firecrawl/OpenAI/AgentMail credentials in the Convex deployment environment. For the component-backed webhook paths, set `FIRECRAWL_WEBHOOK_SECRET` and `AGENTMAIL_WEBHOOK_SECRET` as well. Then run:

```bash
npm run typecheck
npm run build
npm run dev
```

Do not commit provider keys or Convex deployment secrets.

## Current qualification state

Core Convex schema/UI and the three provider integrations are implemented in source, including the official Firecrawl and AgentMail Convex Components. Live-provider validation and public deployment remain gated on hackathon account credentials/project provisioning. See `hackathon.md`.
