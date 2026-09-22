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
- Provider credentials remain environment-only and are never committed.
- Public evidence must describe only behavior that was actually exercised; no fabricated provider, deployment, social, video, or submission receipts.

## Live acceptance — 2026-09-22
- Public app: https://valiant-crab-246.convex.site
- Runtime/provider gate SAN-122 is complete: the fixed-inbox AgentMail webhook is enabled for `message.received`, one bounded reminder/reply acceptance flow reached Convex, and aggregate state reports `inbound_proven=true`.
- Judge-facing SAN-115 acceptance passed on the public `convex.site`: the persisted reminder is sent, the reply is received, the waiting action is complete, the review-only follow-up action/draft is visible, and the same state survives a browser reload.
- Exact static-hosting candidate `b3e8d51a2fe173d9abc95e83a1dad6dffaf59600` passed `npm test`, `npm run typecheck`, the production Next.js build, and static export before publication.
- Raw inbound email bodies are not exposed in the public UI.

## Final-submission evidence — 2026-09-22
- Fresh public Analyze acceptance passed at https://valiant-crab-246.convex.site using the official All Gas URL: the UI completed with `needs_info` and **5 verified evidence quotes** after a real Firecrawl → OpenAI → Convex run; browser errors and console errors were empty.
- Under-3-minute demo + required sponsor-tagged social proof: https://x.com/Currenlabs/status/2102397127800549693
  - The attached demo is **28.83 seconds** and was recorded from the accepted public app.
  - The post tags `@convex`, `@OpenAI`, `@firecrawl`, and `@agentmail`, and links the live app and public repository.
- Final VibeApps judging submission receipt: https://vibeapps.dev/s/opportunity-concierge
  - The public submission page lists Opportunity Concierge by Trương Quang Sang, the accepted `convex.site` app URL, GitHub repository, LinkedIn profile, X social post, and required tags.
  - The submitted Video Demo is the public 44.0-second MP4 at https://github.com/sangtrx/opportunity-concierge/releases/download/all-gas-submission-2026-09-22/all-gas-demo-2026-09-22.mp4.
