# 12 — Prototype Page Parity

**Source of truth:** `FeastFlow_Marketplace_220_Accounts_Client_Portal.html`
**Measured:** 3 November 2026, at commit `7e2c495`
**Question answered:** which screens in the visual prototype still have no equivalent in the app?

The prototype declares its pages in two places: the sidebar (`data-page`) and
`pageMeta` (prototype lines 214, 746, 940, 1039, 1164, 1720). Together they define
**22 page keys**. This document maps each one to a real route or marks it as not built.

Status key:

| Status | Meaning |
|---|---|
| **PARTIAL** | A real route exists and does part of what the prototype screen shows; the listed gaps are missing. |
| **PENDING** | No screen, and (where noted) no table behind it. |
| **NOT BUILDING** | A deliberate product decision, not an oversight. Cite the reason. |

**Count: 0 at full parity · 8 partial · 12 pending · 2 deliberately not building.**

Parity is not the goal on its own — the prototype contains screens we decided not to
port. What matters is the revenue loop: enquiry → client → event → quote → payment →
delivery. That loop is broken in four places, listed in §3.

---

## 1. Workspace pages

| # | Prototype page | Prototype shows | Today | Status | Priority |
|---|---|---|---|---|---|
| 1 | `dashboard` — Business overview | KPI cards, 6-month cash chart, upcoming events, attention list | `/dashboard`: four server-computed KPIs (pipeline, awaiting reply, upcoming, average margin), enabled-services strip, recent quotes | PARTIAL | P1 (attention list), P3 (chart) |
| 2 | `storefront` — My storefront | Hero, services, menus, portfolio, reviews, map, enquiry CTA, share link, public URL | `/p/[slug]`: server-rendered public page with services, catalogue counts, enquiry form writing to `enquiries`, demo label, 5-minute revalidate | PARTIAL | P3 |
| 3 | `menus` — Menus & packages | Dish cards (price, unit, dietary, allergen, image), package cards with minimum guests and staff-per-100, search, filters, duplicate | `/menu`: meal periods with service windows → groups → dishes, dietary markers, grouped and full-list views, image quota (200 KB/file, 25 MB/org). `/catalogue`: priced items with typed units and tax | PARTIAL | **P1 (packages)** |
| 4 | `portfolio` — Event portfolio | Completed events, photos, public-visibility toggle | Nothing. No table, no screen, no media library beyond menu images | PENDING | P3 |
| 5 | `clients` — Clients & enquiries | Client list, enquiry list, lead statuses, convert enquiry to event, phone dedupe | `enquiries` rows exist and the public form writes them. No list, no triage, no status change, no conversion, no client record | PENDING | **P1** |
| 6 | `events` — Events & bookings | Create/edit event (date, venue, guests, package, extras, staff, transport, rentals, discount, tax), calendar, status pipeline | `events` table exists and the dashboard counts upcoming rows. No create, edit, calendar or pipeline screen | PENDING | **P1** |
| 7 | `operations` — Event operations | Per-event task timeline with owners and dates, vendor list, budget cap vs actual, run-of-show, activity log | Nothing. No tasks, vendors, run-sheet, budget or expense tables | PENDING | P2 |
| 8 | `servicecatalog` — Services & occasions | 20 verticals, event types, cuisines, service areas, capacity, lead time | `/services`: enable/disable verticals, allowed unit classes, default tax, three config fields per vertical, generic specialist vertical | PARTIAL | P2 |
| 9 | `serviceworkspaces` — Service workspaces | Per-vertical packages, resources, crew, jobs, deliverables, configuration | Nothing. The vertical/catalogue split covers part of the intent; there is no per-vertical workspace | PENDING | P2 |
| 10 | `quotations` — Quotations & invoices | Quote preview, printable quote, statuses, record payment, invoice | `/quotes`, `/quotes/new`, `/quotes/[id]`: server-priced composer, immutable sent versions, public token page `/q/[token]`, PDF at `/api/quotes/[id]/pdf`, UPI card, Razorpay webhook appending payments | PARTIAL | **P1 (invoice + manual payment)** |
| 11 | `team` — Employees & duties | Staff records, skills, shift assignment, task checkboxes, check-in | `/team`: memberships, roles, invitations with token, deactivate, last-owner guard | PARTIAL | P2 |
| 12 | `inventory` — Inventory & suppliers | Stock vs threshold, unit cost, supplier, purchase modal, recipe mapping per dish | `/inventory`: append-only movements, on-hand derived from the ledger, low-stock flags, stock value, supplier as free text | PARTIAL | P2 |
| 13 | `finance` — Money management | Income/expense transactions, categories, donut, filters | Nothing beyond payments arriving through the webhook | PENDING | P2 |
| 14 | `reports` — Reports & insights | Revenue, cost, event count, CSV export | Nothing | PENDING | P3 |
| 15 | `employee` — Employee workspace | Assigned events, tasks, leave request | Nothing. Roles exist, but no role-scoped screen | PENDING | P2 |
| 16 | `settings` — Business settings | Profile, tax %, advance %, quote validity, storefront toggles, backup export/import | Nothing. Defaults are hardcoded per vertical; profile is seeded only | PENDING | **P1** |
| 17 | `brandstudio` — Brand studio | Name, tagline, logo, font, theme, live preview | Nothing | PENDING | P3 |
| 18 | `prototype` — Prototype coverage | Walkthrough of what the demo claims to cover | Nothing | **NOT BUILDING** | — (audit §6 says delete from the customer-facing build) |

## 2. Public, account and platform pages

| # | Prototype page | Prototype shows | Today | Status | Priority |
|---|---|---|---|---|---|
| 19 | `marketplace` — Event marketplace | 220 synthetic providers, filters, sorting, favourites, quote request | Nothing | **NOT BUILDING** | — Phase 1 promises no leads; no fake listings ([03](03-ideation-and-mvp.md), [11](11-competitive-analysis-and-gaps.md)) |
| 20 | `customerportal` — My event plan | Request list, event plan, saved businesses, profile | `/q/[token]` (view and pay one quote) and `/p/[slug]` (enquire). No account, request list, plan or saved list | PARTIAL | P3 (needs auth) |
| 21 | `superadmin` — Superadmin console | Organisation list, user list, suspend, platform log, stats, CSV | Nothing | PENDING | P4 — needs its own design and a separate access path |
| 22 | `menucard` — Menu card | Print-ready menu card for the guest table | Nothing | PENDING | P3 |

Non-page surfaces in the prototype:

| Surface | Today | Status |
|---|---|---|
| Sign in / sign up / password reset | `/login` is a disabled form that names the missing Supabase variables; no signup, reset or session | PENDING — blocker |
| Guided onboarding | `/onboarding` is a static explainer; it does not call `bootstrap_org` | PENDING |
| Bulk import | Nothing | PENDING (P4) |
| Public review form | Nothing; needs moderation before it can exist | PENDING (P4) |
| Printable quotation | PDF route verified: `200`, `application/pdf`, `%PDF-` header | BUILT |
| Audit trail | Nothing is written or shown | PENDING (P2) |

---

## 3. The four gaps that actually break the product

The menu and quote engine were built first, and they work. Everything around them is
missing, which means a quote today has **no origin, no event and no settlement**.

1. **No enquiry inbox.** Enquiries land in a table nobody can open, so there is no
   follow-up queue, no lead status and no phone-based dedupe. The first paying customer
   needs this on day one.
2. **No event screen.** Quotations carry `event_date` and `guests`, but an event cannot
   be created, edited, rescheduled or marked delivered. Deposits and balances have
   nothing to attach to.
3. **No packages.** `service_packages` exists in the schema with no UI. Caterers sell
   "veg banquet, 250 guests, ₹850/plate", not a list of 14 dishes; without packages the
   composer is slower than the spreadsheet it replaces. Minimum-guest enforcement is
   also absent, so a 100-guest package can be quoted at 30.
4. **No invoice or manual payment.** A quote can be accepted and paid online, but a
   bank transfer or cash advance cannot be recorded, and there is no immutable invoice
   document. Money stops at "sent".

A fifth gap is configuration rather than a page: **tax rate, advance percentage and
quote validity are hardcoded per vertical**, so every business using that vertical is
forced into the same commercial terms. `/settings` is a prerequisite for honest
quotations, not polish.

---

## 4. Recommended order

| Phase | Work | Why here |
|---|---|---|
| **P0** | Supabase project, migrations, `db/policies.sql`, real auth, the two-tenant test | RLS has never executed; today the app connects as table owner and bypasses it. No page work is trustworthy before this. |
| **P1** | Enquiries inbox → clients → events → packages → settings (tax/advance/validity) → invoice + record payment | Completes the loop the quote engine already sits in. Each item is a vertical slice: schema, policy, action, screen, test. |
| **P2** | Event operations, team duties + employee view, suppliers/recipes, finance ledger, audit trail | Post-booking delivery and the cost side; this is where margin becomes visible. |
| **P3** | Storefront editor, brand studio, menu card, reports, customer portal | Growth and presentation. Safe to defer until real quotes are flowing. |
| **P4** | Superadmin, bulk import, public reviews | Platform and migration tooling; needs real tenants first. |

---

## 5. Verification notes

- All routes above return `200` in labelled demo mode; typecheck, unit tests and
  production build passed at `7e2c495`.
- **Demo mode is read-only.** Writes such as catalogue items, menu dishes, invites and
  stock movements are refused until Supabase is connected.
- RLS policies exist in `db/policies.sql` but have **never been applied or executed**.
  Do not read "route returns 200" as "tenancy is enforced".
- The prototype page count includes pages the audit recommended deleting
  (`prototype`) and pages deferred by decision (`marketplace`); they are counted so
  the inventory reconciles with `pageMeta`, not because they are owed.
