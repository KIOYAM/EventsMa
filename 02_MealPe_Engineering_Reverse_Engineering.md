# MealPe --- Deep Product and Engineering Reverse-Engineering Guide

**Research date:** 19 October 2026\
**Scope:** Publicly described institutional food-service platform. No
private APIs, source code, or internal infrastructure access is assumed.

## 1. Public product map

MealPe is not primarily an independent event-caterer CRM. Its public
platform describes four connected applications: Food Ordering App, Admin
Dashboard, Counter Billing POS, and Vendor Application. Public pages
describe digital cafeterias, multi-vendor POS, QR ordering, kitchen
order tickets (KOTs), kitchen display system (KDS) integration, shift
billing, meal subscriptions, RSVP forecasting, biometric/RFID/QR
verification, vendor settlement, analytics, and enterprise integrations.
Sources: [main site](https://mealpe.app/),
[platform](https://mealpe.app/product), [digital
cafeteria](https://mealpe.app/solutions/software/digital-cafeteria),
[mess manager](https://mealpe.app/solutions/software/mess-manager),
[about](https://mealpe.app/about-us).

The product's public architecture is described as API-first,
offline-capable at hardware touchpoints, hardware-agnostic,
role-controlled, and integrated with ERP/HRMS/POS systems. These are
vendor claims, not an independently audited description of the internal
stack.

## 2. Application surfaces and users

### Food ordering app

Users: employees, students, patients, visitors. - Browse active menus by
vendor and meal period. - Pre-order/schedule orders. - Use UPI, cards,
wallets, or institutional accounts as configured. - Subscribe to
fixed-term meal plans. - Track order state and receive notifications.

### Vendor app

Users: cafeteria vendor, counter staff, kitchen operator. - Manage menus
and availability by shift. - Receive orders from mobile, QR, or
counter. - Accept/reject or update preparation state. - Produce KOT/KDS
work. - View inventory awareness and sales analytics.

### Counter POS

Users: cashier and shift supervisor. - Rapid order entry. - Cash, QR,
RFID, card, wallet, or institutional credit as configured. - Send
counter orders into the same kitchen queue. - Print receipts/KOTs. -
Close shift and reconcile expected versus actual payments.

### Institution admin

Users: facility/food-service manager, finance, procurement, HR/IT
integration teams. - Configure locations, meal slots, vendors, menus,
pricing and access policies. - Set meal-plan/subsidy rules. - Monitor
plate counts, revenue, consumption, vendor performance. - Run
settlements and exports. - Integrate identity and finance systems.

### Mess Manager

A recurring meal entitlement system: schedules, meal slots, RSVP/opt-out
cutoffs, access verification, expected-vs-actual plate counts,
subscription/term billing, and exception overrides.

### MedMeals (related product family)

Public MealPe materials also describe a hospital food/nutrition
solution. This introduces patient-specific diet orders, allergens,
therapeutic diet rules, bedside ordering, KOT routing, OTP-verified
delivery/clearance, and audit trails. This is a safety-sensitive domain
and should not be treated as a generic cafeteria extension without
clinical governance.

## 3. Reconstructed end-to-end workflows

### 3.1 Digital cafeteria order

1.  Institution configures campus/site, outlets, vendors, menus, price
    lists, meal windows, payment options.
2.  User is authenticated or otherwise associated with a permitted
    institution.
3.  Ordering app resolves the active location and meal period.
4.  Menu service returns currently visible, available items.
5.  User selects items, pickup/delivery mode, and payment source.
6.  Order service validates item availability, price version,
    meal-window cutoff, account/subsidy eligibility, and idempotency
    key.
7.  Payment authorization or institutional debit is performed.
8.  Order is routed to the responsible vendor and KOT/KDS.
9.  Vendor updates accepted/preparing/ready/collected/cancelled state.
10. Notifications and receipt are issued.
11. Order consumption and payment are included in reports/settlements.

### 3.2 Counter POS

1.  Cashier opens a shift with opening cash/terminal state.
2.  Cashier creates an order using a fast item-entry interface.
3.  Price and discounts are validated server-side.
4.  Payment method and transaction reference are recorded.
5.  A receipt and KOT are produced.
6.  Order is routed into the same kitchen queue as app orders.
7.  At shift end, expected cash/card/UPI/wallet totals are compared with
    actual totals.
8.  Variances require reason and supervisor review.

### 3.3 Mess subscription and attendance

1.  Admin defines recurring meal calendar and meal slots.
2.  Users receive an eligible subscription/allowance.
3.  User opts in/out before cutoff where configured.
4.  Kitchen forecast aggregates expected meals by slot/menu/diet.
5.  At entry or serving, QR/RFID/biometric/manual verification creates a
    meal-consumption event.
6.  Duplicate scans, wrong slot, expired subscription, and unauthorized
    users are rejected or routed to an exception flow.
7.  Actual consumption is compared with forecast.
8.  Billing and contractor/vendor settlement are calculated from policy
    and actual records.

### 3.4 Vendor settlement

Aggregate posted orders, refunds, payment provider settlement,
institutional subsidy, fees/commissions if configured, and
vendor-specific terms. Produce a settlement statement with line-level
provenance. Do not settle from dashboard chart aggregates alone.

## 4. Architecture proposal

``` text
Diner web/mobile | Counter POS | Vendor app | Admin console
                         |
                    API gateway
                         |
 Identity/entitlements | Catalog | Orders | Payments
                         |            |
 Access verification | KOT/KDS | Inventory | Settlement
                         |
 Event stream / durable queue / outbox
                         |
 PostgreSQL + cache + analytics store + object storage
                         |
 Payment gateways | ERP/HRMS/HIS | RFID/QR/biometric adapters
```

This is a proposed design, not a verified MealPe stack.

### Recommended boundaries

-   Identity and entitlements.
-   Institution/site/outlet/vendor configuration.
-   Menu/catalog and price scheduling.
-   Order lifecycle.
-   Payments/refunds/wallet.
-   Meal subscription and consumption.
-   Device/access adapter.
-   Kitchen queue/KOT/KDS.
-   Vendor settlement/ledger.
-   Reporting/analytics.
-   Integration and reconciliation.
-   Audit/security.

## 5. Core data model

  ---------------------------------------------------------------------
  Entity                             Purpose / fields
  ---------------------------------- ----------------------------------
  `institution`                      tenant, legal/customer
                                     configuration

  `site`                             campus, hospital, factory or
                                     location

  `outlet`                           cafeteria outlet/serving point

  `vendor`                           vendor identity, contract,
                                     settlement terms

  `vendor_site`                      vendor permission at site/outlet

  `user_identity`                    external HR/student/patient ID
                                     mapping

  `entitlement`                      meal-plan, subsidy, allowance,
                                     validity, slot eligibility

  `meal_slot`                        breakfast/lunch/dinner, schedule,
                                     cutoff

  `menu_version`                     effective dates, outlet/vendor,
                                     availability

  `menu_item`                        price, tax, allergens, nutrition
                                     where applicable

  `order`                            user, source channel, status,
                                     totals, idempotency key

  `order_line`                       item/price/tax snapshots, quantity

  `payment_attempt`                  method, provider reference, status

  `refund`                           amount, reason, linked
                                     payment/order

  `consumption_event`                user, slot, device, time,
                                     decision, duplicate flag

  `access_device`                    device identity, location,
                                     key/cert metadata

  `kitchen_ticket`                   station, ticket lines,
                                     queue/status timestamps

  `shift`                            cashier, open/close, expected and
                                     actual tender totals

  `settlement_batch`                 period, vendor, calculated amount,
                                     status

  `settlement_line`                  order/payment/refund/fee source
                                     records

  `inventory_movement`               ingredient/stock change and source

  `integration_event`                external source ID, payload hash,
                                     processing status

  `audit_event`                      actor, operation, before/after,
                                     timestamp
  ---------------------------------------------------------------------

All institution-owned records need tenant/site authorization. Device and
external user identifiers should be mapped, not used as unrestricted
public identifiers.

## 6. Order state machine

Suggested state transitions:
`created → payment_pending → confirmed → accepted → preparing → ready → fulfilled`
Possible alternate states: `payment_failed`, `rejected`, `cancelled`,
`refund_pending`, `refunded`.

Each transition should be a command with guards: - Only a confirmed,
payable order can enter kitchen production. - Only authorized roles can
reject or mark ready. - A cancellation after preparation begins may
require a policy-specific charge. - A repeated provider webhook must not
create a duplicate payment. - Status timestamps should be append-only
history, not just a mutable string.

## 7. Access-control and meal entitlement engine

Decision inputs: - identity match; - institution/site/outlet; - meal
slot and current time; - subscription validity; - opt-in status and
cutoff; - allowance/subsidy balance; - duplicate consumption window; -
permitted verification method; - device health/offline cache age; -
manual override policy.

Decision output: `ALLOW`, `DENY`, or `MANUAL_REVIEW`, plus a reason
code.

Do not return only `true/false`; operations need explainable denial
reasons. Examples: `WRONG_SLOT`, `SUBSCRIPTION_EXPIRED`,
`ALREADY_CONSUMED`, `IDENTITY_UNKNOWN`, `DEVICE_UNTRUSTED`,
`OFFLINE_POLICY_EXCEEDED`.

### Offline mode

An offline device cannot know every latest revocation or consumption
event. Define the risk boundary explicitly: - Which entitlements are
cached? - How long can cached data be trusted? - Is offline consumption
allowed for high-value entitlements? - How are duplicate events
reconciled after reconnect? - What happens if two offline devices accept
the same identity?

Use signed/secure device identity, local encrypted cache, sequence
numbers, event IDs, and reconciliation conflict rules. Do not claim
perfect duplicate prevention under disconnected concurrent conditions.

## 8. Kitchen order management

Each order line maps to a station or preparation group. KOTs should
include order ID, location, vendor, items, quantities, modifiers,
promised time, and relevant allergy/diet warning. KDS state should be
independent from customer-facing order state.

Important design: - A single order can generate multiple station
tickets. - Ticket printing must be retryable without duplicating the
order. - KDS updates must be idempotent. - Out-of-order updates should
be rejected or reconciled. - Hardware failures need a durable print
queue and visible operator alert. - Item availability should be
revalidated before acceptance if menus can change.

## 9. Payments and settlement engineering

### Payment lifecycle

1.  Create payment attempt with unique idempotency key.
2.  Call gateway.
3.  Verify webhook signature.
4.  Validate amount/currency/order reference.
5.  Record provider transaction exactly once.
6.  Update order/payment state transactionally.
7.  Reconcile with provider settlement file later.

Never trust the browser's "payment successful" response alone.

### Vendor settlement

For each settlement period:
`net_payable = eligible_gross_sales - refunds - configured_fees - deductions + approved_adjustments`
The precise formula depends on vendor contract. Every component must
trace to source orders and posted adjustments.

### Shift reconciliation

Expected totals are computed from posted transactions by tender type.
Actual cash counted/card terminal/UPI settlement is entered separately.
Variance is recorded with reason, user, supervisor approval, and audit
event.

## 10. Reporting and forecasting

Public pages describe real-time plate counts, consumption analytics,
waste tracking, and RSVP-based forecasting. Independent forecast
design: - Confirmed subscriptions and RSVPs. - Historical attendance by
site, slot, weekday, season. - Special event/holiday overrides. - Vendor
menu and capacity constraints. - Separate forecast from actual count. -
Track error metrics by slot/site; never present a forecast as a
guaranteed count.

Key reports: - orders by channel/vendor/site/slot; - accepted vs
fulfilled vs cancelled; - expected vs actual meals; - vendor sales and
settlement; - subsidy/entitlement use; - payment tender and shift
variance; - wastage and stock movement; - system/device offline and
exception logs.

## 11. Security, privacy, and compliance

-   RBAC at institution, site, outlet, vendor and user scope.
-   Device authentication and key rotation.
-   Signed provider webhooks.
-   PII minimization and retention policy.
-   Audit access to sensitive identity/meal records.
-   Separate patient health/diet data from ordinary cafeteria records.
-   Least-privilege integration credentials.
-   Data export restrictions by role.
-   Encryption in transit and at rest where supported.
-   Incident workflow for lost RFID cards or compromised devices.

For hospital diet management, allergy and therapeutic-diet rules are
safety-critical. Use clinical approval, controlled rule changes,
versioned diet definitions, and explicit human responsibility. Do not
rely on generative AI to decide whether a patient may eat a menu item.

## 12. API proposal

-   `POST /orders`
-   `GET /orders/{id}`
-   `POST /orders/{id}/transition`
-   `POST /payments/attempts`
-   `POST /webhooks/payments/{provider}`
-   `POST /access/verify`
-   `POST /consumption-events`
-   `POST /subscriptions`
-   `POST /subscriptions/{id}/rsvp`
-   `POST /kitchen-tickets/{id}/transition`
-   `POST /shifts/{id}/close`
-   `POST /settlements/{id}/calculate`
-   `POST /settlements/{id}/approve`
-   `GET /reports/consumption`
-   `GET /reports/vendor-settlement`
-   `POST /integrations/hrms/sync`

Use idempotency, role checks, external reference deduplication, event
history, pagination, and strict tenant scoping.

## 13. Test matrix

-   Duplicate payment webhooks.
-   QR scan replay and double scan.
-   Two offline devices accept same identity then reconnect.
-   User enters wrong meal slot.
-   Subscription expires mid-day.
-   Menu item becomes unavailable after cart creation.
-   KOT printer goes offline.
-   Order is cancelled while kitchen is preparing.
-   Vendor settlement includes a refund and approved adjustment.
-   Cashier shift closes with cash variance.
-   Cross-tenant access attempts.
-   Integration sends same employee record twice.
-   Meal forecast compares against actual consumption.
-   Hospital mode: diet changes while an order is in queue; stale KOT
    must be flagged and kitchen alerted.

## 14. What is not publicly knowable

The public site does not disclose actual code, database, event broker,
queue, biometric vendor, protocol, exact offline cache policy,
settlement algorithm, pricing contracts, security audit, or uptime
history. These require authorized technical documentation, a vendor
demo, or a contractually permitted integration review.

## 15. FeastFlow implications

Do not copy MealPe's institutional complexity into the core caterer
demo. Treat recurring meal entitlements, cafeteria POS, multi-vendor
settlement, access devices, and hospital nutrition as separately bounded
future modules. Reuse generic foundations---tenant model, menu catalog,
orders, payments, notifications, audit---but keep event booking and
institutional meal consumption as different domain workflows.

------------------------------------------------------------------------

# Deep Engineering Annex --- MealPe

## 14. Distinguish the four product surfaces

Public product pages describe Digital Cafeteria, Mess Manager, QR
Ordering, and custom managed meal programs, along with counter POS and
vendor/admin surfaces. These share infrastructure but have different
transaction semantics. A single generic `order` table may support the
core order but should not erase the differences between a retail
purchase, an entitlement-based meal, and a hospital diet order.

### Digital Cafeteria

A multi-vendor marketplace-like food court within an institution. Orders
need vendor routing, outlet availability, payment method, KOT/KDS,
refund, and settlement.

### Mess Manager

A recurring meal entitlement and consumption system. It needs
subscription periods, meal-slot rules, RSVP cutoff,
attendance/verification, duplicate prevention, forecast, and contract
billing.

### QR Ordering

A location-scoped ordering channel. The QR code should resolve a signed
or server-registered table/location identifier; it should not itself
grant payment or administrative authority.

### Custom meal programs

An operational service with vendor contracts, procurement, fulfilment
metrics, service levels, and settlement.

### MedMeals / hospital workflow

A distinct safety-sensitive extension involving patient identity, diet
prescriptions, allergen constraints, meal delivery and proof of
handover. It requires clinical governance and must not be treated as an
ordinary menu preference.

## 15. Order domain design

Recommended aggregates: - `Order`: customer/site/channel/status/total. -
`OrderLine`: immutable menu item and price snapshot. - `PaymentAttempt`:
provider-specific attempt. - `KitchenTicket`: station-specific
production work. - `ConsumptionEvent`: verified meal actually
consumed. - `SettlementLine`: financial line item for a vendor period.

An order being paid does not mean it was prepared, collected, or
consumed. A meal entitlement being verified does not necessarily create
a retail payment. Keep these concepts separate.

### Commands and invariants

-   `CreateOrder`: idempotent by client-generated key.
-   `AuthorizePayment`: verifies amount, currency, provider state.
-   `AcceptOrder`: checks outlet and item availability.
-   `RouteKitchenTicket`: generates one or more station tickets.
-   `MarkReady`: allowed only from valid production states.
-   `FulfilOrder`: records pickup/delivery evidence as policy requires.
-   `RecordConsumption`: applies slot and duplicate rules.
-   `CancelOrder`: follows cutoff and production policy.
-   `ReconcileSettlement`: matches internal records to
    provider/bank/contract evidence.

## 16. Meal entitlement decision algorithm

Inputs: - user identity mapping; - institution and site; - entitlement
plan; - meal slot; - local time and cutoff; - RSVP status; - consumed
events within duplicate window; - allowance/subsidy policy; - device
trust and online/offline state.

Pseudo-policy: 1. Validate device identity and request signature. 2.
Resolve person to institution identity. 3. Verify active entitlement and
permitted site. 4. Resolve active meal slot using institution timezone.
5. Check RSVP/opt-out cutoff. 6. Check whether the entitlement is
already consumed for the same slot. 7. If online, commit consumption
with a uniqueness constraint. 8. If offline, apply the configured
offline risk policy and store a signed event for reconciliation. 9.
Return decision code and explanation.

A unique constraint such as
`(entitlement_id, meal_slot_instance_id, consumption_period)` can
prevent duplicate consumption online. Offline duplicates cannot be
perfectly prevented by a disconnected device; the product needs explicit
reconciliation and exception rules.

## 17. Offline-first protocol

"Offline-first" is a product claim, not a complete protocol. A credible
design specifies: - cached menu/entitlement scope; - cache expiry; -
device identity and key rotation; - local encrypted event queue; -
monotonic sequence numbers; - unique event UUIDs; - sync cursor and
replay protection; - conflict handling; - manual override log; - maximum
permitted offline window.

Never sync by blindly overwriting server records with local state. Send
immutable events, validate them, and build server-side projections. If
two devices both accept the same entitlement offline, reconcile to a
policy-defined outcome and surface the exception.

## 18. Kitchen tickets and device adapters

A KOT/KDS adapter should support: - station routing by item/preparation
category; - idempotent ticket creation; - reprint with visible "copy"
marker; - ticket status history; - printer/KDS heartbeat; - queued print
jobs during outages; - order amendments that produce delta tickets; -
allergy/diet warnings with visual and textual signals.

Keep business order state separate from printer state. A printer failure
must not silently mark an order cancelled. Hardware integration should
be behind interfaces, e.g. `PrinterAdapter`, `QrScannerAdapter`,
`RfidReaderAdapter`.

## 19. POS shift reconciliation

A shift records opening float, cashier, terminal, and time. Expected
tender totals are derived from posted transactions: - cash
sales/refunds; - UPI/card settlements; - institutional wallet debits; -
account/subsidy charges; - voids and discounts.

At close, record actual cash count and terminal totals. Compute
variance, require reason for nonzero variance, and optionally supervisor
approval. Never "fix" the shift by rewriting order history.

## 20. Vendor settlement ledger

A settlement batch should have a period, vendor, site, currency,
source-line list, computed total, approver, payout reference, and
status. Each settlement line must point to an order, refund, fee,
subsidy, contract adjustment, or approved manual adjustment.

Reconciliation steps: 1. Select eligible posted transactions for the
settlement period. 2. Match provider settlement IDs and order IDs. 3.
Detect missing, duplicate, amount-mismatched and late transactions. 4.
Apply contract-defined fees and subsidies. 5. Create a preview
statement. 6. Require approval where policy dictates. 7. Post the
settlement and record payment reference. 8. Lock the batch; correct
later errors with adjustment lines.

## 21. Enterprise integrations

For HRMS/ERP/HIS imports: - store source system and external ID; - use
idempotent upsert; - validate schema/version; - quarantine invalid
records; - record last successful cursor; - support reprocessing; - keep
integration credentials scoped and rotatable; - never trust external
identity payloads without authentication.

Hospital integration additionally requires a governed source of truth
for diet orders. Menu recommendations must be filtered by the
authoritative diet order before reaching kitchen production.

## 22. Security and threat model

Threats include QR code tampering, RFID replay/cloning, device theft,
duplicate webhook, staff sharing accounts, cross-site privilege
escalation, forged offline events, and patient data leakage.

Controls: - signed device credentials; - server-side authorization; -
rate-limited access verification; - replay detection; - encrypted local
cache; - least-privilege vendor scopes; - audit for manual overrides; -
device revocation; - webhook signature validation; - tenant/site scope
in every query; - data retention and incident response.

Do not store biometric templates in the application unless absolutely
required and properly governed. Prefer integration with a trusted
device/system that returns a minimal verification result, where the
operational/legal design permits it.

## 23. Reporting model and data quality

Separate operational event data from analytics projections. Define
metric semantics: - orders placed; - orders accepted; - meals
fulfilled; - verified consumption; - plates produced; - subsidy
claims; - vendor payable.

These values are not interchangeable. Track timestamps and source events
so late updates can correct aggregates. Forecast accuracy should be
measured by slot/site and compared against actual counts; do not
retroactively rewrite the forecast.

## 24. High-value failure tests

-   Same QR scanned twice at two terminals.
-   User entitlement expires during checkout.
-   Offline device queue is replayed twice.
-   A late event arrives after a settlement batch was calculated.
-   Payment webhook says success but amount mismatches.
-   Order is cancelled after KOT reaches kitchen.
-   Vendor changes price while an item is in a cart.
-   KDS station is offline.
-   POS shift closes with unaccounted cash.
-   Employee leaves institution but stale entitlement is cached.
-   Site A manager requests Site B reports.
-   Patient diet order changes after ticket creation.
-   Settlement contains a refund that was posted after cutoff.

## 25. Acceptance scenario

An institution has two sites, three vendors, lunch/dinner slots, 1,000
users, and a meal subsidy: 1. Import users from HRMS with stable
external IDs. 2. Configure entitlements and cutoff. 3. Publish versioned
vendor menus. 4. Place app and counter orders. 5. Route KOTs to
stations. 6. Verify subscription meal at entry. 7. Process a duplicate
scan and return a reason code. 8. Simulate offline mode and reconcile
queued events. 9. Close cashier shift and record variance. 10. Reconcile
vendor settlement including a refund. 11. Export site-level MIS. 12.
Test cross-site and vendor isolation. Expected: order, payment,
consumption, and settlement remain separate but traceably related.

## 26. Authorized evidence needed to identify real internals

Public pages do not prove the actual database, event broker, offline
protocol, biometric integration, or settlement code. To investigate
legitimately, request architecture documentation, integration specs, API
schemas, sandbox credentials, device protocol manuals, sample settlement
files, and a vendor-supervised workflow demonstration. Do not infer
implementation details from a marketing phrase such as
"enterprise-grade."

# 20,000+ Word Expansion Annex

## Scope and confidence statement
This guide documents the publicly observable product surface of **MealPe** and provides an independent engineering blueprint for reproducing comparable workflows. It is intentionally not a claim to have accessed private source code, private APIs, internal database schemas, or undocumented infrastructure. Confirmed public claims, observed behavior, and proposed implementation choices must remain distinct. The domain focus is institutional dining, multi-vendor cafeterias, QR ordering, POS, kitchen routing, meal entitlements, mess programs, settlements, and enterprise integrations.

# Expanded Engineering Annex: Feature-by-Feature Implementation Notes


## 1. Institution and campus tenancy: detailed implementation blueprint

### Goal and operator outcome
Model institution, campus, building, outlet, vendor, and service area separately. A campus may contain several outlets and policy zones. Tenant boundaries should be explicit in data and authorization. Enterprise customers often require configuration inheritance: institution defaults, campus overrides, outlet overrides, and vendor-specific exceptions.

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


## 2. Digital cafeteria product boundary: detailed implementation blueprint

### Goal and operator outcome
The digital cafeteria flow supports discovery, ordering, payment, kitchen routing, fulfillment, and reporting across multiple vendors. Do not confuse it with fixed meal-plan eligibility or a simple QR menu. The system must show which outlet owns each item, whether a combined basket is permitted, and whether payment or pickup is handled per vendor or centrally.

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


## 3. Mess Manager and fixed meal programs: detailed implementation blueprint

### Goal and operator outcome
Fixed meal programs need a schedule, eligibility policy, meal slot, attendance or redemption event, and settlement logic. A student or employee may have a term subscription but still need to RSVP for a particular meal. Eligibility and actual consumption are different facts: the former permits a meal, the latter records that it was served.

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


## 4. QR ordering and table/seat identity: detailed implementation blueprint

### Goal and operator outcome
A QR code can represent a menu, a table, a seat, a pickup point, or a short-lived ordering session. Avoid treating the QR token itself as proof of user identity. Signed tokens should be revocable and scoped to the intended outlet and function. Public QR browsing can be allowed while checkout requires authentication or a verified payment method.

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


## 5. Menu publication and time-based availability: detailed implementation blueprint

### Goal and operator outcome
Menu items need schedules, stock limits, outlet ownership, price versions, and temporary sold-out states. A menu being visible does not guarantee an item can still be ordered. Check availability at basket validation and again at order commit. Support breakfast/lunch windows, cutoff times, holidays, and emergency closures.

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


## 6. Multi-vendor basket and routing: detailed implementation blueprint

### Goal and operator outcome
If a basket spans vendors, the system must define whether it becomes one parent order with child vendor orders or several independent orders. Each child has its own acceptance, preparation, cancellation, and settlement. Customer-visible status should aggregate child statuses without hiding a delayed vendor. Partial cancellation/refund behavior must be explicit.

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


## 7. Order lifecycle and invariants: detailed implementation blueprint

### Goal and operator outcome
Use a guarded lifecycle such as Draft, Submitted, PaymentPending, Accepted, InPreparation, Ready, Collected/Delivered, Cancelled, Refunded, or Failed. A transition must validate the current state and actor permissions. Do not permit a kitchen display to mark an unpaid or unaccepted order ready unless the configured payment policy explicitly allows it.

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


## 8. Payment, wallets, and institutional accounts: detailed implementation blueprint

### Goal and operator outcome
Model payment intent, provider transaction, capture, refund, wallet ledger, and institution-funded subsidy separately. Never treat a client-side success screen as authoritative settlement. Webhooks require signature verification, idempotency, and reconciliation. Wallet balances should be derived from immutable ledger entries or maintained with a transactionally consistent balance.

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


## 9. KOT and kitchen display routing: detailed implementation blueprint

### Goal and operator outcome
Kitchen Order Tickets should preserve item modifiers, quantity, special instructions, due time, routing destination, and order version. KDS adapters may use networked displays or printers, but order state must remain central. Retry a failed print with an idempotent ticket identifier and visible failure state to avoid silent missing orders or duplicate preparation.

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


## 10. POS shifts and cash management: detailed implementation blueprint

### Goal and operator outcome
A cashier shift has opening float, transactions, refunds, cash drops, expected closing cash, counted cash, variance, and closure actor. Reopening a closed shift must be permissioned and audited. Offline POS events need stable local IDs and a reconciliation policy when the same order arrives from multiple devices.

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


## 11. Meal entitlement and access verification: detailed implementation blueprint

### Goal and operator outcome
Eligibility can depend on plan, date, meal slot, campus, user status, remaining quota, and policy exceptions. Biometric, RFID, and QR are alternate evidence channels, not separate entitlement engines. Verify identity token, check entitlement, record a redemption exactly once, and return a clear denial reason without exposing sensitive account details.

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


## 12. RSVP forecasting and meal counts: detailed implementation blueprint

### Goal and operator outcome
Forecasting combines eligibility, RSVP, historical show-up rates, weather/calendar context where authorized, and operational adjustments. The system should show baseline, committed RSVPs, predicted attendance, and uncertainty separately. A prediction must not silently alter a contractual entitlement or deny a meal.

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


## 13. Subscription and term billing: detailed implementation blueprint

### Goal and operator outcome
Subscriptions need effective dates, plan versions, pricing, billing cycles, proration policy, pause/cancel policy, and payment status. Changing a plan should not rewrite historical invoices. Meal redemptions should refer to the applicable plan version and policy effective at that time.

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


## 14. Vendor settlement and commission: detailed implementation blueprint

### Goal and operator outcome
Settlement reports should aggregate orders by vendor and period, separate gross sales, tax, refunds, commissions, discounts funded by each party, and net payable. Lock a settlement period when finalized; corrections should produce adjustment entries. Reconcile settlement totals to orders, payments, refunds, and bank payouts.

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


## 15. Enterprise identity and integrations: detailed implementation blueprint

### Goal and operator outcome
Institutions may integrate SSO, HR/student rosters, access control, ERP, payment gateways, and attendance systems. Treat external identifiers as scoped to the source system. Use an integration inbox/outbox, schema versioning, retry with backoff, dead-letter queues, and operational dashboards. A successful API response does not prove downstream processing completed.

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


## 16. Offline-first operation and sync: detailed implementation blueprint

### Goal and operator outcome
For cafeterias with unreliable connectivity, distinguish actions safe to queue offline from actions that require server authorization. Cache menus with expiry, use unique device-generated IDs, and preserve event ordering where it matters. Inventory-sensitive ordering may require limited quotas or a fail-closed policy. On reconnect, show conflicts rather than silently overwriting state.

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


## 17. Analytics and service-level metrics: detailed implementation blueprint

### Goal and operator outcome
Measure order-to-acceptance, acceptance-to-ready, ready-to-pickup, cancellation, payment failure, refund latency, stockout rate, and vendor settlement variance. Report percentiles as well as averages because a few slow orders can disappear in mean values. Separate technical failures from operational delays.

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


## 18. Privacy and access-control safeguards: detailed implementation blueprint

### Goal and operator outcome
Institutional data can reveal attendance, location, dietary choices, and consumption habits. Collect only fields needed for operations and define retention. Restrict biometric templates or identifiers; prefer external verification tokens where feasible. Provide auditable administrative access and ensure vendor accounts cannot query other vendors' customers.

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


## 19. Load, resilience, and incident management: detailed implementation blueprint

### Goal and operator outcome
Plan for class breaks and lunch rush spikes, not only average traffic. Use queue-based processing for notifications and kitchen events, but keep order acceptance semantics clear. Define degraded modes for payment-provider outage, KDS outage, campus network loss, and integration delay. Monitor queue age, event lag, duplicate rates, and settlement mismatch.

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


## Entity contract: Institution

The `institution` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Campus

The `campus` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Outlet

The `outlet` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Vendor

The `vendor` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Stall

The `stall` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

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


## Entity contract: Menu Availability Window

The `menu_availability_window` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Order

The `order` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Order Line

The `order_line` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

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


## Entity contract: Wallet Ledger

The `wallet_ledger` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Meal Entitlement

The `meal_entitlement` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Subscription

The `subscription` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Rsvp

The `RSVP` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Kot

The `KOT` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Kds Ticket

The `KDS_ticket` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Pos Shift

The `POS_shift` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Settlement

The `settlement` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Device

The `device` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

**Validation contract.** Validate type, length, range, allowed enum values, referenced-record existence, tenant ownership, and lifecycle compatibility. Normalize phone numbers, currency, units, and dates at the boundary while preserving original display values when operationally useful. Reject unknown enum values rather than guessing. If a field is derived, document whether it is recomputed, stored as a projection, or frozen in a snapshot.

**Lifecycle contract.** State which transitions are permitted, who can perform them, and whether a transition is reversible. For irreversible actions, prefer an explicit command with a confirmation reason. Keep deletion separate from archival. Historical records must remain readable even if the referenced catalogue item, user, or vendor becomes inactive.

**Integrity contract.** Define unique keys, foreign-key rules, deletion behavior, concurrency strategy, and idempotency requirements. If two records must change together, use a database transaction. If an external provider is involved, use an outbox record and asynchronous worker rather than a database transaction that remains open during network I/O.

**Observability contract.** Emit structured logs with correlation_id, actor_id, entity_id, command, result, latency, and error_code. Do not log credentials, full payment credentials, or unnecessary personal information. Provide an admin-readable history and metrics for failed transitions, conflict rates, retries, and records stuck in pending states.


## Entity contract: Integration Event

The `integration_event` record should have a stable primary identifier and explicit ownership scope. Define required fields separately from optional descriptive fields. Use normalized foreign keys for relationships, and preserve immutable snapshots whenever this entity participates in a customer promise, accounting entry, or operational instruction. Avoid storing multiple unrelated concepts in one JSON blob merely to accelerate the first prototype.

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


## Scenario suite: Institution and campus tenancy

Scope: Model institution, campus, building, outlet, vendor, and service area separately. A campus may contain several outlets and policy zones. Tenant boundaries should be explicit in data and authorization. Enterprise customers often require configuration inheritance: institution defaults, campus overrides, outlet overrides, and vendor-specific exceptions.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to institution and campus tenancy. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Digital cafeteria product boundary

Scope: The digital cafeteria flow supports discovery, ordering, payment, kitchen routing, fulfillment, and reporting across multiple vendors. Do not confuse it with fixed meal-plan eligibility or a simple QR menu. The system must show which outlet owns each item, whether a combined basket is permitted, and whether payment or pickup is handled per vendor or centrally.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to digital cafeteria product boundary. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Mess Manager and fixed meal programs

Scope: Fixed meal programs need a schedule, eligibility policy, meal slot, attendance or redemption event, and settlement logic. A student or employee may have a term subscription but still need to RSVP for a particular meal. Eligibility and actual consumption are different facts: the former permits a meal, the latter records that it was served.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to mess manager and fixed meal programs. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: QR ordering and table/seat identity

Scope: A QR code can represent a menu, a table, a seat, a pickup point, or a short-lived ordering session. Avoid treating the QR token itself as proof of user identity. Signed tokens should be revocable and scoped to the intended outlet and function. Public QR browsing can be allowed while checkout requires authentication or a verified payment method.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to qr ordering and table/seat identity. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Menu publication and time-based availability

Scope: Menu items need schedules, stock limits, outlet ownership, price versions, and temporary sold-out states. A menu being visible does not guarantee an item can still be ordered. Check availability at basket validation and again at order commit. Support breakfast/lunch windows, cutoff times, holidays, and emergency closures.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to menu publication and time-based availability. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Multi-vendor basket and routing

Scope: If a basket spans vendors, the system must define whether it becomes one parent order with child vendor orders or several independent orders. Each child has its own acceptance, preparation, cancellation, and settlement. Customer-visible status should aggregate child statuses without hiding a delayed vendor. Partial cancellation/refund behavior must be explicit.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to multi-vendor basket and routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Order lifecycle and invariants

Scope: Use a guarded lifecycle such as Draft, Submitted, PaymentPending, Accepted, InPreparation, Ready, Collected/Delivered, Cancelled, Refunded, or Failed. A transition must validate the current state and actor permissions. Do not permit a kitchen display to mark an unpaid or unaccepted order ready unless the configured payment policy explicitly allows it.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to order lifecycle and invariants. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Payment, wallets, and institutional accounts

Scope: Model payment intent, provider transaction, capture, refund, wallet ledger, and institution-funded subsidy separately. Never treat a client-side success screen as authoritative settlement. Webhooks require signature verification, idempotency, and reconciliation. Wallet balances should be derived from immutable ledger entries or maintained with a transactionally consistent balance.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to payment, wallets, and institutional accounts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: KOT and kitchen display routing

Scope: Kitchen Order Tickets should preserve item modifiers, quantity, special instructions, due time, routing destination, and order version. KDS adapters may use networked displays or printers, but order state must remain central. Retry a failed print with an idempotent ticket identifier and visible failure state to avoid silent missing orders or duplicate preparation.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to kot and kitchen display routing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: POS shifts and cash management

Scope: A cashier shift has opening float, transactions, refunds, cash drops, expected closing cash, counted cash, variance, and closure actor. Reopening a closed shift must be permissioned and audited. Offline POS events need stable local IDs and a reconciliation policy when the same order arrives from multiple devices.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to pos shifts and cash management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Meal entitlement and access verification

Scope: Eligibility can depend on plan, date, meal slot, campus, user status, remaining quota, and policy exceptions. Biometric, RFID, and QR are alternate evidence channels, not separate entitlement engines. Verify identity token, check entitlement, record a redemption exactly once, and return a clear denial reason without exposing sensitive account details.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to meal entitlement and access verification. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: RSVP forecasting and meal counts

Scope: Forecasting combines eligibility, RSVP, historical show-up rates, weather/calendar context where authorized, and operational adjustments. The system should show baseline, committed RSVPs, predicted attendance, and uncertainty separately. A prediction must not silently alter a contractual entitlement or deny a meal.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to rsvp forecasting and meal counts. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Subscription and term billing

Scope: Subscriptions need effective dates, plan versions, pricing, billing cycles, proration policy, pause/cancel policy, and payment status. Changing a plan should not rewrite historical invoices. Meal redemptions should refer to the applicable plan version and policy effective at that time.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to subscription and term billing. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Vendor settlement and commission

Scope: Settlement reports should aggregate orders by vendor and period, separate gross sales, tax, refunds, commissions, discounts funded by each party, and net payable. Lock a settlement period when finalized; corrections should produce adjustment entries. Reconcile settlement totals to orders, payments, refunds, and bank payouts.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to vendor settlement and commission. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Enterprise identity and integrations

Scope: Institutions may integrate SSO, HR/student rosters, access control, ERP, payment gateways, and attendance systems. Treat external identifiers as scoped to the source system. Use an integration inbox/outbox, schema versioning, retry with backoff, dead-letter queues, and operational dashboards. A successful API response does not prove downstream processing completed.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to enterprise identity and integrations. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Offline-first operation and sync

Scope: For cafeterias with unreliable connectivity, distinguish actions safe to queue offline from actions that require server authorization. Cache menus with expiry, use unique device-generated IDs, and preserve event ordering where it matters. Inventory-sensitive ordering may require limited quotas or a fail-closed policy. On reconnect, show conflicts rather than silently overwriting state.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to offline-first operation and sync. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Analytics and service-level metrics

Scope: Measure order-to-acceptance, acceptance-to-ready, ready-to-pickup, cancellation, payment failure, refund latency, stockout rate, and vendor settlement variance. Report percentiles as well as averages because a few slow orders can disappear in mean values. Separate technical failures from operational delays.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to analytics and service-level metrics. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Privacy and access-control safeguards

Scope: Institutional data can reveal attendance, location, dietary choices, and consumption habits. Collect only fields needed for operations and define retention. Restrict biometric templates or identifiers; prefer external verification tokens where feasible. Provide auditable administrative access and ensure vendor accounts cannot query other vendors' customers.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to privacy and access-control safeguards. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


## Scenario suite: Load, resilience, and incident management

Scope: Plan for class breaks and lunch rush spikes, not only average traffic. Use queue-based processing for notifications and kitchen events, but keep order acceptance semantics clear. Define degraded modes for payment-provider outage, KDS outage, campus network loss, and integration delay. Monitor queue age, event lag, duplicate rates, and settlement mismatch.


### Happy path
A valid user completes the action with complete data, authorized permissions, current pricing, and a healthy network. The system validates the request, writes the authoritative record, emits an auditable event, updates dependent projections, and returns a stable identifier. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Missing required data
The user omits a field required by the current business rule. The interface identifies the exact field and preserves other valid input. The server independently rejects the invalid command with a structured error code; it must not trust browser-only validation. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Stale version
Another operator changes the record after the current user loaded it. The save includes an expected version or ETag. If the version is stale, the server returns a conflict and the UI presents changed fields so the operator can reload or reconcile. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Duplicate submission
The user double-clicks, retries after a timeout, or reconnects after the server committed but before the response arrived. The command carries an idempotency key. The server returns the original result for the same key and does not create a second financial, order, or communication side effect. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Permission denied
A user can see a route or manipulate a client request but lacks authorization for the target object or action. The API denies access without leaking whether unrelated tenant records exist. The denial is observable in security logs and does not mutate data. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Downstream provider outage
A document, messaging, payment, or integration provider times out. The primary record remains in a known state; the external action is marked pending or failed, a retry is scheduled where safe, and the user can see the next step. Retrying must not duplicate external effects. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Concurrent edits
Two operators change overlapping fields. The server uses optimistic concurrency or a transaction with explicit conflict detection. Non-overlapping edits may be merged only under documented rules. Prices, payment amounts, dates, guest counts, and confirmed selections should never be silently overwritten. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Partial completion
A multi-step operation succeeds for one component but fails for another. The system records component-level status and a compensating action if rollback is possible. The UI should state exactly which part succeeded and avoid presenting the overall operation as fully complete. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Audit correction
An operator discovers an incorrect value after it has affected downstream work. The correction path captures original value, replacement, actor, timestamp, reason, and impacted documents or tasks. Financial records use reversal or adjustment semantics when required. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.


### Boundary value
The user enters zero, one, the configured maximum, a value just over the maximum, a date at midnight, or a quantity with precision near the supported unit scale. The system applies documented boundaries consistently in the UI, API, calculations, exports, and reports. For **MealPe**, apply this scenario specifically to load, resilience, and incident management. Identify the initiating role, preconditions, command payload, authoritative state change, event emitted, downstream projections, user-visible result, and audit evidence. Include one automated API test and one end-to-end UI test. Where this workflow changes money, stock, availability, customer commitments, or external communication, add a reconciliation assertion rather than relying only on a success toast.

# Expanded Engineering Annex: Test Strategy and Release Gates

A credible reverse-engineering specification ends with observable pass/fail checks. The tests below are proposed for an independent implementation. They should run in CI and in a staging environment with test accounts and provider sandboxes.


## Unit tests
Pure calculations, input normalization, lifecycle transition guards, role policy decisions, unit conversions, pricing, tax rounding, and status aggregation. Use table-driven tests for boundary values and property-based tests for invariants.

- For **Institution and campus tenancy**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Digital cafeteria product boundary**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Mess Manager and fixed meal programs**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **QR ordering and table/seat identity**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu publication and time-based availability**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Multi-vendor basket and routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Order lifecycle and invariants**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Payment, wallets, and institutional accounts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **KOT and kitchen display routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **POS shifts and cash management**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Meal entitlement and access verification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **RSVP forecasting and meal counts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Repository and database tests
Tenant isolation, unique constraints, transaction rollback, optimistic concurrency, soft deletion, ledger balancing, immutable snapshots, and migrations from the previous schema version.

- For **Institution and campus tenancy**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Digital cafeteria product boundary**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Mess Manager and fixed meal programs**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **QR ordering and table/seat identity**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu publication and time-based availability**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Multi-vendor basket and routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Order lifecycle and invariants**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Payment, wallets, and institutional accounts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **KOT and kitchen display routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **POS shifts and cash management**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Meal entitlement and access verification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **RSVP forecasting and meal counts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## API contract tests
Authentication, authorization, pagination, field validation, stale versions, idempotency keys, error envelope stability, rate limits, and forbidden field injection.

- For **Institution and campus tenancy**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Digital cafeteria product boundary**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Mess Manager and fixed meal programs**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **QR ordering and table/seat identity**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu publication and time-based availability**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Multi-vendor basket and routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Order lifecycle and invariants**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Payment, wallets, and institutional accounts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **KOT and kitchen display routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **POS shifts and cash management**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Meal entitlement and access verification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **RSVP forecasting and meal counts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Integration tests
Payment provider sandbox, PDF rendering, messaging handoff, storage uploads, webhooks, roster imports, device adapters, and downstream retry behavior where relevant to the app.

- For **Institution and campus tenancy**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Digital cafeteria product boundary**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Mess Manager and fixed meal programs**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **QR ordering and table/seat identity**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu publication and time-based availability**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Multi-vendor basket and routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Order lifecycle and invariants**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Payment, wallets, and institutional accounts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **KOT and kitchen display routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **POS shifts and cash management**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Meal entitlement and access verification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **RSVP forecasting and meal counts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## End-to-end tests
Complete role-specific journeys using realistic sample data and multiple browser/device sessions. Assert not only the visible UI but also database state, emitted events, audit trail, generated files, and reconciled totals.

- For **Institution and campus tenancy**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Digital cafeteria product boundary**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Mess Manager and fixed meal programs**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **QR ordering and table/seat identity**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu publication and time-based availability**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Multi-vendor basket and routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Order lifecycle and invariants**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Payment, wallets, and institutional accounts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **KOT and kitchen display routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **POS shifts and cash management**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Meal entitlement and access verification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **RSVP forecasting and meal counts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Performance tests
Test normal traffic, peak bursts, large exports, large catalogues, and slow external providers. Record p50/p95/p99 latency, queue age, database contention, and error rate.

- For **Institution and campus tenancy**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Digital cafeteria product boundary**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Mess Manager and fixed meal programs**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **QR ordering and table/seat identity**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu publication and time-based availability**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Multi-vendor basket and routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Order lifecycle and invariants**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Payment, wallets, and institutional accounts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **KOT and kitchen display routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **POS shifts and cash management**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Meal entitlement and access verification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **RSVP forecasting and meal counts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Security tests
Cross-tenant IDOR, privilege escalation, CSRF where applicable, XSS in free-text notes, unsafe file uploads, rate-limit bypass, webhook forgery, secret leakage, and excessive personal-data exposure.

- For **Institution and campus tenancy**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Digital cafeteria product boundary**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Mess Manager and fixed meal programs**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **QR ordering and table/seat identity**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu publication and time-based availability**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Multi-vendor basket and routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Order lifecycle and invariants**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Payment, wallets, and institutional accounts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **KOT and kitchen display routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **POS shifts and cash management**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Meal entitlement and access verification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **RSVP forecasting and meal counts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


## Recovery tests
Kill a worker mid-job, time out after a successful commit, replay a webhook, restore a backup, reconnect an offline client, and retry an external message. Verify no duplicated money movement or customer commitment.

- For **Institution and campus tenancy**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Digital cafeteria product boundary**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Mess Manager and fixed meal programs**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **QR ordering and table/seat identity**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Menu publication and time-based availability**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Multi-vendor basket and routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Order lifecycle and invariants**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Payment, wallets, and institutional accounts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **KOT and kitchen display routing**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **POS shifts and cash management**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **Meal entitlement and access verification**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.

- For **RSVP forecasting and meal counts**, create at least one positive case, one invalid-input case, one permission-denied case, one concurrency or retry case where applicable, and one audit assertion. Preserve fixtures so a regression can be reproduced by issue ID.


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
For **MealPe**, collect evidence only through public pages or an authorized test account. For every screen, record the entry route, actor role, preconditions, visible fields, defaults, validation messages, actions, resulting state, network-independent observable outcome, and screenshot/video reference. For every calculation, capture at least three input-output examples including a boundary case. For every integration, record the user-visible handoff and only the delivery state that the authorized provider exposes. Redact real customer data. Never bypass authentication, evade access controls, or access another customer's records.

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
- Official platform page: https://mealpe.app/
- Official Digital Cafeteria solution page: https://mealpe.app/solutions/software/digital-cafeteria
- Public claims include digital cafeteria, mess programs, QR ordering, POS, kitchen routing, subscriptions, RSVP forecasting, vendor analytics, and institutional integrations; detailed internal implementation is unverified.

## Glossary and naming discipline
Use **confirmed** only for information directly supported by a public source or authorized observation. Use **inferred** for a likely behavior derived from the visible product flow. Use **proposed** for an independent implementation recommendation. Use **unknown** when evidence is absent. Never describe a proposed table, endpoint, algorithm, or architecture as if it were the competitor's actual internals.
