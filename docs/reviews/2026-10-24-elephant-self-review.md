# Review — 24 October 2026

**Target:** `docs/00` – `docs/09` as drafted on 24 October 2026.
**Mode:** consolidated report, three lenses (comprehension, critique, implementation
readiness).

## Process limitation (read this first)

The Elephant/Goldfish protocol requires reviewers with **fresh context** that have not
seen the drafting conversation. The available subagent in this environment is a
web-research agent that cannot read local files, so independent Goldfish review was not
possible. This report is a **structured self-review by the author**, using the same
three lenses and the same rules (critique first, no flattery, generate the strongest
counter-argument). It is weaker evidence than an independent review and must not be
described as one.

To close the gap, run `/egm-review docs/04-architecture-cost-and-scale.md` in a harness
that can spawn file-reading subagents, then `/egm-resolve`. Until that happens, treat
the design as reviewed-once, not validated.

---

## Lens 1 — Comprehension

**Test:** could a new reader explain the plan, including what happens on failure,
without asking a question?

| # | Finding | Result |
|---|---|---|
| C1 | The documents answered "what to build" but were ambiguous about **who operates it** in the first 90 days | **Fixed** — Phase 0 defines the founder-led validation loop and the weekly cadence in [05 §10](../05-engineering-workflow.md) |
| C2 | "Phase 1" meant both "the product phase" and "the business phase" in different documents | **Fixed** — the docs now use Phase 0–4 consistently, and the product scope is named MVP-1/MVP-2 |
| C3 | A reader could not tell which claims were measured | **Fixed** — every document carries FACT / ASSUMPTION / DECISION / OPEN labels; market figures carry their source and caveat |
| C4 | The failure behaviour of the quote flow was described, but not payment reconciliation | **Fixed** — added late-webhook and duplicate-payment handling in [06 §4.5](../06-product-flows.md) |

---

## Lens 2 — Critique (the material findings)

| # | Severity | Finding | Resolution |
|---|---|---|---|
| **F1** | 🔴 Blocker | **The free tier was self-defeating.** 10 quotes/month covers most target caterers' entire usage, and the margin view — the only real differentiator — was in the free plan. A working caterer could stay free forever. | Cut Free to 5 quotes/month and moved the **margin view** to Growth. Written rationale in [01 §6](../01-business-model.md). Re-test on the fifth quote: if users do not upgrade, the limit is wrong, not the price. |
| **F2** | 🔴 Blocker | **"₹0 production" was false.** Supabase Free pauses after 7 days of inactivity and has **no backups**. A paying customer's quotation history cannot live there. | Split the ladder: Stage 0 is build/demo/design partners only; the paid step happens at the **first paying customer** (≈₹5,500/month). Added the inactivity trigger and pre-launch cash prerequisites in [04 §5](../04-architecture-cost-and-scale.md). |
| **F3** | 🔴 Blocker | **Phone OTP contradicted the budget.** Customer acceptance and employee sign-in used SMS one-time codes, which require a paid vendor and KYC. | Replaced with email one-time codes and manager-issued magic links for MVP; phone OTP deferred. [06 §4.5, §8](../06-product-flows.md). |
| **F4** | 🟡 Major | **Quotation versioning was internally inconsistent.** The schema had `quotations.version` and `snapshot_json`, while the flows described immutable versions and a "current version". | Split into `quotations` (identity, status) and `quotation_versions` (immutable snapshot, totals, hash, sent_at). [04 §3.1](../04-architecture-cost-and-scale.md). |
| **F5** | 🟡 Major | **`availability_blocks.capacity_used` was a stored counter**, which will drift the first time an event is cancelled or moved. | Changed to a status-only row; capacity is derived by counting events per date. |
| **F6** | 🟡 Major | **Tables described in the flows had no schema**: notifications, review verification tokens. Reviews were "verified" with nothing to verify against. | Added `notifications` and `review_tokens`; reviews now require a token tied to a completed event. |
| **F7** | 🟡 Major | **`wa.me` messages truncate.** The plan to pre-fill a full quote summary would have produced a broken share. | Share message limited to ~600 characters (client, guests, total, validity) with the full quote behind the link. [06 §4.4](../06-product-flows.md). |
| **F8** | 🟡 Major | **The 8-week MVP was optimistic for one developer.** Auth + RLS + pricing + composer + PDF + payments + public page + dashboard is closer to 11–13 weeks. | Added a de-risked build sequence and named what to cut first (public page and enquiry delivery), while protecting tenancy and pricing tests. [03 §4](../03-ideation-and-mvp.md). |
| **F9** | 🟡 Major | **Implementation readiness was incomplete.** A developer could not start: no route list, no column types, no error codes, no acceptance fixtures. | Acceptable for a design phase, but recorded as a gate: `docs/designs/` must specify routes, columns, states and error codes per feature before code. [05 §2, §9](../05-engineering-workflow.md). |
| **F10** | 🟢 Nit | **RLS policy example lacked role enforcement detail** and the `has_role` function was referenced but never defined. | `has_role` is now named as part of the policy contract; define it alongside `is_org_member` in the first migration. |
| **F11** | 🟢 Nit | **Search plan stopped at "Postgres full-text".** No geospatial plan despite "near me" being a likely customer need. | Added to the scale path: bounding-box query first, PostGIS only when distance ranking is proven necessary. |
| **F12** | 🟢 Nit | **`.gitignore` duplicated `.vercel/` and left gaps** around `.next`, `.cache`, env variants. | Cleaned up. |
| **F13** | 🟢 Nit | **Skill documentation claimed an installed skill that was not installed** (`react-best-practices`). | Marked as deferred until the first React milestone; the table now separates installed from deferred. |
| **F14** | 🟡 Major | **`edc` could not be identified.** Three unrelated candidates surfaced, one of which installs hooks that alter agent behaviour. | Not installed. Recorded as an open question in [09 §4](../09-project-setup-and-skills.md) rather than guessing. |

---

## Lens 3 — Implementation readiness

**Verdict:** ready for Phase 0 validation and schema design; **not** ready for code on
the quote flow, because the per-screen contracts do not exist yet.

What is ready:

- Stack, hosting, region, cost model and scale triggers.
- Tenancy model, RLS shape, table list, money rules.
- MVP scope, build sequence, cut lines, kill criteria.
- Performance budgets and the tests that enforce them.
- Release, rollback and incident flow.

What must be produced before the first line of quote code:

1. `docs/designs/quote-composer.md` — route, component tree, draft payload, server
   validation, error codes, keyboard behaviour, offline queue semantics.
2. `docs/designs/tenancy.md` — every policy, the two-tenant test matrix, the service-role
   boundary.
3. `docs/designs/payments.md` — gateway objects, webhook state machine, receipt, refund
   and reconciliation runbook.
4. A fixture set: one real (redacted) catering quote with 12 lines, tax, transport and
   deposit, used by unit, integration and E2E tests.

---

## Strongest counter-argument to the whole plan

**"You are building a better quote form for people who will not pay ₹499, in a market
where two competitors give the form away and one gives the whole ERP away for ₹8,000 a
year."**

This is the argument most likely to be right. It is not refuted by anything in these
documents, only by evidence: five caterers, one watched quote each, three who pay. That
is why Phase 0 exists and why the kill criteria in [03 §6](../03-ideation-and-mvp.md)
are written down before the code.

The second-strongest: **"The prototype already has 20 verticals and a marketplace; why
shrink?"** Because breadth without delivery is a demo, and the marketplace has no real
supply. Depth in catering is the only path to a second feature anyone pays for.

---

## Residual risks accepted

| Risk | Why accepted | Review date |
|---|---|---|
| Vercel Hobby commercial-use rule unverified | Page could not be fetched; budgeted Pro at first revenue anyway | First paying customer |
| Market-size estimates unreconciled | Not used in any decision; bottom-up counts replace them | Phase 0 |
| Graph built by hand, not by graphify CLI | No code to analyse; CLI would install to `C:` | First code milestone |
| No independent Goldfish review | No file-reading subagent available | Before Phase 1 code |
