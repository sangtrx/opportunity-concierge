# Under-3-minute judge demo

Goal: click through the real product. Keep architecture narration under 20 seconds total.

## 0:00–0:18 — problem

Show the current inbox.

> Opportunities are scattered across official pages, and the expensive part is not finding a link — it is deciding whether I qualify, what evidence supports that decision, and what I need to do before the deadline.

## 0:18–0:50 — ingest one real opportunity

Paste an official public opportunity URL. Enter only explicit candidate facts that are relevant to eligibility.

Click **Analyze**.

Narrate only what the live run proves:

- Firecrawl captures the official page through the Firecrawl Convex Component.
- OpenAI returns strict structured eligibility/actions from that source plus the facts I typed.
- The app verifies model evidence quotes verbatim against the captured source before storing them.
- Convex persists the source, evidence, decision data and updates the dashboard reactively.

## 0:50–1:25 — evidence-backed decision

Show the resulting card:

- eligible / ineligible / needs info
- reason
- deadline
- priority score
- missing facts
- verified source quotes

Click **Pursue**, **Need info**, or **Skip** and show the status changing live.

Use at least one case that returns **needs info** when a required user fact is absent. Do not narrate hypothetical eligibility.

## 1:25–1:52 — action loop

Show AI-generated next actions. Complete one action and show the realtime mutation reflected immediately.

Emphasize that this is durable Convex application state, not a static LLM answer.

## 1:52–2:30 — AgentMail follow-up loop

Enter the demo email address and click **Email reminder** exactly once.

Show the reactive send state in the product, then show the received message with:

- opportunity
- current eligibility
- deadline
- missing facts
- remaining next actions

Reply to the email with one short sentence. Return to the app and show the inbound reply count/thread state update through the AgentMail webhook.

Mention only that sending is explicit; analysis never auto-sends mail.

## 2:30–2:50 — Convex depth

Very briefly show source/code or another browser tab only if needed:

- queries + mutations + actions
- source snapshots/evidence/actions/decisions tables
- live subscriptions
- Firecrawl + AgentMail Convex Components

Do not turn this into a code walkthrough.

## 2:50–3:00 — close

> One official URL becomes a grounded decision, a live action plan, and a follow-up loop. The product tells me what it knows, what it does not know, and what I should do next.

## Recording checklist

- [ ] Real Firecrawl Component source capture
- [ ] Real OpenAI analysis
- [ ] Verified evidence visible
- [ ] Convex realtime decision/action mutation visible
- [ ] AgentMail Component send status visible
- [ ] Real AgentMail message received
- [ ] Inbound AgentMail reply reflected reactively in the app
- [ ] No secrets visible
- [ ] Public convex.site or chatgpt.site URL visible
- [ ] Video under 3 minutes

## Fail-closed recording rule

Do not record or claim this flow until SAN-122 has provisioned the Convex project, generated and committed the real `convex/_generated/*` bindings, configured provider/webhook secrets, and the exact deployed SHA has passed live provider acceptance.
