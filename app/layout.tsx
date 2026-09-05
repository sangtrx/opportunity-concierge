import type { Metadata } from "next";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./styles.css";
export const metadata:Metadata={title:"Opportunity Concierge",description:"Evidence-backed opportunity decisions and deadlines"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><ConvexClientProvider>{children}</ConvexClientProvider></body></html>}
