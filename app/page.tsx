"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OpportunityCard } from "./OpportunityCard";

type OpportunityKind = "hackathon" | "grant" | "scholarship" | "job" | "other";

function factsFromText(value: string) {
  return value.split(/\n|;/).map((x) => x.trim()).filter(Boolean).slice(0, 40);
}

export default function Page() {
  const items = useQuery(api.opportunities.list);
  const create = useMutation(api.opportunities.create);
  const analyze = useAction(api.ingest.analyze);
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<OpportunityKind>("hackathon");
  const [facts, setFacts] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Paste an official opportunity URL. Leave facts blank if you want the system to tell you what it still needs to know.");
  const prioritizedItems = items
    ? [...items].sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        const aDeadline = a.deadlineAt ?? Number.MAX_SAFE_INTEGER;
        const bDeadline = b.deadlineAt ?? Number.MAX_SAFE_INTEGER;
        if (aDeadline !== bDeadline) return aDeadline - bDeadline;
        return b.updatedAt - a.updatedAt;
      })
    : items;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("Capturing the official source with Firecrawl…");
    try {
      const id = await create({ sourceUrl: url, kind });
      const result = await analyze({ opportunityId: id, candidateFacts: factsFromText(facts) });
      setUrl("");
      setMessage(`Analysis complete · ${result.eligibility} · ${result.evidenceCount} verified evidence quote(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header>
        <div className="kicker">ALL GAS · OPPORTUNITY CONCIERGE</div>
        <h1>Know what is worth chasing.</h1>
        <p>Firecrawl captures the official source. OpenAI reasons over your explicit facts. Convex keeps evidence, actions and decisions live. AgentMail sends the next action.</p>
      </header>
      <form onSubmit={submit} className="captureStack">
        <div className="capture">
          <select value={kind} onChange={(e) => setKind(e.target.value as OpportunityKind)} aria-label="Opportunity type">
            <option value="hackathon">Hackathon</option>
            <option value="grant">Grant</option>
            <option value="scholarship">Scholarship</option>
            <option value="job">Job</option>
            <option value="other">Other</option>
          </select>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste an official opportunity URL" />
          <button disabled={busy || !url.trim()}>{busy ? "Working…" : "Analyze"}</button>
        </div>
        <textarea value={facts} onChange={(e) => setFacts(e.target.value)} placeholder={'Your facts, one per line. Example:\nResident of Vietnam\nAI engineer\nSolo participant'} />
        <div className="mailRow">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for explicit AgentMail reminders" />
          <span>No email is sent automatically.</span>
        </div>
      </form>
      <div className="statusline">{message}</div>
      <section className="grid">
        {prioritizedItems === undefined ? (
          <div className="empty">Loading live state…</div>
        ) : prioritizedItems.length === 0 ? (
          <div className="empty">No opportunities yet.</div>
        ) : (
          prioritizedItems.map((item) => <OpportunityCard key={item._id} id={item._id} email={email} onMessage={setMessage} />)
        )}
      </section>
    </main>
  );
}
