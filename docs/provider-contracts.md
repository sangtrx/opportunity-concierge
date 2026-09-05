# Provider contracts

## Firecrawl
Runtime responsibility: fetch the official source page and return markdown + metadata. Store the raw snapshot and content hash before model extraction. No eligibility claim may rely only on an LLM summary.

## OpenAI
Runtime responsibility: extract structured fields from the stored source snapshot and produce an eligibility assessment with `eligible | ineligible | needs_info`, explicit missing facts, and evidence references. The model must not invent user facts.

## AgentMail
Runtime responsibility: provide a real inbox/reminder/follow-up loop. Message sending remains an explicit user action outside a clearly labeled sandbox demo.

Exact SDK calls are deliberately deferred until credentials are available and the current provider docs are verified; placeholder network calls would hurt hackathon reliability.
