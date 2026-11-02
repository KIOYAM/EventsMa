# CateringMenu --- Deep Product and Engineering Reverse-Engineering Guide

**Research date:** 19 October 2026\
**Source:** [Google Play public
listing](https://play.google.com/store/apps/details?id=app.cateringmenu.in)

## 1. Evidence and limits

The public app listing describes CateringMenu as a catering management
app with menu packages, menu selection, quotations, invoices,
WhatsApp/PDF sharing, advance/pending payment tracking, enquiry/lead
management, follow-up scheduling, automatic material requirements,
referral tracking, staff assignments, multiple events, customer data,
and a business dashboard. The listing states an update date of 19 July
2026 and a small public download count at the time reviewed. Download
count alone is not evidence of quality or adoption.

No public technical manual was found that establishes the exact screen
flow, formulas, database schema, API, framework, or backend. The guide
reconstructs a reasonable system from the public feature inventory and
marks recommendations as independent design proposals.

## 2. Product interpretation

CateringMenu appears to target a caterer who needs a single operational
app rather than a large enterprise implementation. Its design priority
should therefore be: - quick mobile entry; - reusable menus/packages; -
quote generation with minimal typing; - visible advances and balances; -
enquiry follow-up; - staff/material planning; - simple revenue/booking
dashboard.

The public listing explicitly connects material generation to reducing
waste and improving purchase planning. That implies a useful connection
between selected menu, guest count, and production requirements, but it
does not disclose how ingredient quantities are calculated.

## 3. Reconstructed workflows

### 3.1 New enquiry

1.  Enter customer name, phone, event date, venue, event type, guest
    count, and requirements.
2.  Record lead source and stage.
3.  Set follow-up date/reminder.
4.  Search existing customers to avoid duplicates.
5.  Convert the enquiry into a quote.

### 3.2 Menu selection and quotation

1.  Select a saved package or compose a custom menu.
2.  Add/remove menu items and optionally select serving style.
3.  Enter per-plate, fixed, or custom price.
4.  Include delivery, labor, rental, or other service charges as
    separate lines.
5.  Review subtotal, discount, tax profile, deposit and balance.
6.  Generate PDF and/or open WhatsApp with a message and quote
    link/file.
7.  Save sent quote revision and record outcome.

### 3.3 Booking and material list

1.  Client accepts the quote.
2.  Convert quote to event/booking.
3.  Confirm final headcount and menu.
4.  Calculate material requirements from recipe definitions.
5.  Aggregate quantities by ingredient across all events on the same
    date.
6.  Subtract available stock and existing reservations.
7.  Create a purchase list.
8.  Assign staff to event and record completion.

### 3.4 Payment tracking

-   Record advance, partial payments, and final payment as separate
    transactions.
-   Compute outstanding balance from invoice/booking totals minus
    allocated payments.
-   Preserve receipt history and references.
-   Do not overwrite a mutable "paid amount" without a transaction
    record.

### 3.5 Referral system

A referral feature requires a referrer, referred client/lead,
qualification rule, reward policy, reward status, and duplicate/fraud
checks. Public copy mentions a referral system but does not establish
its reward logic. Do not invent a specific commission or reward formula.

## 4. Proposed technical architecture

For a mobile-oriented app, a plausible independent design is: -
mobile/web client; - API backend; - relational database; - PDF/document
service; - notification adapter; - background job for reminders and
exports; - local draft cache for poor connectivity.

This is not a claim about the app's actual technology.

``` text
Mobile UI
  |-- CRM and follow-ups
  |-- Menu/package editor
  |-- Quote/invoice UI
  |-- Payments and dashboard
  |-- Staff and material planning
          |
        API
          |
 CRM | Catalog | Quotes | Events | Material planner | Finance
          |
 Database + file storage + notification jobs
```

For the prototype, existing HTML/JS can emulate this with local storage.
A production version needs server-side access control and shared
persistence.

## 5. Data model proposal

  ----------------------------------------------------------------------
  Entity                   Key fields             Rules
  ------------------------ ---------------------- ----------------------
  `customer`               name, phone, email,    normalized phone and
                           address                duplicate review

  `enquiry`                customer, event date,  follow-up is explicit
                           guest estimate,        
                           source, stage          

  `follow_up`              enquiry, due date,     overdue state derived
                           owner, status          from due date

  `menu_item`              name, category,        stable ID
                           dietary tags, price    
                           hint                   

  `menu_package`           name, minimum guests,  versioned package
                           pricing mode           

  `package_item`           package, item,         order and optional
                           included/optional,     groups retained
                           quantity               

  `recipe`                 item, yield, version   needed for material
                                                  generation

  `ingredient`             name, base unit,       units normalized
                           purchase conversion,   
                           supplier               

  `quote`                  customer, enquiry,     revision history
                           number, status         

  `quote_revision`         menu/price/tax/terms   immutable once sent
                           snapshots              

  `booking`                accepted quote, date,  retains quote
                           venue, status          provenance

  `material_requirement`   booking/session,       calculated from recipe
                           ingredient, quantity   version

  `staff_assignment`       booking, staff, role,  conflict validation
                           time                   

  `invoice`                number, buyer/seller,  issued documents
                           tax snapshot, total    immutable

  `payment`                amount, date, method,  transaction record
                           reference              

  `referral`               referrer, referred     policy configurable
                           lead, qualification,   
                           reward state           

  `dashboard_snapshot`     metric period, value,  derived; not source of
                           generated time         truth
  ----------------------------------------------------------------------

## 6. Material-generation algorithm

A menu package alone is insufficient to calculate a trustworthy grocery
list. The system needs recipes or a clearly labeled quantity-per-guest
template.

For each menu item: 1. Determine servings per guest and recipe yield. 2.
Scale ingredient quantities to session guest count. 3. Apply yield-loss
rule once. 4. Convert to base units. 5. Aggregate by ingredient across
menu items and events. 6. Subtract usable on-hand stock and
already-reserved quantity. 7. Round up to supplier pack sizes. 8.
Display calculated amount, on-hand stock, shortage, pack rounding, and
assumptions.

`net_purchase_qty = max(0, rounded_required_qty - usable_stock - existing_reservations)`

Never silently assume that every guest consumes one full serving of
every menu item. Serving style, buffet behavior, children/adults, menu
options, and service duration can change consumption assumptions.

## 7. Quote and invoice calculation

Recommended quote line types: - per-plate menu; - fixed event fee; -
add-on; - labor; - delivery/transport; - equipment/rental; - discount; -
tax line according to configured tax treatment.

Use integer paise or fixed precision. Save a price snapshot at quote
revision time. A price change to a menu item should affect future
drafts, not rewrite a quote already sent to a client.

Invoice totals must be computed by a deterministic backend service in
production. Tax rules should be configurable and reviewed; printing tax
columns alone does not make a product legally compliant.

## 8. API proposal

-   `POST /customers`
-   `POST /enquiries`
-   `POST /enquiries/{id}/follow-ups`
-   `POST /menu-packages`
-   `POST /quotes`
-   `POST /quotes/{id}/revisions`
-   `POST /quotes/{id}/share`
-   `POST /quotes/{id}/convert-to-booking`
-   `POST /bookings/{id}/material-requirements`
-   `POST /bookings/{id}/staff-assignments`
-   `POST /invoices`
-   `POST /payments`
-   `GET /dashboard/summary`
-   `POST /referrals`
-   `GET /reports/revenue`

For every endpoint, validate tenant/role, input schema, status
transition, and duplicate request behavior.

## 9. UI engineering recommendations

### Quick enquiry form

Keep required fields short: customer, phone, event date, guest count,
event type. Put optional venue, budget, dietary requirements, and notes
in an expandable section. Add a duplicate-client warning before saving.

### Quote editor

Show guest count, selected menu, unit price, additional lines,
discounts, tax, total, deposit, and balance in one context. A mobile
user should be able to add a dish without losing the current quote
state.

### Payment view

Show total, amount paid, outstanding, due dates, and transaction
history. Payment balance is derived from posted transactions.

### Material list

Display item, base-unit requirement, available stock, shortage,
suggested purchase quantity, and whether the amount is estimated or
recipe-derived.

### Dashboard

Use operational alerts: new enquiry, follow-up overdue, quote pending,
advance due, upcoming event without staff, material shortage, unpaid
invoice. Avoid decorative charts with no action.

## 10. Security and reliability

-   Authentication and server-side roles.
-   Customer PII access restrictions.
-   Audit trail for quote approval, invoice, payment, stock adjustment,
    and staff changes.
-   Secure file links for PDFs.
-   Idempotent payment recording.
-   Offline draft synchronization with conflict handling.
-   Data export and deletion policy.
-   Rate limits on public enquiry forms.
-   Backup and restore tests.

## 11. Test cases

-   Duplicate phone/customer.
-   Quote revised after send.
-   Guest count changed after quote approval.
-   Material list from multiple menu items sharing ingredients.
-   Recipe unit conversion kg↔g.
-   No recipe exists: UI must label quantity estimate or block automatic
    material calculation.
-   Partial advance and final payment.
-   Duplicate payment request.
-   Staff assignment overlap.
-   Follow-up becomes overdue.
-   PDF generation fails but quote remains saved.
-   Tenant isolation and role restrictions.
-   Referral self-referral/duplicate reward.

## 12. Unknowns and verification plan

Public evidence does not establish: - exact onboarding or screens; -
actual material formula and recipe data structure; - tax and invoice
numbering behavior; - offline support; - referral reward mechanics; -
integrations or APIs; - hosting/database/authentication; - whether the
app is multi-tenant and how tenant isolation works.

To validate, obtain authorized test access, record screen-by-screen
behavior, capture representative input/output pairs, test edge cases
with synthetic data, and document observations. Do not infer private
backend details from app marketing text.

## 13. Best implementation order

1.  Customer/enquiry + follow-up.
2.  Menu/package library.
3.  Quote generation and sharing.
4.  Booking conversion.
5.  Payments and invoice snapshots.
6.  Recipe/ingredient master and material planner.
7.  Staff assignments.
8.  Referral workflow.
9.  Dashboard and exports.

**Bottom line:** The public feature set suggests a practical
mobile-first caterer utility. The critical engineering work is to
connect quotation, booking, material planning, staffing, and payments
with consistent records instead of treating them as isolated forms.

------------------------------------------------------------------------

# Deep Engineering Annex --- CateringMenu

## 14. Feature-level workflow and command model

The public app listing describes menu packages, menu selection,
quotation/invoice creation, WhatsApp/PDF sharing, advance and pending
payments, enquiries/follow-ups, material requirements, staff, customers,
multiple events, and referral functionality. The listing does not
document the app's precise internal implementation.

### Enquiry commands

`CreateEnquiry`, `LinkCustomer`, `AssignFollowUp`, `LogCall`,
`MarkQuoted`, `MarkWon`, `MarkLost`. The enquiry should preserve source
and event context even if the customer record already exists. Do not
merge two customer records based only on similar names.

### Menu commands

`CreateMenuItem`, `CreatePackage`, `AddPackageItem`, `SetOptionalGroup`,
`PublishPackageRevision`. Packages must be versioned. If a user edits a
package after sending a quote, old quotes remain unchanged.

### Quote commands

`CreateQuoteDraft`, `RecalculateQuote`, `CreateRevision`, `GeneratePDF`,
`ShareQuote`, `RecordClientResponse`, `ConvertToBooking`. Approval must
refer to the exact revision.

### Payment commands

`RecordAdvance`, `AllocatePayment`, `IssueReceipt`, `RecordRefund`,
`ReconcileBalance`. A payment record needs amount, date, method,
reference, party, allocation, and actor.

## 15. Mobile-first data-entry design

A small caterer often enters data during a phone call. The screen should
optimize the path: 1. customer/phone; 2. event date; 3. guest count; 4.
package/menu; 5. price; 6. share quote.

Optional fields can follow, but should not be lost. Use autosaved drafts
and show the last saved time. On offline use, queue draft mutations with
a client UUID and server version; on reconnect, resolve conflicts rather
than overwriting the server silently.

## 16. Detailed schema and relationships

-   `Customer 1:N Enquiry`
-   `Enquiry 1:N FollowUp`
-   `Enquiry 1:N Quote`
-   `Quote 1:N QuoteRevision`
-   `QuoteRevision 1:N QuoteLineSnapshot`
-   `Accepted QuoteRevision 1:1 or 1:N Booking` according to business
    rule
-   `Booking 1:N Session`
-   `Session N:M StaffMember` through assignments
-   `Session 1:N MaterialRequirement`
-   `Invoice 1:N PaymentAllocation`
-   `Payment 1:N PaymentAllocation` where partial/multi-invoice
    allocation is supported
-   `Referral 1:N ReferredLead` only if the business rules permit a
    campaign/referrer to generate multiple leads.

Do not store both `paid_total` and a separate payment ledger without a
reconciliation rule. A displayed total can be a projection; posted
payments are the source of truth.

## 17. Material list: recipe-backed versus estimate-backed

Three implementation levels: 1. **Manual material template:** manager
enters quantity per 100 guests. Fast but not truly recipe-aware. 2.
**Recipe-derived:** each menu item maps to ingredient quantities and
yield. More explainable and accurate if maintained. 3. **AI-estimated:**
model predicts likely quantities from menu name or historical examples.
This must be marked estimated and reviewed.

The UI must say which mode produced each number. Do not present a
material list as "automatic exact quantity" if no recipe/template
exists.

## 18. Calculation trace

For each material requirement, save: - session guest count; - menu item
and version; - recipe/template ID and version; - per-guest multiplier; -
yield/loss factor; - unit conversion; - gross demand; - stock
deducted; - reservations considered; - pack-size rounding; - final
suggested purchase quantity; - calculation timestamp.

This lets a manager explain why the purchase list changed after a guest
count update.

## 19. Referral feature design

A configurable referral policy needs: - referrer; - referred
person/lead; - eligibility event (lead created, booking confirmed, or
booking completed); - reward type and value; - validity window; -
attribution precedence; - duplicate phone/device checks; - approval
status; - payout/reward ledger.

Public listing does not establish the reward formula. Do not hardcode
money or commission amounts without product requirements.

## 20. API contracts

`POST /customers`, `POST /enquiries`, `POST /enquiries/{id}/follow-ups`,
`POST /packages`, `POST /quotes`, `POST /quotes/{id}/revisions`,
`POST /quotes/{id}/share`, `POST /quotes/{id}/responses`,
`POST /bookings`,
`POST /bookings/{id}/material-requirements/recalculate`,
`POST /bookings/{id}/staff-assignments`, `POST /invoices`,
`POST /payments`, `POST /payment-allocations`, `POST /referrals`,
`GET /dashboard`.

Example payment request:

``` json
{
  "customer_id": "cust_123",
  "booking_id": "booking_456",
  "amount_minor": 2500000,
  "currency": "INR",
  "method": "upi",
  "reference": "manual-ref-001",
  "received_at": "2026-10-19T14:00:00+05:30"
}
```

The example represents ₹25,000. Validate amount, currency, permission,
duplicate reference policy, and allocation rules. Never accept a
browser-computed balance as authoritative.

## 21. Offline synchronization

If the mobile app must work with intermittent connectivity: - each local
mutation gets a UUID; - client tracks server version; - server records
idempotency key; - sync response reports accepted/rejected/conflict; -
conflicts show a merge UI for editable fields; - ledger/stock/issued
invoices are not "last write wins"; - draft records can be merged more
freely than posted financial records.

## 22. Dashboard definitions

-   `new_enquiries`: created within period and not archived;
-   `followups_overdue`: open follow-ups due before current local time;
-   `quotes_sent`: sent revisions, not draft quotes;
-   `conversion_rate`: define denominator explicitly (qualified leads or
    sent quotes);
-   `amount_collected`: posted receipts, not quote totals;
-   `outstanding`: issued/confirmed obligations less allocated posted
    payments and credits;
-   `upcoming_events`: based on tenant timezone and event status.

A dashboard must not sum draft quotes and issued invoices together as
revenue.

## 23. Acceptance tests

-   Save an enquiry with only required fields.
-   Duplicate customer warning appears but permits reviewed override.
-   Quote revision keeps previous PDF stable.
-   WhatsApp share opens with correct quote ID/revision.
-   Material list distinguishes manual/recipe/AI estimate.
-   A package change does not mutate a sent quote.
-   Two partial payments reconcile to invoice balance.
-   One payment is allocated to two invoices according to policy.
-   Staff overlap is flagged.
-   Follow-up appears overdue in tenant timezone.
-   Referral reward is not duplicated on retried booking confirmation.
-   Offline draft sync reports a conflict instead of overwriting posted
    payment data.

## 24. Research limits and hands-on plan

The app-store listing alone cannot establish exact screens, tax formula,
material calculation, referral rules, offline architecture, backend, or
schema. For real reverse engineering with authorization: 1. capture
every screen; 2. record field labels, defaults, validation and
navigation; 3. create controlled sample data; 4. vary one input at a
time; 5. compare quote/PDF/material outputs; 6. record network/API
behavior only where permitted; 7. distinguish observable behavior from
assumptions.

# 20,000+ Word Expansion Annex

## Scope and confidence statement
This guide documents the publicly observable product surface of **CateringMenu** and provides an independent engineering blueprint for reproducing comparable workflows. It is intentionally not a claim to have accessed private source code, private APIs, internal database schemas, or undocumented infrastructure. Confirmed public claims, observed behavior, and proposed implementation choices must remain distinct. The domain focus is mobile-first catering operations, menu/package selection, enquiries, quotations, invoices, payment tracking, material planning, staff, and customer follow-up.

# Expanded Engineering Annex: Feature-by-Feature Implementation Notes


## 1. Product scope and mobile-first workflow: detailed implementation blueprint

### Goal and operator outcome
The product is positioned as a compact operational tool for caterers rather than an institutional food court platform. Prioritize quick creation and retrieval of customer, event, menu, quote, and payment information on a phone. Every long form should support draft save, validation near the field, and recovery after navigation or intermittent network conditions.

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


## 2. Customer and enquiry intake: detailed implementation blueprint

### Goal and operator outcome
Capture name, primary phone, event date, venue, guest count, event type, budget, source, and notes. Validate date plausibility without blocking legitimate last-minute events. Phone normalization should support Indian country code formats. Duplicate matches should present a safe merge option while preserving event history and avoiding automatic overwrite of contact details.

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


## 3. Menu item catalogue: detailed implementation blueprint

### Goal and operator outcome
Each item should have a stable ID, display label, category, cuisine, dietary markers, description, optional image, availability, default portion, and base price if used. Archive items instead of deleting those referenced by historic quotes. Search should support partial names and category filters, with a low-friction way to add a new item without losing the quote in progress.

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


## 4. Package and selection rules: detailed implementation blueprint

### Goal and operator outcome
A package is a reusable group of menu items with optional included/excluded categories, price basis, minimum guest count, and customization permissions. The selection tool should show included items, optional additions, substitutions, and price changes. If a customer-facing selection is exposed, distinguish draft selections from confirmed menu choices.

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


## 5. Quotation creation and recalculation: detailed implementation blueprint

### Goal and operator outcome
A quotation should snapshot customer/event details, selected menu, guest count, rates, discounts, delivery or service charges, taxes, terms, and validity. Recalculate when any priced field changes and display a clear change summary. The system should prevent an old quotation PDF from appearing current after the underlying quote has changed.

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


## 6. Quote versioning and acceptance: detailed implementation blueprint

### Goal and operator outcome
Each sent revision should be immutable. A quote may be Draft, Ready, Sent, Viewed if view telemetry exists, Accepted, Rejected, Expired, or Superseded. Acceptance should bind to a specific revision and record who accepted and when. If acceptance happens through a phone call, the operator should record the method rather than invent a digital signature.

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


## 7. PDF and WhatsApp sharing: detailed implementation blueprint

### Goal and operator outcome
PDF generation should use a snapshot of the quotation and business branding. Provide preview before sharing, include a stable document number, and show generated/sending/error status. WhatsApp sharing may open a deep link or invoke an authorized integration; the UI must not report delivery unless a provider confirms it.

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


## 8. Invoice and payment tracking: detailed implementation blueprint

### Goal and operator outcome
Invoices should reference the booking or accepted quote and have their own issue date, number, line items, tax breakdown, and amount due. Track advance, partial payment, balance, payment mode, reference, received date, and recorder. Avoid representing an unpaid invoice as paid simply because a payment note was typed.

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


## 9. Material requirements and quantity estimation: detailed implementation blueprint

### Goal and operator outcome
Material lists can be calculated only as accurately as the underlying recipe and portion data. If the app offers a manual requirement list, mark quantities as user-entered. If recipe-backed calculation exists, record yield, units, wastage, and conversion rules. Show the calculation inputs and permit the operator to adjust quantities with a reason.

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


## 10. Staff scheduling and assignment: detailed implementation blueprint

### Goal and operator outcome
Staff records need role, skill or service category, contact method, availability, and active state. Assignments should reference an event or session, date/time, role, and confirmation status. Detect overlapping assignments where the data is available, but support explicit overrides with a reason for staff who can cover nearby sessions.

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


## 11. Follow-up and reminders: detailed implementation blueprint

### Goal and operator outcome
A follow-up should have due date, owner, channel, outcome, and next step. Reminders should be idempotent and respect customer communication preferences. A sent message and a completed follow-up are different states. Provide a clear overdue view without assuming every overdue lead is a lost opportunity.

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


## 12. Dashboard and metric definitions: detailed implementation blueprint

### Goal and operator outcome
Define counts such as enquiries, quotations sent, confirmed events, pending balances, and upcoming events. State whether the dashboard uses event date, creation date, or invoice date. Pending payment should be calculated from issued documents and recorded payments, not a manually maintained flag. Support filtering by date range and event status.

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


## 13. Import/export and data portability: detailed implementation blueprint

### Goal and operator outcome
Allow export of customers, events, quotes, invoices, and payment records with stable identifiers and timestamps. Imports should validate columns and preview duplicates. Sensitive financial exports should be permissioned and logged. Provide a documented backup/export format so a business is not trapped in a single mobile device.

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


## 14. Offline and low-connectivity behavior: detailed implementation blueprint

### Goal and operator outcome
Save drafts locally only if the implementation can protect and synchronize them safely. Each mutation needs a client-generated ID and server acknowledgement. If two devices edit the same quote, show a conflict with timestamps and changed fields. Never silently merge conflicting prices or payment entries.

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


## 15. Role-based access and owner controls: detailed implementation blueprint

### Goal and operator outcome
A small business may begin with one owner and later add sales, kitchen, and accounts users. Roles should control both read and write access. Staff should not automatically see all customer phone numbers or financial data. Server-side checks must prevent unauthorized API calls even if a user manipulates the client.

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


## 16. Operational audit and corrections: detailed implementation blueprint

### Goal and operator outcome
Log changes to quote totals, invoice state, payments, event date, guest count, and material quantities. Store old/new values, actor, timestamp, and reason where important. Provide correction flows for mistaken payment entries and invoice errors rather than encouraging deletion of financial history.

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


## 17. Reliability and support workflow: detailed implementation blueprint

### Goal and operator outcome
Define handling for PDF failure, duplicate taps, expired sessions, network timeout, payment mismatch, invalid phone numbers, and database save failure. The app should preserve entered data and provide a retry action. Error messages should identify the next safe step without exposing database errors or internal stack traces.

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


## 18. Acceptance and release verification: detailed implementation blueprint

### Goal and operator outcome
Test complete journeys from new enquiry through package selection, quotation PDF, WhatsApp handoff, acceptance, invoice, advance payment, staff assignment, material list, and event completion. Verify currency rounding, date boundaries, stale quote handling, multi-device edits, export accuracy, and permission denial.

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


## Entity contract: Customer

The `customer` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Enquiry

The `enquiry` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

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


## Entity contract: Menu Item

The `menu_item` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Menu Package

The `menu_package` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Selection

The `selection` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Quotation

The `quotation` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Quotation Line

The `quotation_line` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

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


## Entity contract: Payment

The `payment` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Material Requirement

The `material_requirement` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Staff Member

The `staff_member` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Assignment

The `assignment` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Follow-Up

The `follow-up` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Document

The `document` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

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


## Scenario suite: Product scope and mobile-first workflow

Scope: The product is positioned as a compact operational tool for caterers rather than an institutional food court platform. Prioritize quick creation and retrieval of customer, event, menu, quote, and payment information on a phone. Every long form should support draft save, validation near the field, and recovery after navigation or intermittent network conditions.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to product scope and mobile-first workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Customer and enquiry intake

Scope: Capture name, primary phone, event date, venue, guest count, event type, budget, source, and notes. Validate date plausibility without blocking legitimate last-minute events. Phone normalization should support Indian country code formats. Duplicate matches should present a safe merge option while preserving event history and avoiding automatic overwrite of contact details.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to customer and enquiry intake. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Menu item catalogue

Scope: Each item should have a stable ID, display label, category, cuisine, dietary markers, description, optional image, availability, default portion, and base price if used. Archive items instead of deleting those referenced by historic quotes. Search should support partial names and category filters, with a low-friction way to add a new item without losing the quote in progress.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to menu item catalogue. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Package and selection rules

Scope: A package is a reusable group of menu items with optional included/excluded categories, price basis, minimum guest count, and customization permissions. The selection tool should show included items, optional additions, substitutions, and price changes. If a customer-facing selection is exposed, distinguish draft selections from confirmed menu choices.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to package and selection rules. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Quotation creation and recalculation

Scope: A quotation should snapshot customer/event details, selected menu, guest count, rates, discounts, delivery or service charges, taxes, terms, and validity. Recalculate when any priced field changes and display a clear change summary. The system should prevent an old quotation PDF from appearing current after the underlying quote has changed.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to quotation creation and recalculation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Quote versioning and acceptance

Scope: Each sent revision should be immutable. A quote may be Draft, Ready, Sent, Viewed if view telemetry exists, Accepted, Rejected, Expired, or Superseded. Acceptance should bind to a specific revision and record who accepted and when. If acceptance happens through a phone call, the operator should record the method rather than invent a digital signature.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to quote versioning and acceptance. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: PDF and WhatsApp sharing

Scope: PDF generation should use a snapshot of the quotation and business branding. Provide preview before sharing, include a stable document number, and show generated/sending/error status. WhatsApp sharing may open a deep link or invoke an authorized integration; the UI must not report delivery unless a provider confirms it.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to pdf and whatsapp sharing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Invoice and payment tracking

Scope: Invoices should reference the booking or accepted quote and have their own issue date, number, line items, tax breakdown, and amount due. Track advance, partial payment, balance, payment mode, reference, received date, and recorder. Avoid representing an unpaid invoice as paid simply because a payment note was typed.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to invoice and payment tracking. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Material requirements and quantity estimation

Scope: Material lists can be calculated only as accurately as the underlying recipe and portion data. If the app offers a manual requirement list, mark quantities as user-entered. If recipe-backed calculation exists, record yield, units, wastage, and conversion rules. Show the calculation inputs and permit the operator to adjust quantities with a reason.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to material requirements and quantity estimation. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Staff scheduling and assignment

Scope: Staff records need role, skill or service category, contact method, availability, and active state. Assignments should reference an event or session, date/time, role, and confirmation status. Detect overlapping assignments where the data is available, but support explicit overrides with a reason for staff who can cover nearby sessions.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to staff scheduling and assignment. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Follow-up and reminders

Scope: A follow-up should have due date, owner, channel, outcome, and next step. Reminders should be idempotent and respect customer communication preferences. A sent message and a completed follow-up are different states. Provide a clear overdue view without assuming every overdue lead is a lost opportunity.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to follow-up and reminders. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Dashboard and metric definitions

Scope: Define counts such as enquiries, quotations sent, confirmed events, pending balances, and upcoming events. State whether the dashboard uses event date, creation date, or invoice date. Pending payment should be calculated from issued documents and recorded payments, not a manually maintained flag. Support filtering by date range and event status.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to dashboard and metric definitions. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Import/export and data portability

Scope: Allow export of customers, events, quotes, invoices, and payment records with stable identifiers and timestamps. Imports should validate columns and preview duplicates. Sensitive financial exports should be permissioned and logged. Provide a documented backup/export format so a business is not trapped in a single mobile device.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to import/export and data portability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Offline and low-connectivity behavior

Scope: Save drafts locally only if the implementation can protect and synchronize them safely. Each mutation needs a client-generated ID and server acknowledgement. If two devices edit the same quote, show a conflict with timestamps and changed fields. Never silently merge conflicting prices or payment entries.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to offline and low-connectivity behavior. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Role-based access and owner controls

Scope: A small business may begin with one owner and later add sales, kitchen, and accounts users. Roles should control both read and write access. Staff should not automatically see all customer phone numbers or financial data. Server-side checks must prevent unauthorized API calls even if a user manipulates the client.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to role-based access and owner controls. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Operational audit and corrections

Scope: Log changes to quote totals, invoice state, payments, event date, guest count, and material quantities. Store old/new values, actor, timestamp, and reason where important. Provide correction flows for mistaken payment entries and invoice errors rather than encouraging deletion of financial history.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to operational audit and corrections. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Reliability and support workflow

Scope: Define handling for PDF failure, duplicate taps, expired sessions, network timeout, payment mismatch, invalid phone numbers, and database save failure. The app should preserve entered data and provide a retry action. Error messages should identify the next safe step without exposing database errors or internal stack traces.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to reliability and support workflow. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Acceptance and release verification

Scope: Test complete journeys from new enquiry through package selection, quotation PDF, WhatsApp handoff, acceptance, invoice, advance payment, staff assignment, material list, and event completion. Verify currency rounding, date boundaries, stale quote handling, multi-device edits, export accuracy, and permission denial.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **CateringMenu**, apply this scenario specifically to acceptance and release verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.

# Expanded Engineering Annex: Test Strategy and Release Gates

A credible reverse-engineering specification ends with observable pass/fail checks. The tests below are proposed for an independent implementation. They should run in CI and in a staging environment with test accounts and provider sandboxes.


## Unit tests
Pure calculations, input normalization, lifecycle transition guards, role policy decisions, unit conversions, pricing, tax rounding, and status aggregation. Use table-driven tests for boundary values and property-based tests for invariants.

- For **Product scope and mobile-first workflow**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer and enquiry intake**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu item catalogue**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Package and selection rules**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation creation and recalculation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quote versioning and acceptance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF and WhatsApp sharing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Invoice and payment tracking**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Material requirements and quantity estimation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Staff scheduling and assignment**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Follow-up and reminders**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Dashboard and metric definitions**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Repository and database tests
Tenant isolation, unique constraints, transaction rollback, optimistic concurrency, soft deletion, ledger balancing, immutable snapshots, and migrations from the previous schema version.

- For **Product scope and mobile-first workflow**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer and enquiry intake**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu item catalogue**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Package and selection rules**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation creation and recalculation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quote versioning and acceptance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF and WhatsApp sharing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Invoice and payment tracking**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Material requirements and quantity estimation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Staff scheduling and assignment**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Follow-up and reminders**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Dashboard and metric definitions**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## API contract tests
Authentication, authorization, pagination, field validation, stale versions, idempotency keys, error envelope stability, rate limits, and forbidden field injection.

- For **Product scope and mobile-first workflow**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer and enquiry intake**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu item catalogue**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Package and selection rules**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation creation and recalculation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quote versioning and acceptance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF and WhatsApp sharing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Invoice and payment tracking**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Material requirements and quantity estimation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Staff scheduling and assignment**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Follow-up and reminders**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Dashboard and metric definitions**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Integration tests
Payment provider sandbox, PDF rendering, messaging handoff, storage uploads, webhooks, roster imports, device adapters, and downstream retry behavior where relevant to the app.

- For **Product scope and mobile-first workflow**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer and enquiry intake**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu item catalogue**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Package and selection rules**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation creation and recalculation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quote versioning and acceptance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF and WhatsApp sharing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Invoice and payment tracking**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Material requirements and quantity estimation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Staff scheduling and assignment**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Follow-up and reminders**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Dashboard and metric definitions**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## End-to-end tests
Complete role-specific journeys using realistic sample data and multiple browser/device sessions. Assert not only the visible UI but also database state, emitted events, audit trail, generated files, and reconciled totals.

- For **Product scope and mobile-first workflow**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer and enquiry intake**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu item catalogue**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Package and selection rules**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation creation and recalculation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quote versioning and acceptance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF and WhatsApp sharing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Invoice and payment tracking**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Material requirements and quantity estimation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Staff scheduling and assignment**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Follow-up and reminders**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Dashboard and metric definitions**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Performance tests
Test normal traffic, peak bursts, large exports, large catalogues, and slow external providers. Record p50/p95/p99 latency, queue age, database contention, and error rate.

- For **Product scope and mobile-first workflow**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer and enquiry intake**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu item catalogue**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Package and selection rules**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation creation and recalculation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quote versioning and acceptance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF and WhatsApp sharing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Invoice and payment tracking**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Material requirements and quantity estimation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Staff scheduling and assignment**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Follow-up and reminders**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Dashboard and metric definitions**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Security tests
Cross-tenant IDOR, privilege escalation, CSRF where applicable, XSS in free-text notes, unsafe file uploads, rate-limit bypass, webhook forgery, secret leakage, and excessive personal-data exposure.

- For **Product scope and mobile-first workflow**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer and enquiry intake**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu item catalogue**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Package and selection rules**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation creation and recalculation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quote versioning and acceptance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF and WhatsApp sharing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Invoice and payment tracking**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Material requirements and quantity estimation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Staff scheduling and assignment**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Follow-up and reminders**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Dashboard and metric definitions**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Recovery tests
Kill a worker mid-job, time out after a successful commit, replay a webhook, restore a backup, reconnect an offline client, and retry an external message. Verify no duplicated money movement or customer commitment.

- For **Product scope and mobile-first workflow**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Customer and enquiry intake**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu item catalogue**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Package and selection rules**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quotation creation and recalculation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Quote versioning and acceptance**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **PDF and WhatsApp sharing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Invoice and payment tracking**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Material requirements and quantity estimation**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Staff scheduling and assignment**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Follow-up and reminders**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Dashboard and metric definitions**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


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
For **CateringMenu**, collect evidence only through public pages or an authorized test account. For every screen, record the entry route, actor role, preconditions, visible fields, defaults, validation messages, actions, resulting state, network-independent observable outcome, and screenshot/video reference. For every calculation, capture at least three input-output examples including a boundary case. For every integration, record the user-visible handoff and only the delivery state that the authorized provider exposes. Redact real customer data. Never bypass authentication, evade access controls, or access another customer's records.

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
- Public app listing: https://play.google.com/store/apps/details?hl=en&id=app.cateringmenu.in
- Public claims include menu packages, quotations, invoices, WhatsApp/PDF sharing, advance and pending payment tracking, and related catering workflow; detailed internal implementation is unverified.

## Glossary and naming discipline
Use **confirmed** only for information directly supported by a public source or authorized observation. Use **inferred** for a likely behavior derived from the visible product flow. Use **proposed** for an independent implementation recommendation. Use **unknown** when evidence is absent. Never describe a proposed table, endpoint, algorithm, or architecture as if it were the competitor's actual internals.
