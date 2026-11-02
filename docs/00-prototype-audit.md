# 00 — Prototype Audit

**Subject:** `FeastFlow_Marketplace_220_Accounts_Client_Portal.html`
**Audited:** 24 October 2026
**Verdict:** A high-fidelity single-file clickable prototype. It has a strong
back-office information architecture, a genuinely thought-through multi-vertical
service model, and no backend, security, payments or delivery. It is a useful
**requirements artifact** and not a codebase. Keep the domain thinking and screen
inventory. Rebuild the implementation.

---

## 1. What the file is

| Property | Value | Label |
|---|---|---|
| Size / lines | 647 KB, 1,196 lines, most lines 1,000–6,000 characters | FACT |
| Structure | One HTML file: CSS in `<style>`, markup, then one `<script>` with the whole app | FACT |
| Persistence | `localStorage` keys `feastflow_state_v1`, `feastflow_users_v1`, `feastflow_orgs_v1`, `feastflow_session_v1`, `feastflow_audit_v1`, `feastflow_workspace_<orgId>`, `feastflow_mkt_profiles_v1` | FACT |
| Rendering | String-template HTML assigned to `innerHTML`, then delegated click/change/submit handlers | FACT |
| Charts | Hand-drawn `<canvas>` bar and donut charts | FACT |
| Dependencies | None. No framework, no build step, no network calls | FACT |
| Demo identity | 5 seeded users, 2 seeded organisations, 220 generated marketplace profiles | FACT |
| Routing | Hash routes (`#workspace`, `#storefront`, `#marketplace`, `#customerportal`) | FACT |

The whole state of a business is one JSON blob per organisation
(`feastflow_workspace_<orgId>`). Every save rewrites the entire blob. This is the
single most important structural fact about the prototype: there are no tables, no
relations, no partial updates and no concurrency control.

---

## 2. Module inventory

Status key: **WORKS** = the interaction genuinely functions inside the browser ·
**LOCAL** = works but only against localStorage · **MOCK** = fixed demo data or a
toast pretending to send something · **MISSING** = represented in the UI but with no
behaviour.

### 2.1 Business workspace (owner / manager)

| Module | What exists | Status | Notes |
|---|---|---|---|
| Dashboard | KPI cards, 6-month cash chart, upcoming events, attention list | LOCAL | Numbers computed from local arrays; no server aggregation |
| Menus & packages | Dish cards with price/unit/dietary/allergen/image, package cards with min guests and staff-per-100, search and filters, duplicate package | WORKS | Genuinely the best-built area; units (`per guest`, `per tray`, `per counter`) drive calculations |
| Event portfolio | Completed events, photos, public visibility toggles | LOCAL | Feeds a fake public page |
| Clients & enquiries | Client list, enquiry list, lead statuses, convert-enquiry-to-event, phone-match dedupe | WORKS | Conversion logic is real and worth preserving |
| Events & bookings | Create/edit event with package, guests, extras, staff cost, transport, rentals, discount, tax; calendar modal; status pipeline | WORKS | Core domain object |
| Event operations | Per-event task timeline with owners and dates, vendor list with amounts and status, budget cap vs actual expenses, run-of-show by time, activity log | WORKS | Strong idea; not connected to inventory or staff shifts |
| Services & occasions | 20 service verticals, event types, cuisines, service areas, capacity, lead time | WORKS | This is the multi-vertical thesis in one screen |
| Service workspaces | Per-vertical packages, resources, crew, jobs, deliverables, configuration | WORKS | Seeded generically per vertical; the strongest original idea in the file |
| Quotations & invoices | Quote preview modal, printable HTML in a new window, statuses, record payment | LOCAL | No versioning, no acceptance, no PDF file, no GST compliance |
| Employees & duties | Staff records, skills, shift assignment, per-task checkboxes, check-in toggle | LOCAL | No conflict detection, no wage calculation |
| Inventory & suppliers | Stock levels vs threshold, unit cost, supplier, purchase modal, recipe mapping per dish | LOCAL | Recipes are not consumed by events; stock is edited by hand |
| Money management | Income/expense transactions, categories, donut, filters | LOCAL | No double entry, no receivables ageing, no reconciliation |
| Reports | Revenue, cost, event count, CSV export | LOCAL | Client-side aggregation only |
| Employee workspace | Personal view: assigned events, tasks, leave request | LOCAL | Good role separation idea |
| Business settings | Profile, pricing defaults (tax %, advance %, quote validity), storefront toggles, backup export/import, reset | WORKS | Backup/restore is a browser file, not a server backup |
| Brand studio | Name, tagline, logo upload (client-side compressed), font, theme, live preview | WORKS | Nice touch for perceived ownership |
| Prototype coverage | A walkthrough of what the prototype claims to cover | MOCK | Useful as a spec index, not as a product screen |

### 2.2 Public / marketplace side

| Module | What exists | Status | Notes |
|---|---|---|---|
| Business storefront | Hero, services, menus, portfolio, reviews, map embed, enquiry CTA, share link | LOCAL | Rendered inside the same file; no real public URL, no SEO |
| Marketplace discovery | 220 generated profiles across 20 verticals, search, filters (city, vertical, occasion, cuisine, budget, guests), sorting, pagination, favourites | MOCK | `sample:true`, `verifiedDemo:true` on generated profiles |
| Provider profile | Overview, packages, operations/capacity, reviews, quote request | MOCK | Quote request writes into a demo workspace that no real provider owns |
| Customer portal | Request list, event plan, saved businesses, profile, per-user client store | LOCAL | Plan/favourites are local only; not shareable |
| Auth | Login, signup (owner/manager/employee/customer), password reset, seeded demo accounts | MOCK | Plaintext passwords in localStorage; no verification, no server session |
| Superadmin | Organisation list, user list, suspend account/org, platform activity log, stats, CSV export | MOCK | Operates only on local data; no real platform authority |
| Onboarding | 3-step guided modal | LOCAL | Steps are informational; they do not gate data quality |
| Bulk import | File picker, preview counts, "21 valid · 2 duplicates · 1 needs correction" | MOCK | No parser, no validation rules, no write path |

---

## 3. The calculation engine, as written

This matters because money is the product. The prototype computes:

```
menuSelections = Σ (itemPrice × quantity × guests)   when unit is per guest/per plate
eventSubtotal  = rate × guests + menuSelections + extras + staffCost
                 + transport + rentals + other − discount
eventTotal     = round(eventSubtotal × (1 + taxRate/100))
balance        = eventTotal − paid
```

**FACT — defects in this model**

1. **Double counting risk.** A package already includes dishes, but additional
   menu selections are added on top with no awareness of what the package covers.
2. **One tax rate for the whole quote.** No per-line tax treatment, no inclusive vs
   exclusive distinction, no GST split, no round-off rule.
3. **`minGuests` is stored but not enforced.** A 100-guest package can be quoted at
   30 guests with no warning or minimum charge.
4. **No service charge, no delivery/serving charge, no overtime, no equipment
   damage waiver, no cancellation policy** — all standard catering line items.
5. **Transport is a typed number.** The research notes clearly describe distance-based
   transport pricing; nothing resolves a venue to a distance.
6. **No cost side.** Inventory carries `unitCost` and dishes carry `recipe`
   quantities, but the quote never shows plate cost, gross margin, or contribution.
   The owner's real question — "will I make money on this event?" — is unanswered.
7. **No rounding, currency or negative guards beyond `Math.max(0, …)`** on a few
   fields; discount can exceed subtotal and silently clamp.

---

## 4. Security and correctness findings

These are blockers, not polish. None of them can be fixed inside a static HTML file.

| # | Finding | Severity | Evidence |
|---|---|---|---|
| S1 | Passwords stored and compared in plaintext in `localStorage` | Critical | `ffUsers` seed objects include `password:'FeastOwner@2026'`, `ffAuthView` |
| S2 | Password reset requires no email verification; anyone with the browser can reset any local account | Critical | `recover` mode of `ffAuthView` |
| S3 | Session is a localStorage key; no expiry, no revocation, no device list | High | `FF_SESSION_KEY` |
| S4 | Role enforcement is DOM visibility only; all data for all local orgs sits in the same origin and can be read | Critical | `ffApplyRoleUi`, `ffLoadWorkspace` |
| S5 | "Join an existing workspace" accepts any org from a dropdown with no invitation | High | signup form, `ffSignupOrgWrap` |
| S6 | Public review form is unauthenticated and publishes immediately | Medium | `openPublicReview` |
| S7 | Audit log is local, mutable and capped at 250 entries | Medium | `ffLog`, `ffSaveAudit` |
| S8 | Import/restore replaces all local state after a `confirm()` | Medium | `importBackup` |
| S9 | No tenant data export beyond a JSON dump; no deletion path | Medium | `downloadJson` |
| S10 | Storefront marked "LIVE" while nothing is hosted | Low (trust) | sidebar `nav-count` |

**FACT — the file itself admits the limitation.** Comments and copy inside the
prototype say "This remains a browser prototype; production authorization needs a
backend", "Real secure authentication, account isolation across devices, and
platform-wide monitoring require a hosted backend", and "Hosting is needed for a
public cross-device link". We should carry that honesty forward instead of inheriting
the demo's implied completeness.

---

## 5. Data model implied by the prototype

Even though it lives in one blob, the shape is usable as the first schema draft:

```
Organisation ─┬─ Users (role: owner | manager | employee | customer)
              ├─ Business profile (brand, city, tax, advance %, quote validity,
              │                    service verticals, event types, cuisines, areas)
              ├─ MenuItem (price, unit, veg, allergens, recipe[])
              ├─ Package (rate, minGuests, staffPer100, includes[], services[])
              ├─ Client ── Event (date, venue, guests, package, charges, status)
              │              ├─ Quotation / Invoice (derived totals, payments[])
              │              ├─ OperationsPlan (tasks, vendors, expenses, run sheet)
              │              └─ StaffAssignment (employee, tasks, checkIn)
              ├─ Employee (role, skills, wage, leave)
              ├─ InventoryItem (stock, unit, threshold, unitCost, supplier)
              ├─ Supplier
              ├─ Transaction (income | expense, category, date)
              ├─ Review (rating, text, verified, reply)
              └─ ServiceWorkspace (vertical-specific packages, resources, crew,
                                   deliverables, job records, configuration)
```

Missing from the model and required for a real SaaS: `subscription`, `invoice`
(as an immutable financial document), `payment` (with gateway reference),
`notification`, `document` (file metadata), `invitation`, `audit_event`,
`quote_version`, `availability_block`, `distance_cache`, `consent`, and
`marketplace_listing` (separate from the business profile).

---

## 6. What to keep, what to rebuild

**Keep (as design input, re-implemented):**

- The information architecture: workspace → catalogue → clients → events → money.
- The 20 service verticals and the "service workspace" concept. Most competitors
  force every business into a caterer-shaped box; this does not.
- Unit types on menu items (`per guest`, `per tray`, `per counter`) because they
  reflect how caterers actually price.
- Enquiry → client → event conversion with phone-number deduplication.
- Operations board (tasks, vendors, run sheet, budget) — this is the post-booking
  half of the value that most quote-only tools ignore.
- Role-specific entry points (owner, manager, field employee, customer).
- The visual language: forest green, terracotta, warm neutrals, serif display type.
  It reads as hospitality rather than generic enterprise software.
- The print-ready quotation and the "explain the calculation" instinct.

**Rebuild, do not port:**

- Every line of JavaScript. String-template `innerHTML` rendering with a global
  mutable `state` object cannot support multi-user editing or be tested.
- Auth, session, roles, tenancy — replaced by Supabase Auth + row-level security.
- The 220 synthetic marketplace profiles — replaced by real, claimed listings or
  removed until supply exists.
- The single-blob persistence — replaced by normalised Postgres tables.
- Client-side search and filtering — replaced by indexed queries; 220 rows is not
  a search problem, 50,000 listings is.
- Charts — replaced by a chart component that does not depend on canvas measurement
  timing.

**Delete outright:**

- The "Prototype coverage" page from the customer-facing build.
- Seeded demo credentials in any environment that is reachable from the internet.
- The "LIVE" badge until a listing is actually published.

---

## 7. Reusable engineering references

The five reverse-engineering guides and the Caterease guide are competitor
teardowns, not our design. Their useful parts for us:

- Feature checklists to validate scope (what buyers expect to see in a demo).
- Data contracts for menus, packages, quotations and ingredient explosion.
- Onboarding sequences used by partner apps.
- Pricing-page patterns we can benchmark against.

They are explicitly **not** evidence of private internals, and no code or text from
them should be copied. `EVENTSMA_catering_SaaS_research_and_proof.md` already
carries the correct evidence caveats; the same rules apply here.
