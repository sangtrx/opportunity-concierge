"use client";

import { useEffect, useState } from "react";
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
  const latestThread = useQuery(api.mail.latestThread, { opportunityId: id });
  const setDecision = useMutation(api.opportunities.setDecision);
  const setActionStatus = useMutation(api.actions.setStatus);
  const linkOutboundThread = useMutation(api.mail.linkOutboundThread);
  const sendReminder = useAction(api.mail.sendReminder);
  const [busy, setBusy] = useState(false);
  const [outboundId, setOutboundId] = useState<string | null>(null);
  const activeOutboundId = outboundId ?? latestThread?.outboundId ?? null;
  const sendStatus = useQuery(
    api.mail.sendStatus,
    activeOutboundId ? { outboundId: activeOutboundId } : "skip",
  );
  const threadId = sendStatus?.threadId ?? latestThread?.threadId ?? null;
  const replyState = useQuery(
    api.mail.replyState,
    activeOutboundId ? { opportunityId: id, outboundId: activeOutboundId } : "skip",
  );
  const followUpDraft = useQuery(
    api.mail.followUpDraft,
    activeOutboundId && replyState?.status === "reply_received"
      ? { opportunityId: id, outboundId: activeOutboundId }
      : "skip",
  );

  useEffect(() => {
    if (!activeOutboundId || !threadId) return;
    void linkOutboundThread({ opportunityId: id, outboundId: activeOutboundId, threadId }).catch(() => {
      // The webhook callback can establish the same link first; this sync is best-effort.
    });
  }, [activeOutboundId, id, linkOutboundThread, threadId]);

  if (detail === undefined) return <article className="empty">Loading opportunity…</article>;
  if (detail === null) return null;

  const { opportunity, evidence, actions, decisions } = detail;
  const latestDecision = decisions[0];
  const timeline = [
    ...(opportunity.deadlineAt
      ? [{ key: "opportunity-deadline", label: "Opportunity deadline", dueAt: opportunity.deadlineAt }]
      : []),
    ...actions.flatMap((item) =>
      item.dueAt !== undefined && item.status !== "done" && item.status !== "skipped"
        ? [{ key: String(item._id), label: item.title, dueAt: item.dueAt }]
        : [],
    ),
  ].sort((a, b) => a.dueAt - b.dueAt).slice(0, 6);

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

      {timeline.length > 0 && (
        <section className="actionsBlock">
          <div className="sectionLabel">Deadline timeline</div>
          {timeline.map((item) => (
            <div className="lastDecision" key={item.key}>
              {new Date(item.dueAt).toLocaleDateString()} · {item.label}
            </div>
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
      {activeOutboundId && (
        <div className="lastDecision">AgentMail delivery · {sendStatus?.status ?? latestThread?.status ?? "queued"}</div>
      )}
      {activeOutboundId && (
        <div className="lastDecision">
          AgentMail inbox · {replyState === undefined
            ? "syncing"
            : replyState?.status === "reply_received"
              ? "reply received"
              : "waiting for reply"}
        </div>
      )}
      {followUpDraft && (
        <section className="evidenceBlock">
          <div className="sectionLabel">Follow-up draft · review before sending</div>
          <blockquote>
            <b>{followUpDraft.subject}</b>
            <span style={{ whiteSpace: "pre-wrap" }}>{followUpDraft.text}</span>
            <small>No email is sent automatically.</small>
          </blockquote>
        </section>
      )}
    </article>
  );
}
