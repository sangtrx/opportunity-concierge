"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function OpportunityCard({
  id,
  email,
  onMessage,
}: {
  id: Id<"opportunities">;
  email: string;
  onMessage: (message: string) => void;
}) {
  const detail = useQuery(api.opportunities.get, { id });
  const setDecision = useMutation(api.opportunities.setDecision);
  const setActionStatus = useMutation(api.actions.setStatus);
  const sendReminder = useAction(api.mail.sendReminder);
  const [busy, setBusy] = useState(false);
  const [outboundId, setOutboundId] = useState<string | null>(null);
  const sendStatus = useQuery(api.mail.sendStatus, outboundId ? { outboundId } : "skip");
  const threadId = sendStatus?.threadId ?? null;
  const inboundMessages = useQuery(api.mail.threadMessages, threadId ? { threadId } : "skip");

  if (detail === undefined) return <article className="empty">Loading opportunity…</article>;
  if (detail === null) return null;

  const { opportunity, evidence, actions, decisions } = detail;
  const latestDecision = decisions[0];

  async function decide(decision: "pursue" | "skip" | "needs_info") {
    setBusy(true);
    try {
      await setDecision({
        id,
        decision,
        rationale: `User selected ${decision.replace("_", " ")} from the realtime dashboard.`,
      });
      onMessage(`Decision saved · ${decision.replace("_", " ")}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAction(actionId: Id<"actions">, current: string) {
    setBusy(true);
    try {
      await setActionStatus({ id: actionId, status: current === "done" ? "todo" : "done" });
      onMessage("Action updated in Convex.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Action update failed");
    } finally {
      setBusy(false);
    }
  }

  async function remind() {
    if (!email.trim()) {
      onMessage("Enter an email above before sending a reminder.");
      return;
    }
    setBusy(true);
    try {
      const sent = await sendReminder({ opportunityId: id, to: email.trim() });
      setOutboundId(sent.outboundId);
      onMessage("Reminder queued through the AgentMail Convex component. Delivery and reply state are live below.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Email failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article>
      <div className="top">
        <span>{opportunity.kind}</span>
        <strong>{opportunity.eligibility.replace("_", " ")}</strong>
      </div>
      <h2>{opportunity.title || new URL(opportunity.sourceUrl).hostname}</h2>
      <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer">{opportunity.sourceUrl}</a>
      <p className="reason">{opportunity.eligibilityReason || "Not analyzed yet."}</p>

      <div className="meta">
        <span>Status · {opportunity.status}</span>
        <span>Priority · {opportunity.priorityScore}</span>
      </div>
      {opportunity.deadlineAt && <div className="deadline">Deadline · {new Date(opportunity.deadlineAt).toLocaleDateString()}</div>}
      {opportunity.missingFacts.length > 0 && <div className="missing">Needs: {opportunity.missingFacts.join(", ")}</div>}

      {evidence.length > 0 && (
        <section className="evidenceBlock">
          <div className="sectionLabel">Verified source evidence</div>
          {evidence.slice(0, 3).map((item) => (
            <blockquote key={item._id}>
              <b>{item.field}</b>
              <span>“{item.quote}”</span>
              <small>{item.supports}</small>
            </blockquote>
          ))}
        </section>
      )}

      {actions.length > 0 && (
        <section className="actionsBlock">
          <div className="sectionLabel">Next actions</div>
          {actions.slice(0, 6).map((item) => (
            <button
              type="button"
              className={`actionItem ${item.status === "done" ? "done" : ""}`}
              key={item._id}
              disabled={busy}
              onClick={() => toggleAction(item._id, item.status)}
            >
              <span>{item.status === "done" ? "✓" : "○"}</span>
              <span>{item.title}</span>
              {item.dueAt && <small>{new Date(item.dueAt).toLocaleDateString()}</small>}
            </button>
          ))}
        </section>
      )}

      <section className="decisionRow">
        <button type="button" disabled={busy} onClick={() => decide("pursue")}>Pursue</button>
        <button type="button" disabled={busy} onClick={() => decide("needs_info")}>Need info</button>
        <button type="button" disabled={busy} onClick={() => decide("skip")}>Skip</button>
      </section>
      {latestDecision && <div className="lastDecision">Latest decision · {latestDecision.decision.replace("_", " ")}</div>}
      <button type="button" className="secondary" disabled={busy} onClick={remind}>Email reminder</button>
      {outboundId && (
        <div className="lastDecision">AgentMail delivery · {sendStatus?.status ?? "queued"}</div>
      )}
      {threadId && (
        <div className="lastDecision">
          AgentMail inbox · {inboundMessages === undefined
            ? "syncing"
            : inboundMessages.length > 0
              ? `${inboundMessages.length} inbound repl${inboundMessages.length === 1 ? "y" : "ies"}`
              : "waiting for reply"}
        </div>
      )}
    </article>
  );
}
