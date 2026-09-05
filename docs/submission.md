# All Gas submission checklist

Official deadline: **2026-09-22 12:00 PM PT**.

## Qualification

- [x] New standalone app started after Aug 25 12 PM PT
- [x] Public GitHub repository
- [x] Root `hackathon.md`
- [x] Convex is the canonical backend in source
- [x] OpenAI does runtime structured analysis in source
- [x] Firecrawl does runtime official-page capture in source
- [x] AgentMail does runtime reminder sending in source
- [ ] Luma registration completed
- [ ] 20k participant Firecrawl credits claimed
- [ ] Convex project provisioned with `npx convex dev`
- [ ] Provider secrets set in Convex deployment environment
- [ ] Full typecheck/build passes with generated Convex API
- [ ] Live Firecrawl/OpenAI/AgentMail end-to-end acceptance passes
- [ ] Public app deployed to `convex.site` or `chatgpt.site`
- [ ] Live URL added to `hackathon.md`
- [ ] <3 minute demo recorded
- [ ] Demo URL added to `hackathon.md`
- [ ] X or LinkedIn post published tagging `@convex`, `@OpenAI`, `@firecrawl`, `@agentmail`
- [ ] Submit repo + live app + video on vibeapps.dev

## Social draft

Built **Opportunity Concierge** for the Convex All Gas Hackathon.

Paste an official hackathon/grant/scholarship/job URL → Firecrawl captures the source → OpenAI evaluates eligibility using only explicit user facts → Convex keeps evidence, decisions and actions live → AgentMail sends an explicit reminder with what is still left to do.

The key design constraint: missing user facts never silently become `eligible=true`, and every displayed evidence quote is verified against the captured source before it is persisted.

Live: `[LIVE_URL]`
Repo: https://github.com/sangtrx/opportunity-concierge
Demo: `[DEMO_URL]`

@convex @OpenAI @firecrawl @agentmail

## Judge-proof points to show, not merely say

1. Change an action or decision in one client and show realtime state update.
2. Open a result with exact source evidence rather than only a model summary.
3. Use a case that produces `needs_info` when one eligibility fact is missing.
4. Send one AgentMail reminder and show receipt in the inbox.
5. Keep the demo framed as an everyday decision tool, not developer infrastructure.
