"use client";
import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
export default function Page(){
  const items=useQuery(api.opportunities.list); const create=useMutation(api.opportunities.create); const [url,setUrl]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{await create({sourceUrl:url,kind:"hackathon"});setUrl("")}finally{setBusy(false)}}
  return <main className="shell"><header><div className="kicker">ALL GAS · OPPORTUNITY CONCIERGE</div><h1>Know what is worth chasing.</h1><p>Evidence-backed eligibility, deadlines and next actions — live in Convex.</p></header><form onSubmit={submit} className="capture"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste an official hackathon, grant, scholarship or job URL"/><button disabled={busy}>{busy?'Adding…':'Add opportunity'}</button></form><section className="grid">{items===undefined?<div className="empty">Loading live state…</div>:items.length===0?<div className="empty">No opportunities yet.</div>:items.map(x=><article key={x._id}><div className="top"><span>{x.kind}</span><strong>{x.eligibility.replace('_',' ')}</strong></div><h2>{x.title||new URL(x.sourceUrl).hostname}</h2><a href={x.sourceUrl} target="_blank">{x.sourceUrl}</a><div className="meta"><span>Status · {x.status}</span><span>Priority · {x.priorityScore}</span></div>{x.missingFacts.length>0&&<div className="missing">Needs: {x.missingFacts.join(', ')}</div>}</article>)}</section></main>
}
