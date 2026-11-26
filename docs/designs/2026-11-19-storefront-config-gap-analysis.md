# Storefront customisation — how far our engine is from Wix and Shopify

**Date:** 19 November 2026 · **Status:** audit, no code change
**Related:** `2026-11-16-storefront-builder.md`, `2026-11-16-storefront-customise.md`,
`2026-11-17-production-storefront.md` (§10–14), `docs/designs/next-build-handoff.md` G9/G12

## 1. Problem

The storefront config screen is the product's shop window: an owner who has used Wix,
Shopify or a website builder will judge EventsMa by what they can change without asking
us. The question is not "does it work" but "is it enough", and where it is not, which
missing *engine* logic (not missing buttons) is the cause.

## 2. What we actually tested

Run against the local dev server on `:3400` with the live Supabase project, 19 Nov 2026.

| Check | Result |
|---|---|
| `GET /p/kannan-events` | 200, 242 KB HTML |
| Tenant brand applied | `--brand:#183d33` present on the page |
| Enquiry form rendered | `id="storefront-enquiry"` present |
| `description`, `og:*`, `twitter:*`, canonical, robots | all present (`robots: index, follow`) |
| `GET /storefront/customise` signed out | 307 → `/login` (auth gate holds) |
| `GET /p/does-not-exist` | 404 (no soft fallback to another tenant) |
| `GET /sitemap.xml` | 5 URLs: home, privacy, terms, **2 storefronts**; **0** `/p/[slug]/services/...` |
| `GET /robots.txt` | `/storefront` disallowed, `/p` allowed — correct split |
| Absolute URLs in metadata | emitted as `http://localhost:3100/...` while serving `:3400` — they come from `NEXT_PUBLIC_APP_URL`, not the request |

The last row is not a bug locally, but it means **preview deployments inherit the
production origin** in canonical/OG tags unless the env var is per-environment.

## 3. What the engine offers today (verified in code)

| Area | Surface | Evidence |
|---|---|---|
| Sections | 10 fixed keys, one row per key, reorder by one step, show/hide | `lib/domain/storefront.ts` `SECTION_KEYS`; `lib/db/storefront.ts` `moveStorefrontSection` |
| Per-section content | heading override; hero photo; FAQ (12), team (12), testimonials (12) | `sanitiseSectionConfig`, `section-builder.tsx` |
| Design | 3 layouts, 1 brand colour, 2 wordmark fonts, logo upload | `STOREFRONT_THEMES`, `BRAND_FONTS`, `BRAND_COLOURS` |
| Identity | name, tagline, city, phone, subtitle, 600-char intro | `storefront_snapshot.ts` `identity`/`brand` |
| Publishing | immutable snapshot versions, restore = new version, unpublished-changes fingerprint | `lib/db/storefronts.ts` |
| Public routes | `/p/[slug]`, `/p/[slug]/services/[item]` | `app/p/**` |
| SEO | per-tenant title/description derived from name/tagline, OG/Twitter, canonical, robots | `app/p/[slug]/page.tsx` `generateMetadata` |
| Lead capture | enquiry form (`source='storefront'`), rate limit, honeypot | `app/p/[slug]/actions.ts` |

## 4. What Wix and Shopify expose (sourced)

| Capability | Shopify | Wix / Studio | Us |
|---|---|---|---|
| Section/block model | Sections **and blocks**; up to **25 sections and 1250 blocks per template**, block sets defined per section | Section grid + stack, flexbox, free-form elements | 10 fixed sections, no blocks |
| Repeat/add/duplicate | Any number of sections/blocks within the caps | Any number of sections/strips/elements | One of each; cannot add a second "About" or a custom text section |
| Theme settings | Global typography, colours, social, cart | Site Styles: colour palette, text themes, page transitions, max width | 1 colour, 2 fonts, 3 layouts |
| Custom CSS | Theme code editable | Studio: custom CSS, runtime styles | None |
| Breakpoints | Theme-controlled | Studio: custom desktop/tablet/mobile breakpoints | Tailwind defaults, not owner-controlled |
| Animation | Theme-defined | No-code presets, scroll/loop/hover | CSS reveal only |
| Templates/per page | Multiple templates, 20 themes, one published, draft themes | Multi-page site, per-page settings | Single page + catalogue detail routes |
| Preview before publish | Theme preview + **shareable preview link** for unpublished themes | Editor preview; publish step required for live | Owner full-page preview **and** a signed seven-day client link (no session needed) |
| Version history | Version history + restore (Canvas/Sidekick) | Site History with author + timestamp, restore (erases later changes) | Restore exists; no diff/compare, **no pruning** (table grows forever) |
| Scheduling | Planned theme changes via Markets rollouts | Publish step, scheduled/marketing tooling | Publish is immediate only |
| SEO | Per-resource SEO fields, sitemap, structured data by theme | Per-page title/description/indexable, defaults by page type | Derived metadata only; **no override fields, no JSON-LD, detail pages absent from sitemap** |
| Multilingual | Markets + Translate & Adapt | Multilingual, 180+ languages, per-language SEO | English-only public page (Tamil copy exists, unused) |
| Custom domain | Yes | Yes | **No** — slug only |
| Password/preview gate | Storefront password | Site password | None (only publish/unpublish) |
| Media | CDN, responsive images, alt text fields | Image editor, focal point, alt text | Hero + logo only; one cover per work item; hero `alt=""` |

Sources: Shopify Help — *Sections and blocks* (limits), *Adding, previewing, and buying
themes* (20 themes, preview links), *Customizing theme settings*, *Publishing themes*;
Shopify Canvas — *Restore an earlier version*; Wix Studio site (grid/stack, flexbox,
breakpoints, custom CSS, animations); Wix Help — *Customizing your site's theme and
design*, *Site history*, *SEO settings*, *Wix Multilingual overview*, *Publishing your
site*.

## 5. The engine gaps, in the order they hurt

### P0 — an owner would notice these in the first hour

1. **No draft preview, no preview link.** Shopify can hand a client a URL for an
   unpublished theme; Wix previews before publishing. We can only show the builder's
   identity card, so "publish and look" is the only way to see the real page. This is
   the most damaging gap because our whole publish model is built on draft ≠ live.
2. **No custom domain.** A business that owns `kannanevents.in` cannot use it. Slug-only
   URLs also weaken the storefront's credibility in WhatsApp forwards.
3. **SEO is engine-derived, not owner-controlled.** Title/description come from
   name/tagline; there is no per-storefront override, no `LocalBusiness`/`Service`
   JSON-LD (the marketing home has it, `/p/[slug]` does not), no tenant-specific OG
   image (falls back to a static file when no logo), and catalogue detail pages are
   indexable but missing from `sitemap.xml`.
4. **Media is one hero photo.** Work entries support one cover, no gallery, no alt text,
   no focal point. A portfolio page that sells ceremony cannot show the ceremony.

### P1 — the structural limits behind those symptoms

5. **Sections are types, not instances.** `storefront_sections` is unique on
   `(org_id, key)`, so a workspace can never have two text blocks, a custom "Awards"
   section or a second gallery. Wix/Shopify model is a list of instances with a type and
   settings; ours is a fixed enum. Fixing this is a data-model change, not a UI change.
6. **One config shape for all sections.** `SectionConfig` is a struct with
   `faq`/`team`/`testimonials` fields that every row carries. Adding a section type means
   editing the union, the sanitiser, the snapshot version and the builder. Shopify's
   schema-per-section is what makes adding a block type cheap; without it our section
   catalogue will stay at ten.
7. **Design tokens are thin.** One brand colour and two wordmark fonts, with three
   hand-written layout objects (`storefront-look.ts`). Wix exposes a palette and text
   themes; Shopify exposes typography and colour schemes per section. Missing here:
   secondary/accent colour, body vs heading font pairing, density/spacing, per-section
   background and alignment, hero layout variants, header/footer configuration.
8. **Single page, no navigation model.** Wix/Shopify sites are multi-page with a menu.
   Our storefront is one page plus generated catalogue detail routes; there is no way to
   add an "Awards", "Locations" or "Terms" page, and no nav/footer editor.
9. **Version history is write-only.** Restore works, but there is no compare, no
   "preview this version", and **no retention cap** — `nextVersionNumber` scans all rows
   and nothing deletes them, so the table grows per publish forever (the production
   audit already recommended keeping the last 20).
10. **No scheduling.** Publishing is immediate. Wix and Shopify both support planned
    changes; an event business wants "go live on Monday" without logging in on Monday.

### P2 — parity items that can wait

11. **No analytics or attribution on the storefront.** Only `/api/vitals` exists. We do
    not record storefront views, section scroll depth, or UTM/referrer on an enquiry, so
    an owner cannot tell which section produced a lead.
12. **No experiments/A-B testing.** Neither platform ships a first-class native A/B for
    storefronts, so this is not a parity gap — but it is the natural next step after (11).
13. **No password/preview gate** for a site that is not ready for the public.
14. **Public page is English-only** although the Tamil catalogue exists; every other
    surface is being localised.
15. **No reviews/moderation and no booking** — deliberately out of scope per G12 and the
    availability-model blocker, not a customisation gap.

## 6. Options

| Option | What it buys | Cost | Risk |
|---|---|---|---|
| A. Add fields to the current model (secondary colour, per-section image, SEO overrides) | Fast, low risk, closes half of P0 | S | Model still caps at 10 sections |
| B. Section instances + typed settings schema + renderer registry | The structural parity that makes Wix/Shopify comparisons fair | L | Snapshot v5, migration, builder rewrite; touches published pages |
| C. Draft preview tokens + scheduled publish | Removes "publish to see it"; lets owners plan launches | M | New token path — needs the same tenancy proof as `/q/[token]` |
| D. Custom domains | Biggest credibility win after preview | M–L | DNS/Vercel access the user must grant; per-domain canonical/OG |
| E. SEO package (overrides, JSON-LD, sitemap detail URLs, tenant OG) | Search discovery for storefronts and catalogue | M | Low; additive metadata |

## 7. Decision (proposed, not started)

Ship **E → C → A → D → B**, and only then consider P2. Reason: E and C are additive and
deliver the two things an owner notices first (findable page, "show me before it goes
live"); A closes cheap parity gaps; D needs user-supplied DNS; B is the only item that
rewrites the publishing model and should be done once, deliberately, with a design doc of
its own (snapshot v5, section instances, settings schema, renderer registry).

Do **not** start B before C: a preview path built on today's model is still useful after
B, whereas a section-instance rewrite without preview repeats the same blindness.

## 8. Data change (only if A/B/C/E are approved)

- `storefront_versions` retention: prune to the last 20 per storefront in the publish
  transaction (no schema change).
- Preview: short-lived signed token table or HMAC on `(org_id, version_id, exp)`, read
  through a route that renders the snapshot without touching the published pointer.
- SEO: `businesses.settings.seo = { title, description, noindex }` (JSON, no migration),
  or typed columns if the owner needs them per language later.
- Section instances (B): migration `0015` adding `storefront_blocks (id, org_id, type,
  position, visible, settings jsonb)` and a snapshot v5 that carries the block list.
  Old snapshots remain readable; the renderer keeps the current ten types as block types.

## 9. Failure modes to design against

- A preview token that outlives unpublish must not expose a page the owner has hidden.
- A custom domain must resolve to exactly one tenant; a stale DNS row must 404, not fall
  back to the first storefront.
- SEO overrides are user input: cap length, strip markup, and keep `noindex` out of the
  sitemap.
- Pruning versions must never delete the version `published_version_id` points at.
- Section instances need a per-tenant cap (e.g. 40 blocks) or a single owner can make a
  page heavier than the whole app.

## 10. Acceptance tests (when built)

- Draft edit + preview link shows the draft; the public URL still serves the published
  version until publish.
- Unpublish then open the preview link → 404.
- Tenant A's preview token cannot render tenant B's storefront.
- `sitemap.xml` contains every published storefront **and** its active catalogue items,
  and no unpublished one.
- Publishing a 21st version deletes the oldest unless it is live.
- Custom domain for tenant A returns A's page; an unclaimed host returns 404.

## 11. Out of scope

Marketplace listing, booking/availability, reviews moderation, checkout — each has its
own blocker (see `2026-11-17-production-storefront.md` §8).

## 12. Part 1 shipped — discovery and publish confidence (19 November 2026)

Implemented in this slice, additive only; no migration and no change to the ten
section types.

| Gap | What shipped | Files |
|---|---|---|
| Draft preview (#1) | Owner-only full-page render of the draft at `/p/[slug]/preview`, with a pinned preview bar and a disabled enquiry form (a preview can never write a lead). Signed out → login; another tenant → 404. | `app/p/[slug]/preview/page.tsx`, `components/storefront/public-page.tsx`, `getDraftPublicProfile` |
| Shareable preview link (#1) | `/p/[slug]/preview/[token]`: the same draft for a client with no session. The token is an HMAC over org id, slug and a seven-day expiry (derived key, no new table, nothing to revoke one by one); the org id is checked against the slug's current owner so a reused slug cannot inherit an old link. The displayed link follows the request's host, so preview deployments and a local port other than the configured one open the right page. The same rule (`requestOrigin()`) now covers every link an owner copies — storefront share and draft links, the client quote link, and team invitations — because each is rendered back to the requester. Emailed links, auth redirects, canonicals, OG images and the sitemap keep `appUrl()`; a request with no usable Host logs an error rather than quietly substituting the configured origin. Bar says it is a draft, enquiry form stays disabled, `noindex`. | `lib/security/storefront-preview-token.ts`, `app/p/[slug]/preview/[token]/page.tsx`, `components/storefront/preview-link.tsx` |
| SEO overrides (#3) | Title (60) and description (160) fields plus a `noindex` switch, saved into `businesses.settings.seo`, frozen into snapshot **v5**, used by `generateMetadata` with the derived copy as placeholder/fallback. | `lib/domain/storefront-seo.ts`, `components/storefront/seo-form.tsx`, snapshot v5 |
| Structured data (#3) | `LocalBusiness` JSON-LD (name, description, phone, city, logo, url, offers per shown service) emitted from the same published DTO the page renders; absent from preview. | `public-page.tsx` |
| Sitemap coverage (#3) | Service listing **and** catalogue detail URLs, read from the **published snapshot** (not draft visibility), skipping `noindex` storefronts and revoked services. 90 URLs on the live project, previously 0; every listed page returns 200. | `app/sitemap.ts`, `lib/domain/storefront-sitemap.ts` |
| Tenant social card (#3) | `/p/[slug]/opengraph-image` renders the business name, city, tagline and own colour at 1200×630 instead of the platform logo. | `app/p/[slug]/opengraph-image.tsx` |
| Version retention (#9) | Publishing prunes beyond the newest 20 versions, never deleting the live pointer. | `lib/db/storefronts.ts` |

Evidence: `npx tsc --noEmit` clean; `npx vitest run` 152 passed (11 new SEO cases);
`npx next build` exit 0; live page 200 with `"@type":"LocalBusiness"` present, dynamic
`og:image`, canonical and `robots: index, follow` unchanged, brand colour and enquiry form
preserved; `/p/kannan-events/preview` → 307 `/login` signed out; OG route returns
`image/png` (37 KB); sitemap went from 0 to 80 catalogue URLs.

Not verified: the signed-in owner preview and the SEO save round trip (no session in this
environment). Both are typechecked and share the same code path as the tested public
render. The signed client link *was* exercised over HTTP: valid token 200 with
`noindex, nofollow`, a client bar, no editor link, a disabled enquiry form and no JSON-LD;
a tampered signature and the same token under another slug both 404.

The sitemap exclusions are now proven against real rows, not just the unit test:
`scripts/verify-sitemap-exclusions.ts` publishes two disposable storefronts (one with a
hidden service, one `noindex`), asserts all nine expected outcomes, and deletes both in a
`finally`. Every check passed and the sitemap returned to its 90-URL baseline.

### Review pass (same day)

Four things the fresh-eyes read changed:

1. Sitemap replaced its draft-table join with the published snapshot, and now also skips
   `noindex` storefronts. The selection rule moved to `shownServiceKeys()` so it is tested
   once and used by one caller.
2. The JSON-LD `url`/`image` were relative and the image was a 24-hour signed logo link;
   both are now absolute, and the image is the stable OG route.
3. `JSON.stringify` does not escape `<`, so an owner typing `</script>` into a business
   name could close the tag early. The payload now escapes `<`.
4. Version retention went from select-then-filter-then-delete to one `<= version - 20`
   delete: versions are monotonic, so the live pointer can never be in that range.

### Still open, in the order this document recommended

- **Custom domains** — blocked on DNS/Vercel access the user must grant; no code started.
- **Media depth** — one hero photo, one cover per work entry, no galleries/alt/focal point.
- **Section instances (#5/#6)**, **design tokens (#7)**, **multi-page nav (#8)**, **scheduled
  publishing (#10)**, **analytics/attribution (#11)**, **password gate (#13)**, **bilingual
  public page (#14)** — each needs its own slice; #5 is the model rewrite and should be
  designed on its own before code.
- Shareable preview links for clients (Shopify parity) would build on the owner preview:
the same renderer, plus a signed token the owner can send. Deliberately not invented here,
because it needs the same tenancy proof as `/q/[token]`.
