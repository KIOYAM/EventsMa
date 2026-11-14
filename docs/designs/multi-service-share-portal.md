# Design — Multi-service share portal and persistent submissions

**Status:** Phase 1 of the multi-service remediation implemented (service registry
config + public portal + durable submissions). Decoration, makeup and photography
workspaces already existed; their tables were unguarded by RLS and are now covered.

## Problem the audit found

1. The public `/share/[slug]` page lived inside the authenticated `(app)` layout, so
   a customer link redirected to `/login`.
2. It rendered a client-side `alert()` on submit. Nothing was stored.
3. The submit route inserted an `event_id` column into `enquiries`, which does not
   exist, so a submit would have failed at runtime.
4. `event_services`, `decoration_*`, `makeup_*` and `photography_*` had RLS enabled
   by the migration but **no policies**, which blanks every service workspace for a
   real authenticated role.
5. Service configuration saved every field under the same form name (`value`) and
   never sent the config `key`, so only one value could ever survive — and it was
   ignored because the field could not be matched.

## Decisions

### D1 — Share links are rows, not event ids

`share_links(token, org_id, event_id, kind, expires_at, revoked)`. A token is 18
random bytes, base64url. Resolution order: token → link → event. A raw event id is
still accepted as a legacy fallback so links already sent keep working; it is not
the supported flow.

### D2 — Submissions are durable and service-wise

`share_submissions` (customer + event + indicative total + dedupe key),
`share_submission_services` (one per selected service),
`share_submission_lines` (one per chosen catalogue item, with the unit price and
unit class **copied at submit time**). Editing the catalogue later cannot rewrite
what a customer asked for.

### D3 — The server computes the indicative price

`lib/domain/share-pricing.ts` is pure and integer-only. The browser uses the same
functions for its live preview; the submit route recomputes from the catalogue and
stores that number. A browser-supplied amount is never trusted.

Basis rules come from `quantityBasis`: `PER_GUEST` × event guests, `FLAT` × 1,
everything else × quantity. That is why a 500-guest wedding does not bill a flat
stage backdrop 500 times.

### D4 — Ownership is re-checked on submit, not assumed from the token

Every selected item must exist in that organisation's active catalogue and must
belong to the service key it was submitted under. A disabled service cannot be
submitted even if its items still exist.

### D5 — All writes in one transaction, with a dedupe key

Client (existing by phone or email, else created) → enquiry → submission → services
→ lines → notification. The last three only commit together. `dedupe_key` is a
sha256 of event, contact and sorted item ids; a retry returns the existing
submission instead of creating a second one.

### D6 — Email is best-effort; the row is the record

The in-app `notifications` row is written inside the transaction. Resend is called
after commit and a failure is swallowed, because a mail outage must not lose a
customer's request.

### D7 — Config saves per field

The config page renders one small form per field with its own `key`. `setServiceConfig`
inserts a `business_services` row when none exists, so the first edit is not lost.

## Security

- RLS policies added for `event_services`, `decoration_areas`, `decoration_setups`,
  `makeup_artists`, `makeup_appointments`, `makeup_trials`, `photography_coverage`,
  `photography_assignments`, `photography_shot_lists` (member read, owner/manager
  write) and `decoration_materials`, `photography_deliverables` (owner/manager only).
- `share_links` member-read / owner-manager-write; submissions owner/manager only.
- The public portal reads through the server connection; the browser never holds a
  database credential and receives only catalogue name, description and indicative
  price — never `cost_paise`.
- Expired or revoked links return 404.

## Verification record

Applied on the production database on 2026-11-14 (through the Supabase pooler, because
`DIRECT_URL` no longer resolves): migrations `0005` and `0006`, then `db/setup.mjs` →
**56 tables, 56 with RLS, 109 policies, two-tenant isolation PASS**.

Proven end to end on the live deployment with a labelled test event and two services:
portal rendered both catalogues; one POST wrote client + enquiry + submission +
2 service rows + 2 lines + 1 queued notification; indicative total ₹14,000
(`PER_GUEST` 100 × ₹60 = ₹6,000, `FLAT` ₹8,000); an identical repeat POST returned
`duplicate: true` with no second row; the owner saw it at `/submissions` and
`Mark reviewed` persisted. All test rows were then deleted and the tenant restored to
catering-only.

## Known limitations (honest)

- Business-wide catalogue links (`kind = 'catalogue'`) are modelled but the portal
  only serves event links today.
- Submissions are reviewed and marked; generating the consolidated quotation from a
  submission is still a manual step in the existing composer.
- No reference-image upload yet: file storage is not wired for public tokens.
