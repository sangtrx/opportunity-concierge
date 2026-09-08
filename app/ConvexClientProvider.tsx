"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const DEFAULT_CONVEX_URL = "https://valiant-crab-246.convex.cloud";
const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim() || DEFAULT_CONVEX_URL;
const client = new ConvexReactClient(url);

export function ConvexClientProvider({children}:{children:ReactNode}){
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
