# Storefront customisation page (brand studio)

**Date:** 2026-11-16
**Surface:** `app/(app)/storefront/customise`
**Public result:** `app/p/[slug]`

## 1. What the owner asked for

A business owner must be able to make their public page look like *their* business —
name, logo, colour, type, wording, sections — and then send that one link to a client.
The earlier builder only reordered and hid sections and picked one of three designs;
identity, brand colour, logo and typography were not editable at all.

The prototype's "Brand studio" (`ffRenderBrandStudio`, `ffSaveBrandStudio`) is the
reference for the field set: business name, fallback initials, tagline, small
descriptor, wordmark typography, colour system, custom headline/about text, logo
upload, plus the share modal that copies the address.

## 2. What was built

`/storefront/customise` is a single page of form cards, each posting a server action:

| Card | Fields | Stored in |
| --- | --- | --- |
| Identity and logo | name, tagline, city, phone, logo upload/remove | `businesses.name/tagline/city/phone`, `settings.brand.logoPath` |
| Colour, typography and words | brand colour, wordmark style, descriptor, introduction, design | `settings.brand.primary/font/subtitle`, `settings.about`, `settings.brand.theme` |
| Sections and order | existing section builder (order, visibility, headings, hero photo) | `storefront_sections` |
| Share with clients | public URL, copy, WhatsApp, open | none (reads `settings.published`) |

`/storefront` is now an overview: a live summary of the page, the publish switch,
and links to the pieces. Two surfaces editing the same settings was the previous
problem; now there is one.

## 3. Decisions

- **Wordmark type is a two-value choice, not a font picker.** The app loads one serif
  and one sans; offering names of fonts that are not loaded means a "choice" that
  silently renders as something else. `BRAND_FONTS` in `lib/domain/storefront.ts`
  lists only families the build actually ships.
- **Colour is a hex, not a preset list.** A `<input type="color">` gives an arbitrary
  brand colour; the four presets are swatches for orientation only. Contrast is
  handled by `--brand-ink` with `color-mix`, so a light brand colour cannot produce
  unreadable text on the dark hero.
- **Initials stand in for a missing logo.** The public page and the owner preview show
  a wordmark tile when no image is uploaded, so the page never has a hole at the top.
- **Logo reuses the storefront image path.** Same bucket, same validation, same
  signing; a separate pipeline would have been a second thing to secure for no gain.
  Clearing or replacing a logo deletes the previous object.
- **One action per card, `back()` returns to the customise page.** Redirect targets for
  the older builder actions moved from `/storefront` to `/storefront/customise`, since
  that is where the controls now live.
- **No client JS except the clipboard.** Everything else is a form post; the share
  strip is a client component because `navigator.clipboard` has no server equivalent,
  and it falls back to "select the address above" when the browser blocks it.
- **Share is gated on publish.** A draft page returns 404, so offering a copyable link
  would send a client to an error. Drafts get the explanation and a link to publishing.

## 4. Data and tenancy

No new table. Identity columns already existed; everything else is inside
`businesses.settings` (`brand.primary`, `brand.font`, `brand.theme`, `brand.logoPath`,
`brand.subtitle`, `about`) which already carries `RLS` through `businesses`.

Reads and writes go through `lib/db/storefront.ts` (`getStorefrontBrand`,
`setStorefrontBrand`, `updateStorefrontIdentity`) scoped by `orgId` from the session.
`setStorefrontBrand` is one read-modify-write so saving colour cannot drop the theme.

## 5. Copy

All new copy lives in `lib/i18n/messages/en/storefront.ts`, registered in
`messages/en.ts` and `messages/ta.ts`; Tamil covers the labels, the long explanations
stay English and show up as coverage gaps on purpose. `npm run i18n:audit` moved
**519 → 473** (the baseline before this feature was 481).

## 6. Verification

- `npx tsc --noEmit` — 0.
- `npx next build` — 0, 48 routes including `/storefront/customise`.
- `npx vitest run` — 129 passed, 14 skipped (integration suites need `TENANCY_LIVE_TEST`).
- `npm run i18n:audit` — 473.
- Owner page exercised in a signed-in browser: saving brand colour `#8a6524`, sans
  wordmark, a descriptor and an introduction wrote through and the public page
  rendered the descriptor, the introduction, `font-sans` on the `h1` and
  `--brand:#8a6524`. Values were then restored to Kannan Events' originals
  (`serif` / `editorial` / `#183d33`, no subtitle, no about).
- Share strip: copy sets the button to "Link copied" and the live region to
  "Copied to your clipboard."; the WhatsApp href carries the encoded message.
- Temporary tenant and temporary owner login deleted; `organisations` back to 2 and
  `storefront_sections` back to 0.

## 7. Not covered

- Logo upload was not exercised against real storage in this pass (the file input path
  is the same code the section hero photo uses, which was verified earlier).
- Reviews, prices and menu visibility toggles from the prototype are absent: the app
  has no reviews, and prices are per-quote rather than a public price list. Adding a
  toggle for a section that does not exist would be a control that does nothing.
- The public page still renders `http://localhost:…` in the share card because
  `NEXT_PUBLIC_APP_URL` is set to the dev port in `.env.local`; production must set it
  to the real origin.
