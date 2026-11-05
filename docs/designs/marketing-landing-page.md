# Marketing landing page — design

**Status:** implemented and verified locally, 5 November 2026  
**Scope:** `/` only, plus `/privacy` and `/terms`  
**Non-goals:** no new backend, no schema change, no payment gateway, no invented
pricing, customers, testimonials or ratings.

## 1. Problem

The current `/` is a single hero and three feature cards. It explains the product
idea but does not show the workflow, prove the product exists, answer buying
questions, or give a visitor a complete path to sign up. It also has only one CTA
pair and no mobile navigation.

## 2. Direction

Keep the EventsMa identity: forest/mint, Playfair display headings, Inter body,
integer-paise money language. Move the marketing page to a **deep forest dark**
surface while keeping product previews light, so the real application UI is the
visual proof. This is a marketing-only treatment; the workspace keeps its existing
light theme.

The page must not invent proof. There are no customer logos, testimonials,
ratings or subscription prices. Pricing says plainly that billing is not switched
on and will be agreed with early businesses.

## 3. Page sections

1. Sticky header with desktop navigation and an accessible mobile menu.
2. Hero: headline, supporting copy, two CTAs, and a live-logic quote preview.
3. Capability strip: four things the product actually does.
4. Problem and solution: spreadsheets/manual quotes vs one structured workspace.
5. Product showcase: dashboard, quote builder and margin view previews.
6. Multi-service management: configurable catering, decor, photography and
   specialist services.
7. Quote builder workflow: select event, add services, price, tax, review, share.
8. Financial intelligence: revenue, cost, tax, margin; clearly illustrative.
9. How it works: four steps.
10. Who it is for: five event-business types.
11. Differentiators: six honest product advantages.
12. Pricing: "billing not switched on", no invented plans.
13. FAQ: native `<details>` accordions, answers tied to implemented behaviour.
14. Final CTA and footer, including working privacy/terms/contact destinations.

## 4. Responsive contract

Test widths: 320, 360, 375, 390, 414, 430, 600, 768, 820, 900, 1024, 1280, 1366,
1440, 1600, 1920 and 2560 px.

- One column below 1024 px; two columns for hero and major split sections at
  `lg`.
- Mobile navigation below `lg`; 44 px minimum target sizes.
- `max-w-7xl` container plus fluid padding; no fixed page widths.
- Preview cards use `min-w-0`, wrapping labels and tabular figures; no horizontal
  page overflow.
- Native details/summary means the FAQ works without JavaScript.
- `prefers-reduced-motion` already disables animations globally.

## 5. Data and truth

- The product preview calls the real `computeQuote` function with a labelled
  sample, so totals are calculated by the same rules as the app.
- No real customer name or business is used. The preview says "Sample event".
- Pricing, testimonials and customer counts are deliberately absent.
- Manual payments only; copy states that no gateway collects money and no card
  data is stored.

## 6. SEO and accessibility

- Page title, description, canonical, Open Graph and Twitter metadata.
- `SoftwareApplication` JSON-LD without offers or ratings.
- One `h1`; section headings in order; skip link; visible focus states.
- Semantic `header`, `main`, `section`, `nav`, `footer`, `figure`, `figcaption`.
- Privacy and terms pages linked from the footer and sitemap.

## 7. Verification

- `npm run typecheck`, `npm run test`, `npm run build`.
- Browser checks at the viewport widths above for horizontal overflow, menu
  interaction, anchors, CTAs, footer and legal routes.
- Lighthouse on `/` after deployment; record results in
  `docs/13-performance-ledger.md`.
- Deploy only after the build passes; verify live `/`, `/privacy`, `/terms`,
  `/api/health`, and signed-out redirects.
