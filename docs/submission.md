# All Gas submission checklist

Official deadline: **2026-09-22 12:00 PM PT**.

## Qualification

- [x] New standalone app started after Aug 25 12 PM PT
- [x] Public GitHub repository
- [x] Root `hackathon.md`
- [x] Convex is the canonical backend in source
- [x] OpenAI does strict structured opportunity analysis in source
- [x] Firecrawl does official-page capture through the Firecrawl Convex Component in source
- [x] AgentMail does explicit reminder delivery through the AgentMail Convex Component in source
- [x] Reactive AgentMail outbound status is exposed in source
- [x] AgentMail webhook + reactive inbound reply state are implemented in source
- [ ] Luma registration completed
- [ ] 20k participant Firecrawl credits claimed
- [ ] Convex project provisioned with `npx convex dev`
- [ ] Real component-aware `convex/_generated/*` committed
- [ ] Provider + webhook secrets set in the Convex deployment environment
- [ ] Clean-clone `npm run typecheck` passes for the exact accepted SHA
- [ ] Clean-clone `npm run build` passes for the exact accepted SHA
- [ ] Live Firecrawl Component → OpenAI → Convex persistence acceptance passes
- [ ] Live realtime opportunity decision/action mutation is demonstrated
- [ ] Live AgentMail Component send + reactive delivery status passes
- [ ] Live inbound AgentMail reply updates reactive thread state
- [ ] Public app deployed to `convex.site` or `chatgpt.site`
- [ ] Live URL added to `hackathon.md`
- [ ] <3 minute demo recorded from the accepted deployed SHA
- [ ] Demo URL added to `hackathon.md`
- [ ] X or LinkedIn post published tagging `@convex`, `@OpenAI`, `@firecrawl`, `@agentmail`
- [ ] Submit repo + live app + video on vibeapps.dev

## Judging polish after runtime acceptance

The official rubric explicitly rewards Convex depth including queries, mutations, live updates, auth and components. The current source already demonstrates queries/mutations/live updates/components. After SAN-122 clears, decide whether a minimal real auth seam improves the product without destabilizing the accepted demo path. Do not add mock auth solely for the rubric.

## Social draft

Built **Opportunity Concierge** for the Convex All Gas Hackathon.

Paste an official hackathon/grant/scholarship/job URL → Firecrawl captures the source through its Convex Component → OpenAI evaluates eligibility using only explicit user facts → Convex keeps evidence, decisions and actions live → AgentMail sends an explicit reminder through its Convex Component and syncs the reply back into the app.

The key design constraint: missing user facts never silently become `eligible=true`, and every displayed evidence quote is verified against the captured source before it is persisted.

Live: `[LIVE_URL]`
Repo: https://github.com/sangtrx/opportunity-concierge
Demo: `[DEMO_URL]`

@convex @OpenAI @firecrawl @agentmail

## Judge-proof points to show, not merely say

1. Change an action or decision in one client and show realtime state update.
2. Open a result with exact source evidence rather than only a model summary.
3. Use a case that produces `needs_info` when one eligibility fact is missing.
4. Send one AgentMail reminder, show reactive delivery status, and show receipt in the inbox.
5. Reply to that reminder and show the inbound thread state update in the app.
6. Keep the demo framed as an everyday decision tool, not developer infrastructure.

## Evidence discipline

Source-complete is not runtime-accepted. Until SAN-122 clears, leave every deployment/demo/provider checkbox above unchecked and do not publish claims that the component migration has been live-validated.
