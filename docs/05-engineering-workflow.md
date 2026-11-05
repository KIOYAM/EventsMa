# 05 — Engineering Workflow

How a change travels from an idea to production, and what must be true at each gate.
This is the process document; product behaviour is in [06](06-product-flows.md).

**Governing rule:** design first, in writing, then build once. AI-assisted development
makes typing cheap and mistakes expensive; the written design is the artifact that
survives.

---

## 1. The loop, in one picture

```
 Idea / complaint
      │
      ▼
 [1] Frame ──────────► one-paragraph problem + who it hurts + evidence
      │
      ▼
 [2] Elephant (design) ─► docs/designs/<feature>.md  (no code in this phase)
      │                    problem, options, decision, data change, failure modes
      ▼
 [3] Goldfish (review) ─► fresh-context reviewers attack the doc
      │                    comprehension → critique → implementation readiness
      ▼
 [4] Slice ─────────────► smallest vertical slice with acceptance tests
      │
      ▼
 [5] Build ─────────────► migrations + API + UI + tests in one PR
      │
      ▼
 [6] Verify ────────────► types, lint, unit, RLS, e2e, performance, a11y
      │
      ▼
 [7] Preview ───────────► deploy preview + smoke script on a real phone
      │
      ▼
 [8] Release ───────────► production, monitor 30 minutes, announce
      │
      ▼
 [9] Learn ─────────────► metric changed? keep, iterate or revert
```

Steps 2 and 3 are the Elephant/Goldfish Model. The skills are installed in
`.agents/skills/egm-*`; the working rule is simple: **the person who designs the
change does not get to be its only reviewer.**

---

## 2. Feature design document (Step 2)

Every feature larger than a bug fix gets a file at `docs/designs/<slug>.md` using the
template in section 9. It must fit on two screens. If it does not, the feature is too
big.

The design document must contain:

1. **Problem** — the user, the moment, the cost today.
2. **Evidence** — a customer quote, a support ticket, a measurement, or an explicit
   "ASSUMPTION".
3. **Options considered** — at least two, including "do nothing".
4. **Decision and reason** — one paragraph, no hedging.
5. **Data change** — tables, columns, indexes, migration and rollback.
6. **Server authority** — which numbers are computed where.
7. **Failure modes** — offline, duplicate submit, permission denied, empty state,
   large input, slow network, concurrent edit.
8. **Performance impact** — which budget in [04 §4.1](04-architecture-cost-and-scale.md)
   could this break, and how it is measured.
9. **Acceptance tests** — the exact checks that prove it works.
10. **Out of scope** — what this deliberately does not do.

**No code in the design phase.** Not a sketch of a component, not a "quick prototype".
The prototype we already have is the reason for that rule: attractive screens with no
model underneath.

---

## 3. Goldfish review (Step 3)

Three reviewers, spawned with fresh context, each given only the design document and
the repository — never the conversation that produced it.

| Reviewer | Question it must answer | Failure if it cannot |
|---|---|---|
| **Comprehension** | Explain the feature back, including what happens on failure | Document is ambiguous; return to Step 2 |
| **Critic** | Where does this break? Edge cases, hidden dependencies, data risk, cost | Findings are triaged into the doc or explicitly accepted as trade-offs |
| **Readiness** | Can a developer implement this without asking a question? Are tables, columns, routes and states named? | Not ready; return to Step 2 |

Rules for the review, copied from the EGM constraints because they are right:

- No flattery, no "great idea". Lead with what is wrong.
- Generate the strongest counter-argument to the chosen option.
- A review in the same context is not a review.

For small changes (copy, spacing, a single query fix) a peer read of the diff is
enough. For anything touching money, auth, tenancy, deletion or migrations, the full
three-reviewer pass is mandatory.

---

## 4. Repository layout

```
app/
  (marketing)/                 public marketing pages, static
  (auth)/login, signup, verify, reset
  (app)/                       authenticated shell
    dashboard/
    quotes/[id]/
    quotes/new/
    clients/
    events/[id]/
    menus/
    payments/
    settings/
  p/[slug]/                    public provider page (ISR)
  q/[token]/                   public quote view (signed, cached briefly)
  api/                         route handlers only; no UI
components/
  ui/                          shadcn primitives
  quote/                       composer, line editor, totals
  charts/                      lazy-loaded
lib/
  db/                          schema, queries, migrations runner
  domain/                      pricing, tax, margin, dates, money
  auth/                        session helpers, guards
  integrations/                resend, whatsapp links, maps (no payment gateway)
  validation/                  zod schemas shared by client and server
db/
  migrations/                  numbered SQL, forward-only with down notes
  policies/                    RLS policies, reviewed as code
  seeds/                       dev fixtures, never production
tests/
  unit/                        pricing, tax, date, permission logic
  integration/                 route handlers against the dev database
  rls/                         two-tenant isolation suite
  e2e/                         Playwright on preview deployments
docs/                          this folder + designs/
```

**Rules**

- `app/api` contains no business logic beyond parsing, authorising and delegating.
- Pricing and tax live in `lib/domain` as pure functions with no database access, so
  they can be unit-tested exhaustively and reused by the PDF renderer.
- Every table has a migration; no manual SQL in production, ever.
- No file in the repo may exceed 400 lines. The prototype's 6,000-character lines are
  the anti-pattern.

---

## 5. Environments and promotion

| Environment | Database | Purpose | Data |
|---|---|---|---|
| Local | `eventsma-dev` Supabase project (or branch) | Development | Fake fixtures only |
| Preview | `eventsma-dev` (shared) or a per-PR branch if available | Review each PR | Fake fixtures |
| Production | `eventsma-prod` | Customers | Real, backed up |

**Why no local Docker:** Docker stores images on `C:`, which must not be used. The
development database is a cloud project. This means migrations must be safe to run
repeatedly and CI must catch drift.

**Migration flow**

1. Write `db/migrations/NNNN_description.sql` with a forward change and a written
   rollback plan in the header.
2. Apply to `eventsma-dev` and run the full test suite.
3. Preview deployment applies the same migration to its database.
4. Production applies automatically on merge, **before** the new code serves traffic.
5. Migrations must be backward compatible for one release (add columns nullable, back
   fill, then enforce) so a rollback of code does not require a rollback of data.

**Secrets** live in Vercel/Supabase environment settings, never in the repo, never in
the client bundle. `.env.example` documents names only.

---

## 6. Definition of Ready and Done

### Ready (before a ticket enters a sprint)

- Design document exists and survived Goldfish review, or the change is a trivial fix.
- Acceptance test is written in plain language.
- The data change and rollback are known.
- The screen has an empty, loading, error and permission-denied state described.
- The performance budget impact is named.

### Done (before merge)

- Types and lint clean; no suppressions added to silence a real problem.
- Unit tests for pricing/tax/permissions; integration test for the route.
- Two-tenant RLS test still passes.
- E2E covers the happy path on a 390×844 viewport.
- Accessibility: keyboard reachable, labelled inputs, contrast ≥ 4.5:1 for body text,
  no text below 12 px.
- Performance: route JS within budget; no new query above p95 50 ms on fixture data.
- Error states verified by forcing failure, not assumed.
- Docs updated: product flow, changelog entry, and any decision recorded.

### Done (before release)

- Preview deployed and smoke-tested on a real phone.
- Migration applied cleanly to the preview database.
- Feature flag exists if the change is risky or user-visible.
- Rollback command written in the release notes.

---

## 7. Testing strategy

| Layer | What it covers | Tool | Gate |
|---|---|---|---|
| Unit | Money, tax, margin, date math, state machines, validation | Vitest | Every PR, < 10 s |
| Integration | Route handlers, auth, permissions, webhooks | Vitest + dev DB | Every PR |
| RLS | Cross-tenant read/write attempts on every table | SQL test harness | Every PR (blocking) |
| E2E | Signup → menu → quote → send → accept → pay | Playwright | Every PR on preview |
| Performance | Web Vitals on preview, quote screen timing | Lighthouse CI / Speed Insights | Every release |
| Accessibility | Axe on key routes | Playwright + axe | Every PR |
| Restore | Quarterly restore drill | Script + checklist | Quarterly |

**The pricing engine gets property-based tests**: random line combinations must always
satisfy `subtotal + tax = total`, totals must be monotonic when a positive line is
added, and no rounding path may produce a negative total.

---

## 8. Release, rollback and incidents

**Release**

1. Merge to `main` after review.
2. CI builds, runs tests, applies migrations, deploys.
3. Smoke script: sign in, open dashboard, create a draft quote, export CSV, open a
   public profile, hit `/api/health`.
4. Watch error rate and p95 latency for 30 minutes.
5. Announce in the team channel; note the version.

**Rollback**

- Code: promote the previous deployment (Vercel instant rollback).
- Data: migrations are backward compatible, so code rollback is safe. Destructive data
  changes require a snapshot first.
- Feature: flip the flag off. Every risky feature ships behind one.

**Incident flow**

1. Declare: one person owns communication, one owns the fix.
2. Stop the bleeding: flag off or roll back before diagnosing.
3. Protect data: if writes are corrupting records, put the affected route in read-only.
4. Communicate to affected customers within 24 hours if their data or money is touched.
5. Write a blameless post-mortem within 72 hours: timeline, cause, detection gap,
   prevention with an owner and a date.

**Never** "fix forward" on a payment or data-loss incident while users are actively
harmed. Roll back first.

---

## 9. Design document template

```markdown
# <Feature name>

**Date:** · **Owner:** · **Status:** draft | review | approved | shipped
**Related:** <links to flows, tickets, designs>

## Problem
<the user, the moment, the cost today>

## Evidence
- FACT: <measured or observed>
- ASSUMPTION: <belief to test>

## Options
1. <option> — <cost, risk>
2. Do nothing — <consequence>

## Decision
<one paragraph, defensible>

## Data change
- tables/columns/indexes:
- migration:
- rollback:

## Server authority
<what is computed where; what the client may only preview>

## Failure modes
| Case | Behaviour |
|---|---|
| offline | |
| duplicate submit | |
| permission denied | |
| empty state | |
| large input | |

## Performance impact
<budget affected, measurement plan>

## Acceptance tests
- [ ] ...

## Out of scope
- ...
```

---

## 10. Weekly cadence

| Day | Ritual | Output |
|---|---|---|
| Monday | Look at the numbers: activation, quotes sent, quotes accepted, churn, errors | One priority for the week |
| Tuesday–Thursday | Build in vertical slices; design docs for anything new | Merged PRs |
| Friday morning | Goldfish review of next week's designs; performance and cost check | Approved designs, cost within limits |
| Friday afternoon | Release + customer follow-ups (5 calls per week until 50 customers) | Release notes, 5 notes of feedback |

**Every week, one real caterer must see the product.** If a week passes with no
customer contact, the roadmap is fiction.

---

## 11. Disk and cost guardrails

Because the project machine must not grow `C:` usage:

```bash
# every shell session that installs anything
export npm_config_cache="D:/Kannan-Projects/EventsMa/.cache/npm"
export TMPDIR="D:/Kannan-Projects/EventsMa/.cache/tmp"
export TEMP="$TMPDIR"
export TMP="$TMPDIR"
export BUN_INSTALL_CACHE_DIR="D:/Kannan-Projects/EventsMa/.cache/bun"
```

- `.npmrc` in the repo points the cache into the project.
- No Docker, no local Postgres, no local Supabase, no Android SDK, no global installs.
- Build artefacts stay in the project or in CI, never in the home directory.
- `node_modules`, `.next`, `.cache` are ignored by git and safe to delete.

Cost guardrails:

- Any new third-party service needs a line in [04 §5](04-architecture-cost-and-scale.md)
  with its free-tier limit and the trigger that would make it paid.
- A weekly check of all provider dashboards against the 70% thresholds.
- No service is added "for later". If it is not used this month, it is not installed.
