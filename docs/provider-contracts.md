# Provider contracts

## Firecrawl

Current integration uses the official **v2 REST scrape endpoint**:

- `POST https://api.firecrawl.dev/v2/scrape`
- Bearer auth from `FIRECRAWL_API_KEY`
- request: official source URL, `formats: ["markdown"]`, `onlyMainContent: true`
- response markdown is hashed and stored in `sourceSnapshots` before model output is persisted

No eligibility claim is allowed to rely only on an LLM summary.

## OpenAI

Current integration uses the Responses API with strict JSON Schema output. Inputs are only:

1. the Firecrawl markdown snapshot,
2. the canonical source URL,
3. candidate facts explicitly typed by the user.

Evidence quotes must be verbatim source substrings and are verified in code before persistence. If no quote verifies, eligibility is downgraded to `needs_info` instead of trusting unsupported model output.

## AgentMail

Current integration uses AgentMail's v0 REST API:

- `POST /v0/inboxes` with stable `client_id` for idempotent inbox creation
- `POST /v0/inboxes/:inbox_id/messages/send` for reminders

Sending is always an explicit user click. The app never auto-emails from analysis. Sends include a deterministic `Idempotency-Key` derived from opportunity + recipient + rendered content so retries of the same logical reminder do not duplicate delivery.
