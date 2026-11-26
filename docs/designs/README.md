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

## Localization (shipped, living documents)

| Design | Covers | Status |
|---|---|---|
| [`2026-11-14-localization-engine.md`](2026-11-14-localization-engine.md) | Locale registry, catalogues and fallback, formatting, the measured `<html lang>` trade-off, roadmap to five languages | Foundation shipped; customer link bilingual |
| [`2026-11-15-design-discovery.md`](2026-11-15-design-discovery.md) | Application-wide design audit: 48-route inventory, measured component duplication, findings F1–F12, three design directions with a recommendation, token/icon/asset plans, component matrix, roadmap | Discovery complete; implementation awaits approval |
| [`2026-11-14-localization-rollout-guide.md`](2026-11-14-localization-rollout-guide.md) | How to translate the remaining surfaces, how to add a language, file ownership for parallel agents, the pitfalls we actually hit, verification checklist, ready-to-paste agent prompt | **Read before changing any UI copy** |

## Storefront (shipped)

| Design | Covers | Status |
|---|---|---|
| [`2026-11-16-storefront-builder.md`](2026-11-16-storefront-builder.md) | Section engine (order, visibility, headings), three designs as one markup tree, tenant brand colour injection, motion budget, verification | Shipped |
| [`2026-11-16-storefront-customise.md`](2026-11-16-storefront-customise.md) | The brand studio: identity, logo, colour, wordmark type, section builder and the client share strip; storage decisions and what the prototype offered that the product cannot | Shipped |
| [`2026-11-19-storefront-config-gap-analysis.md`](2026-11-19-storefront-config-gap-analysis.md) | Live test of the storefront config surface, capability comparison against Wix/Shopify, engine gaps ranked P0–P2 (draft preview, custom domain, SEO, media, section instances, tokens, version pruning) and a proposed sequence | Audit complete; implementation not started |
| [`2026-11-17-production-storefront.md`](2026-11-17-production-storefront.md) | Phase 0 audit of the real repository: 61 tables / 118 policies, existing enquiry and quote pipeline, capability status table, draft-vs-published snapshot architecture, migration `0012`, phased plan and blockers | Audit complete; **Phase 1 shipped** (migration `0012`, publish/rollback, isolation test) — §10; **Phase 2 shipped** (sections about/packages/team/FAQ/contact, migration `0013`, snapshot v2, honest publish state) — §11; **Phase 3 shipped** (service entitlement vs storefront visibility, migration `0014`, snapshot v3) — §12 |

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
