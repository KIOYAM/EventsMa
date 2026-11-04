# EVENTSMA / FeastFlow — Design & Development Docs

This folder is the source of truth for **what we are building, why, and in what order**.
The existing `FeastFlow_Marketplace_220_Accounts_Client_Portal.html` is a clickable
prototype, not a product. Nothing in this folder is code; it is the design layer we
build from.

**Last updated:** 3 November 2026
**Status:** MVP-1 screens built in labelled demo mode. Design reviewed once (self-review,
not an independent Goldfish review — see the linked report). Blocking next step: a real
Supabase project, so migrations and RLS can execute before any of it is called working.

---

## Read in this order

| # | Document | What it answers |
|---|---|---|
| 00 | [Prototype audit](00-prototype-audit.md) | What the HTML file actually contains, what is real vs mocked, what is reusable, what must be thrown away |
| 01 | [Business model](01-business-model.md) | Who pays, for what, how much, what the unit economics look like, why a caterer switches |
| 02 | [Gaps and client experience](02-gaps-and-client-experience.md) | Every business, product and UX gap found, ranked, with the customer-side friction list |
| 03 | [Ideation and MVP](03-ideation-and-mvp.md) | Three candidate strategies, the chosen wedge, what ships first, what we deliberately do not build |
| 04 | [Architecture, cost and scale](04-architecture-cost-and-scale.md) | Vercel + Supabase free-tier design, the exact limits, the scale ladder, the performance budget, the migration path |
| 05 | [Engineering workflow](05-engineering-workflow.md) | How work flows from idea to production: doc-first EGM loop, environments, review gates, release, rollback |
| 06 | [Product flows](06-product-flows.md) | Step-by-step user and system flows, including the quote state machine and tenancy paths |
| 07 | [Roadmap, metrics, risks](07-roadmap-metrics-risks.md) | Phases with exit criteria, the numbers we track, the risk register, the open questions for real caterers |
| 08 | [Knowledge graph](08-knowledge-graph.md) | Entities, relationships, god nodes and communities across the whole design (graphify method) |
| 09 | [Project setup and skills](09-project-setup-and-skills.md) | What was installed and why, how the Elephant/Goldfish workflow was applied, what was deliberately skipped |
| 10 | [Hosting and infrastructure](10-hosting-and-infrastructure.md) | What Supabase, Vercel and Cloudflare actually cost, what breaks on the free tiers, and the triggers that force the paid jump |
| 11 | [Competitive analysis and gaps](11-competitive-analysis-and-gaps.md) | What the five competitor studies reveal, the gaps they all share, what to adopt now and what to deliberately skip |
| 12 | [Prototype page parity](12-prototype-page-parity.md) | Every prototype page mapped to a built route, a gap, or a deliberate omission, with priority order |
| 13 | [Performance and UX ledger](13-performance-ledger.md) | Which speed practices are implemented, which are gated on infrastructure, the budgets, and the honest gaps |
| 14 | [Deployment runbook](14-deployment-runbook.md) | What is deployed where, the exact failures hit on the way, how to fix each if it returns, and how to prove a deploy works |
| — | [Design review](reviews/2026-10-24-elephant-self-review.md) | Adversarial review of these documents, the 14 findings and how each was resolved |

Per-feature design documents (required before code) live in [`designs/`](designs/README.md).

Original inputs kept untouched at the repository root:

- `FeastFlow_Marketplace_220_Accounts_Client_Portal.html` — the prototype
- `EVENTSMA_catering_SaaS_research_and_proof.md` — prior research and evidence register
- `01…05_*_Reverse_Engineering.md`, `Caterease_Full_Technical_Implementation_Guide.md` — competitor engineering references

---

## Evidence labels used in every document

Every claim is marked so a reader can tell what is proven from what is guessed.

| Label | Meaning |
|---|---|
| **FACT** | Observed directly in the prototype file, the research notes, or an official vendor page. |
| **ASSUMPTION** | Our working belief. Must be tested before money or code is committed to it. |
| **DECISION** | A choice already made for this project. Revisit only with a written reason. |
| **OPEN** | Unresolved. Needs a real caterer, a real invoice, or a real measurement. |

---

## Hard project constraints

**DECISION — disk.** All work stays on `D:\Kannan-Projects\EventsMa`. The `C:` drive is
at 97% capacity and must not be used for caches, installs, temp files or generated
artifacts. See `AGENTS.md` for the environment variables that enforce this.

**DECISION — budget.** Hosting starts at ₹0: Vercel Hobby + Supabase Free. The design
must survive a paid jump of roughly $45/month (Vercel Pro $20 + Supabase Pro $25)
without a rewrite, and must keep working at 10,000 businesses. See
[04](04-architecture-cost-and-scale.md) for the exact triggers that force each jump.

**DECISION — speed is a feature.** The app must feel like Swiggy or Amazon on a mid-range
Android phone on 4G: first meaningful screen under 2 seconds, quote creation under
90 seconds, WhatsApp share in 3 taps. The performance budget is part of the spec, not
polish added later.

**DECISION — no false claims.** Phase 1 does not promise new customers to a caterer
because no real demand marketplace exists yet. Marketing copy must match shipped
function. The prototype's "LIVE" storefront badge is not accurate and is not carried
forward.
