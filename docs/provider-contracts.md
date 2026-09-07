# Provider contracts

## Firecrawl

Current integration uses the official **Firecrawl Convex Component** (`@firecrawl/firecrawl-convex`) for the production scrape seam:

- component registered in `convex/convex.config.ts`
- `FirecrawlClient.scrape(...)` is called from the Convex analysis action
- component credentials come from deployment env: `FIRECRAWL_API_KEY` and optional `FIRECRAWL_WEBHOOK_SECRET`
- request: official source URL, `formats: ["markdown"]`, `onlyMainContent: true`
- response markdown is hashed and stored in `sourceSnapshots` before model output is persisted

The app still rejects obvious local/private source URLs before calling Firecrawl. No eligibility claim is allowed to rely only on an LLM summary.

## OpenAI

Current integration uses the Responses API with strict JSON Schema output. Inputs are only:

1. the Firecrawl markdown snapshot,
2. the canonical source URL,
3. candidate facts explicitly typed by the user.

Evidence quotes must be verbatim source substrings and are verified in code before persistence. If no quote verifies, eligibility is downgraded to `needs_info` instead of trusting unsupported model output.

## AgentMail

Current integration uses the official **AgentMail Convex Component** (`@agentmail/convex`):

- a stable `clientId` is used to create/reuse the Opportunity Concierge inbox
- reminder sends are enqueued through the component's durable outbound queue from an internal Convex mutation
- the frontend subscribes to component-backed outbound status (`queued`, `sent`, `delivered`, `bounced`, etc.)
- `/agentmail/webhook` is mounted in `convex/http.ts`
- inbound thread messages are exposed through a reactive Convex query, so replies appear without frontend polling
- deployment env requires `AGENTMAIL_API_KEY`; inbound webhook verification also requires `AGENTMAIL_WEBHOOK_SECRET`

Sending is always an explicit user click. The app never auto-emails from analysis.

## Acceptance boundary

These component migrations are source-complete but **not runtime-accepted** until SAN-122 provisions the Convex deployment, generates/commits real `convex/_generated/*`, installs dependencies, sets provider secrets, and passes clean-clone typecheck/build plus one live provider flow.
