# Catering menu selection on the public share link

**Date:** 14 November 2026 · **Status:** shipped
**Related:** [`multi-service-share-portal.md`](multi-service-share-portal.md), `docs/06` (product flows)

## Problem

The owner already plans catering properly: `event_catering_sessions` carries one guest
count per session, `session_menu_items` holds the dishes chosen for that session, and
`category_selection_rules` carries the minimum, maximum and required flags per category.

The customer share link ignored all of it. `/share/[token]` listed every active
`service_items` row grouped by its free-text `category`, and printed the event's meal
sessions as a single sentence. So the customer could not tell which dishes belonged to
lunch, could not see "choose 2–4 starters", and could pick ten desserts from a category
capped at three. A request then arrived at `/submissions` that the owner had to
re-interpret by hand.

## Options

1. Keep the flat catalogue and add a free-text note field. Cheap, but the rules the
   owner configured would still be decoration.
2. Show the session menu read-only and take the request by phone. Honest but useless.
3. Render the owner's actual plan — sessions, their dishes, their rules — and validate
   the selection against those rules on the server. More work, but the configuration the
   owner already maintains becomes the customer's interface.

## Decision

Option 3.

- The customer portal presents **one block per event session**, each with its own guest
  count, timings and categories.
- A category shows its rule as data (`Choose 2–4`), a live counter, and blocks the
  submit while it is out of range.
- A **plate panel** summarises what the guest has put on the plate, so a 40-dish choice
  reads as a menu rather than a list of checkboxes.
- The server re-resolves the token, re-loads the menu, re-validates every category
  count and recomputes every amount. A browser-submitted total is never stored.
- Selections persist as `share_submission_sessions` (one row per session, with the guest
  count and amount frozen) and as `share_submission_lines` rows carrying
  `submission_session_id` and `category_name`.

Fallback: when an event has no sessions or no dishes assigned to them, the portal keeps
the old flat catalogue for that service, so existing links do not go blank.

## Data change (migration 0007)

| Table | Change |
|---|---|
| `share_submission_sessions` | new: submission, event session (set null on delete), name/date/time snapshots, guests, dish count, indicative paise |
| `share_submission_lines` | `submission_session_id` (FK, set null), `category_name` |

Both carry `org_id`; RLS: members read, owner/manager write.

## Server authority

- Every dish id must belong to the session it was submitted under.
- Every category count is validated with the same `validateSelection` the owner's own
  planning screen uses, against rules read at submit time.
- Amounts use `priceSelection` (integer paise) with the **session's** guest count, never
  the event's.

## Failure modes

| Failure | Behaviour |
|---|---|
| Rule tightened after the customer opened the page | Submit returns 400 with the category named; nothing is written |
| Dish archived between page load and submit | 400 "no longer available"; the customer is asked to refresh |
| Link expired or revoked mid-session | 404 before any write |
| Same client submits the same menu twice | Dedupe key includes session+dish pairs; 23505 returns the existing id |
| No sessions planned | Flat catalogue fallback, unchanged behaviour |

## Performance impact

Three extra queries per portal render (sessions, dishes, rules), each capped, stitched in
memory — no per-session query. The portal stays `force-dynamic`; the selection itself is
client state with integer-only preview maths, so typing and toggling never hit the network.

## Acceptance tests

- Pure: min/max/required verdicts, unlimited (`null`) max, per-session guest pricing,
  plate capacity, dedupe key stability.
- Live: session with 2–4 starters and 1–3 desserts rejects 5 starters server-side; a valid
  selection writes 1 submission + 1 session row per session + lines with session and
  category; `/submissions` renders the session-wise menu; the same POST twice creates one
  row.

## Out of scope

- Per-guest individual menus (each guest picking independently) — needs guest-level
  identities, not a link.
- Turning a submission into a quotation automatically (handoff G2).
- Photo upload from the customer.
