# Storefront media pipeline and error monitoring

**Date:** 20 November 2026 · **Status:** shipped (monitoring inert until a DSN exists)
**Related:** `docs/architecture/05-eventsma-gap-register.md` ES-02, ES-04;
`docs/architecture/06-production-readiness.md`; `docs/04` monitoring note
**Migration:** none

## Problem

Two P0 rows from the gap register, both about production rather than features:

1. Storefront photographs were raw `<img>` tags with an expiring Supabase URL, no
   dimensions, no `srcset`, and an empty `alt` on the hero. `next.config.ts` configured
   AVIF/WebP for an optimizer the storefront never called.
2. A storefront 500 was invisible until a client complained. `docs/04` named Sentry,
   but no SDK was installed.

## Evidence

| Check | Before |
|---|---|
| Hero markup | `<img src={signedUrl} alt="" className=…>` |
| URL stability | Supabase signed URL regenerated per render (24 h TTL) |
| Uploaded tenant photos | none, so the page looked acceptable by accident |
| Error path | `onRequestError` absent; only `/api/vitals` wrote to logs |

## Decision

### Images: stable signed proxy + `next/image`

- `lib/storage/image-url.ts` signs **the object path**, not a storage token, and emits
  `/api/storefront/image?p=…&e=…&s=…`. The HMAC uses `STOREFRONT_IMAGE_SECRET` (falling
  back to the service-role key so no new variable is required to ship).
- The expiry is **quantised to a seven-day window**, so every render inside a window emits
  byte-identical markup and the optimizer can cache one variant per width.
- `app/api/storefront/image/route.ts` verifies the signature, resolves a 60-second
  Supabase URL server-side, and streams the bytes with
  `Cache-Control: public, max-age=604800, immutable`.
- `next/image` with `fill` (hero, portfolio tiles) or explicit `width`/`height` (logo)
  supplies `srcset`, layout reservation and AVIF/WebP negotiation.
- Alt text is assembled from existing owner content (`lib/domain/storefront-image-alt.ts`):
  business + city for the hero, work title + venue for a tile, name + "logo" for the mark.
  No new copy field, so `i18n:audit` is unchanged by this slice.

**Why not a public bucket:** hidden portfolio work must not remain reachable forever.
**Why not expiring signed URLs directly:** the optimizer treats every new token as a new
image. The chosen trade-off is bounded: a URL emitted before an entry was hidden stops
working when its seven-day window closes, rather than immediately.

### Monitoring: Sentry, inert without a DSN

- `instrumentation.ts` loads the runtime config and exports
  `onRequestError = Sentry.captureRequestError`, which covers Server Components, Server
  Actions, route handlers and middleware.
- `instrumentation-client.ts` initialises the browser SDK; `app/global-error.tsx` reports
  the boundary error.
- `lib/observability/scrub.ts` masks emails, Indian mobile numbers and URL query strings,
  redacts identity fields at any depth, caps arrays, and runs in `beforeSend` on every
  runtime. Sentry 11's `dataCollection` is switched off per category as well.
- With no DSN the SDK is disabled: a preview deployment boots and behaves exactly as
  before, it simply reports nothing.

## Data change

None. The snapshot already stores object paths; only the way a path becomes a URL changed.

## Server authority

- The browser never sees the storage credential or a Supabase signed URL.
- The route accepts only `org-uuid/...` paths (no `..`, no leading slash, no backslash).
- Every rejection is a `404` with `no-store`, so probing cannot distinguish forged from
  expired.
- Publishing rules are untouched: the URL is only emitted for paths already in the
  published snapshot or a published portfolio row.

## Failure modes

| Case | Behaviour |
|---|---|
| No signing secret / no storage | `storefrontImageUrl` returns null; the page renders its gradient/initials fallback |
| Object deleted | route 404s; card layout keeps its reserved space |
| Storage fetch throws | route 404s, never a 500 |
| Upstream is not an image | route 404s |
| Tampered or expired token | 404 without touching storage |
| Tiny source image | Next falls back to the original bytes; verified and accepted |
| Owner hides a work entry | its last URL works until the current window ends (≤7 days) |

## Performance impact

- One fewer storage round trip per storefront render (URL construction is pure).
- AVIF/WebP variants at the widths `next.config.ts` already declares.
- Hero is `priority` only when the hero is the first section; portfolio tiles are lazy by
  default.
- `sizes` matches the real grid (100vw hero, 66/33vw tiles, 180px logo).

## Acceptance tests (all passing)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| Focused vitest | 22 tests, 4 files, 0 failed |
| `npx next build` | exit 0; `/api/storefront/image` built |
| Proxy with valid token | 200 `image/png`, `immutable`, `max-age=604800` |
| Tampered signature | 404 |
| Next optimizer for the same URL | 200 `image/avif` |
| Page route with no images | 200 (fallback path intact) |
| `npm run i18n:audit` | 467 in the shared working tree (other agents' in-flight edits; this slice adds no literal copy) |

The end-to-end check is repeatable:
`npx vite-node -c vitest.config.ts scripts/verify-storefront-images.ts http://localhost:3100`
(uploads one temporary object, checks the six behaviours, deletes it in `finally`).

## Known limits

- **No owner-authored alt text.** The derived text is accurate but not descriptive of the
  photograph itself; an "alt" field per image is a later slice.
- **Bounded revocation**, as above.
- **No real photo rendered through the page yet** — both demo tenants still have zero
  uploads, so the `<Image>` markup was compiled and the pipeline was proven with a
  temporary object, not by looking at a tenant page with a photograph.
- **Monitoring is wired, not live.** A Sentry project and `SENTRY_DSN` /
  `NEXT_PUBLIC_SENTRY_DSN` are still required; until then no event leaves the app and no
  alert exists. Source maps additionally need `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and
  `SENTRY_PROJECT`.
- **Vercel image quota.** Hobby includes 5,000 transformations/month; stable URLs keep the
  count to distinct widths rather than distinct renders.

## Out of scope

Gallery images per work item, focal point, blur placeholders, owner alt fields, R2, and
storefront analytics (ES-03).
