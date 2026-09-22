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
- [x] Luma registration completed
- [ ] 20k participant Firecrawl credits claimed
- [x] Convex project provisioned with `npx convex dev`
- [x] Real component-aware `convex/_generated/*` committed
- [x] Provider + webhook secrets set in the accepted Convex deployment environment
- [x] Clean-clone `npm run typecheck` passes for the exact accepted SHA
- [x] Clean-clone `npm run build` passes for the exact accepted SHA
- [x] Live Firecrawl Component → OpenAI → Convex persistence acceptance passes
- [x] Live realtime opportunity decision/action state is demonstrated and survives reload
- [x] Live AgentMail Component send + reactive delivery status passes
- [x] Live inbound AgentMail reply updates reactive thread state
- [x] Public app deployed to `convex.site`: https://valiant-crab-246.convex.site
- [x] Live URL added to `hackathon.md`
- [x] <3 minute demo recorded from the accepted public app (1:53.25)
- [x] Demo URL added to `hackathon.md`
- [x] X post published tagging `@convex`, `@OpenAI`, `@firecrawl`, `@agentmail`
- [x] Submit repo + live app + video on vibeapps.dev

## Verified final-lane receipts — 2026-09-22

- Luma registration is confirmed by the organizer email recorded on parent issue SAN-43.
- SAN-122 runtime acceptance is complete with one bounded AgentMail reminder/reply flow and `inbound_proven=true`.
- SAN-115 public judge-UX acceptance passed at https://valiant-crab-246.convex.site, including persisted reply/action/follow-up state after reload.
- Exact static-hosting candidate `b3e8d51a2fe173d9abc95e83a1dad6dffaf59600` passed tests, typecheck, production build and static export before publication.
- The Firecrawl participant-credit checkbox remains intentionally unchecked because no durable claim receipt is recorded here.
- Fresh public Analyze acceptance passed on 2026-09-22 using the official All Gas URL: the public UI completed with `needs_info` and 5 verified evidence quotes after a real Firecrawl → OpenAI → Convex run; browser errors and console errors were empty.
- Social receipt: https://x.com/sangtrx/status/2102431680502079997 — the post tags all four required sponsor accounts.
- Video Demo: https://youtu.be/CZmA1vFSyF4 — 1:53.25, under the 3-minute limit, recorded from the accepted public app.
- Final VibeApps submission receipt: https://vibeapps.dev/s/opportunity-concierge. The public receipt page lists the live `convex.site` app, public GitHub repo, LinkedIn profile, X share, required tags, and the YouTube Video Demo above.

## Judging polish after runtime acceptance

The official rubric explicitly rewards Convex depth including queries, mutations, live updates, auth and components. The current source already demonstrates queries/mutations/live updates/components. After SAN-122 clears, decide whether a minimal real auth seam improves the product without destabilizing the accepted demo path. Do not add mock auth solely for the rubric.

## Social draft

Built **Opportunity Concierge** for the Convex All Gas Hackathon.

Paste an official hackathon/grant/scholarship/job URL → Firecrawl captures the source through its Convex Component → OpenAI evaluates eligibility using only explicit user facts → Convex keeps evidence, decisions and actions live → AgentMail sends an explicit reminder through its Convex Component and syncs the reply back into the app.

The key design constraint: missing user facts never silently become `eligible=true`, and every displayed evidence quote is verified against the captured source before it is persisted.

Live: https://valiant-crab-246.convex.site
Repo: https://github.com/sangtrx/opportunity-concierge
Demo: https://youtu.be/CZmA1vFSyF4

@convex @OpenAI @firecrawl @agentmail

## Judge-proof points to show, not merely say

1. Change an action or decision in one client and show realtime state update.
2. Open a result with exact source evidence rather than only a model summary.
3. Use a case that produces `needs_info` when one eligibility fact is missing.
4. Send one AgentMail reminder, show reactive delivery status, and show receipt in the inbox.
5. Reply to that reminder and show the inbound thread state update in the app.
6. Keep the demo framed as an everyday decision tool, not developer infrastructure.

## Evidence discipline

Source-complete is not runtime-accepted. The runtime, fresh Analyze, public judge UX, and demo/social claims above are checked only because each now has a durable acceptance receipt. The final VibeApps checkbox is checked only after the public submission page at https://vibeapps.dev/s/opportunity-concierge was verified.
