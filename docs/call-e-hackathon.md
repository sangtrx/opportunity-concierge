# CALL-E hackathon adaptation — Opportunity Clarifier

## Project delta

This branch adds a new runtime phone-work flow to the existing Opportunity Concierge during the CALL-E hackathon submission period. The original app discovers and reasons about opportunities from public sources. The CALL-E adaptation closes one remaining real-world gap: when a deadline, eligibility rule, or submission requirement is still ambiguous after reading public documentation, an authorized user can place one bounded clarification call and receive structured evidence plus a next action.

## Runtime flow

1. Open `/call-e`.
2. Enter one organization, one authorized E.164 recipient number, one concrete clarification question, and optional non-sensitive public context.
3. Explicitly confirm authorization to place a real external call.
4. The server calls `POST https://api.heycall-e.com/v1/calls` using `CALLE_API_KEY` and a stable idempotency key.
5. CALL-E identifies itself as an AI calling assistant, asks only the supplied clarification question, and avoids payments, credentials, identifiers, or unrelated requests.
6. The UI polls `GET /v1/calls/{call_id}` and renders CALL-E's structured result, summary, and bounded evidence without exposing transcripts or phone numbers.

Structured result fields:

- `answer_status`: `answered | unclear | not_reached`
- `answer`: concise factual paraphrase; missing facts must not be invented
- `needs_follow_up`: `yes | no | unknown`
- `next_action`: concrete next step supported by the call

## Safety / side-effect boundary

Calls are never automatic. The UI requires an explicit confirmation immediately before the call request. Server-side validation requires E.164, a single scoped question, and a browser-generated request id used for CALL-E idempotency. API credentials remain server-only. Status responses intentionally omit transcript turns and recipient phone numbers.

## Local setup

```bash
cp .env.example .env.local
# set CALLE_API_KEY to a CALL-E Developer API key
npm install
npm run dev
```

Then open `http://localhost:3000/call-e`.

## Verification without placing a call

```bash
npm run typecheck
npm run lint
npm run build
```

These checks must not place a phone call. A real-call acceptance requires an authorized test recipient and an explicit click in the `/call-e` UI.

## <3 minute demo outline

- 0:00–0:25 — problem: public opportunity pages still leave deadline/eligibility ambiguity that normally becomes manual phone work.
- 0:25–0:55 — show one opportunity question and the explicit real-call authorization gate.
- 0:55–1:45 — place one CALL-E call to an authorized demo recipient; show that the agent identifies itself and stays on the single question.
- 1:45–2:20 — show live status changing to terminal and the structured result/evidence/next action.
- 2:20–2:45 — show server-side API routes and explain idempotency, secret isolation, and no transcript/phone exposure in the UI.
- 2:45–2:58 — summarize impact: turn unresolved opportunity ambiguity into one actionable, evidence-backed answer.

## Submission notes

Current official CALL-E rules require the project to use CALL-E at runtime, a PR to `CALLE-AI/awesome-phone-call-agents`, an English description, and a public demo video shorter than three minutes. Existing projects are eligible only when significantly updated during the submission period, so the Devpost write-up should explicitly describe this phone-work delta and link the exact hackathon branch/commit or merged source that contains it.

Official references:

- https://call-e.devpost.com/rules
- https://call-e.devpost.com/resources
- https://docs.heycall-e.com/api-reference/calls
