# Caterease Public-Scope Reverse Engineering & FeastFlow Development Blueprint

**Document type:** Product, market, workflow, data, architecture, UX,
and delivery specification\
**Prepared:** 19 October 2026\
**Research boundary:** Public Caterease pages, public support/training
resources, and screenshots supplied by the project owner\
**Target implementation:** Existing FeastFlow VP HTML/CSS/JavaScript
demo; extend current code and seeded data, do not rebuild from scratch\
**Status:** Evidence-based discovery blueprint --- not a claim of access
to Caterease private source code, database, internal APIs, or
authenticated application

------------------------------------------------------------------------

## 1. Executive summary

Caterease presents itself as an all-in-one catering and event-management
system. Its public materials describe event and client management,
booking wizards, menus, staffing, recipes, packing lists, custom prints,
payment processing, tasks, a browser-based Horizon Hub, an AI assistant
called Cai, event portals, dashboards, calendars, reports, Kitchen
Display, electronic signature workflows, and anonymized industry trends.
Public support resources additionally expose training and documentation
topics for areas such as event management, clients, prospects, menus,
scheduler, employee management, reports and queries, document builder,
ingredient management, guestrooms, banquet rooms, touch management, and
setup.

The supplied screenshots provide further visual evidence of: - A
desktop-style Event Manager with a left-side event list, search/filter
controls, a selected-event detail pane, event/sub-event tabs,
client/contact data, totals, status, planned/actual/guaranteed guest
counts, booking/revision timestamps, notes, and an image attachment. - A
scheduler organized by venue/room columns and time slots, with
day/week/month/year/agenda modes, time-unit selection, filters, room
tabs, holidays, notes, waitlist, breakout rooms, and room blocking. - A
web event detail experience with event metrics, tabs for
details/sub-events/payments/schedule/assistant/prints, client portal
actions, menu/food-service rows, notes and alerts. - Business
intelligence dashboards with date-range filters, KPI cards, revenue
trends, event status distributions, top items, and top clients. - A
calendar with month navigation, event indicators, event detail cards,
event status, date/time, guests, revenue and event identifiers. -
Scheduled report configuration with templates, date ranges, AI-assisted
criteria, previews, schedule settings, recipient lists, and PDF
export. - A dark Kitchen Display showing daily events, sub-event time
ranges, menu items, required quantities, and a total prep summary. - A
document/template builder with configurable sections, rich-text/header
editing, preview, duplicate/delete/save controls, signer status and
document actions. - An industry trends screen with anonymized aggregate
metrics, event volume over time, day-of-week distribution, menu
intelligence, and event-type mix. - A public login page describing
customer access points for Caterease Connect and Horizon Hub.

These screenshots are evidence of visible concepts and interface
patterns, not proof of every underlying behavior. This document labels
assumptions and recommendations separately from verified public claims.

### Project objective

Build an evidence-backed model of the publicly discoverable product and
use it to improve FeastFlow's existing VP demo. Do not attempt to obtain
private source code, bypass authentication, inspect data without
authorization, or duplicate proprietary branding/assets. Implement
comparable business capabilities using original code, original UI, and
project-owned sample data.

### What "complete reverse engineering" means under public-only access

We can comprehensively map: 1. Public product positioning and feature
claims. 2. Publicly documented modules and user workflows. 3. Visible UI
elements in the supplied screenshots. 4. A proposed domain model that
supports those workflows. 5. Feature dependencies, validation rules,
state transitions and calculations. 6. A reference architecture and
development plan for FeastFlow. 7. Test scenarios and acceptance
criteria for a faithful functional demo.

We cannot establish with certainty: - Caterease's private source code,
framework, database schema, internal API contracts, deployment topology
or security implementation. - Hidden features not mentioned in public
sources. - Exact production behavior for screens not shown or workflows
not documented. - Current account-specific entitlements or non-public
prices. - Whether each screenshot represents the current released UI, a
prototype, or a particular customer configuration.

------------------------------------------------------------------------

## 2. Research methodology and evidence standards

### 2.1 Source set

Primary public sources reviewed: - Official website:
https://www.caterease.com/ - Features:
https://www.caterease.com/features/ - Pricing:
https://www.caterease.com/pricing/ - Support documentation:
https://help.caterease.com/docs/resources/documentation/ - Training
videos: https://help.caterease.com/docs/resources/training-videos/ -
Free user training: https://help.caterease.com/free-user-training/ -
Training: https://help.caterease.com/training/ - New user onboarding:
https://help.caterease.com/new-user-onboarding/ - Support home:
https://help.caterease.com/

Screenshot evidence: project-owner-provided images showing Event
Manager, Scheduler, event detail, AI report prompt, BI dashboard,
calendar, scheduled reports, Kitchen Display, document builder, industry
trends, and login.

### 2.2 Confidence labels

Use these labels throughout the project: - **Verified public claim
(V):** Explicitly described by an official public page or support
resource. - **Screenshot observation (S):** Clearly visible in a
supplied screenshot; behavior beyond the visible state is not assumed. -
**Strong inference (I):** Needed to support the observed workflow and
consistent with common software design, but not directly confirmed. -
**Proposal (P):** A recommended FeastFlow design, not a statement about
Caterease internals. - **Unknown (U):** Requires further public
documentation or authorized product access.

Every item in the eventual feature matrix should include evidence,
confidence, implementation status, dependency, and test coverage.

### 2.3 Investigation procedure

1.  Capture each official page's title, claims, CTA, navigation, images,
    links and pricing language.
2.  Follow public support links and enumerate guidebooks,
    quick-reference guides, videos and training curricula.
3.  Extract visible fields and controls from supplied screenshots.
4.  Group capabilities into domains and workflows.
5.  Map dependencies and lifecycle transitions.
6.  Propose an independent data model.
7.  Compare each feature with current FeastFlow files.
8.  Implement in priority order and test end-to-end.
9.  Update the evidence register whenever a feature is confirmed,
    contradicted or remains unknown.

### 2.4 Limitations

Public marketing content is designed to communicate benefits, not
specify every rule. Training documents may cover different product
versions. Screenshots may contain synthetic/demo data and cannot
validate all calculations. Pricing, packaging and features can change.
Re-check official sources before making commercial decisions.

------------------------------------------------------------------------

## 3. Product and market positioning

### 3.1 Public positioning

The homepage frames Caterease as a complete software solution for
catering and events, intended to manage the operation from lead/inquiry
to event execution. Its value proposition emphasizes: - One system for
many operational functions. - Faster event creation and management. -
Detailed menu and service management. - Payment processing. - A modern,
mobile-ready web hub. - AI-assisted access to business data. - Reporting
and operational visibility.

The features page contrasts "familiar tools" used by the industry with
newer web/AI capabilities. This positions the product as both an
established operational system and a modern access layer.

### 3.2 Likely target segments (inference from features and packaging)

-   Independent caterers moving from spreadsheets and paper.
-   Multi-user catering businesses coordinating sales, kitchen, service
    and finance.
-   Banquet halls and event venues with room/resource scheduling needs.
-   High-volume operators that need batch communication, advanced
    queries and enhanced security.
-   Businesses needing recipes, scalable quantities, staffing and
    equipment packing lists.
-   Operations requiring client-facing portals, documents and signature
    collection.

These are market-segment inferences, not a verified list of customer
demographics.

### 3.3 Jobs to be done

1.  Capture and qualify a lead.
2.  Create an event consistently without missing required information.
3.  Convert an inquiry into a quote/proposal and a confirmed booking.
4.  Build a menu and calculate quantities and charges.
5.  Schedule venue space, rooms, time slots and staff.
6.  Generate documents for customers and internal teams.
7.  Track deposits, payments, balances and event profitability.
8.  Communicate changes to clients, sales, kitchen and operations.
9.  Consolidate production requirements across events.
10. Understand sales pipeline, revenue, customer value, menu performance
    and operational workload.

### 3.4 Marketing message architecture

  -----------------------------------------------------------------------
  Layer                  Publicly visible       Product proof that should
                         message                support it
  ---------------------- ---------------------- -------------------------
  Category               Catering and event     Unified
                         management software    event/client/operations
                                                records

  Core benefit           Manage the whole       Connected lifecycle from
                         business in one system inquiry to closeout

  Speed                  Booking wizards and    Guided forms, reusable
                         dynamic menu building  packages and quantity
                                                calculations

  Reliability            Tasks, staffing        Validation, alerts,
                         conflict checks and    checklists and
                         production lists       consolidated prep

  Financial control      Payment processing and Accurate totals, payment
                         reports                ledger, balances and
                                                profitability

  Modern access          Horizon Hub,           Responsive browser
                         mobile-ready access    workspace and governed
                         and AI assistant       natural-language queries

  Customer experience    Client portal and      Controlled event sharing
                         e-signature workflows  and auditable document
                                                status

  Management insight     Dashboard, reports and Filterable KPIs, exports,
                         industry trends        schedules and anonymized
                                                aggregates
  -----------------------------------------------------------------------

### 3.5 Marketing funnel (proposed analysis)

-   **Awareness:** Homepage, product positioning, visual proof,
    customer/social proof.
-   **Consideration:** Features page, feature videos, product
    screenshots, comparison table.
-   **Evaluation:** Pricing, plan comparison, optional add-ons,
    demo/contact CTA.
-   **Conversion:** Contact sales/get started, onboarding and setup.
-   **Activation:** Structured onboarding, guided event creation,
    templates, sample data.
-   **Retention:** Operational reliance, training, support resources,
    updates and reporting.
-   **Expansion:** Additional users, modules, integrations and advanced
    workflows.

This is a conventional funnel inferred from the public site structure,
not internal Caterease analytics.

### 3.6 Pricing model observed publicly

The public pricing page displayed annual-billing monthly rates: -
Express: \$99/month. - Standard: \$149/month. - Professional:
\$199/month. - Additional users: \$28/month each. - Optional
modules/add-ins: \$25/month each. - One-time launch fee: \$200 per user.

The page described Express as core event/client management, event
prints, available add-ins/interfaces and payment processing; Standard
adds staffing, recipes and automatic equipment packing lists;
Professional adds batch merge emails, enhanced user security and copying
default menus/prints. The page also describes Mosaic payment processing
and Horizon Hub as included, with processing fees applying.

Treat this as a time-stamped public observation (19 October 2026
context), not a guaranteed quote. Revisit the page for current values.
Do not assume every checkbox in the pricing comparison table is legible
or accurately represented by a partial screenshot. Optional modules
listed publicly include Guest Rooms Manager, Prospect Manager, Document
Builder, Web Inquiry and Banquet Rooms; the page also describes
integrations as add-ons. Verify current packaging before implementing
plan gating.

### 3.7 Competitive differentiation opportunities for FeastFlow (proposal)

-   Make the first-use experience easier with a seeded demo and guided
    setup.
-   Provide clear "next action" guidance on every event.
-   Present a modern, consistent UI without sacrificing dense
    operational views.
-   Make menu costing, quantity scaling, inventory consumption and
    margin transparent.
-   Provide a simple mobile/role-specific kitchen and service
    experience.
-   Make all key reports traceable to the underlying event/payment/item
    records.
-   Make AI assistance explain the data and show the records used to
    answer.
-   Support import/export with preview, validation, duplicate detection
    and rollback where possible.
-   Keep plan packaging understandable and avoid hidden add-on
    surprises.
-   Offer India-friendly defaults if FeastFlow targets Indian caterers:
    INR, GST configuration, Indian phone formats, regional date formats
    and vegetarian/allergen labels; these are product choices for
    FeastFlow, not Caterease claims.

------------------------------------------------------------------------

## 4. Product scope and module inventory

### 4.1 Core desktop/operations layer

#### 4.1.1 Event Manager

**Evidence:** Official feature claims plus supplied Event Manager
screenshot; support/training materials describe event information,
sub-events, contacts, notes, files and repeat events.

**Visible screenshot fields and controls:** - Event list with
client/organization and event date. - Quick date tabs such as Today,
Tomorrow, This Week and month range. - Views and filters. - Search field
and paging controls. - Selected client/organization contact card:
address, telephone, email. - Financial summary: subtotal, service
charge, taxes, total and cost per guest. - Event and SubEvent tabs. -
Event status indicator and allergy indicator. - General and
Miscellaneous tabs. - Party name, sales representative, theme,
category. - Booking contact and site contact. - Event number, date,
status. - Planned, actual and guaranteed guest counts. - Booked and
revised timestamps. - Notes area and image/picture attachment.

**Expected functional requirements for FeastFlow:** - Create, view,
edit, duplicate, cancel and close events. - Search by event number,
customer, date, contact and party name. - Filter by date range, status,
category, salesperson and venue. - Support multiple sub-events/meal
functions per master event. - Record planned, actual and guaranteed
guest counts separately. - Record audit timestamps and actor identity. -
Store notes, attachments and allergy/dietary alerts. - Show derived
totals from the event's item, fee, tax and payment records. - Preserve
history when event status changes. - Validate that event date/time and
required contacts are present. - Prevent accidental duplicate
submission. - Allow a customer to have multiple events and an event to
have multiple sub-events.

**Proposed lifecycle:** Prospect → Tentative → Definite/Confirmed → In
Progress → Closed/Completed. Cancellation should be a separate terminal
state. This is a FeastFlow proposal; actual Caterease status names and
transitions should be confirmed from documentation before claiming
parity.

**Acceptance criteria:** - Creating an event assigns a unique event
number. - Event appears in list, calendar and scheduler. - Editing guest
count recalculates quantity-dependent charges. - Status changes appear
in history and dashboards. - Event totals match the financial ledger. -
Closed/cancelled events are handled consistently by reports. - Duplicate
event operation preserves or resets selected fields according to
explicit user choice.

#### 4.1.2 Sub-events / functions

A master event may contain one or more functions such as breakfast,
lunch, break, reception or dinner. Each function may have its own time,
venue/room, guest count, menu, setup, staff and production needs.

**Proposed fields:** id, event_id, function_name, service_type,
start_at, end_at, venue_id, room_id, guest_count, setup_style, status,
notes.

**Rules:** - Start must be before end. - Sub-event guest count may
differ from the master event. - Menu quantities should derive from the
relevant function's count and item quantity rules. - Changes should
update scheduler, print documents, kitchen prep and reports. - A
function may need its own staffing and setup assignments.

#### 4.1.3 Scheduler / venue management

**Screenshot observations:** - Day, Week, Month, Year and Agenda
views. - Time-unit selector (example: 30 minutes). - Zoom controls, Day
View and Options. - Venue/room tabs such as All Venues, Ballrooms and
individual rooms. - Mini-calendar and month navigation. -
Include-in-view filters: Holidays, Notes, Waitlist, Breakout Rooms, Room
Blocking. - Time grid and room columns. - Colored event blocks with
event name, party name, status, description, sales rep, planned and
actual guests. - A side details rail.

**Proposed requirements:** - Calendar grid by venue/room and time. -
Filter by event status, venue, room, salesperson and event type. -
Detect room and staff conflicts. - Support setup/teardown buffers. -
Represent room blocks and blackout periods. - Support breakout rooms and
capacity constraints. - Allow click-through to event details. -
Drag/drop rescheduling only with conflict checks and confirmation. -
Time zone handling and consistent date/time formatting. - Event color
legend and accessible non-color status cues.

**Core conflict rule proposal:** Two active bookings conflict when they
share an exclusive resource and their buffered intervals overlap. For
interval A \[startA,endA) and B \[startB,endB), overlap exists when
startA \< endB and startB \< endA. Include setup/teardown buffer and
resource capacity rules.

#### 4.1.4 Client / contact management

**Public support evidence:** Client tips cover entry, prospects,
history, contact people and duplicate merging.

**Proposed fields:** legal/business name, display name, client type,
phone, email, billing address, event address, tax identifiers where
applicable, preferred contact method, notes, tags, source/referral,
lifetime event count/value, active/inactive state.

**Features:** - Multiple contacts per client. - Client and organization
records. - Multiple addresses and billing details. - Event history and
financial summary. - Notes, reminders and communication history. -
Duplicate detection by normalized email, phone and name. - Safe merge
flow with field-level preview and reversible audit record. - Customer
segmentation and source tracking.

#### 4.1.5 Prospect / sales pipeline

**Evidence:** Public training page describes prospect management and a
sales cycle from proposal through event completion.

**Proposed pipeline:** New inquiry → Contacted → Qualified → Proposal
sent → Follow-up → Tentative hold → Won/Definite or Lost. Configure
stages rather than hard-code them.

**Fields:** prospect_id, organization, contact, source, estimated date,
guest count, estimated budget, event type, probability, owner,
next_action_at, lost_reason.

**Required behavior:** - Capture web inquiries. - Assign salesperson and
follow-up tasks. - Track stage changes and elapsed time. - Convert won
prospect to client/event without losing history. - Prevent double
conversion. - Report conversion rates, pipeline value and overdue
follow-ups.

#### 4.1.6 Menu building and pricing

**Public claims:** Dynamic menu building includes incremental search,
automatic packages, linked quantities and minimum quantities.

**Proposed catalog model:** - Menu category. - Menu item/product. -
Package. - Package item. - Unit of measure. - Portion/serving basis. -
Sell price and cost. - Minimum quantity. - Quantity multiplier/linked
quantity. - Tax/service-charge classification. - Dietary/allergen
labels. - Availability and active state.

**Quantity model:** For guest-based item, base quantity = guests ×
units_per_guest. Apply package rules, minimum quantity, rounding
increment and manual override policy. Show formula and override reason.
Do not silently overwrite manual quantity.

**Price model:** Line subtotal = quantity × unit price. Apply item
discounts, event discounts, service charges and taxes according to
configured order and inclusive/exclusive rules. Store rate snapshots on
the event so later catalog price changes do not rewrite historical
events.

**Required UX:** - Incremental search and category filters. - Add
package and expand/edit included items. - Apply minimum and linked
quantity rules. - Override quantities/prices with permission and audit
log. - Distinguish food, beverage, rentals, equipment, room charges,
labor and miscellaneous items. - Show cost, selling price, gross margin
and guest cost to authorized roles.

#### 4.1.7 Recipes and ingredient management

**Public claims:** Detailed recipes can be associated with menu items
and automatically compiled/quantified from event menus. Public training
lists Ingredient Management.

**Proposed model:** - Ingredient. - Ingredient unit. - Recipe. - Recipe
ingredient lines. - Yield/serving count. - Prep method and notes. -
Ingredient cost and supplier. - Allergen/dietary metadata. - Waste/yield
adjustment.

**Scaling formula:** required ingredient quantity = recipe ingredient
quantity × (required servings / recipe yield). Convert units only when
conversion is defined and dimensionally valid. Account for yield loss
and batch size as configurable rules.

**Requirements:** - Recipe cost per batch and per serving. -
Ingredient-level cost snapshots or dated costing. - Unit conversion. -
Ingredient availability and purchase requirements. - Allergen and
dietary warnings. - Update prep totals when event/menu counts change. -
Avoid double-counting recipe ingredients and direct menu items.

#### 4.1.8 Inventory, purchasing and waste

Inventory and purchasing details should be treated as an implementation
domain to validate against public documentation rather than assumed
complete Caterease functionality.

**Proposed capabilities for FeastFlow:** - Stock items, units, storage
location and reorder threshold. - Stock movements: receive, consume,
adjust, waste, transfer. - Supplier and purchase order records. -
Planned consumption derived from recipes and events. -
Available-to-promise quantity. - Batch/expiry tracking if target users
need it. - Waste reasons and quantity. - Stock reconciliation and audit
trail. - Low-stock alerts. - Link purchase requirements to upcoming
event prep.

**Formula:** on_hand = opening + receipts + positive adjustments +
transfers in − consumption − waste − issues − transfers out. Available
stock may additionally reserve quantities for future events.

#### 4.1.9 Staffing and shifts

**Public claims:** Shifts & Staffing supports assigning shifts and
employees and automatically tracking potential scheduling conflicts.

**Proposed model:** employee, role/skill, availability, shift,
shift_assignment, event/sub_event, labor rate, assignment status.

**Rules:** - Employee assignments cannot overlap unless an explicit
override is permitted. - Respect availability, leave and role
qualifications. - Distinguish requested, assigned, accepted, checked-in
and completed. - Calculate labor estimate and actual labor cost. -
Report staffing gaps and overtime warnings. - Record who made/overrode a
conflict decision.

#### 4.1.10 Equipment packing lists

**Public claims:** Equipment packing lists can be built automatically
from menu items.

**Proposed behavior:** - Map menu items/packages to equipment
requirements. - Aggregate quantities across sub-events. - Add
event-specific manual equipment. - Account for inventory available,
cleaning/turnaround and loss buffers. - Generate pack, dispatch, return
and missing/damaged checklists. - Separate equipment needed from
equipment actually assigned.

#### 4.1.11 Tasks, reminders and history

**Public claims:** Pop-up reminders, history notes and to-do checklists
help teams follow up.

**Proposed fields:** task_id, entity_type/entity_id, title, due_at,
assigned_to, priority, status, created_by, completed_at, recurrence,
reminder_channel.

**Features:** - Event/client/prospect-linked tasks. - Assignment, due
date, recurrence and escalation. - History notes with timestamp and
actor. - Overdue task views. - Checklist templates by event type. -
Notifications through configured channels. - Audit changes and
completion.

#### 4.1.12 Custom prints / documents

**Public claims:** Customizable prints support
back-of-house/front-of-house templates and branded layouts. Public
support resources list Document Builder.

**Candidate documents:** - Quote/proposal. - Contract/terms. - Banquet
event order. - Customer event summary. - Kitchen production sheet. -
Staff assignment sheet. - Packing list. - Invoice/receipt. - Payment
schedule. - Event change report.

**Proposed builder:** - Template name, description, type and version. -
Configurable sections, conditional visibility and data bindings. -
Company header/logo, typography and layout settings. - Preview using
real sample event. - Duplicate, save, archive and restore version. -
Generate PDF/print/email output. - Role-based access and audit history.

**Security:** Never allow arbitrary user-supplied template code to
execute. Use a constrained template system and escaped output.

#### 4.1.13 Payments and financial management

**Public claims:** Payment processing includes tokenized cards and
customer payment links. Pricing mentions Mosaic payment processing and
processing fees.

**Proposed domain:** - Invoice/charge lines. - Payment schedule. -
Payment transaction. - Refund. - Credit/adjustment. - Processor
reference. - Reconciliation status. - Tax and service charge
configuration. - Discount and commission rules.

**Important distinction:** Store processor tokens/references, not raw
card numbers or CVV. Real payment processing requires a compliant
provider integration; a browser-only demo should use clearly labeled
simulated transactions.

**Financial formulas (must be configurable and tested):** - Subtotal =
sum of priced line items after defined line-level discounts. - Service
charge = configured eligible base × rate, unless flat fee. - Tax =
configured taxable base × rate, respecting inclusive/exclusive tax
settings. - Total due = subtotal + fees + tax − event discounts +
adjustments. - Balance = total due − successful payments +
refunds/chargebacks as defined. - Cost per guest = total / chosen guest
basis; define behavior when guest count is zero. - Gross profit =
revenue − direct costs. - Gross margin % = gross profit / revenue × 100,
guarded against zero revenue. - Sales commission = eligible sales base ×
commission rate; eligibility, timing and refunds must be explicitly
defined.

Use decimal arithmetic for money, not binary floating-point rounding.
Store currency code and rate snapshots.

#### 4.1.14 Optional modules and add-ons

Public pricing materials list: - Guest Rooms Manager. - Prospect
Manager. - Document Builder. - Web Inquiry. - Banquet Rooms. -
Integrations/add-ins.

The exact availability and current packaging must be verified at
implementation time. For FeastFlow, implement module boundaries so
optional capabilities can be enabled without entangling core event
logic.

------------------------------------------------------------------------

## 5. Modern web layer: Horizon Hub and related tools

### 5.1 Horizon Hub

**Public claim:** Access live Caterease data outside the desktop program
from devices; mobile-ready access.

**Screenshot evidence:** Browser-style dashboard, calendar, event
details, reports, kitchen display, industry trends and AI query UI.

**FeastFlow design proposal:** - Responsive web workspace. -
Role-specific home dashboards. - Shared underlying business records
rather than duplicate datasets. - Fast global search. - Event detail
deep links. - Notifications and activity feed. - Accessible keyboard
navigation. - Read-only views for roles that do not need editing. -
Permission-aware exports.

### 5.2 Cai AI Assistant / natural-language analytics

**Public claim:** The AI assistant answers questions about business
information. Screenshot examples include calculating commission on food
sales by sales rep for the month and breaking special-event profit down
by salesperson.

**Proposed safe architecture:** 1. Authenticate user. 2. Parse
natural-language request into a constrained intent and parameters. 3.
Check role permissions and tenant scope. 4. Map intent to an approved
metric/query definition. 5. Validate dates, dimensions, filters and
aggregation. 6. Execute read-only parameterized query. 7. Return answer,
calculation, date range and source records/links. 8. Log request
metadata and outcome while minimizing sensitive content.

**Example intent schema:** - metric: food_sales / commission / profit /
guest_count / event_count. - date_range: explicit start/end. - group_by:
salesperson/client/event_type/month. - filters: status, event type,
salesperson. - commission_rate: decimal if supplied. - output:
summary/table/chart.

**Controls:** - Do not let the model generate arbitrary SQL for direct
execution. - Use a metric registry and parameterized query builder. -
Restrict all results to the user's authorized tenant/records. - Explain
assumptions and excluded statuses. - Ask clarification for ambiguous
terms such as "special event profit." - Do not invent data when no
records match. - Distinguish food sales from total event revenue. -
Treat commission rates as explicit parameters or approved settings. -
Make the result reproducible from the same data snapshot.

### 5.3 Dashboard and business intelligence

**Screenshot evidence:** Date range, exclude-status filter, KPI cards
for events/revenue/guests/clients, revenue line chart, event status
donut, top items and top clients.

**Proposed metrics:** - Event count by status. - Revenue by event date
or invoice date. - Guests by event date. - Average revenue per event. -
Average revenue per guest. - Gross profit/margin. - Lead conversion
rate. - Booking lead time. - Top clients by revenue. - Top menu items by
sales/quantity/margin. - Outstanding balance and overdue payments. -
Staffing utilization. - Inventory waste and stock-outs.

**Rules:** - Every metric needs a written definition. - Date basis must
be explicit (event date, booked date, invoice date, payment date). -
Cancellation and refund treatment must be explicit. - Use server-side
aggregation in production. - Filter widgets consistently by tenant,
permissions, date range and status. - Include loading, empty,
partial-error and stale-data states. - Dashboard values must reconcile
with underlying records.

### 5.4 Calendar

**Screenshot evidence:** Monthly grid, event indicators, event cards,
event status, date/time, guest count, event value and event number.

**Proposed behavior:** - Month/week/day/agenda. - Filter by status,
salesperson, venue and event type. - Click event to open detail. - Show
sub-events where useful. - Drag/drop only with conflict validation. -
Keyboard and screen-reader access. - Local time zone display and correct
daylight-saving behavior.

### 5.5 Reports, custom queries and scheduled reports

**Screenshot evidence:** Report templates, date range, AI criteria
field, Generate action, preview table, Schedule and Download PDF
actions, recurrence, day/time, recipients and Save Schedule.

**Proposed features:** - Report catalog and saved custom reports. -
Filter builder and grouping/sorting. - Column selection. - Preview and
export (CSV/PDF). - Scheduled report definitions. - Recurrence
(daily/weekly/monthly) with time zone. - Recipient authorization and
validation. - Delivery history, failure state and retry policy. - Report
version and definition snapshot. - Data-access audit. - Clear "generated
at" timestamp.

**Reliability rules:** - Avoid duplicate delivery on retries using
idempotency keys. - Do not expose records beyond recipient
authorization. - Escape CSV fields to mitigate spreadsheet formula
injection. - Limit expensive reports and apply pagination. - Track
schedule owner and disable schedules when owner/recipient access is
revoked.

### 5.6 Kitchen Display

**Screenshot evidence:** Dark full-screen operational display, selected
date, event count, guest count, item count, event cards, sub-event
times, menu items and aggregated prep summary.

**Proposed behavior:** - Full-screen, high-contrast kitchen view. -
Filter by date, kitchen/location, service period and status. - Group
event items by event/function and aggregate total quantities. -
Highlight additions/changes since last viewed snapshot. - Mark prep
items as started, ready, packed or unavailable. - Show allergies/dietary
warnings prominently. - Print/export production sheets. - Avoid
accidental edits in high-traffic kitchen use. - Support tablet display
and refresh status.

**Aggregation:** Required quantity for a menu item = sum of validated
quantities across included active sub-events, adjusted for recipe
yield/production rules. Do not aggregate cancelled functions or count
the same package item twice.

### 5.7 Event portals

**Public claim:** Event details can be shared with team and customers;
portal may support files and chat (public training syllabus references
sharing files and portal chats).

**Proposed portal capabilities:** - Secure, revocable event-specific
invitation. - Customer-visible event summary. - Menu and guest-count
review. - Documents and signatures. - Payment links through a payment
provider. - File sharing. - Chat/message history. - Guest-facing privacy
filters. - Link expiration and access logs. - Consent and notification
settings.

Never expose internal costs, margin, private staff notes, other
customers or internal attachments to portal users.

### 5.8 Sign & Send / electronic signature

**Public claim:** Custom templates can be sent for electronic signature
or posted in a client portal.

**Proposed workflow:** Draft → Preview → Send → Viewed → Signed /
Declined / Expired / Voided.

Track: - Document version/hash. - Signer identity and role. - Invitation
timestamp. - Consent and signature event timestamps. - IP/device
metadata only where legally appropriate and disclosed. - Completion
certificate/provider reference. - Resend and void operations. -
Immutable audit trail.

Use a qualified e-sign provider for production legal workflows. Demo
signatures must be labeled simulated.

### 5.9 Industry Trends

**Screenshot evidence:** Region filter, events analyzed, average guest
count, average event revenue, peak capacity, event volume over time,
weekday distribution, menu intelligence and event-type mix. Screenshot
text says aggregated/anonymized metrics.

**Proposed privacy requirements:** - Aggregate across sufficiently large
cohorts. - Apply minimum cohort sizes and suppression for rare
combinations. - Remove direct identifiers and sensitive free-text. -
Prevent users from inferring another business's data. - Define
opt-in/contractual basis and retention policy. - Show methodology,
region/time window and sample size. - Do not present synthetic FeastFlow
demo benchmarks as real industry data.

------------------------------------------------------------------------

## 6. End-to-end workflows

### 6.1 Lead to booked event

1.  Capture inquiry manually or via web form.
2.  Normalize contact details and detect duplicates.
3.  Assign lead owner and source.
4.  Create follow-up task and due date.
5.  Qualify date, venue, guest count, service style and budget.
6.  Check room/resource availability.
7.  Create estimate and menu proposal.
8.  Send proposal/contract using approved template.
9.  Track view/signature/response.
10. Convert to definite booking after required conditions are met.
11. Create payment schedule and operational tasks.
12. Record status history and preserve source attribution.

**Tests:** duplicate lead, missing required date, conflicting room,
expired quote, customer rejection, won/lost conversion, repeated
conversion attempt.

### 6.2 Event planning and revision

1.  Open event.
2.  Edit master details and/or sub-events.
3.  Adjust guest counts and schedule.
4.  Add menu packages and custom items.
5.  Recalculate quantities, prices, service charges and tax.
6.  Review allergies and dietary requirements.
7.  Validate room, equipment and staffing.
8.  Record revision reason.
9.  Notify authorized users and customer if configured.
10. Regenerate affected documents and kitchen summaries.

**Tests:** menu change after contract, guest count reduction, time
change, cancelled sub-event, tax-rate change, manual price override.

### 6.3 Event production

1.  Query upcoming confirmed events.
2.  Aggregate recipes and ingredient requirements.
3.  Aggregate equipment packing list.
4.  Compare against stock and reservations.
5.  Create purchase requirements if stock is insufficient.
6.  Assign staff/roles/shifts.
7.  Resolve conflicts.
8.  Generate kitchen display and internal prints.
9.  Track prep/pack/dispatch/return.
10. Record waste and actual quantities.

### 6.4 Payment and closeout

1.  Generate or update invoice.
2.  Apply configured charges, taxes and discounts.
3.  Schedule deposit/installments/balance.
4.  Record processor transaction reference.
5.  Reconcile payment status.
6.  Handle failed payment/refund/adjustment.
7.  Calculate final revenue and direct costs.
8.  Close event when operational/financial rules allow.
9.  Update customer history and analytics.
10. Retain auditable financial snapshots.

### 6.5 Reporting and AI query

1.  User selects date range or asks a question.
2.  Resolve date basis, metrics and filters.
3.  Validate access and input.
4.  Execute approved aggregation.
5.  Display values, definitions and record drill-downs.
6.  Export or schedule report if permitted.
7.  Log generation/delivery status.
8.  Reconcile output with a deterministic test query.

------------------------------------------------------------------------

## 7. Proposed domain model

This is a recommended independent FeastFlow model, not Caterease's
actual database schema.

### 7.1 Core entities

  -----------------------------------------------------------------------
  Entity                   Purpose                Key relationships
  ------------------------ ---------------------- -----------------------
  Organization/Tenant      Business account       Owns users, clients,
                           boundary               events, settings

  User                     Login identity         Has roles and
                                                  permissions

  Role/Permission          Access control         Grants actions within
                                                  scope

  Client                   Customer/business      Has contacts and events

  Contact                  Person associated with Linked to client and
                           client                 event roles

  Prospect                 Lead and sales         May convert to
                           pipeline               client/event

  Event                    Master booking         Belongs to client;
                                                  contains sub-events

  SubEvent                 Individual             Belongs to event; has
                           meal/function          menu, venue and
                                                  staffing

  Venue                    Physical site          Contains
                                                  rooms/resources

  Room/Resource            Bookable               Used by sub-events and
                           location/resource      blocks

  RoomBlock                Unavailable interval   Applies to
                                                  room/resource

  MenuItem                 Sellable food/service  Linked to recipe and
                           item                   category

  MenuPackage              Reusable menu grouping Contains package items

  EventMenuLine            Item selected for      Belongs to sub-event
                           event                  

  Recipe                   Production formula     Contains ingredient
                                                  lines

  Ingredient               Raw material           Used in recipes and
                                                  stock

  InventoryLocation        Storage site           Holds inventory
                                                  movements

  InventoryMovement        Stock ledger           Receipts, use, waste,
                                                  adjustments

  Supplier/PurchaseOrder   Purchasing             PO lines receive stock

  Employee                 Staff member           Has availability/skills

  Shift                    Work requirement       Linked to
                                                  event/sub-event

  ShiftAssignment          Employee assignment    Links employee to shift

  EquipmentItem            Reusable/consumable    Used in packing lists
                           equipment              

  PackingListLine          Equipment requirement  Linked to
                                                  event/function

  Task/Reminder            Work follow-up         Links to
                                                  event/client/prospect

  Quote/Invoice            Financial document     Belongs to event

  InvoiceLine              Charge detail          Linked to event menu or
                                                  fee

  Payment                  Payment ledger         Applies to
                                                  invoice/event

  Refund/Adjustment        Financial correction   References
                                                  payment/invoice

  DocumentTemplate         Reusable print/sign    Produces document
                           template               instances

  DocumentInstance         Generated/sent         Linked to
                           document               event/client/signers

  SignatureEvent           Signature lifecycle    Linked to
                                                  document/signer

  Attachment               Uploaded file metadata Linked to permitted
                                                  parent entity

  Message/PortalSession    Customer communication Linked to portal/event

  AuditEvent               Change record          References actor,
                                                  entity and action

  ReportDefinition         Saved report           Owned by user/tenant
                           configuration          

  ReportSchedule           Scheduled execution    References report and
                                                  recipients

  Notification             Delivery record        References recipient
                                                  and entity

  DashboardWidget          Saved dashboard layout Owned by user/role

  AIQueryAudit             AI request metadata    Stores governed
                                                  query/result references
  -----------------------------------------------------------------------

### 7.2 Relationship sketch

``` mermaid
erDiagram
  TENANT ||--o{ USER : contains
  TENANT ||--o{ CLIENT : owns
  CLIENT ||--o{ CONTACT : has
  CLIENT ||--o{ EVENT : books
  PROSPECT }o--o| CLIENT : converts_to
  EVENT ||--o{ SUBEVENT : contains
  SUBEVENT ||--o{ EVENT_MENU_LINE : selects
  MENU_ITEM ||--o{ EVENT_MENU_LINE : appears_as
  MENU_PACKAGE ||--o{ PACKAGE_LINE : contains
  MENU_ITEM ||--o{ RECIPE : may_have
  RECIPE ||--o{ RECIPE_LINE : contains
  INGREDIENT ||--o{ RECIPE_LINE : used_in
  SUBEVENT }o--o| ROOM : scheduled_in
  ROOM ||--o{ ROOM_BLOCK : blocked_by
  SUBEVENT ||--o{ SHIFT : needs
  SHIFT ||--o{ SHIFT_ASSIGNMENT : assigned
  EMPLOYEE ||--o{ SHIFT_ASSIGNMENT : works
  EVENT ||--o{ INVOICE : billed_by
  INVOICE ||--o{ INVOICE_LINE : contains
  INVOICE ||--o{ PAYMENT : paid_by
  EVENT ||--o{ DOCUMENT_INSTANCE : generates
  DOCUMENT_INSTANCE ||--o{ SIGNATURE_EVENT : signed_by
  EVENT ||--o{ TASK : tracks
  TENANT ||--o{ AUDIT_EVENT : records
```

### 7.3 Data design principles

-   Every business record belongs to a tenant.
-   Use stable IDs; never rely on display names as foreign keys.
-   Use created_at, updated_at, created_by and updated_by.
-   Use soft-delete/archive where history must remain.
-   Store status transitions and important changes in an audit/event
    history.
-   Store currency code and decimal monetary values.
-   Store timestamps consistently (UTC in production) and render in
    configured time zone.
-   Snapshot event pricing, taxes and contractual document versions.
-   Validate foreign keys and prevent orphaned event details.
-   Use database transactions for multi-record updates.
-   Use idempotency keys for payments, imports and scheduled deliveries.
-   Keep sensitive payment data with the payment provider.
-   Define retention and deletion policies.
-   Add indexes for tenant_id, event date, status, client ID, event
    number and common search fields.
-   Do not expose cross-tenant records in reports, search, AI, exports
    or portals.

------------------------------------------------------------------------

## 8. Proposed technical architecture for FeastFlow

### 8.1 Demo architecture versus production architecture

**Current demo boundary:** FeastFlow VP is an existing
HTML/CSS/JavaScript application with seeded data. First extend and
stabilize that demo. Do not prematurely rebuild the UI or introduce a
production backend solely for the demo.

**Production target (proposal):** - Frontend: modular web UI, responsive
and accessible. - Backend: API service with validation, authorization
and business logic. - Database: relational database for transactional
entities. - File storage: private object storage for
attachments/documents. - Background jobs: scheduled reports,
notifications, document generation and data imports. - Payment provider:
hosted/tokenized payment flow. - Email/SMS provider: configured
notifications. - Analytics: deterministic metric layer and query
services. - AI service: constrained natural-language interface to
approved metrics. - Observability: logs, metrics, traces, alerts and
audit events. - Deployment: CI/CD, environment-specific configuration,
backups and rollback.

### 8.2 Suggested production stack (proposal, not Caterease stack)

-   Frontend: TypeScript + React or retain the current framework if
    suitable.
-   API: Python FastAPI or Django REST Framework, selected based on team
    needs.
-   Database: PostgreSQL.
-   Jobs: a queue/worker system appropriate to deployment scale.
-   File storage: S3-compatible object storage or cloud equivalent.
-   Authentication: established identity library/provider, secure
    sessions and MFA for privileged roles.
-   Tests: unit/integration tests plus Playwright end-to-end tests.
-   Deployment: containerized application with managed database where
    possible.

Stack choice must follow actual team skill, budget, hosting and support
constraints. The public Caterease pages do not reveal their internal
technology stack.

### 8.3 Frontend module boundaries

Suggested independent modules: - `events` - `clients` - `prospects` -
`calendar` - `venues` - `menus` - `recipes` - `inventory` - `staffing` -
`equipment` - `quotes` - `invoices` - `payments` - `documents` -
`tasks` - `reports` - `dashboard` - `portal` - `kitchen-display` -
`settings` - `audit` - `assistant`

Use shared domain utilities for currency, date/time, validation,
permissions, notifications and audit. Avoid one enormous global state
object and duplicated calculation code.

### 8.4 Existing demo refactoring strategy

1.  Inventory all current HTML files, scripts, styles, storage keys,
    navigation and seeded records.
2.  Record baseline screenshots and existing working behaviors.
3.  Identify duplicate logic and current module boundaries.
4.  Create a feature-to-file map.
5.  Add only the smallest necessary abstractions to support missing
    features.
6.  Preserve the current look and existing data unless the requirement
    explicitly calls for a change.
7.  Keep a migration/backup copy before editing.
8.  Add new modules incrementally.
9.  Maintain compatibility with existing demo records.
10. Re-test the original workflows after every change.

### 8.5 Demo persistence

If the demo remains client-side: - Use a versioned
localStorage/IndexedDB schema. - Add export/import of demo data. -
Validate imported JSON/CSV before committing. - Show a visible
"demo/local data" indicator. - Include reset-to-seed-data behavior. -
Avoid storing real personal or payment data. - Document that local
persistence is device/browser-specific and not multi-user
synchronization.

A production multi-user system requires server-side persistence and
access control.

------------------------------------------------------------------------

## 9. Security, privacy and compliance requirements

1.  Authentication and session management.
2.  Tenant isolation on every query and mutation.
3.  Role-based and, where needed, record-level authorization.
4.  Least-privilege defaults.
5.  Secure password reset and optional MFA.
6.  Input validation and output escaping.
7.  CSRF protection where cookie sessions are used.
8.  Rate limiting and abuse monitoring.
9.  Secure upload validation and malware scanning where appropriate.
10. Private file URLs with short-lived access grants.
11. Encryption in transit and at rest.
12. Secrets stored outside source control.
13. Payment provider tokenization; never store raw CVV.
14. Audit logs for financial, permission, status and document changes.
15. Data export and deletion processes.
16. Backups and tested recovery.
17. Dependency and vulnerability scanning.
18. Accessibility and privacy review.
19. AI query permission enforcement and prompt-injection defenses.
20. Data minimization for AI and analytics.
21. Anonymization controls for benchmark data.
22. Incident response and access revocation.

This list is a proposed production checklist, not a statement that
Caterease uses any particular implementation.

------------------------------------------------------------------------

## 10. Functional requirements and acceptance criteria

### 10.1 Global requirements

-   Global search must return only records the user may access.
-   Create/edit forms validate required fields and display actionable
    errors.
-   Destructive actions require confirmation and preserve history where
    appropriate.
-   Empty/loading/error states must be explicit.
-   List pages support search, sort, filters, pagination and reset.
-   Dates, time zones and currency formatting are consistent.
-   Derived financial values are computed centrally and
    deterministically.
-   Exported values match the visible filtered result.
-   Every core action has a meaningful success/failure state.
-   No visible control should be a dead button.
-   All modules use stable IDs and shared records.
-   A seeded dataset must cover common and edge-case scenarios.

### 10.2 Event acceptance tests

-   Create event with valid client/date/guest count.
-   Reject invalid date range.
-   Add multiple sub-events.
-   Edit event and verify calendar/scheduler changes.
-   Update guests and verify menu quantity recalculation.
-   Change status and verify dashboard/report behavior.
-   Add note, allergy and attachment.
-   Search by event number and client.
-   Cancel event and ensure it is excluded/included according to report
    rules.
-   Close event and prevent invalid operational edits according to
    policy.

### 10.3 Financial acceptance tests

-   Sum line items correctly.
-   Apply discounts in the documented order.
-   Calculate service charges on configured eligible bases.
-   Apply inclusive/exclusive tax correctly.
-   Record deposit and installment payments.
-   Handle failed, pending, successful and refunded payments.
-   Balance reconciles to invoice and ledger.
-   Commission uses the correct sales basis and date range.
-   Zero guests/zero revenue does not cause division errors.
-   Rounding is consistent at currency precision.

### 10.4 Scheduling acceptance tests

-   Two bookings cannot overlap in an exclusive room.
-   Setup/teardown buffers are respected.
-   Room blocks prevent booking.
-   Breakout rooms/capacity constraints are applied.
-   Staff conflict is flagged.
-   Rescheduling updates all linked views.
-   Time zone display is consistent.

### 10.5 Reporting and AI acceptance tests

-   Report filters match expected record set.
-   Aggregates reconcile to known seeded data.
-   CSV/PDF export matches preview.
-   Scheduled report sends once per intended run.
-   Unauthorized recipient cannot receive restricted records.
-   AI answers use only approved metrics and allowed data.
-   Ambiguous question requests clarification.
-   No-match question reports no matching records.
-   Result includes date range, metric definition and drill-down/source
    evidence.
-   Malicious prompt cannot bypass role/tenant restrictions.

------------------------------------------------------------------------

## 11. Seeded demo data strategy

The demo should include realistic but fictional records and
relationships, not just disconnected placeholder cards.

### 11.1 Minimum suggested seed volume

-   30--50 clients across corporate, wedding, social, nonprofit and
    private categories.
-   50--100 events across all lifecycle states.
-   1--4 sub-events per larger event.
-   50--100 menu items and several menu packages.
-   Recipes for common food items and ingredients.
-   15--30 staff records with availability and skills.
-   Several venues, rooms, capacities, room blocks and conflicts.
-   Inventory stock, movements, low-stock and waste examples.
-   Invoices, deposits, balances, refunds and simulated payments.
-   Documents in draft/sent/signed/expired states.
-   Tasks in open/due/overdue/completed states.
-   Reports with predictable output.
-   Allergy/dietary and special-request examples.
-   Import rows with duplicates, invalid fields and valid records.

These are recommendations for test coverage, not claims about the
Caterease dataset.

### 11.2 Seed data quality

-   Use fictional names and contact information.
-   Mark all payment activity simulated.
-   Include referentially valid records.
-   Include known expected totals for reconciliation tests.
-   Include at least one record for every state.
-   Make demo reset deterministic.
-   Avoid using real people's personal details from screenshots.

------------------------------------------------------------------------

## 12. Feature-gap audit template

Complete this table against the existing FeastFlow codebase.

  -----------------------------------------------------------------------------------------------------------------
  Feature            Caterease      FeastFlow   Gap         Priority   Dependencies            Test
                     evidence       current                                                    
                                    state                                                      
  ------------------ -------------- ----------- ----------- ---------- ----------------------- --------------------
  Event manager      Public page +  Inspect     To          P0         Client, event,          Create/edit/status
                     screenshot     current     determine              sub-event               
                                    files                                                      

  Sub-events         Training +     Inspect     To          P0         Event/menu/schedule     Multiple functions
                     screenshot                 determine                                      

  Scheduler          Screenshot +   Inspect     To          P0         Venue/room/time         Conflict detection
                     training                   determine                                      

  Clients/contacts   Support        Inspect     To          P0         Tenant/users            Duplicate merge
                     resources                  determine                                      

  Menu packages      Features page  Inspect     To          P0         Menu catalog            Quantity/price
                                                determine                                      

  Costing/finance    Screenshot +   Inspect     To          P0         Lines/tax/payment       Reconciliation
                     pricing                    determine                                      

  Staff shifts       Features page  Inspect     To          P1         Employee/availability   Overlap
                                                determine                                      

  Recipes            Features page  Inspect     To          P1         Ingredient/unit         Scale yield
                                                determine                                      

  Packing lists      Features page  Inspect     To          P1         Equipment/menu          Aggregate
                                                determine                                      

  Tasks/reminders    Features page  Inspect     To          P1         User/parent record      Due state
                                                determine                                      

  Document builder   Public         Inspect     To          P1         Templates/events        Preview/version
                     support +                  determine                                      
                     screenshot                                                                

  Portal             Features       Inspect     To          P2         Identity/documents      Access control
                     page +                     determine                                      
                     training                                                                  

  Reports            Features       Inspect     To          P1         Metric definitions      Reconcile
                     page +                     determine                                      
                     screenshot                                                                

  Scheduled reports  Screenshot     Inspect     To          P2         Jobs/recipients         Idempotency
                                                determine                                      

  Kitchen display    Features       Inspect     To          P1         Menus/sub-events        Prep totals
                     page +                     determine                                      
                     screenshot                                                                

  AI assistant       Features       Inspect     To          P2         Metrics/auth            Safe query
                     page +                     determine                                      
                     screenshot                                                                

  Industry trends    Features       Inspect     To          P3         Anonymized aggregates   Privacy
                     page +                     determine                                      
                     screenshot                                                                

  Import/export      Existing       Inspect     To          P1         Schema/validation       Duplicate/rollback
                     project                    determine                                      
                     requirement                                                               

  Audit trail        Pricing        Inspect     To          P1         Identity/domain events  Actor history
                     comparison                 determine                                      
                     references                                                                
  -----------------------------------------------------------------------------------------------------------------

Priority: - **P0:** Core demo integrity and event lifecycle. - **P1:**
Essential operational depth. - **P2:** Advanced customer/reporting
automation. - **P3:** Benchmarking or advanced differentiators.

The "FeastFlow current state" column must be populated only after
inspecting the latest actual source files. Do not mark features complete
because a button or mockup exists; verify the workflow.

------------------------------------------------------------------------

## 13. Development roadmap

### Phase 0 --- Baseline and evidence inventory

-   Collect latest FeastFlow files.
-   Identify entry points, module navigation, state/data storage and
    seed data.
-   Capture baseline behavior and known defects.
-   Create a file/module map and test checklist.
-   Archive a baseline before changes.

**Exit:** Existing functionality and source layout are documented.

### Phase 1 --- Core data integrity

-   Normalize clients, contacts, events and sub-events where necessary.
-   Centralize validation, ID generation, money and date utilities.
-   Add consistent status/history behavior.
-   Ensure seeded records have valid relationships.

**Exit:** Core entities can be created/edited without corrupting linked
records.

### Phase 2 --- Event lifecycle and calendar/scheduler

-   Complete event forms and event list filters.
-   Add sub-event management.
-   Connect calendar/scheduler to the same data.
-   Add venue/room constraints and conflict warnings.

**Exit:** One event update is reflected consistently across all views.

### Phase 3 --- Menus, costing and financials

-   Complete catalog and packages.
-   Add quantity rules and recipe links.
-   Centralize price/tax/service charge calculations.
-   Add invoices, payments and balances.
-   Add known-value calculation tests.

**Exit:** Totals reconcile and are traceable to line items.

### Phase 4 --- Production and staffing

-   Add recipe/ingredient aggregation.
-   Add equipment packing lists.
-   Add inventory movements and purchasing where in scope.
-   Add employee availability, shift assignments and conflicts.
-   Add kitchen production view.

**Exit:** Event menu changes update production requirements.

### Phase 5 --- Documents, tasks and client experience

-   Add template-driven prints.
-   Add task/reminder workflows.
-   Add event portal simulation if appropriate for demo.
-   Clearly mark simulated signature/payment behavior.

**Exit:** Event information can produce coherent customer and internal
documents.

### Phase 6 --- Analytics, reporting and AI

-   Define metric catalog and date basis.
-   Build filterable dashboard and reports.
-   Add CSV/PDF exports and scheduled-report simulation.
-   Add constrained AI query intents only after deterministic metrics
    work.

**Exit:** All displayed analytics reconcile to the seed dataset.

### Phase 7 --- Quality and release

-   Run end-to-end tests and regression tests.
-   Test import/export and reset behavior.
-   Test keyboard accessibility, responsive views and empty/error
    states.
-   Check for dead buttons, console errors and inconsistent totals.
-   Produce a known limitations list.

**Exit:** Demo is reliable and demonstrable; production-only features
are clearly labeled.

### Phase 8 --- Production discovery and architecture

After the demo scope is stable: - Confirm business requirements with
real users. - Choose backend/API/database. - Define authentication and
tenant isolation. - Define payment/email/document providers. - Build
migration plan from demo data to server-backed records. - Establish
backups, observability, security and deployment. - Conduct acceptance
and security testing.

**Exit:** Production architecture and release plan approved.

------------------------------------------------------------------------

## 14. Project management and delivery artifacts

Maintain these documents in the project repository: 1.
`CATEREASE_PUBLIC_EVIDENCE_REGISTER.md` 2. `CATEREASE_FEATURE_MATRIX.md`
3. `FEASTFLOW_CURRENT_STATE_AUDIT.md` 4. `FEASTFLOW_GAP_ANALYSIS.md` 5.
`FEASTFLOW_DOMAIN_MODEL.md` 6. `FEASTFLOW_WORKFLOW_SPEC.md` 7.
`FEASTFLOW_API_SPEC.md` (once a backend is designed) 8.
`FEASTFLOW_TEST_PLAN.md` 9. `FEASTFLOW_SECURITY_CHECKLIST.md` 10.
`FEASTFLOW_RELEASE_NOTES.md`

Each feature should have: - Requirement ID. - Description. -
Source/evidence. - Confidence. - Acceptance criteria. - Dependencies. -
UI location. - Data entities. - Validation and permissions. - Test
IDs. - Status and known limitations.

Recommended feature states: Not reviewed → Discovered → Specified → In
progress → Implemented → Tested → Accepted. "Implemented" and "Tested"
must be separate states.

------------------------------------------------------------------------

## 15. Marketing plan for FeastFlow (proposal)

Do not copy Caterease branding, text, screenshots, trade dress or
proprietary materials. Build a distinct FeastFlow message around
demonstrated value.

### 15.1 Positioning statement

"FeastFlow helps catering teams manage inquiries, event planning, menus,
staffing, production and payments in one connected workflow."

Validate this statement against the actual product before publishing.

### 15.2 Recommended website structure

1.  Hero: target user, main outcome, product demo CTA.
2.  Workflow overview: Inquiry → Quote → Confirm → Prepare → Serve →
    Close.
3.  Feature sections: Event management, menu costing, scheduling,
    kitchen operations, finance, analytics.
4.  Interactive product demo with fictional data.
5.  Role-based use cases: owner, sales, operations, kitchen, finance.
6.  Integrations and security page only for capabilities actually
    delivered.
7.  Pricing with transparent plan limits.
8.  Onboarding and migration.
9.  Customer stories only when real and authorized.
10. FAQ, support and contact.

### 15.3 Product-led conversion ideas

-   Clickable sandbox/demo with reset button.
-   Example event that flows through menu, schedule, invoice and kitchen
    display.
-   Guided checklist after first login.
-   Import preview and mapping assistant.
-   ROI calculator based on user-supplied assumptions, clearly labeled
    estimates.
-   Sample reports using demo data.
-   In-app education and contextual help.

### 15.4 Pricing strategy options to test

Do not directly mirror competitor prices without unit economics and
customer research. Possible FeastFlow structure: - **Starter:** single
operator, core events/clients/quotes. - **Growth:** multiple users, menu
costing, staffing and production. - **Professional:** advanced
permissions, automation, reporting and integrations. - Add-ons only
where operational complexity genuinely differs.

Test willingness to pay, user/venue limits, support cost, payment
processing economics, onboarding effort and churn. State tax, billing
cadence, overages, cancellation terms and included modules clearly.

### 15.5 Marketing measurement

Track: - Visitor-to-demo-start rate. - Demo completion rate. -
Lead-to-qualified rate. - Trial-to-paid conversion. - Time to first
created event. - Time to first quote sent. - Weekly active teams. -
Events managed per account. - Feature adoption by role. - Support
tickets per account. - Retention and churn. - Customer acquisition cost
and payback period.

Do not invent traction, testimonials, customer counts or benchmarks.

------------------------------------------------------------------------

## 16. Deployment and operational readiness

### Demo readiness

-   All buttons and forms work.
-   Seed data loads and resets.
-   Demo state survives refresh where expected.
-   No real payments or messages are sent.
-   Import/export validates data.
-   Clear limitations are displayed.
-   Works in supported desktop browsers.
-   No console errors in primary flows.

### Production readiness

-   Environment-specific configuration and secret management.
-   CI tests and code review.
-   Database migrations and rollback strategy.
-   Automated backups and recovery tests.
-   Monitoring, logging and alerting.
-   Rate limits and abuse prevention.
-   Authentication, authorization and tenant-isolation tests.
-   Privacy policy, terms and retention process.
-   Payment-provider approval and reconciliation.
-   Email domain and delivery configuration.
-   File retention and secure links.
-   Load and performance tests.
-   Accessibility review.
-   Incident response plan.
-   Staged rollout and rollback procedure.

------------------------------------------------------------------------

## 17. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                    Consequence             Mitigation
  ----------------------- ----------------------- -----------------------
  Public-only visibility  Hidden behavior cannot  Mark unknowns; use
                          be confirmed            official guides and
                                                  screenshots

  Treating mockups as     False parity claims     Test interactions and
  working features                                data flows

  Starting from scratch   Regression and wasted   Audit and extend
                          effort                  current FeastFlow code

  Duplicated calculations Financial               Centralized calculation
                          inconsistencies         engine and known-value
                                                  tests

  Disconnected sample     Demo feels fake and     Relational seed data
  data                    reports disagree        and reconciliation
                                                  tests

  Scope explosion         Demo never stabilizes   Dependency-based phases
                                                  and P0/P1/P2 priorities

  Unsafe AI queries       Data leakage or         Approved metrics,
                          incorrect answers       authorization and
                                                  read-only query layer

  Fake production claims  Trust and compliance    Label simulated
                          risk                    payments/signatures and
                                                  planned features

  Copying protected       IP and brand risk       Original code, visual
  assets                                          design, copy and sample
                                                  data

  Overstated              Re-identification risk  Cohort thresholds,
  anonymization                                   suppression and privacy
                                                  review

  Inadequate auditability Disputes and debugging  Actor/time history and
                          difficulty              financial/document
                                                  audit events
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 18. Open questions and unknowns

The following cannot be settled from the current public evidence
alone: - Exact private application architecture and database schema. -
Full field lists and conditional validation logic for every screen. -
Exact status lifecycle and permission matrix. - Detailed tax/service
charge order and rounding rules. - All payment-provider and integration
contracts. - Full report/query expression language. - AI model,
retrieval design and internal tool implementation. - Exact portal
security/session behavior. - Detailed inventory reservation and
purchasing logic. - Which features are included in each plan when
pricing-table details are not fully legible. - Actual production SLAs,
backup/retention settings and internal security controls. - Current
state of every FeastFlow feature without inspecting the latest source
files.

Keep these items in an "unknowns" register; do not fill them with
guesses and label them facts.

------------------------------------------------------------------------

## 19. Official references

1.  Caterease homepage --- https://www.caterease.com/
2.  Caterease features --- https://www.caterease.com/features/
3.  Caterease pricing --- https://www.caterease.com/pricing/
4.  Support documentation ---
    https://help.caterease.com/docs/resources/documentation/
5.  Training videos ---
    https://help.caterease.com/docs/resources/training-videos/
6.  Free user training ---
    https://help.caterease.com/free-user-training/
7.  Training --- https://help.caterease.com/training/
8.  New user onboarding ---
    https://help.caterease.com/new-user-onboarding/
9.  Support home --- https://help.caterease.com/

### Key evidence summarized

-   The public features page describes event booking wizards, dynamic
    menu building, customizable prints, shifts/staffing, recipes/packing
    lists, payment processing, client management and tasks/reminders.
-   The same page describes Horizon Hub, AI Assistant, event portals,
    dashboards, calendar, reports, Kitchen Display, Sign & Send and
    Industry Trends.
-   The public pricing page displays Express, Standard and Professional
    tiers and describes optional add-ons.
-   Public training resources cover event booking, Event Manager tools,
    administrative setup and other workflows.
-   Public support resources list program guidebooks, quick reference
    guides and training videos for modules such as Document Builder,
    Guestrooms Manager, Ingredient Management, Prospect Manager, Banquet
    Rooms and Reports & Queries.

Revisit the links because marketing, feature packaging and pricing can
change. Use public claims only with their source and date.

------------------------------------------------------------------------

## 20. Final implementation principle

**The objective is not to clone Caterease's private implementation. It
is to understand its publicly observable product scope and build an
independently implemented, functionally coherent FeastFlow product.**

The recommended order is: 1. Finish evidence collection. 2. Inspect the
current FeastFlow source and seed data. 3. Build the gap matrix. 4.
Complete core event, sub-event, scheduling, menu and financial
workflows. 5. Connect production, staffing, documents and reporting. 6.
Add portal, AI and advanced modules after deterministic workflows are
reliable. 7. Run regression tests and prepare the production
architecture separately.

The most important success criterion is end-to-end consistency: a change
to an event must correctly flow through menus, quantities, venue
scheduling, staff, production, documents, financial totals and reports.
A visually impressive screen without those connections is not a complete
application.

# PART II --- IMPLEMENTATION-LEVEL TECHNICAL GUIDE

> **Critical evidence boundary:** The following implementation details
> describe a technically sound way to build a product with comparable
> *publicly described capabilities*. They are not claims about
> Caterease's actual private framework, code, database, API, cloud
> provider, algorithms, or AI model. Those internals are not
> discoverable from public marketing pages alone.

## 21. Engineering principles and system boundaries

### 21.1 Functional parity, not source-code cloning

Build equivalent business outcomes from independently written code. For
every feature, separate: - **Observed interface:** visible labels,
fields, layout and controls. - **Documented capability:** what official
public materials say it does. - **Inferred behavior:** necessary
workflow assumptions requiring confirmation. - **FeastFlow
implementation decision:** the actual behavior we choose to build. -
**Acceptance evidence:** tests proving the chosen behavior works.

Do not reproduce Caterease logos, copyrighted copy, private data, or
proprietary visual assets. Screenshots can inform information
architecture, not justify direct copying of branding or assets.

### 21.2 Recommended architecture layers

``` text
Web UI / Kitchen Display / Client Portal
                  |
          UI state + validation
                  |
        Authenticated API boundary
                  |
       Application use-case services
                  |
   Domain rules / calculations / policies
                  |
        Repository / transaction layer
                  |
  Relational database + file object storage
                  |
 Queue/workers: reports, emails, documents,
 scheduled tasks, imports, notifications
                  |
 External providers: payment, email, e-sign,
 calendar, AI inference (optional)
```

The browser should not be the authority for payment totals, permissions,
availability or final report values in production. It may preview
calculations, but the server must recompute and validate them before
persisting changes.

### 21.3 Module ownership

Each domain module should own its rules and expose services rather than
allowing arbitrary modules to mutate its records: - Events owns event
lifecycle and sub-event relationships. - Scheduling owns resource
availability and conflict detection. - Menus owns
catalog/package/quantity rules. - Costing owns deterministic monetary
calculation. - Inventory owns stock ledger and reservation rules. -
Staffing owns shift availability and assignment conflicts. - Documents
owns template versioning and generated artifacts. - Payments owns
payment intents, processor references, reconciliation and refunds. -
Analytics owns metric definitions and aggregate queries. -
Identity/authorization owns tenant and permission checks. - Audit owns
append-only records of important changes.

Cross-module changes should be coordinated by application services and
database transactions where possible. For long-running external actions,
use an outbox/job pattern rather than holding a database transaction
open while calling an external provider.

------------------------------------------------------------------------

## 22. Detailed data dictionary proposal

The following is a starting contract, not an assertion about Caterease's
internal schema. Use migrations and explicit constraints when
implementing it.

### 22.1 Common record fields

For most mutable domain tables: - `id`: UUID or database-generated
stable identifier. - `tenant_id`: required tenant/business boundary. -
`created_at`, `updated_at`: UTC timestamps. - `created_by`,
`updated_by`: user IDs where applicable. - `archived_at`: nullable
archive timestamp if archival is supported. - `version`: integer
optimistic-lock version where concurrent edits matter.

Avoid using the client-facing event number as the primary key. Event
numbers are identifiers for humans and can have format rules; internal
IDs should remain stable.

### 22.2 Tenant and identity

**tenant** - id, legal_name, display_name, default_currency, timezone,
locale, settings_json, status.

**user** - id, tenant_id, email_normalized, display_name,
auth_provider_subject, status, last_login_at.

**role / permission / user_role / role_permission** - Define permission
strings such as `events.read`, `events.create`, `events.update`,
`events.cancel`, `payments.refund`, `reports.export`,
`settings.manage`. - Scope permissions by tenant and, where required, by
record/venue. - Do not rely on hiding buttons as authorization.

### 22.3 Clients and contacts

**client** - id, tenant_id, client_number, client_type, legal_name,
display_name, status, primary_email, primary_phone, billing_address_id,
default_tax_profile_id, source_id, notes, merged_into_client_id.

**contact** - id, tenant_id, client_id, first_name, last_name, email,
phone, role/title, preferred_contact_method, is_primary, active.

**address** - id, tenant_id, line1, line2, city, region, postal_code,
country_code, address_type.

A client merge must be a controlled transaction: preview records to
merge, choose survivor, reassign foreign keys, retain an audit record,
and avoid destroying financial/legal history. For production, consider a
reversible merge map instead of physical deletion.

### 22.4 Events and functions

**event** - id, tenant_id, event_number, client_id, party_name,
event_type_id, category_id, sales_rep_id, booking_contact_id,
site_contact_id, event_date, timezone, planned_guests, actual_guests,
guaranteed_guests, status, booked_at, revised_at, closed_at,
cancellation_reason, reference_code, notes, version.

**sub_event** - id, tenant_id, event_id, name, service_type_id,
start_at, end_at, venue_id, room_id, guest_count, setup_style_id,
status, notes, sort_order.

**event_status_history** - id, tenant_id, event_id, old_status,
new_status, changed_by, changed_at, reason.

**event_note** - id, tenant_id, parent_type, parent_id, body,
visibility, created_by, created_at.

**attachment** - id, tenant_id, parent_type, parent_id, storage_key,
original_filename, content_type, size_bytes, checksum, visibility,
uploaded_by, created_at.

Use a constrained parent type or explicit join tables for
attachments/notes. Do not let an arbitrary client-supplied parent ID
grant access to an attachment.

### 22.5 Catalog, packages and recipes

**menu_item** - id, tenant_id, sku, name, description, category_id,
item_type, unit_id, sell_price, cost_basis, minimum_quantity,
quantity_increment, units_per_guest, taxable, service_charge_eligible,
active, version.

**menu_package** - id, tenant_id, name, description, default_price,
active, version.

**menu_package_line** - id, package_id, menu_item_id, default_quantity,
quantity_rule, override_allowed.

**event_menu_line** - id, tenant_id, event_id, sub_event_id,
menu_item_id, item_name_snapshot, unit_name_snapshot, quantity,
unit_price_snapshot, unit_cost_snapshot, discount_amount,
tax_profile_snapshot, source_package_id, manual_override_reason,
sort_order.

Snapshots protect a booked event from later catalog edits. Decide
whether an event can intentionally refresh snapshots; if so, require
preview and audit.

**recipe** - id, tenant_id, menu_item_id, name, yield_quantity,
yield_unit_id, instructions, version.

**recipe_line** - id, recipe_id, ingredient_id, quantity, unit_id,
prep_loss_factor.

**ingredient** - id, tenant_id, name, sku, unit_id, supplier_id,
average_cost, active, allergen_codes.

Use explicit unit conversion tables. Do not convert mass to volume
without ingredient-specific density data. A unit mismatch should produce
a validation error, not a silent conversion.

### 22.6 Scheduling

**venue** - id, tenant_id, name, address_id, timezone, active.

**room** - id, tenant_id, venue_id, name, capacity,
setup_buffer_minutes, teardown_buffer_minutes, exclusive_booking,
active.

**resource_block** - id, tenant_id, room_id/resource_id, start_at,
end_at, reason, created_by.

**resource_reservation** - id, tenant_id, sub_event_id, resource_id,
start_at, end_at, reservation_status.

For production databases, use a concurrency-safe conflict mechanism. A
"check availability then insert" sequence can race if two users book the
same room at once. Use a database exclusion constraint where supported,
a serializable/locked transaction, or a unique reservation mechanism
that atomically enforces non-overlap.

### 22.7 Staffing

**employee** - id, tenant_id, display_name, contact details as required,
active, employment_type.

**employee_skill** - employee_id, skill_id, proficiency/qualification
state.

**availability** - id, employee_id, start_at, end_at, availability_type,
approved_by.

**shift** - id, tenant_id, sub_event_id, role_id, start_at, end_at,
required_count, estimated_hours, status.

**shift_assignment** - id, shift_id, employee_id, status,
hourly_rate_snapshot, assigned_by, assigned_at, override_reason.

Do not store sensitive HR information unless required. Enforce overlap
and qualifications in the domain service and again at the transactional
boundary.

### 22.8 Inventory and purchasing

**stock_item** can reference an ingredient, equipment item or separate
stock SKU, but keep stock semantics explicit.

**inventory_balance** may be a cache/projection; the source of truth
should be an immutable **inventory_movement** ledger: - id, tenant_id,
stock_item_id, location_id, movement_type, quantity_delta, unit_id,
unit_cost_snapshot, source_type, source_id, occurred_at, created_by,
reason.

**purchase_order** - id, tenant_id, supplier_id, status, ordered_at,
expected_at, received_at, currency, subtotal, tax, total.

**purchase_order_line** - id, purchase_order_id, stock_item_id,
quantity_ordered, quantity_received, unit_price, unit_id.

Use a transaction to create stock receipt and inventory movements.
Prevent receiving the same shipment twice with a unique receipt
reference/idempotency key.

### 22.9 Finance

**invoice** - id, tenant_id, event_id, invoice_number, currency,
issue_date, due_date, status, subtotal, discounts, service_charge,
tax_total, total, balance, version.

**invoice_line** - id, invoice_id, source_type, source_id,
description_snapshot, quantity, unit_price, discount, taxable_base,
tax_rate_snapshot, line_total.

**payment** - id, tenant_id, invoice_id, provider, provider_payment_id,
idempotency_key, amount, currency, status, initiated_at, settled_at,
failure_code, reconciliation_status.

**refund** - id, tenant_id, payment_id, provider_refund_id, amount,
status, reason, created_by, created_at.

**payment_allocation** - id, payment_id, invoice_id, allocated_amount.

For partial payments or payments spanning multiple invoices, use
explicit allocations. Do not assume a payment amount can be subtracted
from a single invoice without recording allocation.

### 22.10 Documents, signatures and portals

**document_template** - id, tenant_id, name, template_type, version,
content_definition, status, created_by.

**document_instance** - id, tenant_id, template_id, template_version,
event_id, storage_key, content_hash, status, generated_at, sent_at,
voided_at.

**document_signer** - id, document_instance_id, contact_id, signer_role,
email_snapshot, status.

**signature_event** - id, document_instance_id, signer_id,
provider_event_id, event_type, occurred_at, metadata_safe.

**portal_invitation** - id, tenant_id, event_id, contact_id, token_hash,
expires_at, revoked_at, last_access_at.

Store a hash of a portal token, not the raw long-lived bearer token. Use
expiration, revocation and minimum privileges. Keep internal notes and
cost/margin fields outside customer portal serializers.

### 22.11 Reports, jobs and audit

**report_definition** - id, tenant_id, name, metric_ids, filters_json,
group_by_json, column_config_json, owner_id, visibility.

**report_schedule** - id, tenant_id, report_definition_id, recurrence,
timezone, next_run_at, recipients_json, status, last_run_at.

**job_run** - id, tenant_id, job_type, idempotency_key, status,
started_at, finished_at, retry_count, error_code.

**audit_event** - id, tenant_id, actor_id, action, entity_type,
entity_id, timestamp, request_id, safe_diff_json, reason.

Do not log passwords, payment credentials, raw access tokens or
unrestricted sensitive document content. Audit logs should be
append-only for application roles.

------------------------------------------------------------------------

## 23. API design

These endpoints are a proposed FeastFlow contract. They are not
Caterease API endpoints.

### 23.1 API conventions

-   Prefix versioned routes with `/api/v1`.
-   JSON request/response bodies.
-   UUIDs for internal IDs.
-   UTC ISO 8601 timestamps.
-   Pagination: `limit`, `cursor` or `page`/`page_size`; document one
    convention.
-   Filters use allow-listed field names.
-   Sort fields are allow-listed to avoid injection.
-   Consistent errors:
    `{ "error": { "code": "...", "message": "...", "fields": {} } }`.
-   Use optimistic concurrency (`version` or `If-Match`) on
    high-conflict updates.
-   Use idempotency keys on payment, import, notification and other
    retryable commands.
-   Return server-calculated totals and current version.
-   Use `409 Conflict` for availability/version conflicts, `422` for
    validation, `401/403` for identity/permission failures and `404`
    when resource is absent or intentionally concealed.

### 23.2 Endpoint catalogue

**Identity and settings** - `GET /api/v1/me` - `GET /api/v1/settings` -
`PATCH /api/v1/settings`

**Clients** - `GET /api/v1/clients?search=&status=&cursor=` -
`POST /api/v1/clients` - `GET /api/v1/clients/{id}` -
`PATCH /api/v1/clients/{id}` -
`POST /api/v1/clients/{id}/merge-preview` -
`POST /api/v1/clients/{id}/merge`

**Events** -
`GET /api/v1/events?from=&to=&status=&client_id=&sales_rep_id=` -
`POST /api/v1/events` - `GET /api/v1/events/{id}` -
`PATCH /api/v1/events/{id}` -
`POST /api/v1/events/{id}/status-transitions` -
`POST /api/v1/events/{id}/duplicate` -
`POST /api/v1/events/{id}/close` - `POST /api/v1/events/{id}/cancel`

**Sub-events** - `POST /api/v1/events/{id}/sub-events` -
`PATCH /api/v1/sub-events/{id}` - `DELETE /api/v1/sub-events/{id}` only
when permitted and no protected dependencies exist.

**Scheduling** - `GET /api/v1/schedule?from=&to=&venue_id=` -
`POST /api/v1/availability/check` -
`POST /api/v1/resource-reservations` - `POST /api/v1/resource-blocks` -
`DELETE /api/v1/resource-blocks/{id}`

**Menus and recipes** - `GET /api/v1/menu-items` -
`POST /api/v1/menu-items` - `POST /api/v1/events/{id}/menu-lines` -
`PATCH /api/v1/event-menu-lines/{id}` -
`POST /api/v1/events/{id}/recalculate-preview` -
`GET /api/v1/recipes/{id}` -
`POST /api/v1/production/requirements?date=`

**Staffing** - `GET /api/v1/employees` - `POST /api/v1/shifts` -
`POST /api/v1/shifts/{id}/assignments` -
`POST /api/v1/staffing/conflicts/check`

**Inventory** - `GET /api/v1/inventory/balances` -
`POST /api/v1/inventory/movements` - `POST /api/v1/purchase-orders` -
`POST /api/v1/purchase-orders/{id}/receive`

**Finance** - `POST /api/v1/events/{id}/invoices` -
`GET /api/v1/invoices/{id}` -
`POST /api/v1/invoices/{id}/payment-intents` -
`POST /api/v1/payments/{id}/refunds` -
`POST /api/v1/payments/webhooks/{provider}`

**Documents and portals** - `POST /api/v1/document-templates` -
`POST /api/v1/events/{id}/documents` -
`POST /api/v1/documents/{id}/send` -
`POST /api/v1/documents/{id}/void` - `POST /api/v1/portal-invitations` -
`POST /api/v1/portal-invitations/{id}/revoke`

**Reports** - `POST /api/v1/reports/preview` -
`POST /api/v1/reports/export` - `POST /api/v1/report-schedules` -
`GET /api/v1/report-runs/{id}`

**AI** - `POST /api/v1/assistant/query` -
`GET /api/v1/assistant/query/{id}`

**Audit** - `GET /api/v1/audit-events?entity_type=&entity_id=&from=&to=`

### 23.3 Event creation request example

``` json
{
  "client_id": "2e8f9c50-2bb8-45e6-95dc-7a7bbad5b2d2",
  "party_name": "Corporate Product Launch",
  "event_date": "2026-11-12",
  "timezone": "Asia/Kolkata",
  "planned_guests": 120,
  "status": "tentative",
  "sub_events": [
    {
      "name": "Dinner",
      "start_at": "2026-11-12T18:00:00+05:30",
      "end_at": "2026-11-12T22:00:00+05:30",
      "guest_count": 120,
      "venue_id": "c6ad1db0-7d5c-4f4f-9e1c-7bdf18f0ddaa"
    }
  ]
}
```

Server behavior: 1. Authenticate and authorize. 2. Validate tenant
ownership of client and venue. 3. Validate dates, counts and event
status. 4. Validate resource availability within a transaction. 5.
Generate event number. 6. Insert event and sub-event records. 7. Record
audit/status history. 8. Commit. 9. Return event with server version and
computed summary.

### 23.4 API error example

``` json
{
  "error": {
    "code": "ROOM_CONFLICT",
    "message": "The selected room is already reserved for part of this time range.",
    "fields": {
      "room_id": "The room is unavailable from 18:00 to 20:00."
    }
  }
}
```

Avoid returning another customer's event details in conflict errors. It
is sufficient to report unavailable time and suggest alternatives.

------------------------------------------------------------------------

## 24. Core algorithms and business rules

### 24.1 Money calculation pipeline

Do not implement financial calculations separately in each screen.
Create a pure calculation service that takes normalized lines and
configuration and returns a breakdown.

Recommended sequence (must be explicitly chosen by FeastFlow and
validated with business rules): 1. Calculate each line's gross amount.
2. Apply permitted line-level discounts. 3. Calculate subtotal. 4. Apply
event-level discount to the configured eligible base. 5. Determine
service-charge eligible base. 6. Calculate service charge. 7. Determine
taxable bases by tax profile. 8. Calculate taxes with defined
inclusive/exclusive behavior. 9. Add fees/adjustments. 10. Calculate
total due. 11. Apply payment allocations and refunds to determine
balance.

Use decimal types, explicit rounding mode and currency precision. Keep
intermediate amounts at a documented precision; round only at defined
boundaries. Tax/service-charge order varies by jurisdiction and
contract, so do not assume a universal order.

### 24.2 Quantity calculation

Suggested inputs: - guest count. - quantity basis (per guest, per table,
per event, per unit). - units per basis. - minimum quantity. -
increment/rounding rule. - package expansion. - recipe yield. - waste
factor.

For guest-based line: `raw = guest_count * units_per_guest`

Then: - Apply package/linked quantity rules. - Apply minimum quantity. -
Round up to required increment if configured. - Apply yield/waste rule
only at the correct production layer. - Preserve manual override and
reason. - Show calculation details in UI.

Do not apply waste factor both at menu quantity and recipe ingredient
level unless explicitly intended; this is a common double-counting
error.

### 24.3 Scheduling conflict algorithm

For candidate interval `[start, end)`: 1. Reject if `end <= start`. 2.
Expand interval by setup/teardown buffers. 3. Query active reservations
for the same exclusive resource. 4. Conflict if
`candidate_start < existing_end AND existing_start < candidate_end`. 5.
Apply room capacity and resource compatibility constraints. 6. Recheck
atomically while committing the reservation.

A UI-only conflict check is not sufficient under concurrent production
use.

### 24.4 Event status transition policy

Create a transition table. Example proposal:

  -----------------------------------------------------------------------
  Current                 Allowed next states     Preconditions
  ----------------------- ----------------------- -----------------------
  Prospect                Tentative, Lost         Qualified inquiry

  Tentative               Definite, Lost,         Required details;
                          Cancelled               optionally signed
                                                  contract/deposit

  Definite                In Progress, Cancelled, Operational readiness
                          Closed                  policy

  In Progress             Closed                  Required
                                                  execution/closeout
                                                  fields

  Closed                  Reopened only with      Reason and audit record
                          permission              

  Cancelled               Reopen only with        Reason and
                          permission              conflict/financial
                                                  review
  -----------------------------------------------------------------------

This is a suggested FeastFlow policy. Do not claim it matches
Caterease's exact state machine.

### 24.5 Report metric registry

Every metric should declare: - stable metric ID and display name. -
source entities. - allowed date dimensions. - aggregation method. -
currency treatment. - excluded statuses. - null/zero behavior. -
permitted filters and group-by dimensions. - access classification. -
definition/version.

Example: - `event_revenue_by_event_date`: sum of finalized event charge
totals grouped by event date; exclude cancelled events; refund treatment
explicitly defined. - `cash_received_by_payment_date`: sum of settled
payment amounts by settlement date less successful refunds. -
`food_sales_by_sales_rep`: sum of eligible food menu lines grouped by
sales rep; exclude room rental, equipment and other charges. -
`commission_due`: eligible food sales multiplied by configured
commission rate, with cancellation/refund and commission timing rules
applied.

Do not conflate booked revenue, invoiced revenue, payment receipts and
recognized revenue.

### 24.6 AI-to-query mapping

A natural-language assistant should return a structured query plan, not
arbitrary executable SQL:

``` json
{
  "metric_id": "food_sales_by_sales_rep",
  "date_dimension": "event_date",
  "date_range": {
    "start": "2026-10-01",
    "end_exclusive": "2026-11-01"
  },
  "group_by": ["sales_rep"],
  "filters": [
    {"field": "event_status", "operator": "not_in", "value": ["cancelled"]}
  ],
  "parameters": {"commission_rate": 0.10}
}
```

Then: 1. Validate metric ID. 2. Validate all dimensions/filters against
allow-lists. 3. Resolve the caller's tenant and permission scope from
authenticated context, not from model output. 4. Execute a parameterized
query using the metric definition. 5. Return totals plus calculation
explanation and drill-down IDs. 6. Log query plan, result status and
metric version. 7. Ask a clarification question if the intent cannot be
mapped safely.

The model should not decide access permissions, invent data, execute
writes, or bypass business logic.

------------------------------------------------------------------------

## 25. UI implementation patterns

### 25.1 Event Manager layout

Recommended component tree: - `EventManagerPage` - `EventToolbar` (date
presets, views, filters, create) - `EventList` (search, status, date,
pagination) - `ClientSummaryPanel` - `FinancialSummaryPanel` -
`EventTabs` - `GeneralDetailsForm` - `MiscellaneousForm` -
`SubEventList` - `NotesAndAttachments` - `HistoryPanel`

Keep list selection state separate from persisted event data. Dirty
forms should show unsaved changes and confirm before navigation. Use
field-level validation and a save state. Do not make the full screen a
single form if submodules have independent save lifecycles.

### 25.2 Scheduler UI

Use a virtualization strategy if there are many rooms or events. Keep
the date range and timezone explicit. Event blocks should have text
labels and status indicators; color alone is insufficient. Keyboard
users need an alternative to drag/drop, such as an edit-time dialog.

### 25.3 Forms and validation

-   Client-side validation for immediate feedback.
-   Server-side validation for authority.
-   Normalize phone/email input without destroying original display
    data.
-   Use accessible labels and error summaries.
-   Disable duplicate submissions while a request is pending.
-   Preserve entered data on recoverable failure.
-   Confirm destructive actions.
-   Explain required conditional fields.

### 25.4 Responsive layouts

Desktop may use dense multi-pane tables, while mobile should prioritize
task-specific cards/forms. Do not shrink a desktop grid until unusable.
Use responsive breakpoints and separate layouts where the workflow
differs, particularly for Kitchen Display and client portal.

### 25.5 Accessibility

-   Keyboard navigation and visible focus.
-   Semantic headings and labels.
-   Screen-reader announcements for save/error state.
-   Adequate contrast.
-   Status labels that do not rely on color.
-   Table captions and accessible sort state.
-   Reduced-motion support.
-   Touch targets appropriate to tablet/kitchen use.

------------------------------------------------------------------------

## 26. Background jobs and integration patterns

### 26.1 Use asynchronous jobs for

-   Scheduled report generation and delivery.
-   Large exports/imports.
-   Document rendering.
-   Email and notification delivery.
-   Payment reconciliation.
-   Inventory projection rebuilds.
-   AI queries that exceed interactive latency.
-   External e-signature status updates.

### 26.2 Job reliability

Every job should have: - Stable job ID and idempotency key. - Tenant
context. - Status and attempt count. - Start/end timestamps. - Retry
policy with backoff. - Dead-letter/failure state. - Safe error code. -
Correlation/request ID. - Cancellation behavior where possible.

Do not blindly retry a payment charge or external send without
idempotency. For webhook processing, verify provider signatures, store
provider event IDs, reject duplicates, and process state transitions
idempotently.

### 26.3 Outbox pattern

When a database change must trigger an external action: 1. Commit
business record and an outbox event in one transaction. 2. Worker reads
pending outbox events. 3. Worker performs the external action with an
idempotency key. 4. Worker marks success or schedules retry. 5.
Reconcile events stuck in an ambiguous state.

This avoids losing notifications when the database commits but the
process crashes before sending.

------------------------------------------------------------------------

## 27. Observability and operations

Instrument: - API request latency and error rate. - Database latency and
connection pool saturation. - Scheduler conflict-check latency. - Job
queue depth and job age. - Report generation duration. - Payment webhook
processing failures. - Email/document delivery failures. - AI query
validation failures and latency. - Frontend JavaScript errors. - Import
validation/rejection counts.

Use structured logs with correlation IDs. Redact personal data, tokens
and payment details. Metrics should avoid high-cardinality labels such
as raw client IDs. Alerts should be tied to user impact, not just raw
error counts.

------------------------------------------------------------------------

## 28. Performance and scaling

### 28.1 Initial optimization

-   Index common tenant/date/status/client columns.
-   Avoid N+1 queries when loading events with contacts/sub-events.
-   Paginate large event and client lists.
-   Aggregate dashboard metrics in SQL or a reporting layer.
-   Cache stable catalog/configuration data.
-   Invalidate relevant cache entries on change.
-   Lazy-load large attachments and report previews.
-   Use virtualized tables for large result sets.
-   Move expensive PDF/export work to jobs.
-   Avoid recomputing every dashboard widget on every keystroke.

### 28.2 Consistency

Transactional event details, invoices and payment records require strong
consistency. Some analytics can be eventually consistent if the UI
displays last-updated time and users can refresh. Do not use a stale
analytics projection to decide whether a room is available or whether a
payment succeeded.

### 28.3 Performance targets

Set measurable service-level targets after measuring a representative
workload. Example initial goals for a small production deployment: -
Standard list/detail API p95 under 500 ms excluding external
providers. - Common form saves p95 under 800 ms. - Dashboard first
render under 2 seconds for a normal date range. - Scheduled reports
complete within a defined delivery window. - No duplicate payment/refund
action under retry tests.

These are proposed targets, not Caterease performance claims. Validate
them with load testing and realistic data.

------------------------------------------------------------------------

## 29. Test architecture

### 29.1 Test layers

1.  **Unit tests:** money, quantity, tax, status transition, date
    interval and permission rules.
2.  **Repository tests:** persistence, foreign keys, transaction
    rollback and query filtering.
3.  **Service tests:** event creation, conversion, payment allocation,
    inventory receipt.
4.  **API tests:** validation, authorization, response schemas and error
    codes.
5.  **UI component tests:** forms, filters, empty/error states.
6.  **End-to-end tests:** inquiry through booking, menu, production,
    invoice and closeout.
7.  **Security tests:** tenant isolation, IDOR, injection, role
    escalation, file access.
8.  **Load tests:** list/search, dashboards, concurrent reservations and
    report generation.
9.  **Recovery tests:** backups, failed jobs, retries, webhook
    duplicates and rollback.

### 29.2 High-value end-to-end scenario

1.  Create a client.
2.  Create a prospect and follow-up task.
3.  Convert to a tentative event.
4.  Add two sub-events.
5.  Reserve a venue and room.
6.  Add a package and menu items.
7.  Verify quantity and financial totals.
8.  Assign employees and equipment.
9.  Generate a proposal/BEO.
10. Record simulated deposit.
11. Change guest count and confirm dependent values update.
12. Generate kitchen prep summary.
13. Complete event and enter actual count/cost.
14. Close event.
15. Run sales and revenue reports.
16. Confirm report totals match the event/invoice/payment records.
17. Confirm audit history contains relevant changes.

### 29.3 Concurrency tests

-   Two users attempt to book the same room simultaneously.
-   Two users edit the same event version.
-   Payment webhook arrives twice.
-   Scheduled report retry occurs after a timeout.
-   Two imports contain the same external record.
-   Inventory receipt is retried.

Expected outcomes must be deterministic and documented.

------------------------------------------------------------------------

## 30. Import, export and migration

### 30.1 Import pipeline

1.  Upload file to a temporary/quarantined area.
2.  Detect format and encoding.
3.  Parse into staging rows.
4.  Map source columns to target fields.
5.  Validate required fields, formats, references and tenant.
6.  Detect duplicates and likely matches.
7.  Show a preview with accepted/rejected rows.
8.  Allow user to resolve conflicts.
9.  Commit in batches with transaction boundaries.
10. Record import job, row outcomes and error report.
11. Provide rollback/compensating action where feasible.

Do not import directly into production tables while parsing. Never trust
a CSV filename, MIME type or embedded formulas.

### 30.2 Export

-   Respect filters and access permissions.
-   Record who exported and when.
-   Apply safe CSV quoting and formula-injection mitigation.
-   Limit export size or run large exports asynchronously.
-   Exclude private fields by default.
-   Provide a clear data dictionary.
-   Make date/currency formats explicit.

### 30.3 Migration from demo to production

LocalStorage demo data is not a production database. Build a one-time
import/export path: - Version the demo schema. - Export a JSON package
with metadata. - Validate against the production import schema. -
Resolve IDs and duplicates. - Preview rejected rows. - Import in
dependency order. - Recalculate derived fields on the server. - Compare
counts and totals after import. - Keep original export as an archived
backup. - Do not migrate simulated payment status as if it were a real
settled payment.

------------------------------------------------------------------------

## 31. Production release gates

A module is not "done" until all gates pass:

**Product gate** - Requirement and source confidence recorded. -
Workflow and edge cases defined. - Permissions and roles defined.

**Engineering gate** - Code reviewed. - Validation and error states
implemented. - Domain rules centralized. - Migrations reviewed. - No
secrets in repository.

**Test gate** - Unit and integration tests pass. - E2E critical path
passes. - Regression tests pass. - Security checks pass. - Expected
totals reconcile.

**Operations gate** - Logs/metrics/alerts present. - Backups and restore
tested. - Rollback plan exists. - Support/runbook updated.

**Demo gate** - Seed data coherent. - Reset works. - Simulated
integrations are labeled. - No dead buttons. - Known limitations
documented.

------------------------------------------------------------------------

## 32. Implementation checklist by module

### Event management

-   [ ] Event create/edit/view/list/search/filter.
-   [ ] Sub-events and guest counts.
-   [ ] Status transitions and history.
-   [ ] Notes, attachments and allergy alerts.
-   [ ] Event duplication with explicit field selection.
-   [ ] Cross-view consistency.

### Clients and prospects

-   [ ] Client/contact CRUD.
-   [ ] Duplicate detection and merge preview.
-   [ ] Prospect stages and next action.
-   [ ] Convert prospect without losing history.
-   [ ] Communication and task history.

### Scheduling

-   [ ] Venue/room setup.
-   [ ] Calendar views and filters.
-   [ ] Resource blocks.
-   [ ] Atomic conflict validation.
-   [ ] Timezone and buffer rules.
-   [ ] Accessible alternative to drag/drop.

### Menus and recipes

-   [ ] Item/package catalog.
-   [ ] Linked/minimum quantities.
-   [ ] Price/cost snapshots.
-   [ ] Unit conversions.
-   [ ] Recipe scaling and waste policy.
-   [ ] Dietary/allergen handling.

### Staffing and equipment

-   [ ] Employee availability/skills.
-   [ ] Shift requirements and assignments.
-   [ ] Conflict warnings.
-   [ ] Equipment requirements and pack/return checklist.
-   [ ] Labor cost estimates.

### Finance

-   [ ] Deterministic totals service.
-   [ ] Tax/service charge profiles.
-   [ ] Invoices and payment schedule.
-   [ ] Payment provider integration or clearly simulated mode.
-   [ ] Partial payment allocation.
-   [ ] Refund/reconciliation handling.
-   [ ] Audit history.

### Documents and portal

-   [ ] Template versioning.
-   [ ] Safe template rendering.
-   [ ] Preview/PDF output.
-   [ ] Signer state tracking.
-   [ ] Revocable portal invitations.
-   [ ] Customer/internal data separation.

### Analytics and AI

-   [ ] Metric registry.
-   [ ] Date-basis definitions.
-   [ ] Filters and drill-down.
-   [ ] CSV/PDF export.
-   [ ] Scheduled report jobs.
-   [ ] AI intent schema and authorization.
-   [ ] Result reproducibility and audit.

### Security and operations

-   [ ] Tenant isolation.
-   [ ] Role permissions.
-   [ ] Safe uploads.
-   [ ] Secret management.
-   [ ] Backup/restore.
-   [ ] Monitoring and alerting.
-   [ ] Dependency scanning.
-   [ ] Incident response.

------------------------------------------------------------------------

## 33. Official public evidence used for technical scope

These official pages substantiate the feature scope, but do not reveal
the private implementation stack:

-   Features: https://www.caterease.com/features/
-   Pricing: https://www.caterease.com/pricing/
-   Homepage: https://www.caterease.com/
-   Documentation index:
    https://help.caterease.com/docs/resources/documentation/
-   Training videos:
    https://help.caterease.com/docs/resources/training-videos/
-   Free user training: https://help.caterease.com/free-user-training/
-   Event Manager support archive:
    https://help.caterease.com/category/event-manager/
-   Ingredient Management training:
    https://help.caterease.com/docs/resources/training-videos/ingredient-management/
-   Document Builder training:
    https://help.caterease.com/docs/resources/training-videos/document-builder/
-   Menu Manager quick reference guide:
    https://help.caterease.com/wp-content/uploads/2023/06/Menu-Manager-Quick-Reference-Guide-1-1.pdf
-   Booking your first event guide:
    https://help.caterease.com/wp-content/uploads/2023/07/Booking-Your-First-Event-Program-GuideBook.pdf

The official feature page describes event booking wizards, dynamic
menus, custom prints, staffing, recipes/packing lists, payment
processing, client management, task management, Horizon Hub, AI
Assistant, event portals, dashboards, calendar, reports, Kitchen
Display, Sign & Send and Industry Trends. The support documentation
exposes guidebooks and quick-reference material for areas such as Menu
Manager, queries, Guestrooms Manager, Document Builder, Ingredient
Management and Prospect Manager. The Event Manager support archive also
documents specific behaviors such as linking sub-event guest counts to
event guest counts and linking menu item quantities to guests.

## 34. Final technical recommendation

Do not try to infer Caterease's private stack from its UI. The reliable
engineering path is: 1. Use official pages and documentation to define
observable capabilities. 2. Treat screenshot-only behavior as an
observation, not an implementation fact. 3. Inspect the actual FeastFlow
source before deciding which code to change. 4. Build shared domain
rules for events, scheduling, menus, money and reporting. 5. Keep the
demo local and clearly simulated until a production backend is
deliberately designed. 6. Test one complete workflow across every linked
module before expanding scope. 7. Track unknowns explicitly and never
mark a feature complete based only on its appearance.

A successful implementation is one in which an event's data remains
consistent across the event manager, calendar, menu, kitchen production,
staffing, documents, payments and reports---not merely a collection of
similar-looking screens.
