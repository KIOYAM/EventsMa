# Feature design documents

One file per feature, written **before** code, using the template in
[docs/05 §9](../05-engineering-workflow.md).

Naming: `YYYY-MM-DD-<slug>.md`, for example `2026-11-02-quote-composer.md`.

Required before Phase 1 code starts (from the design review):

| Design | Covers | Blocks |
|---|---|---|
| `tenancy.md` | Every RLS policy, role matrix, service-role boundary, two-tenant test matrix | Everything |
| `quote-composer.md` | Route, component tree, draft payload, validation, error codes, keyboard and offline behaviour | Quote flow |
| `payments.md` | Gateway objects, webhook state machine, receipt, refund, reconciliation runbook | Money |
| `public-page.md` | URL structure, ISR tags, structured data, enquiry delivery and rate limits | Enquiry flow |

Supporting fixture required: one real, redacted catering quote with 12 lines, tax,
transport and a deposit, reused by unit, integration and E2E tests.

## Template

```markdown
# <Feature name>

**Date:** · **Owner:** · **Status:** draft | review | approved | shipped
**Related:** <flows, tickets, measurements>

## Problem
## Evidence
## Options
## Decision
## Data change
## Server authority
## Failure modes
## Performance impact
## Acceptance tests
## Out of scope
```
