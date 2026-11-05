# 12 — Prototype Page Parity

**Source of truth:** `FeastFlow_Marketplace_220_Accounts_Client_Portal.html`
**Measured:** 3 November 2026 (second pass, after the operations build)
**Question answered:** which screens in the visual prototype still have no equivalent in the app?

The prototype declares its pages in two places: the sidebar (`data-page`) and
`pageMeta` (prototype lines 214, 746, 940, 1039, 1164, 1720). Together they define
**22 page keys**. This document maps each one to a real route or marks it as not built.

Status key:

| Status | Meaning |
|---|---|
| **BUILT** | A real route covers what the prototype screen does, with server-verified data. |
| **PARTIAL** | A real route exists and does part of what the prototype screen shows; the listed gaps are missing. |
| **PENDING** | No screen, and (where noted) no table behind it. |
| **NOT BUILDING** | A deliberate product decision, not an oversight. Cite the reason. |

**Count: 1 built · 19 partial · 1 pending · 2 deliberately not building** across the 22
prototype pages (measured again on 4 November 2026). Auth, onboarding, password reset,
invitations and session handling are now built and are listed under §2.

Parity is not the goal on its own — the prototype contains screens we decided not to
port. What matters is the revenue loop: enquiry → client → event → quote → payment →
delivery. That loop now exists end to end in demo mode; its weakest joints are listed
in §3.

---

## 1. Workspace pages

| # | Prototype page | Prototype shows | Today | Status | Priority |
|---|---|---|---|---|---|
| 1 | `dashboard` — Business overview | KPI cards, 6-month cash chart, upcoming events, attention list | `/dashboard`: four server-computed KPIs (pipeline, awaiting reply, upcoming, average margin), a query-capped attention list (stale quotes, events inside two weeks, overdue invoices), enabled-services strip, recent quotes | PARTIAL | P3 (chart) |
| 2 | `storefront` — My storefront | Hero, services, menus, portfolio, reviews, map, enquiry CTA, share link, public URL | `/p/[slug]`: server-rendered public page with services, catalogue counts, enquiry form, demo label, 5-minute revalidate. `/storefront`: what a stranger sees, the public link and the publish switch | PARTIAL | P3 (reviews, map) |
| 3 | `menus` — Menus & packages | Dish cards (price, unit, dietary, allergen, image), package cards with minimum guests and staff-per-100, search, filters, duplicate | `/menu`: meal periods → groups → dishes, dietary markers, grouped and full-list views, image quota. `/catalogue`: priced items with typed units and tax. `/packages`: packages with minimum guests, per-head pricing and included lines. `/menu/card`: print-ready card | PARTIAL | P3 (search, duplicate) |
| 4 | `portfolio` — Event portfolio | Completed events, photos, public-visibility toggle | `/portfolio`: text-first entries (title, date, venue, note) with publish toggles that feed `/p/[slug]`. No photo library | PARTIAL | P3 (photos) |
| 5 | `clients` — Clients & enquiries | Client list, enquiry list, lead statuses, convert enquiry to event, phone dedupe | `/clients`: paged enquiry inbox, status filters, debounced search, convert-to-event that creates the client record and a tentative event. `/clients/directory`: paged client list. `/clients/[id]`: contact edit, event/quote/invoice history. `clients_org_phone_key` enforces one client per phone per org | PARTIAL | P3 (merge two clients) |
| 6 | `events` — Events & bookings | Create/edit event (date, venue, guests, package, extras, staff, transport, rentals, discount, tax), calendar, status pipeline | `/events`: paged list with open-task counts, shared create/edit form. `/events/calendar`: month grid over a bounded date range. `/events/[id]`: operations, crew, vendors, money tabs. Packages/extras are priced through quotations, not duplicated on the event | PARTIAL | P2 (transport/rentals fields) |
| 7 | `operations` — Event operations | Per-event task timeline, vendor list, budget cap vs actual, run-of-show, activity log | `/events/[id]`: task board, vendor assignments, crew assignments, per-event payments and expenses, budget vs captured. No run-of-show or activity log | PARTIAL | P2 |
| 8 | `servicecatalog` — Services & occasions | 20 verticals, event types, cuisines, service areas, capacity, lead time | `/services`: enable/disable verticals, allowed unit classes, default tax, three config fields per vertical, generic specialist vertical | PARTIAL | P2 |
| 9 | `serviceworkspaces` — Service workspaces | Per-vertical packages, resources, crew, jobs, deliverables, configuration | Nothing per vertical. Packages and crew are shared across the business, not scoped to a vertical | PENDING | P3 |
| 10 | `quotations` — Quotations & invoices | Quote preview, printable quote, statuses, record payment, invoice | `/quotes`, `/quotes/new`, `/quotes/[id]`: server-priced composer, immutable sent versions, public token page `/q/[token]` with acceptance and manual bank/UPI instructions, PDF, share links. `/invoices`: sequential per-org/per-year numbering, manual receipts with reference/date, append-only payments, mark-paid in full, void guard when money exists. No gateway, pay-now button or webhook | PARTIAL | P2 (credit notes) |
| 11 | `team` — Employees & duties | Staff records, skills, shift assignment, task checkboxes, check-in | `/team`: memberships, roles, invitations with token, deactivate, last-owner guard, skills and day wage on the member | PARTIAL | P2 (shift rota) |
| 12 | `inventory` — Inventory & suppliers | Stock vs threshold, unit cost, supplier, purchase modal, recipe mapping per dish | `/inventory`: append-only movements, on-hand derived from the ledger, low-stock flags, stock value, supplier as free text | PARTIAL | P2 (recipes) |
| 13 | `finance` — Money management | Income/expense transactions, categories, donut, filters | `/finance`: merged ledger over captured payments and expenses, category entry form, paged, CSV export | PARTIAL | P3 (donut, filters) |
| 14 | `reports` — Reports & insights | Revenue, cost, event count, CSV export | `/reports`: six-month CSS chart, margin, quote conversion, expense categories, event and quote counts, ledger and monthly CSV | PARTIAL | P3 (date range) |
| 15 | `employee` — Employee workspace | Assigned events, tasks, leave request | `/me`: assigned events with open-task counts and links. No leave request, no check-in | PARTIAL | P2 (leave) |
| 16 | `settings` — Business settings | Profile, tax %, advance %, quote validity, storefront toggles, backup export/import | `/settings`: profile, brand colour and font, tax mode, advance %, validity, service areas, publish toggle. No backup import/export | PARTIAL | P3 (backup) |
| 17 | `brandstudio` — Brand studio | Name, tagline, logo, font, theme, live preview | Colour, font and tagline in `/settings`, previewed on `/storefront`. No logo upload or theme presets | PARTIAL | P3 |
| 18 | `prototype` — Prototype coverage | Walkthrough of what the demo claims to cover | Nothing | **NOT BUILDING** | — (audit §6 says delete from the customer-facing build) |

## 2. Public, account and platform pages

| # | Prototype page | Prototype shows | Today | Status | Priority |
|---|---|---|---|---|---|
| 19 | `marketplace` — Event marketplace | 220 synthetic providers, filters, sorting, favourites, quote request | Nothing | **NOT BUILDING** | — Phase 1 promises no leads; no fake listings ([03](03-ideation-and-mvp.md), [11](11-competitive-analysis-and-gaps.md)) |
| 20 | `customerportal` — My event plan | Request list, event plan, saved businesses, profile | `/q/[token]` (view and pay one quote) and `/p/[slug]` (enquire). No account, request list, plan or saved list | PARTIAL | P3 (needs auth) |
| 21 | `superadmin` — Superadmin console | Organisation list, user list, suspend, platform log, stats, CSV | `/admin`: read-only organisation list with plan, member and event counts, gated by `PLATFORM_ADMIN_EMAILS`. No suspend, no log, no CSV | PARTIAL | P4 |
| 22 | `menucard` — Menu card | Print-ready menu card for the guest table | `/menu/card`: print stylesheet, brand accent, sections, groups, dietary markers, unit labels, footer disclaimer. Built from the same rows as the quote engine | BUILT | — |

Non-page surfaces in the prototype:

| Surface | Today | Status |
|---|---|---|
| Sign in / sign up | `/login` (email + password, server action, cookie refresh via `middleware.ts`), `/signup`, `/auth/callback`, `/forgot-password`, `/reset-password` and `/invite/[token]` acceptance | BUILT |
| Guided onboarding | `/onboarding` creates organisation, business profile, enabled services and owner membership in one transaction | BUILT |
| Session security | Supabase cookie refresh in `middleware.ts`; `/admin` gated by `PLATFORM_ADMIN_EMAILS`; sign-out in the app shell | BUILT |
| Bulk import | Nothing | PENDING (P4) |
| Public review form | Nothing; needs moderation before it can exist | PENDING (P4) |
| Printable quotation | PDF route verified: `200`, `application/pdf`, `%PDF-` header | BUILT |
| Audit trail | Written for quote acceptance, invoice create/void, payment recorded and mark-paid; no audit viewer screen yet | PARTIAL (P2) |

---

## 3. What still breaks the loop

The enquiry → client → event → quote → payment → delivery path exists in demo mode.
Five joints are still weak:

1. **Tenancy is enforced in the database, but not exercised by the app.** The Supabase
   project has migrations and `db/policies.sql` applied (31 tables, 31 with RLS, 59
   policies) and the rolled-back two-tenant test in `db/setup.mjs` passes. Runtime
   queries still connect as the table owner, so RLS is proven by that test, not by
   production traffic.
2. **No run-of-show.** Events can be created, edited, rescheduled and viewed on a
   calendar, but the minute-by-minute delivery sheet and activity log are not built.
3. **No client merge.** A client detail page now shows history and phone dedupe is
   enforced, but two clients created before the constraint cannot be merged in the UI.
4. **No audit viewer.** Money and status changes now append audit rows, but there is no
   screen to read them. Finance can be reconstructed from the ledger, not from the UI.
5. **Portfolio has no photographs.** Text entries publish; a portfolio without images
   does not sell, so this stays P3 until the media pipeline exists.

A sixth gap is configuration rather than a page: **platform credentials**. Until
Supabase and Resend keys exist, every write is refused in demo mode and the public
pages cannot be shared with a real client. Payment credentials are deliberately absent:
money is recorded manually and no gateway is called.

---

## 4. Recommended order

| Phase | Work | Why here |
|---|---|---|
| **P0** | Production smoke test with a real owner account; verify quote → acceptance → invoice → receipt on the live database | Schema, RLS, indexes and deployment are done; the authenticated money loop still needs a real-session test. |
| **P1** | Client merge, event transport/rentals fields, run-of-show | The remaining screens a caterer touches on event day. |
| **P2** | Audit viewer, shift rota, leave request, recipes | Delivery and the cost side; where margin becomes visible. |
| **P3** | Portfolio photos, reports date range, storefront reviews/map, backup export | Growth and presentation. |
| **P4** | Service workspaces, superadmin actions, bulk import | Needs real tenants first. |

---

## 5. Verification notes

- `npm run typecheck`, `npm run test` (18 tests: 11 pricing, 5 redirect-safety, 2 payment
  settings) and `npm run build` pass after this pass. The production build reports 34
  prerendered pages, first-load JS 103–126 kB.
- `node db/setup.mjs` applied migration 0003, all 31 tables have RLS (59 policies), and
  the rolled-back two-tenant isolation test passes.
- Demo mode is read-only and production refuses the demo workspace when configuration
  is missing (`isDemoEnvironment` returns false under `NODE_ENV=production`).
- The prototype page count includes pages the audit recommended deleting
  (`prototype`) and pages deferred by decision (`marketplace`); they are counted so
  the inventory reconciles with `pageMeta`, not because they are owed.
