# Under-3-minute judge demo

Goal: click through the real product. Keep architecture narration under 20 seconds total.

## 0:00–0:20 — problem

Show the empty/current inbox.

> Opportunities are scattered across official pages, and the expensive part is not finding a link — it is deciding whether I qualify, what evidence supports that decision, and what I need to do before the deadline.

## 0:20–0:55 — ingest one real opportunity

Paste an official public opportunity URL. Enter only explicit candidate facts that are relevant to eligibility.

Click **Analyze**.

Narrate the sponsor stack while the real run executes:

- Firecrawl captures the official page.
- OpenAI returns strict structured eligibility/actions from that source plus the facts I typed.
- The app verifies model evidence quotes verbatim against the captured source before storing them.
- Convex updates the dashboard live.

## 0:55–1:35 — evidence-backed decision

Show the resulting card:

- eligible / ineligible / needs info
- reason
- deadline
- priority score
- missing facts
- verified source quotes

Click **Pursue**, **Need info**, or **Skip** and show the status changing live.

## 1:35–2:05 — action loop

Show AI-generated next actions. Complete one action and show the realtime mutation reflected immediately.

Emphasize that this is durable application state, not a static LLM answer.

## 2:05–2:30 — AgentMail

Enter the demo email address and click **Email reminder** once.

Show the received message with:

- opportunity
- current eligibility
- deadline
- missing facts
- remaining next actions

Mention that sending is explicit and idempotent; analysis never auto-sends mail.

## 2:30–2:50 — Convex depth

Very briefly show source/code or another browser tab only if needed:

- queries + mutations + actions
- source snapshots/evidence/actions/decisions tables
- live subscriptions

Do not turn this into a code walkthrough.

## 2:50–3:00 — close

> One official URL becomes a grounded decision, a live action plan, and a follow-up loop. The product tells me what it knows, what it does not know, and what I should do next.

## Recording checklist

- [ ] Real Firecrawl source capture
- [ ] Real OpenAI analysis
- [ ] Verified evidence visible
- [ ] Convex realtime decision/action mutation visible
- [ ] Real AgentMail message received
- [ ] No secrets visible
- [ ] Public convex.site or chatgpt.site URL visible
- [ ] Video under 3 minutes
