# All Gas Hackathon log

App: **Opportunity Concierge**

## Human direction
- Product thesis: turn a public opportunity URL into an evidence-backed go/no-go decision and concrete next actions.
- Priority: everyday usefulness, not a developer dashboard.
- Safety rule: never invent eligibility facts about the user and never auto-send email.

## AI-assisted implementation
- Initial schema, mutations and dashboard scaffold were authored with ChatGPT/Codex assistance on 2026-09-06.
- Firecrawl v2 source capture, OpenAI strict structured eligibility analysis, verbatim evidence verification, and AgentMail explicit reminder sending were added on 2026-09-06.

## Runtime roles
- **Convex:** canonical realtime opportunity/evidence/action/decision state.
- **Firecrawl:** official-page capture into markdown snapshots.
- **OpenAI:** structured extraction, eligibility reasoning and action generation from source + explicit user facts.
- **AgentMail:** explicit user-triggered reminder delivery from an idempotent agent inbox.

## Qualification guardrails
- New app work begins after 2026-08-25.
- Public deployment, final README/demo/social evidence remain pending.
- Provider credentials remain environment-only and are never committed.
