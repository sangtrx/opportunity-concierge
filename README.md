# Opportunity Concierge

A realtime opportunity inbox for hackathons, grants, scholarships, and jobs. Paste an official opportunity URL, preserve source evidence, evaluate eligibility without inventing missing user facts, and turn the result into concrete next actions.

Built for the Convex All Gas Hackathon. Convex is the canonical realtime backend; Firecrawl, OpenAI, and AgentMail are intentionally separated behind explicit provider contracts so each integration can be verified before activation.

## First local gate

```bash
npm install
npx convex dev
npm run build
```

Then configure provider credentials locally using `.env.example`. Never commit secrets.
