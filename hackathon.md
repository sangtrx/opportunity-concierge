# All Gas Hackathon log

App: **Opportunity Concierge**

## Human direction
- Product thesis: turn a public opportunity URL into an evidence-backed go/no-go decision and concrete next actions.
- Priority: everyday usefulness, not a developer dashboard.
- Safety rule: never invent eligibility facts about the user and never auto-send email.

## AI-assisted implementation
- Initial schema, mutations and dashboard scaffold were authored with ChatGPT/Codex assistance on 2026-09-06.
- Firecrawl v2 source capture, OpenAI strict structured eligibility analysis, verbatim evidence verification, and AgentMail explicit reminder sending were added on 2026-09-06.
- Realtime evidence/action cards, explicit pursue/skip/needs-info decisions, and action completion controls were added on 2026-09-06 to make Convex state visibly central to the user journey.
- Source-side URL canonicalization/de-duplication and explicit hackathon/grant/scholarship/job/other capture were added on 2026-09-07.
- On 2026-09-07 the sponsor integrations were deepened to use the official Firecrawl and AgentMail Convex Components. Firecrawl scraping now runs through `FirecrawlClient`; AgentMail reminders now use the component's durable outbound queue, expose reactive delivery state, mount a verified inbound webhook, and expose reactive thread replies.
- On 2026-09-07 the judge demo and submission evidence were updated to exercise the component-backed outbound status + inbound reply loop and to keep a fail-closed distinction between source-complete and live-accepted behavior.

## Runtime roles
- **Convex:** canonical realtime opportunity/evidence/action/decision/source state plus component-backed email state and subscriptions.
- **Firecrawl:** official-page capture into markdown snapshots through the Firecrawl Convex Component.
- **OpenAI:** structured extraction, eligibility reasoning and action generation from source + explicit user facts.
- **AgentMail:** explicit user-triggered reminder delivery, durable send status and inbound reply sync through the AgentMail Convex Component.

## Qualification guardrails
- New app work begins after 2026-08-25.
- Public deployment, final README/demo/social evidence remain pending.
- Provider credentials remain environment-only and are never committed.
- Clean-clone/typecheck acceptance remains blocked on account-side Convex provisioning and committed generated bindings; source changes must not be represented as live-validated before that gate is cleared.
- The 2026-09-07 component migration is source-complete but runtime-unverified until SAN-122 provisions Convex, generates/commits `convex/_generated/*`, installs dependencies, sets provider/webhook secrets, and passes the live provider acceptance flow.
