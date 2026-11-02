# BuildMenu --- Deep Product and Engineering Reverse-Engineering Guide

**Research date:** 19 October 2026\
**Method:** Public-source product reconstruction; no private access or
source-code claims.

## 1. Scope and evidence

BuildMenu publicly positions itself as cloud catering management for
Indian caterers, banquet halls, cloud kitchens, and food-service
operators. Its public claims include a menu/package builder, AI menu
suggestions, CRM/lead pipeline, branded proposals, WhatsApp quote
sharing, GST invoicing, deposit milestones, recipe costing, inventory,
kitchen prep sheets, and event planning. Sources:
[About/features](https://buildmenu.in/about), [food-cost
calculator](https://buildmenu.in/tools/food-cost-calculator), [recipe
calculator](https://buildmenu.in/features/recipe-cost-calculator),
[recipe costing
guide](https://buildmenu.in/resources/blog/catering-recipe-costing-margins),
[web-based system
guide](https://buildmenu.in/resources/blog/web-based-catering-management-system).

**Evidence labels** - **Public fact:** Explicitly stated on linked
pages. - **Workflow reconstruction:** A likely sequence implied by
public features. - **Independent engineering proposal:** A recommended
design for a comparable product, not a claim about BuildMenu internals.

Public webpages do not disclose BuildMenu's private framework, database,
APIs, exact formulas, AI model, hosting topology, or security
implementation. Those cannot be reliably reverse engineered from
marketing pages alone.

## 2. Product thesis and target users

BuildMenu's central problem is the fragmentation of a caterer's workflow
across notebooks, spreadsheets, PDFs, WhatsApp, kitchen lists, and
manual billing. The core entity is likely a lead/booking that evolves
into a menu proposal, approved event, operational demand, and invoice.

Primary user roles to model: - Owner: business settings, prices, margin,
team, reports. - Sales/booking coordinator: enquiries, client
communication, quotes and revisions. - Menu planner: dish catalog,
packages, recipe quantities, dietary constraints. - Kitchen/production:
prep sheets, ingredient demand, batch planning. - Purchase/store:
supplier prices, receipts, stock movements. - Finance: tax profile,
invoice, deposit, receipt, balance. - Client: view/approve/request
changes through a restricted quote link.

The public positioning is broader than a simple quotation generator
because recipe costing, prep lists, inventory, and invoices are
described as connected capabilities.

## 3. Reconstructed workflows

### 3.1 Enquiry to quote

1.  Capture enquiry from a form, phone, WhatsApp, or manual entry.
2.  Normalize client phone/email and identify duplicates.
3.  Capture event type, date/time, venue, guest count, service style,
    cuisine, budget, dietary requirements, and notes.
4.  Assign a lead owner and next follow-up.
5.  Build a menu from reusable dishes/packages.
6.  Calculate the price and internal cost estimate.
7.  Generate a branded quote snapshot and PDF.
8.  Share via click-to-chat or a real WhatsApp provider integration.
9.  Track sent, viewed (only if instrumented), approved,
    change-requested, declined, and expired states.
10. Convert the approved quote to an event without retyping the
    client/menu.

### 3.2 Menu and package construction

A menu item should be distinct from a package. A dish has
customer-facing copy and category; a recipe has ingredients/yield/cost;
a package composes dishes and rules. A package may have minimum guests,
guest tiers, included items, optional add-ons, and substitutions.

### 3.3 Recipe costing to procurement

1.  Define recipe yield and ingredient quantity basis.
2.  Normalize ingredient purchase units to a canonical base unit.
3.  Record supplier price with effective date and pack size.
4.  Calculate ingredient cost for a recipe yield.
5.  Scale by expected guest demand and servings per guest.
6.  Aggregate requirements across sessions/events.
7.  Subtract available stock/reservations.
8.  Apply pack-size rounding and produce a purchase suggestion.
9.  Keep estimated costs separate from actual purchase receipts.

### 3.4 Approved quote to operations

Create an event with a snapshot of the accepted quote. Operational edits
should not silently mutate the original approved price. Guest-count or
menu changes should trigger a revised quote or a recorded change order,
depending on policy.

### 3.5 Invoice and deposit schedule

An invoice is not merely a quote PDF with a new title. It needs an
invoice number, issue date, tax snapshot, legal seller/buyer details,
line items, payment terms, and immutable totals. Deposit milestones
should be schedule records, with due dates and payment allocations.

## 4. Proposed architecture

``` text
Responsive admin UI + private client quote page
                   |
            Versioned API
                   |
 CRM | Menu Catalog | Recipe Costing | Quotes | Events
                   |                    |
 Procurement | Stock | Finance/Tax | Notifications
                   |
 PostgreSQL + object storage + background job queue
                   |
 PDF renderer | WhatsApp/email adapter | payment/accounting adapters
```

A reasonable independent stack would be a TypeScript web client, FastAPI
or Django backend, PostgreSQL, object storage for PDFs/images, and
workers for PDF generation, reminders, and provider webhooks. This is a
proposal, not BuildMenu's confirmed stack.

### Boundaries

-   CRM owns leads, activities, follow-ups.
-   Catalog owns dishes, packages, add-ons.
-   Recipe module owns ingredients, unit conversions, yields, cost
    snapshots.
-   Quote module owns revisions and client approvals.
-   Event module owns sessions, dates, venue, run sheets.
-   Inventory module owns stock movements and reservations.
-   Finance owns invoices, payments, expenses, tax snapshots.
-   Notification module owns outbound message jobs and delivery
    receipts.

## 5. Data model proposal

  -----------------------------------------------------------------------
  Entity                  Important fields        Invariants
  ----------------------- ----------------------- -----------------------
  `tenant`                name, slug, timezone,   Every business record
                          currency, tax profile   belongs to one tenant

  `client`                name, phone, email,     Normalize phone; avoid
                          billing data            duplicate customer
                                                  records

  `lead`                  source, event date,     Stage changes audited
                          guest estimate, budget, 
                          stage, follow-up        

  `menu_item`             category, name, dietary Stable ID independent
                          tags, allergens, active of name

  `package`               name, min/max guests,   Package versions are
                          pricing mode, version   traceable

  `recipe`                menu item, version,     Recipe changes do not
                          yield, unit basis       rewrite historical
                                                  quote costs

  `recipe_line`           ingredient, quantity,   Units convertible to
                          unit, yield/loss policy canonical unit

  `ingredient_price`      supplier, pack size,    Historical prices
                          price, effective date   retained

  `quote`                 number, client, lead,   One quote may have
                          status, current         multiple immutable
                          revision                revisions

  `quote_revision`        lines, menu, price,     Sent/approved revision
                          tax, terms snapshots    cannot be silently
                                                  changed

  `event`                 accepted quote, venue,  Accepted quote
                          date, status            reference retained

  `event_session`         meal type, guest count, Guest count per session
                          menu snapshot, times    

  `invoice`               number, tax snapshot,   Issued invoice
                          totals, dates           immutable except
                                                  correction workflow

  `payment`               amount, method,         Idempotent external
                          reference, allocation   references

  `stock_movement`        ingredient, qty, type,  Stock changes are
                          source                  ledger entries

  `notification_job`      channel, recipient,     Provider failures
                          template, state         remain visible

  `audit_event`           actor, action, entity,  Sensitive operations
                          before/after            logged
  -----------------------------------------------------------------------

## 6. Deterministic costing algorithms

### 6.1 Recipe cost

For each ingredient, normalize quantity into the canonical unit. If a
recipe calls for 2.4 kg of ingredient purchased at ₹80/kg, line cost is
₹192. If recipe quantity means usable edible quantity, purchase quantity
must account for yield loss:

`purchase_qty = required_usable_qty / yield_fraction`

If recipe quantities already represent raw purchase weights, do not
apply yield loss a second time. Make the basis explicit for each recipe
line.

`recipe_cost = sum(normalized_purchase_qty × effective_unit_cost)`

`cost_per_serving = recipe_cost / recipe_yield`

A 500-guest production requirement should use the recipe's
servings-per-guest and any explicitly configured buffer, not a hardcoded
universal factor.

### 6.2 Event food cost

`event_food_cost = sum(recipe_cost_per_serving × servings_required)`

Keep separate values for: - forecast ingredient cost; - approved
estimate snapshot; - actual received supplier cost; - actual
waste/consumption where measured.

### 6.3 Pricing and margin

If plate price is ₹800, ingredient cost is ₹240, guest count 300, and
direct overhead ₹20,000: - Revenue = ₹240,000 - Ingredient cost =
₹72,000 - Contribution before other costs = ₹148,000 - Contribution
margin = 61.67% - Food-cost ratio = 30%

These figures match the type of public calculator example, but
production logic must explicitly define whether revenue/tax is inclusive
or exclusive, and which costs are included. Margin is not the same as
markup.

### 6.4 Money arithmetic

Use integer paise or fixed-precision decimal on the backend. Do not use
JS binary floats as the authoritative source for tax/invoice totals.
Save the calculation version and input snapshot.

## 7. API design proposal

-   `POST /api/v1/leads`
-   `GET /api/v1/leads?stage=&from=&to=`
-   `POST /api/v1/leads/{id}/activities`
-   `POST /api/v1/menu-items`
-   `POST /api/v1/packages`
-   `POST /api/v1/recipes/{id}/cost-preview`
-   `POST /api/v1/quotes`
-   `POST /api/v1/quotes/{id}/revisions`
-   `POST /api/v1/quotes/{id}/send`
-   `GET /public/quotes/{token}`
-   `POST /public/quotes/{token}/response`
-   `POST /api/v1/quotes/{id}/convert-to-event`
-   `POST /api/v1/events/{id}/calculate-requirements`
-   `POST /api/v1/purchase-orders`
-   `POST /api/v1/invoices`
-   `POST /api/v1/payments`
-   `GET /api/v1/reports/event-margin`

Every endpoint needs tenant scoping, role checks, validation,
pagination, stable error codes, and audit rules. Public quote tokens
must be unguessable, revocable, expiring, and limited to a single quote
revision.

## 8. AI menu builder --- safe reconstruction

Public pages describe AI recommendations based on dietary preferences,
cuisine, and budget, but do not identify the model or prompt chain.
Independent design: 1. Collect event type, guest count, budget range,
cuisine, dietary restrictions, equipment/service constraints. 2.
Retrieve candidate dishes from the tenant's approved catalog. 3. Use an
LLM only to rank or compose candidate IDs and explain the
recommendation. 4. Validate returned IDs against the catalog. 5.
Calculate price and cost with deterministic code. 6. Show
allergen/dietary warnings and ask the human to approve. 7. Save the
resulting menu as a draft version.

Do not let the model invent dish IDs, ingredient quantities, tax rates,
or prices. An AI-generated dish should remain a suggestion until
reviewed.

## 9. WhatsApp and PDF engineering

A click-to-chat link only opens WhatsApp with prefilled content; it does
not prove a message was sent. A provider integration requires
server-side template/opt-in handling, webhooks, provider IDs, retries,
and delivery state. Never scrape WhatsApp Web or store browser session
cookies.

PDFs should render from a frozen quote/invoice snapshot. Include
revision number, validity, menu, guest count, itemized totals, tax
breakdown, deposit schedule, terms, and business details. Keep PDF
layout separate from calculation logic.

## 10. Security and failure cases

-   Tenant isolation on every read/write.
-   Role permissions enforced server-side.
-   Quote token expiration and revocation.
-   Rate limiting for public forms.
-   Uploaded documents type/size checks.
-   Idempotency on payment callbacks and quote approval.
-   Audit events for quote, tax, payment, and inventory changes.
-   Backups and tested restoration.
-   Explicit failure state when WhatsApp/PDF provider fails.

## 11. Test matrix

-   Unit: recipe scaling, yield, pack rounding, money, tax profiles,
    margin.
-   Integration: quote revision → PDF → approval → event conversion.
-   Concurrency: two users edit a quote or reserve stock.
-   Security: tenant A cannot access tenant B's quote/client.
-   Regression: change guest count, verify price and prep list update
    correctly.
-   AI: unsupported dish IDs, ambiguous dates, missing budget,
    allergens, mixed-language inputs.
-   Provider: duplicate webhook, timeout, permanent failure, delayed
    delivery receipt.

## 12. Unknowns requiring authorized hands-on validation

-   Exact screen structure and available plans.
-   Whether quote views are tracked and how.
-   Exact GST/tax rules and invoice numbering.
-   Ingredient yield defaults and price update behavior.
-   AI model/provider and whether AI outputs are deterministic.
-   Stock reservation/depletion timing.
-   Authentication, database, APIs, hosting, and backup design.

## 13. Recommended build order

1.  Lead and client data.
2.  Dish/package library.
3.  Quote calculator and immutable revisions.
4.  PDF/private link/WhatsApp share.
5.  Recipe costing and ingredient units.
6.  Event sessions and prep list.
7.  Inventory/purchasing.
8.  Invoice/deposit/receipts.
9.  AI suggestions and provider integrations.
10. Reports and operational readiness dashboard.

**Bottom line:** BuildMenu's publicly described strength is the
connected path from enquiry to quote to recipe economics and billing.
Reconstruct that workflow and its invariants; do not pretend the private
implementation is known.

------------------------------------------------------------------------

# Deep Engineering Annex --- BuildMenu

> This annex extends the initial guide. Publicly described behavior is
> separated from proposed implementation. It does not claim access to
> BuildMenu's private code, production APIs, database, or AI provider.

## 14. Functional decomposition down to commands and invariants

### 14.1 CRM and lead intake

Model a lead as a sales opportunity, not as an event. A lead may have
zero or more quote attempts and may become one booking; a client may
create many leads over time.

Commands: - `CreateLead` - `AssignLeadOwner` - `RecordContactAttempt` -
`ScheduleFollowUp` - `MarkLeadQualified` - `MarkLeadLost` -
`ConvertLeadToQuote`

Invariants: 1. A lead's `tenant_id` is immutable. 2. A phone-number
match suggests a duplicate; it must not silently merge records. 3.
Follow-up completion is an activity record, not merely clearing a date.
4. Lead conversion preserves the original lead ID and source
attribution. 5. Quote status and lead stage are separate state machines.
A quote being declined does not automatically mean the lead is lost.

A lead event timeline should be append-only: enquiry created, call
attempted, follow-up scheduled, quote sent, revision requested, and
outcome. This timeline is essential for later conversion reporting.

### 14.2 Menu catalog and package versioning

Separate the following concepts: - `MenuItem`: customer-facing dish
identity. - `Recipe`: ingredient specification and yield. - `Package`:
reusable bundle. - `PackageRevision`: exact set of items and pricing
defaults at a point in time. - `QuoteLine`: quote-specific snapshot.

Do not use the menu item's current price as the historical quote price.
A dish may change cost or name while old quotes remain
legally/commercially relevant. Every quote line should retain the
selected item ID plus a snapshot of display name, unit, quantity, price,
and tax category.

### 14.3 Quote aggregate

A quote is a parent with immutable revisions. Recommended states:
`draft → internally_reviewed → sent → viewed (only if verifiably instrumented) → changes_requested → accepted | declined | expired`.

A revision has: - quote ID and revision number; - client/event
snapshot; - menu line snapshots; - price-rule version; - tax profile
version; - discount policy; - deposit schedule; - terms and validity; -
totals; - creator and timestamps; - PDF artifact ID and message attempt
IDs.

A sent revision is immutable. A change request creates a new revision;
it does not edit the previous snapshot. Approval references the exact
revision ID. This avoids a client accidentally approving a different
price than the one displayed.

### 14.4 Event conversion

Conversion must be transactional: 1. Validate quote is accepted and
current. 2. Validate the quote has not already been converted. 3. Create
event and sessions from the accepted snapshot. 4. Create deposit
milestones. 5. Record a conversion event. 6. Commit. 7. Enqueue
notifications and operational planning jobs through an outbox.

If step 4 fails, the event must not be half-created. If the client
retries the request, an idempotency key or unique accepted-quote
constraint prevents duplicate bookings.

## 15. Pricing engine specification

### 15.1 Input contract

``` json
{
  "currency": "INR",
  "guest_count": 300,
  "price_mode": "per_guest",
  "lines": [
    {"kind": "menu", "quantity": 300, "unit_price_minor": 65000, "tax_category": "configured_food_service"},
    {"kind": "transport", "quantity": 1, "unit_price_minor": 250000, "tax_category": "configured_service"}
  ],
  "discount": {"kind": "fixed", "amount_minor": 0},
  "tax_profile_version": "tax-v4"
}
```

This example is illustrative. `65000` minor units is ₹650. The backend
should own the canonical calculation.

### 15.2 Calculation stages

1.  Validate quantities are nonnegative and within business limits.
2.  Resolve the effective price version for every line.
3.  Calculate extensions using integer paise or decimal arithmetic.
4.  Apply line-specific discounts only to eligible lines.
5.  Apply quote-level discount according to a documented allocation
    policy.
6.  Compute taxable bases by configured tax category.
7.  Apply tax rules and rounding at documented boundaries.
8.  Compute grand total.
9.  Calculate deposit milestones and balance.
10. Return a full calculation trace for display/debugging.

Persist inputs and outputs. A total alone is not enough to explain a
discrepancy later.

### 15.3 Example trace

For 300 guests at ₹650 per guest: - menu line: ₹195,000; - transport
line: ₹2,500; - subtotal: ₹197,500; - eligible discount: ₹0; -
configured tax engine: result depends on actual
classification/profile; - total before tax: ₹197,500.

Do not invent a GST rate. GST treatment depends on the actual supply and
legal context. A "GST-ready" interface is not proof of compliance.

### 15.4 Boundary tests

-   guest count zero, negative, or over configured maximum;
-   price exactly on a guest-tier boundary;
-   1 paise rounding difference;
-   fixed discount greater than subtotal;
-   a taxable and non-taxable line in one quote;
-   tax profile changed after quote send;
-   guest count changes after client approval;
-   a package item is deactivated after being quoted.

## 16. Recipe costing data lineage

Every displayed food-cost number should be traceable:
`event session → menu snapshot → recipe version → recipe ingredient lines → unit conversion → effective ingredient price → yield adjustment → cost result`.

Ingredient pricing should be modeled as effective-dated records, not a
single mutable price. If rice cost changes from ₹60/kg to ₹70/kg, a
newly created quote can use the new rate while the old quote's estimate
remains explainable.

Recipe line fields should include: - ingredient ID; - quantity and
unit; - quantity basis (`raw_purchase`, `edible_usable`, or
`prepared_yield`); - recipe yield; - loss/yield factor and its source; -
serving quantity per guest; - optional or conditional usage; - last
reviewed date.

If the app estimates an ingredient quantity from an AI model rather than
a verified recipe, label the result as an estimate and capture
confidence/source. Do not represent inferred quantities as exact recipe
data.

## 17. Kitchen preparation and stock policy

A prep sheet is a derived operational document. It should be generated
from a frozen event/menu version and include session, guest count, dish,
recipe batch count, ingredient requirements, preparation notes, allergy
warnings, and kitchen-ready time.

Stock policy options: - **Soft demand:** event appears in demand
forecasts but does not reserve stock. - **Hard reservation:**
confirmation reserves stock atomically. - **Purchase commitment:** an
approved purchase order is expected but not yet received. -
**Consumption:** actual stock is reduced when usage is recorded. -
**Waste:** separately records spoilage, overproduction, or damage.

Do not subtract purchase orders as if goods are already in the
warehouse. Stock availability should be based on receipts and movements,
while expected supply can be shown separately.

## 18. WhatsApp integration implementation

Represent message delivery as a job with states:
`queued → submitted_to_provider → sent_to_device (if provider reports) → delivered/read (only if provider reports)`.
Possible terminal states: `failed_permanent`, `cancelled`, `expired`.

A `share_link_opened` browser event is not a delivery receipt. A
click-to-chat URL means the user opened WhatsApp and must send manually.
The UI must use accurate labels.

Retry policy: - retry network timeouts and transient 5xx responses with
backoff; - do not retry invalid recipient/template/opt-in failures
indefinitely; - use provider message ID for webhook correlation; -
verify webhook signature; - deduplicate provider events; - redact phone
numbers in logs.

## 19. Permissions matrix proposal

  ---------------------------------------------------------------------------------------
  Operation            Owner          Sales      Kitchen          Purchase        Finance
  ------------- ------------ -------------- ------------ ----------------- --------------
  Manage                 Yes             No           No                No    Limited/Yes
  business tax                                                             
  profile                                                                  

  Edit lead              Yes            Yes           No                No           Read

  Create quote           Yes            Yes           No                No           Read

  Approve quote          Yes   Policy-based           No                No   Policy-based
  internally                                                               

  View recipe            Yes       Optional   Restricted   Ingredient-only            Yes
  cost/margin                                                              

  View prep              Yes        Limited          Yes     Purchase-only             No
  sheet                                                             fields 

  Receive stock          Yes             No           No               Yes           Read

  Issue invoice          Yes             No           No                No            Yes

  Record                 Yes             No           No Supplier payments            Yes
  payment                                                             only 

  Export all             Yes        Limited           No                No        Limited
  client data                                                              
  ---------------------------------------------------------------------------------------

The actual matrix should be configurable, but least privilege should be
the default.

## 20. Failure recovery and reconciliation

-   PDF generation fails: keep quote draft/sent status accurate; show
    retry action.
-   WhatsApp provider fails: quote remains saved; notification job shows
    failure.
-   duplicate approval: return existing event result, not a second
    booking.
-   ingredient price updated mid-calculation: calculation uses one
    consistent version snapshot.
-   user edits package while quote is open: show stale catalog warning
    and revalidate.
-   stock receipt partially fulfilled: preserve ordered, received, and
    outstanding quantities separately.
-   tax profile missing: block final invoice issuance rather than
    guessing.

## 21. Detailed end-to-end acceptance test

Given a lead for a 300-person reception: 1. Create lead and set a
follow-up. 2. Build a package with 12 dishes, two optional stations, and
transport. 3. Attach versioned recipes to costable dishes. 4. Generate a
quote and verify every line in the calculation trace. 5. Send revision 1
and record the notification state. 6. Client requests a change; create
revision 2. 7. Approve revision 2 through a tokenized client page. 8.
Convert to one event with dinner session and deposit milestones. 9.
Generate a prep sheet and ingredient demand snapshot. 10. Record a
purchase order and partial receipt. 11. Issue an invoice from the
accepted terms. 12. Record two payments and reconcile balance. 13.
Compare forecast margin with actual costs. 14. Verify audit history and
cross-tenant denial. Expected: no duplicated booking, revision 1
unchanged, totals reproducible, and every cost/payment linked to a
source.

## 22. Evidence checklist for actual hands-on reverse engineering

If authorized test access is available, capture: - each screen and
navigation route; - form fields, defaults, required markers, validation
messages; - quote before/after guest-count change; - PDF output and
line-item order; - behavior after price/catalog edits; - status changes
after sending and approval; - material list before/after recipe
changes; - inventory behavior on receipt/consumption; - user-role
visibility; - exported files and public integration docs. Do not claim
internal stack/API findings unless supported by actual artifacts.

# 20,000+ Word Expansion Annex

## Scope and confidence statement
This guide documents the publicly observable product surface of **BuildMenu** and provides an independent engineering blueprint for reproducing comparable workflows. It is intentionally not a claim to have accessed private source code, private APIs, internal database schemas, or undocumented infrastructure. Confirmed public claims, observed behavior, and proposed implementation choices must remain distinct. The domain focus is catering business management, lead conversion, event planning, menu costing, quotations, invoicing, and kitchen execution.

# Expanded Engineering Annex: Feature-by-Feature Implementation Notes


## 1. Lead intake and qualification: detailed implementation blueprint

### Goal and operator outcome
Lead capture must preserve source, consent, contactability, event date, guest estimate, event type, location, budget band, and dietary constraints. A lead is not yet an event booking. Treat duplicate detection as a suggestion rather than an automatic destructive merge: two people may share a phone number or represent separate events. A qualification score should be explainable and configurable, never a hidden reason to suppress leads.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 2. Customer identity and household/company relationships: detailed implementation blueprint

### Goal and operator outcome
Keep contact identity separate from an event. One customer can create several events, and a corporate account can have multiple contacts with different authority. Store normalized phone numbers while preserving the display value. Record communication preferences and a suppression flag. Avoid placing sensitive free-text notes in every quote or invoice; use scoped notes with author and visibility.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 3. Sales pipeline and follow-up scheduling: detailed implementation blueprint

### Goal and operator outcome
A pipeline is a state machine, not merely a colored board. Define permitted transitions, required fields, and timestamps for Enquiry, Qualified, Tasting/Discussion, Proposal Draft, Proposal Sent, Negotiation, Won, Lost, and Archived. Follow-ups should have owner, due date, channel, outcome, and next action. A sent proposal does not mean a customer has viewed it.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 4. Event and multi-session modeling: detailed implementation blueprint

### Goal and operator outcome
An event can include breakfast, lunch, dinner, snacks, multiple dates, or multiple venues. Store a parent event and separately modeled sessions. Each session has service time, guest count, menu version, venue, service style, staffing, equipment, and production notes. Do not flatten multi-session events into a single date and guest count.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 5. Menu catalogue and reusable packages: detailed implementation blueprint

### Goal and operator outcome
A dish catalogue needs stable identifiers, display names, cuisine/category, dietary/allergen tags, active state, portion definition, recipe link, and customer-facing description. Packages should reference dishes through versioned membership rows rather than copying names into a quote. When a dish changes later, a sent quote should not silently change.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 6. Recipe and yield costing: detailed implementation blueprint

### Goal and operator outcome
Represent recipe quantities with units and yield. Ingredient quantity for a target batch should be calculated from a base yield using explicit scaling, with optional batch-size rounding rules. Track edible yield, trim loss, cooking loss, and purchased unit conversion separately. Recipe cost should disclose which ingredient prices and recipe revision produced it.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 7. Menu recommendation and AI assistance: detailed implementation blueprint

### Goal and operator outcome
AI-generated menu suggestions should be a draft assistant, not an authority that can commit prices or promise availability. Inputs may include event type, budget, guest count, cuisine, season, vegetarian share, allergies, equipment, and service format. Validate suggestions against the real catalogue, recipe records, allergens, and availability. Show why each suggestion was included and allow manual override.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 8. Quotation calculation and versioning: detailed implementation blueprint

### Goal and operator outcome
A quote must be reproducible from a frozen snapshot: selected dishes, quantities, guest count, unit rates, discounts, tax treatment, transport, staffing, rentals, and terms. Use integer paise or decimal arithmetic rather than binary floating point. Every revision gets an immutable version, author, timestamp, and change summary. The customer-facing link should resolve to a specific version.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 9. PDF proposals and document rendering: detailed implementation blueprint

### Goal and operator outcome
Separate commercial data from PDF presentation. The document renderer should receive a normalized quote snapshot and a template version, then return a generated file with status, checksum, and storage key. Handle fonts, long dish names, multi-page tables, page breaks, missing logos, and regional tax fields. Re-rendering an old quote should reproduce the original version, not current catalogue data.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 10. WhatsApp and outbound communications: detailed implementation blueprint

### Goal and operator outcome
A share action should create a communication record before handing off to a provider or opening a WhatsApp deep link. Record intended recipient, message template, document reference, provider response if available, and final delivery state only when confirmed by the provider. A locally opened WhatsApp window is not evidence of delivery or reading.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 11. Booking conversion and capacity checks: detailed implementation blueprint

### Goal and operator outcome
When a customer accepts a quote, convert it into a booking through a transaction that verifies the quote version, acceptance, date capacity, and duplicate conversion key. A failed transaction must leave the quote intact and explain the conflict. Capacity rules may include kitchen throughput, staff, equipment, vehicle slots, and concurrent service sessions.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 12. Calendar and operational timeline: detailed implementation blueprint

### Goal and operator outcome
Calendar views should distinguish tentative holds from confirmed bookings. Define whether holds expire and who may override a conflict. Support timezone-safe timestamps while retaining the venue's local date and time. Event changes should create an audit event and notify affected roles when service dates, guest counts, or menus materially change.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 13. Production sheets and kitchen handoff: detailed implementation blueprint

### Goal and operator outcome
Production sheets are derived operational documents, not a new source of truth. They should group recipes by session, scale ingredient totals, apply prep notes, and identify allergens and special meals. Freeze the sheet revision when issued, then track amendments. A chef should be able to acknowledge the current version so teams do not cook from stale paperwork.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 14. Inventory and purchasing implications: detailed implementation blueprint

### Goal and operator outcome
If inventory is included, model stock by item, location, lot where relevant, unit, and movement. Planning demand must not be confused with physical depletion. A reservation may allocate stock; only a defined operational event should post consumption. Receipts, returns, waste, and adjustments need different movement types and a reason.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 15. Invoice, tax, and payment schedule: detailed implementation blueprint

### Goal and operator outcome
Invoices are financial documents with issue date, seller identity, buyer identity, line items, taxable base, tax components, rounding policy, and document number. Distinguish quotation tax estimates from issued invoice tax. Payment milestones must sum to the agreed payable total or explain rounding. Record payment attempts and bank reconciliation separately from invoice status.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 16. Reporting and operational metrics: detailed implementation blueprint

### Goal and operator outcome
Every metric needs a definition and denominator. Lead conversion should state whether it counts leads or quote revisions. Event profitability should use actual costs where available and estimated costs otherwise, with the distinction visible. Reports must honor date range, timezone, status filters, and permissions, and should reconcile to underlying transaction records.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 17. Permissions and tenant isolation: detailed implementation blueprint

### Goal and operator outcome
Separate tenant, user, role, and resource-level access. A sales user may view quotes but not payroll; a chef may view recipe and production details but not customer financial notes. Enforce authorization in the service layer, not only by hiding buttons. Tenant ID must be derived from authenticated context and checked on every object lookup.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 18. Auditability and data correction: detailed implementation blueprint

### Goal and operator outcome
Record actor, action, entity, before/after fields where appropriate, timestamp, request correlation ID, and reason for sensitive corrections. Financial records should be corrected with reversals or credit notes rather than silently edited. Provide a human-readable history that helps operators resolve disputes.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 19. Import, migration, and bulk editing: detailed implementation blueprint

### Goal and operator outcome
CSV imports should support preview, field mapping, validation, row-level errors, and an idempotent commit. A retry must not create duplicate dishes or customers. Bulk changes should show a count and impact preview, preserve previous values in audit logs, and require stronger confirmation for prices, tax settings, and active bookings.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.


## 20. Reliability and disaster recovery: detailed implementation blueprint

### Goal and operator outcome
Use backups with tested restore procedures, not just scheduled snapshots. Define recovery point and recovery time objectives based on business impact. Protect generated PDFs and financial records with durable storage and metadata. Make external messaging and PDF generation retryable through a queue without duplicating customer-facing effects.

### Inputs and preconditions
The feature should declare its minimum input contract, permissible defaults, and the records that must already exist. The interface can assist the operator with defaults, but the backend remains authoritative. A missing optional value must be distinguishable from a deliberately selected zero, false, or empty collection. For workflows that touch other aggregates, load only the relevant state and validate it again inside the write transaction.

### Core domain service
Implement the behavior in a domain service that accepts a typed command and returns a typed result. Keep rendering, transport, persistence, and provider SDK details outside the domain rule. A command should contain actor context, expected version, correlation ID, and idempotency key when appropriate. Return business-rule errors as stable codes so the UI can translate them without parsing English messages.

### Persistence and event handling
Persist the aggregate update and an audit/event record atomically where possible. For downstream work, create an outbox row in the same transaction and let a worker deliver it. Consumers should deduplicate by event ID. Keep event payloads versioned and avoid embedding secrets or excessive personal information. If the workflow is synchronous by user expectation but asynchronous internally, return a clear pending state and expose progress.

### UI states and accessibility
Design for initial, loading, empty, valid, invalid, saving, saved, conflict, permission denied, offline, provider pending, provider failed, and stale-data states. Use keyboard-accessible controls, meaningful labels, visible focus, readable contrast, and screen-reader announcements for dynamic errors. On mobile, keep the primary action visible and avoid destructive gestures that can be triggered accidentally.

### Business invariants
Document what must always be true before and after the action. Invariants should be testable with database assertions or pure property tests. Examples include totals reconciling to lines, a finalised record referencing a specific version, no duplicate redemption, no negative stock without explicit policy, no cross-tenant references, and no external notification claiming delivery without provider evidence.

### Operational monitoring
Measure feature usage, failure rate, validation rejection, retries, conflicts, time-to-completion, and unresolved pending jobs. Add alerts for a rising failure rate or queue age. Support staff need a correlation ID and safe diagnostic view to trace the request without direct database access. Avoid high-cardinality metric labels such as customer names or phone numbers.

### Edge cases to explicitly verify
Test concurrent operators, repeated taps, expired authentication, stale cached data, date changes near midnight, daylight-saving behavior where relevant, currency rounding, long names, special characters, missing optional images, attachment upload interruption, provider timeout after remote success, and records that become inactive while the form is open. For this application, also test the domain-specific case described above and ensure it cannot violate the feature's core invariant.

# Expanded Engineering Annex: Data Contracts and Invariants

The following schemas are recommended independent designs. They are not claims about the vendor's real schema. Use UUID/ULID identifiers, UTC timestamps plus explicit business-local dates where relevant, created_at/updated_at, actor attribution, tenant scoping, and optimistic version numbers for mutable aggregates.


## Entity contract: Lead

The `lead` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Customer

The `customer` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Event

The `event` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Event Session

The `event_session` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Menu

The `menu` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Dish

The `dish` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Recipe

The `recipe` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Ingredient

The `ingredient` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Quote

The `quote` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Quote Revision

The `quote_revision` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Booking

The `booking` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Invoice

The `invoice` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Payment Milestone

The `payment_milestone` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Stock Movement

The `stock_movement` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Staff Assignment

The `staff_assignment` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Production Sheet

The `production_sheet` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.

# Expanded Engineering Annex: API and Command Catalogue

Endpoint names below are illustrative contracts for a new implementation. They are not discovered competitor endpoints. Use a consistent API envelope, explicit pagination, structured validation errors, and documented idempotency semantics.


## `GET /api/v1/resources`
List records visible to the caller. Support cursor pagination, deterministic ordering, filters with documented semantics, and a bounded page size. Return a next_cursor rather than requiring offset pagination for large datasets.

**Contract details.** Request validation is performed at the service boundary; authorization is performed for every resource; writes are transactional where possible; external effects use outbox jobs; and all commands carry a correlation ID. Standard errors should include `code`, `message`, optional `field_errors`, and a retryability hint. Never expose raw SQL, filesystem paths, provider secrets, or stack traces.


## `POST /api/v1/resources`
Create a draft record. Validate authorization and domain invariants on the server. Return 201 with the stable resource ID and version. Accept an idempotency key for operations where retries could create duplicates.

**Contract details.** Request validation is performed at the service boundary; authorization is performed for every resource; writes are transactional where possible; external effects use outbox jobs; and all commands carry a correlation ID. Standard errors should include `code`, `message`, optional `field_errors`, and a retryability hint. Never expose raw SQL, filesystem paths, provider secrets, or stack traces.


## `GET /api/v1/resources/{id}`
Return the record plus the fields needed to render its detail view. Enforce tenant/resource authorization before returning related objects. Include version or ETag for optimistic concurrency.

**Contract details.** Request validation is performed at the service boundary; authorization is performed for every resource; writes are transactional where possible; external effects use outbox jobs; and all commands carry a correlation ID. Standard errors should include `code`, `message`, optional `field_errors`, and a retryability hint. Never expose raw SQL, filesystem paths, provider secrets, or stack traces.


## `PATCH /api/v1/resources/{id}`
Apply a narrow update. Require expected version for concurrency-sensitive records. Return 409 on stale version and a structured field error on validation failure. Do not accept protected server-managed fields from the client.

**Contract details.** Request validation is performed at the service boundary; authorization is performed for every resource; writes are transactional where possible; external effects use outbox jobs; and all commands carry a correlation ID. Standard errors should include `code`, `message`, optional `field_errors`, and a retryability hint. Never expose raw SQL, filesystem paths, provider secrets, or stack traces.


## `POST /api/v1/resources/{id}/actions`
Represent a domain command such as accept, issue, confirm, cancel, receive, settle, or publish. The action handler validates current state and actor permission, writes the state transition, and emits an audit event.

**Contract details.** Request validation is performed at the service boundary; authorization is performed for every resource; writes are transactional where possible; external effects use outbox jobs; and all commands carry a correlation ID. Standard errors should include `code`, `message`, optional `field_errors`, and a retryability hint. Never expose raw SQL, filesystem paths, provider secrets, or stack traces.


## `GET /api/v1/reports/summary`
Return documented metrics with filters, timezone, generated_at, and data freshness. Define whether totals are based on event date, transaction date, issue date, or update date. Include a way to drill down to the records behind a total.

**Contract details.** Request validation is performed at the service boundary; authorization is performed for every resource; writes are transactional where possible; external effects use outbox jobs; and all commands carry a correlation ID. Standard errors should include `code`, `message`, optional `field_errors`, and a retryability hint. Never expose raw SQL, filesystem paths, provider secrets, or stack traces.


## `POST /api/v1/imports`
Create an import job from an uploaded file. Return a job ID, then expose preview, validation, commit, and result download. Repeated commits must be idempotent and row-level failures must be explainable.

**Contract details.** Request validation is performed at the service boundary; authorization is performed for every resource; writes are transactional where possible; external effects use outbox jobs; and all commands carry a correlation ID. Standard errors should include `code`, `message`, optional `field_errors`, and a retryability hint. Never expose raw SQL, filesystem paths, provider secrets, or stack traces.


## `GET /api/v1/jobs/{id}`
Expose asynchronous job status, progress, safe error summary, retryability, and timestamps. Do not leak stack traces or provider credentials. Retain enough status history for support to diagnose stalled work.

**Contract details.** Request validation is performed at the service boundary; authorization is performed for every resource; writes are transactional where possible; external effects use outbox jobs; and all commands carry a correlation ID. Standard errors should include `code`, `message`, optional `field_errors`, and a retryability hint. Never expose raw SQL, filesystem paths, provider secrets, or stack traces.

# Expanded Engineering Annex: Detailed Operational Scenarios

This annex is a proposed implementation and verification specification, not evidence of the competitor's private source code. Product-specific facts are limited to the public claims cited in the reference section. The remaining details define a rigorous way to model, test, and independently implement the visible workflow.


## Scenario suite: Lead intake and qualification

Scope: Lead capture must preserve source, consent, contactability, event date, guest estimate, event type, location, budget band, and dietary constraints. A lead is not yet an event booking. Treat duplicate detection as a suggestion rather than an automatic destructive merge: two people may share a phone number or represent separate events. A qualification score should be explainable and configurable, never a hidden reason to suppress leads.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to lead intake and qualification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Customer identity and household/company relationships

Scope: Keep contact identity separate from an event. One customer can create several events, and a corporate account can have multiple contacts with different authority. Store normalized phone numbers while preserving the display value. Record communication preferences and a suppression flag. Avoid placing sensitive free-text notes in every quote or invoice; use scoped notes with author and visibility.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to customer identity and household/company relationships. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Sales pipeline and follow-up scheduling

Scope: A pipeline is a state machine, not merely a colored board. Define permitted transitions, required fields, and timestamps for Enquiry, Qualified, Tasting/Discussion, Proposal Draft, Proposal Sent, Negotiation, Won, Lost, and Archived. Follow-ups should have owner, due date, channel, outcome, and next action. A sent proposal does not mean a customer has viewed it.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to sales pipeline and follow-up scheduling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Event and multi-session modeling

Scope: An event can include breakfast, lunch, dinner, snacks, multiple dates, or multiple venues. Store a parent event and separately modeled sessions. Each session has service time, guest count, menu version, venue, service style, staffing, equipment, and production notes. Do not flatten multi-session events into a single date and guest count.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to event and multi-session modeling. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Menu catalogue and reusable packages

Scope: A dish catalogue needs stable identifiers, display names, cuisine/category, dietary/allergen tags, active state, portion definition, recipe link, and customer-facing description. Packages should reference dishes through versioned membership rows rather than copying names into a quote. When a dish changes later, a sent quote should not silently change.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to menu catalogue and reusable packages. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Recipe and yield costing

Scope: Represent recipe quantities with units and yield. Ingredient quantity for a target batch should be calculated from a base yield using explicit scaling, with optional batch-size rounding rules. Track edible yield, trim loss, cooking loss, and purchased unit conversion separately. Recipe cost should disclose which ingredient prices and recipe revision produced it.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to recipe and yield costing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Menu recommendation and AI assistance

Scope: AI-generated menu suggestions should be a draft assistant, not an authority that can commit prices or promise availability. Inputs may include event type, budget, guest count, cuisine, season, vegetarian share, allergies, equipment, and service format. Validate suggestions against the real catalogue, recipe records, allergens, and availability. Show why each suggestion was included and allow manual override.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to menu recommendation and ai assistance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Quotation calculation and versioning

Scope: A quote must be reproducible from a frozen snapshot: selected dishes, quantities, guest count, unit rates, discounts, tax treatment, transport, staffing, rentals, and terms. Use integer paise or decimal arithmetic rather than binary floating point. Every revision gets an immutable version, author, timestamp, and change summary. The customer-facing link should resolve to a specific version.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to quotation calculation and versioning. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: PDF proposals and document rendering

Scope: Separate commercial data from PDF presentation. The document renderer should receive a normalized quote snapshot and a template version, then return a generated file with status, checksum, and storage key. Handle fonts, long dish names, multi-page tables, page breaks, missing logos, and regional tax fields. Re-rendering an old quote should reproduce the original version, not current catalogue data.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to pdf proposals and document rendering. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: WhatsApp and outbound communications

Scope: A share action should create a communication record before handing off to a provider or opening a WhatsApp deep link. Record intended recipient, message template, document reference, provider response if available, and final delivery state only when confirmed by the provider. A locally opened WhatsApp window is not evidence of delivery or reading.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to whatsapp and outbound communications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Booking conversion and capacity checks

Scope: When a customer accepts a quote, convert it into a booking through a transaction that verifies the quote version, acceptance, date capacity, and duplicate conversion key. A failed transaction must leave the quote intact and explain the conflict. Capacity rules may include kitchen throughput, staff, equipment, vehicle slots, and concurrent service sessions.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to booking conversion and capacity checks. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Calendar and operational timeline

Scope: Calendar views should distinguish tentative holds from confirmed bookings. Define whether holds expire and who may override a conflict. Support timezone-safe timestamps while retaining the venue's local date and time. Event changes should create an audit event and notify affected roles when service dates, guest counts, or menus materially change.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to calendar and operational timeline. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Production sheets and kitchen handoff

Scope: Production sheets are derived operational documents, not a new source of truth. They should group recipes by session, scale ingredient totals, apply prep notes, and identify allergens and special meals. Freeze the sheet revision when issued, then track amendments. A chef should be able to acknowledge the current version so teams do not cook from stale paperwork.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to production sheets and kitchen handoff. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Inventory and purchasing implications

Scope: If inventory is included, model stock by item, location, lot where relevant, unit, and movement. Planning demand must not be confused with physical depletion. A reservation may allocate stock; only a defined operational event should post consumption. Receipts, returns, waste, and adjustments need different movement types and a reason.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to inventory and purchasing implications. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Invoice, tax, and payment schedule

Scope: Invoices are financial documents with issue date, seller identity, buyer identity, line items, taxable base, tax components, rounding policy, and document number. Distinguish quotation tax estimates from issued invoice tax. Payment milestones must sum to the agreed payable total or explain rounding. Record payment attempts and bank reconciliation separately from invoice status.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to invoice, tax, and payment schedule. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Reporting and operational metrics

Scope: Every metric needs a definition and denominator. Lead conversion should state whether it counts leads or quote revisions. Event profitability should use actual costs where available and estimated costs otherwise, with the distinction visible. Reports must honor date range, timezone, status filters, and permissions, and should reconcile to underlying transaction records.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to reporting and operational metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Permissions and tenant isolation

Scope: Separate tenant, user, role, and resource-level access. A sales user may view quotes but not payroll; a chef may view recipe and production details but not customer financial notes. Enforce authorization in the service layer, not only by hiding buttons. Tenant ID must be derived from authenticated context and checked on every object lookup.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to permissions and tenant isolation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Auditability and data correction

Scope: Record actor, action, entity, before/after fields where appropriate, timestamp, request correlation ID, and reason for sensitive corrections. Financial records should be corrected with reversals or credit notes rather than silently edited. Provide a human-readable history that helps operators resolve disputes.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to auditability and data correction. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Import, migration, and bulk editing

Scope: CSV imports should support preview, field mapping, validation, row-level errors, and an idempotent commit. A retry must not create duplicate dishes or customers. Bulk changes should show a count and impact preview, preserve previous values in audit logs, and require stronger confirmation for prices, tax settings, and active bookings.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to import, migration, and bulk editing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Reliability and disaster recovery

Scope: Use backups with tested restore procedures, not just scheduled snapshots. Define recovery point and recovery time objectives based on business impact. Protect generated PDFs and financial records with durable storage and metadata. Make external messaging and PDF generation retryable through a queue without duplicating customer-facing effects.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **BuildMenu**, apply this scenario specifically to reliability and disaster recovery. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.

# Expanded Engineering Annex: Test Strategy and Release Gates

A credible reverse-engineering specification ends with observable pass/fail checks. The tests below are proposed for an independent implementation. They should run in CI and in a staging environment with test accounts and provider sandboxes.


## Unit tests
Pure calculations, input normalization, lifecycle transition guards, role policy decisions, unit conversions, pricing, tax rounding, and status aggregation. Use table-driven tests for boundary values and property-based tests for invariants.

- For **Lead intake and qualification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer identity and household/company relationships**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Sales pipeline and follow-up scheduling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Event and multi-session modeling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu catalogue and reusable packages**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Recipe and yield costing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu recommendation and AI assistance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation calculation and versioning**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF proposals and document rendering**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **WhatsApp and outbound communications**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Booking conversion and capacity checks**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Calendar and operational timeline**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Repository and database tests
Tenant isolation, unique constraints, transaction rollback, optimistic concurrency, soft deletion, ledger balancing, immutable snapshots, and migrations from the previous schema version.

- For **Lead intake and qualification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer identity and household/company relationships**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Sales pipeline and follow-up scheduling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Event and multi-session modeling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu catalogue and reusable packages**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Recipe and yield costing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu recommendation and AI assistance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation calculation and versioning**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF proposals and document rendering**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **WhatsApp and outbound communications**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Booking conversion and capacity checks**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Calendar and operational timeline**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## API contract tests
Authentication, authorization, pagination, field validation, stale versions, idempotency keys, error envelope stability, rate limits, and forbidden field injection.

- For **Lead intake and qualification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer identity and household/company relationships**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Sales pipeline and follow-up scheduling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Event and multi-session modeling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu catalogue and reusable packages**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Recipe and yield costing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu recommendation and AI assistance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation calculation and versioning**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF proposals and document rendering**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **WhatsApp and outbound communications**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Booking conversion and capacity checks**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Calendar and operational timeline**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Integration tests
Payment provider sandbox, PDF rendering, messaging handoff, storage uploads, webhooks, roster imports, device adapters, and downstream retry behavior where relevant to the app.

- For **Lead intake and qualification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer identity and household/company relationships**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Sales pipeline and follow-up scheduling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Event and multi-session modeling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu catalogue and reusable packages**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Recipe and yield costing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu recommendation and AI assistance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation calculation and versioning**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF proposals and document rendering**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **WhatsApp and outbound communications**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Booking conversion and capacity checks**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Calendar and operational timeline**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## End-to-end tests
Complete role-specific journeys using realistic sample data and multiple browser/device sessions. Assert not only the visible UI but also database state, emitted events, audit trail, generated files, and reconciled totals.

- For **Lead intake and qualification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer identity and household/company relationships**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Sales pipeline and follow-up scheduling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Event and multi-session modeling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu catalogue and reusable packages**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Recipe and yield costing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu recommendation and AI assistance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation calculation and versioning**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF proposals and document rendering**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **WhatsApp and outbound communications**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Booking conversion and capacity checks**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Calendar and operational timeline**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Performance tests
Test normal traffic, peak bursts, large exports, large catalogues, and slow external providers. Record p50/p95/p99 latency, queue age, database contention, and error rate.

- For **Lead intake and qualification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer identity and household/company relationships**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Sales pipeline and follow-up scheduling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Event and multi-session modeling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu catalogue and reusable packages**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Recipe and yield costing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu recommendation and AI assistance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation calculation and versioning**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF proposals and document rendering**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **WhatsApp and outbound communications**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Booking conversion and capacity checks**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Calendar and operational timeline**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Security tests
Cross-tenant IDOR, privilege escalation, CSRF where applicable, XSS in free-text notes, unsafe file uploads, rate-limit bypass, webhook forgery, secret leakage, and excessive personal-data exposure.

- For **Lead intake and qualification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer identity and household/company relationships**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Sales pipeline and follow-up scheduling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Event and multi-session modeling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu catalogue and reusable packages**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Recipe and yield costing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu recommendation and AI assistance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation calculation and versioning**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF proposals and document rendering**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **WhatsApp and outbound communications**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Booking conversion and capacity checks**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Calendar and operational timeline**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Recovery tests
Kill a worker mid-job, time out after a successful commit, replay a webhook, restore a backup, reconnect an offline client, and retry an external message. Verify no duplicated money movement or customer commitment.

- For **Lead intake and qualification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer identity and household/company relationships**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Sales pipeline and follow-up scheduling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Event and multi-session modeling**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu catalogue and reusable packages**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Recipe and yield costing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu recommendation and AI assistance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation calculation and versioning**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF proposals and document rendering**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **WhatsApp and outbound communications**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Booking conversion and capacity checks**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Calendar and operational timeline**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Release gate checklist

- [ ] Every public-facing feature has a written behavior contract and a named owner.

- [ ] All business calculations use decimal or integer minor-unit arithmetic and documented rounding.

- [ ] Every financial, stock, booking, or fulfillment mutation has an audit trail.

- [ ] All object reads and writes enforce tenant and role boundaries on the server.

- [ ] External actions are idempotent or have a documented reconciliation mechanism.

- [ ] User-visible pending and failed states have safe retry or escalation paths.

- [ ] Exports reconcile to underlying records and include timezone/date-range semantics.

- [ ] Critical flows pass end-to-end tests with realistic seed data.

- [ ] Backup restoration and data export have been tested, not merely configured.

- [ ] Product claims that are not verified against an authorized app session are labeled as hypotheses.

# Evidence Collection Plan for a Truly Observed Reverse Engineering Pass
For **BuildMenu**, collect evidence only through public pages or an authorized test account. For every screen, record the entry route, actor role, preconditions, visible fields, defaults, validation messages, actions, resulting state, network-independent observable outcome, and screenshot/video reference. For every calculation, capture at least three input-output examples including a boundary case. For every integration, record the user-visible handoff and only the delivery state that the authorized provider exposes. Redact real customer data. Never bypass authentication, evade access controls, or access another customer's records.

## Screen inventory template
| Field | What to record |
|---|---|
| Screen name and route | Exact visible name and route if shown |
| Role and setup | Which authorized test role and required fixture |
| Entry point | Navigation path or previous action |
| Inputs | Field labels, types, defaults, constraints, and required status |
| Actions | Primary, secondary, destructive, and bulk actions |
| Validation | Error text, timing, field focus, and whether data is preserved |
| State transition | Before/after status and timestamps |
| Side effects | Documents, messages, payments, stock, tasks, or notifications |
| Evidence | Screenshot/video ID, date, environment, and observer notes |
| Confidence | Confirmed, observed once, inferred, or unknown |

## Calculation evidence template
For each quote, tax, dynamic price, recipe quantity, stock alert, entitlement, settlement, or forecast calculation, preserve the input fixture, expected output, actual output, rounding behavior, applicable policy version, and confidence. Repeat the calculation after changing one variable at a time. Do not infer a general formula from a single example. Separate a product's advertised claim from the formula proven by controlled input-output testing.

## Sources and public product claims
- Official product/about page: https://buildmenu.in/about
- Official web-based catering management guide: https://buildmenu.in/resources/blog/web-based-catering-management-system
- Public claims include lead pipelines, AI menu assistance, recipe costing, proposals, GST invoicing, deposit milestones, and event operations; detailed internal implementation is unverified.

## Glossary and naming discipline
Use **confirmed** only for information directly supported by a public source or authorized observation. Use **inferred** for a likely behavior derived from the visible product flow. Use **proposed** for an independent implementation recommendation. Use **unknown** when evidence is absent. Never describe a proposed table, endpoint, algorithm, or architecture as if it were the competitor's actual internals.
