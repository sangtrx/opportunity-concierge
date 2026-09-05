"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function factsFromText(value:string){
  return value.split(/\n|;/).map(x=>x.trim()).filter(Boolean).slice(0,40);
}

export default function Page(){
  const items=useQuery(api.opportunities.list);
  const create=useMutation(api.opportunities.create);
  const analyze=useAction(api.ingest.analyze);
  const sendReminder=useAction(api.mail.sendReminder);
  const [url,setUrl]=useState("");
  const [facts,setFacts]=useState("");
  const [email,setEmail]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("Paste an official opportunity URL. Leave facts blank if you want the system to tell you what it still needs to know.");

  async function submit(e:FormEvent){
    e.preventDefault(); setBusy(true); setMessage("Capturing the official source with Firecrawl…");
    try{
      const id=await create({sourceUrl:url,kind:"hackathon"});
      const result=await analyze({opportunityId:id,candidateFacts:factsFromText(facts)});
      setUrl(""); setMessage(`Analysis complete · ${result.eligibility} · ${result.evidenceCount} verified evidence quote(s).`);
    }catch(error){ setMessage(error instanceof Error ? error.message : "Analysis failed"); }
    finally{setBusy(false)}
  }

  async function emailReminder(id:Id<"opportunities">){
    if(!email.trim()){setMessage("Enter your email before sending a reminder.");return;}
    setBusy(true); setMessage("Sending via AgentMail…");
    try{const sent=await sendReminder({opportunityId:id,to:email.trim()});setMessage(`Reminder sent via AgentMail · ${sent.messageId ?? "message accepted"}.`)}
    catch(error){setMessage(error instanceof Error ? error.message : "Email failed")}
    finally{setBusy(false)}
  }

  return <main className="shell">
    <header><div className="kicker">ALL GAS · OPPORTUNITY CONCIERGE</div><h1>Know what is worth chasing.</h1><p>Firecrawl captures the official source. OpenAI reasons over your explicit facts. Convex keeps the decision live. AgentMail sends the next action.</p></header>
    <form onSubmit={submit} className="captureStack">
      <div className="capture"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste an official hackathon, grant, scholarship or job URL"/><button disabled={busy||!url.trim()}>{busy?'Working…':'Analyze'}</button></div>
      <textarea value={facts} onChange={e=>setFacts(e.target.value)} placeholder={'Your facts, one per line. Example:\nResident of Vietnam\nAI engineer\nSolo participant'} />
      <div className="mailRow"><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email for explicit AgentMail reminders"/><span>No email is sent automatically.</span></div>
    </form>
    <div className="statusline">{message}</div>
    <section className="grid">{items===undefined?<div className="empty">Loading live state…</div>:items.length===0?<div className="empty">No opportunities yet.</div>:items.map(x=><article key={x._id}>
      <div className="top"><span>{x.kind}</span><strong>{x.eligibility.replace('_',' ')}</strong></div>
      <h2>{x.title||new URL(x.sourceUrl).hostname}</h2><a href={x.sourceUrl} target="_blank" rel="noreferrer">{x.sourceUrl}</a>
      <p className="reason">{x.eligibilityReason||"Not analyzed yet."}</p>
      <div className="meta"><span>Status · {x.status}</span><span>Priority · {x.priorityScore}</span></div>
      {x.deadlineAt&&<div className="deadline">Deadline · {new Date(x.deadlineAt).toLocaleDateString()}</div>}
      {x.missingFacts.length>0&&<div className="missing">Needs: {x.missingFacts.join(', ')}</div>}
      <button className="secondary" disabled={busy} onClick={()=>emailReminder(x._id)}>Email reminder</button>
    </article>)}</section>
  </main>
}
