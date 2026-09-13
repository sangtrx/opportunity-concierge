"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CallState = {
  callId: string;
  status: string;
  structuredResult?: Record<string, unknown> | null;
  summary?: string | null;
  evidence?: string[];
  failureMessage?: string | null;
};

const terminal = new Set(["completed", "failed", "canceled"]);

export default function CallEClarifierPage() {
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [consent, setConsent] = useState(false);
  const [call, setCall] = useState<CallState | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const done = useMemo(() => (call ? terminal.has(call.status) : false), [call]);

  useEffect(() => {
    if (!call?.callId || done) return;

    let cancelled = false;
    const poll = async () => {
      const response = await fetch(`/api/call-e/status/${encodeURIComponent(call.callId)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as CallState & { error?: string };
      if (cancelled) return;
      if (!response.ok) {
        setError(data.error ?? "Unable to read call status.");
        return;
      }
      setCall(data);
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [call?.callId, done]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStarting(true);
    setError("");
    setCall(null);

    try {
      const response = await fetch("/api/call-e/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          organization,
          question,
          context,
          consent,
          requestId: crypto.randomUUID(),
        }),
      });
      const data = (await response.json()) as CallState & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to start CALL-E call.");
      setCall(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start CALL-E call.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#071019", color: "#f7fbff", padding: "48px 20px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <p style={{ color: "#79e3ff", letterSpacing: ".12em", textTransform: "uppercase", fontSize: 12 }}>
          Opportunity Concierge × CALL-E
        </p>
        <h1 style={{ fontSize: "clamp(38px, 8vw, 76px)", lineHeight: .95, margin: "12px 0 20px" }}>
          Resolve one ambiguity with one real phone call.
        </h1>
        <p style={{ color: "#a8bac9", maxWidth: 680, fontSize: 18, lineHeight: 1.6 }}>
          Give the agent one authorized recipient and one concrete deadline or eligibility question. CALL-E calls, stays on scope, and returns structured evidence plus the next action.
        </p>

        <form onSubmit={submit} style={{ marginTop: 36, display: "grid", gap: 18, border: "1px solid #244154", padding: 24, borderRadius: 18, background: "#0b1722" }}>
          <label>Organization<input required value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Hackathon organizer" style={inputStyle} /></label>
          <label>Recipient phone (E.164)<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+14155550100" style={inputStyle} /></label>
          <label>Single clarification question<textarea required value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Is the submission deadline inclusive of 11:45 PM SGT on Sep 14?" rows={4} style={inputStyle} /></label>
          <label>Optional non-sensitive context<textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Public event name, published rule wording, application reference without secrets…" rows={4} style={inputStyle} /></label>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#cbd8e2" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 4 }} />
            I am authorized to place this call and understand it is a real external phone call.
          </label>
          <button disabled={!consent || starting} style={{ border: 0, borderRadius: 999, padding: "14px 20px", fontWeight: 700, background: consent ? "#79e3ff" : "#28404f", color: "#03111b", cursor: consent ? "pointer" : "not-allowed" }}>
            {starting ? "Starting…" : "Start clarification call"}
          </button>
        </form>

        {error && <p style={{ marginTop: 20, color: "#ffb4b4" }}>{error}</p>}
        {call && (
          <section style={{ marginTop: 28, borderTop: "1px solid #244154", paddingTop: 24 }}>
            <p><strong>Status:</strong> {call.status}</p>
            <p style={{ color: "#8ea4b5" }}><strong>Call ID:</strong> {call.callId}</p>
            {call.summary && <p><strong>Summary:</strong> {call.summary}</p>}
            {call.structuredResult && <pre style={{ whiteSpace: "pre-wrap", background: "#030b10", padding: 18, borderRadius: 12, overflowX: "auto" }}>{JSON.stringify(call.structuredResult, null, 2)}</pre>}
            {!!call.evidence?.length && <div><strong>Evidence</strong><ul>{call.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div>}
            {call.failureMessage && <p style={{ color: "#ffb4b4" }}>{call.failureMessage}</p>}
          </section>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: 8,
  borderRadius: 10,
  border: "1px solid #315064",
  background: "#071019",
  color: "#f7fbff",
  padding: "12px 14px",
  font: "inherit",
  boxSizing: "border-box" as const,
};
