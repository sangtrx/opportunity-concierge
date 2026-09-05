import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({ args:{ opportunityId:v.id("opportunities"), title:v.string(), dueAt:v.optional(v.number()) }, handler:async(ctx,args)=>{
  if(!args.title.trim()) throw new Error("Action title is required");
  const now=Date.now(); return ctx.db.insert("actions",{...args,title:args.title.trim(),status:"todo",source:"user",createdAt:now,updatedAt:now});
}});
export const setStatus = mutation({ args:{ id:v.id("actions"), status:v.union(v.literal("todo"),v.literal("doing"),v.literal("done"),v.literal("skipped")) }, handler:async(ctx,args)=>{
  const row=await ctx.db.get(args.id); if(!row) throw new Error("Action not found"); await ctx.db.patch(args.id,{status:args.status,updatedAt:Date.now()});
}});
