# Design discovery and ideation — EventsMa

**Date:** 2026-11-15
**Phase:** Discovery only. No production code was changed by this document.
**Scope:** Every route in `app/`, every shared component in `components/`.
**Live:** https://eventsma.vercel.app

This is the audit the implementation brief asks for before any redesign starts. Every
claim below is tied to a file, a measured count, or a page I actually opened. Where I
could not inspect something, it says so.

---

## 0. Method and what I actually inspected

| Kind of evidence | How it was gathered |
|---|---|
| Route inventory | `find app -name page.tsx -o -name route.ts` — **48 pages**, 8 API routes |
| Component inventory | `ls components components/ui` — **7 primitives**, 133 `.tsx` files total |
| Duplication metrics | `grep` counts of repeated class strings (numbers below) |
| Design tokens | `app/globals.css` `@theme` block (Tailwind v4, no `tailwind.config`) |
| Focus / a11y primitives | `app/globals.css` and `components/ui/*` |
| Emoji audit | script over every `.tsx` — **0 emoji glyphs** |
| Libraries | `package.json` — no chart lib, no Radix, no framer-motion, no headless UI |
| Skills | `.agents/skills/` — 19 skills incl. `impeccable-ui`, `ui-ux-pro-max`, `ui-skills-collection`, `vercel-ui-verification` |

**Visually inspected** (signed in on production, 390 px and desktop): `/dashboard`,
`/quotes`, `/quotes/new`, `/clients`, `/menu/translations`, `/login`.
**Source-inspected only:** the other 42 pages.
**Not inspectable:** none in the app — but I did not open every detail route visually,
so I do not call them audited.

---

## 1. Deliverable A — Route inventory

48 pages. Auth = requires a member session.

| Group | Routes | Auth | Inspection |
|---|---|---|---|
| Marketing | `/` | – | Visual (public) |
| Auth | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/invite/[token]`, `/onboarding`, `/auth/callback` | – | `/login` visual; rest source |
| Workspace core | `/dashboard`, `/me`, `/settings`, `/admin`, `/team` | ✓ | `/dashboard` visual |
| Selling | `/quotes`, `/quotes/new`, `/quotes/[id]`, `/submissions`, `/invoices`, `/invoices/[id]` | ✓ | `/quotes`, `/quotes/new` visual |
| CRM | `/clients`, `/clients/[id]`, `/clients/directory` | ✓ | `/clients` visual |
| Events | `/events`, `/events/calendar`, `/events/[id]`, `/events/[id]/edit`, `/events/[id]/catering` | ✓ | source |
| Catalogue | `/catalogue`, `/services`, `/services/[vertical]`, `/packages`, `/inventory`, `/menu`, `/menu/card`, `/menu/translations` | ✓ | `/menu/translations` visual |
| Services | `/catering`, `/catering/recipes`, `/decoration`, `/photography`, `/makeup`, `/portfolio`, `/storefront` | ✓ | source |
| Money | `/finance`, `/reports` | ✓ | source |
| Public | `/q/[token]`, `/share/[slug]`, `/p/[slug]`, `/privacy`, `/terms` | – | source |
| API | `/api/quotes/[id]/pdf`, `/api/share/[slug]`, `/api/share/[slug]/submit`, `/api/exports`, `/api/admin/services`, `/api/health`, `/api/vitals` | mixed | not visual |

Two structural notes for design:

1. **48 pages share 7 primitives.** The design system is not under-built in *idea*
   (`Button`, `Input`, `Card`, `Badge`, `Stat`, `PageHeader`, `Skeleton` exist) — it is
   bypassed in *practice*. That is the single most important finding.
2. Several module families are 4–6 pages deep (`events/*`, `clients/*`, `menu/*`,
   `quotes/*`). A page-by-page redesign would therefore produce 48 independent
   decisions. The component-first approach in the brief is correct and non-optional.

---

## 2. Deliverable B — Findings

Severity: **P0** blocks coherence, **P1** visible quality, **P2** polish.

### F1 · The design system is bypassed more often than used — P0
**Evidence:** 43 hand-rolled buttons (`inline-flex h-11 …`) vs **29** `<Button>`
usages; 39 copies of the literal string `bg-forest px-4 text-sm font-medium text-white`.
**Why it matters:** two buttons with the same job can differ in padding, radius, hover
and disabled behaviour. This is exactly the "inconsistent styling between modules" the
brief warns about — and it already exists.
**Fix:** make `Button` the only way to render an action; add `asChild`/`<LinkButton>`
so navigation actions stop being `<a className="…">`.

### F2 · Every panel is the same bordered white box — P0
**Evidence:** 64 occurrences of `rounded-card border border-hairline bg-paper`.
**Why it matters:** the brief's "collection of plain bordered boxes" is measurable. When
a KPI, a warning, a form section and a legal panel share one treatment, hierarchy has to
come from somewhere — today it comes from headings alone.
**Fix:** three surface levels (page canvas → quiet section → elevated card), and a rule
that borders are for *separation*, not *containment*. Some of those 64 should become
dividers or background shifts.

### F3 · No data visualisation at all — P1
**Evidence:** no chart dependency; `components/ui/stat.tsx` is the only number display;
dashboard/finance/reports show figures and lists.
**Why it matters:** for a money-heavy product, margin, pipeline and overdue trends are
currently unreadable at a glance.
**Fix:** choose one library (see §7) and define three chart recipes only — trend line,
composition bar, progress. No decorative charts.

### F4 · Page headers are structurally right but assembled per page — P1
`PageHeader` exists and is used, yet action clusters next to it are hand-built
(`h-11 inline-flex …` ×43). Result: a page can have 2 buttons and its sibling 4, with
different gaps and wrap behaviour.
**Fix:** `PageHeader` gains a typed `actions` slot with `ActionGroup`; mobile
collapse order defined once.

### F5 · Empty states are sentences, not states — P1
Most list pages render a paragraph in a dashed box (`No quotations yet`, `No submissions
yet`). No icon, no illustration, no secondary action in several cases.
**Fix:** one `EmptyState` (icon + title + body + one action), already partly present in
`components/ui/page-header.tsx`.

### F6 · Typography carries two personalities and no declared scale — P1
**Evidence:** `--font-display: Playfair` (serif) is used for marketing headlines *and*
`font-display` inside the workspace (`quote-document.tsx`, page headers). Body is Inter.
**Why it matters:** a serif display face inside an operational table-heavy app reads as
marketing leakage; and without a named scale, `text-[11px]`, `text-[13px]`-style
one-offs accumulate.
**Fix:** decide the role of the serif (marketing + customer-facing documents only, or
workspace too), then publish a 8-step scale and forbid bracket font sizes.

### F7 · Status colour is ad-hoc — P1
**Evidence:** semantic tokens exist (`positive`, `warning`), but components also use
literal hex (`bg-[#e6f4ea]`, `bg-[#fdf0e2]` in `quote-document.tsx`).
**Fix:** `success | warning | danger | info | neutral` × `{bg, border, text, icon}`
tokens; ban raw hex in `.tsx` by lint.

### F8 · Marketing previews are schematic, not the product — P1
**Evidence:** `components/marketing/product-preview.tsx`, `builder-preview.tsx` render
stylised blocks, not real screens.
**Why it matters:** the homepage's strongest asset — that this product is real and
dense — is currently the thing it does not show.
**Fix:** capture the real screens (Playwright at 1440×900), redact to demo data, use
them. Amazon/Stripe-style product truth beats illustration here.

### F9 · Auth pages are functionally complete but visually anonymous — P2
`/login` is a single centred column: heading, two fields, button. `AuthShell` exists but
carries little brand. No password visibility control.
**Fix:** two-column desktop shell (brand + benefit on the left, form right), single
column mobile, password reveal, inline validation states.

### F10 · No elevation, motion, or density scale — P2
Tokens define colour, two radii, fonts. There are no shadow, spacing, density or
duration tokens; transitions are `transition-colors` only.
**Fix:** see §4.

### F11 · Tables have no shared treatment — P1
List pages compose rows inline (quotes, clients, events, invoices each differently).
`components/pagination.tsx` exists but sorting/filtering/empty-in-table are per page.
**Fix:** one `DataTable` with column defs, density prop, mobile card fallback.

### F12 · Tamil text will break fixed-width assumptions — P0 (before any visual work)
Tamil runs ~20–35 % longer than English, and the product is already bilingual.
Any redesign that uses fixed widths, `whitespace-nowrap` labels or single-line buttons
must be tested at `ta`. Evidence in-repo: the shared catalogue is complete for quotes,
clients, invoices, PDF and the shell.
**Fix:** every component spec in DESIGN.md carries a `ta` case; no `truncate` on primary
labels; min-width instead of width.

**Already good, keep it:**
- **0 emoji** in the entire UI; icons are lucide SVG.
- Global `:focus-visible` outline (2 px forest, 2 px offset) — do not remove it.
- Money is `tabular-nums` via `.tabular`.
- Semantic colour naming in `@theme` already exists — extend, do not replace.

---

## 3. Deliverable C — Three directions

### Direction 1 — "Quiet ledger" (recommended)
Extends what is already shipped: warm canvas `#f6f8f6`, forest `#183d33`, mint, gold
accents. Dense, calm, document-first. Hierarchy from type scale, alignment and three
surface levels rather than borders. Serif reserved for customer-facing documents
(quotation, invoice) and marketing; workspace goes all-sans.
**Why:** it is an *evolution* — tokens, PDF, share pages and the Tamil catalogues keep
their identity; lowest regression risk; nothing needs re-translating.

### Direction 2 — "Premium navy" (the brief's proposal)
Deep navy `#172B3A`, warm off-white `#F6F5F1`, teal `#168C83`, amber/coral/green status.
Higher contrast, more "enterprise SaaS".
**Why not first:** it is a brand change, not a design-system change — every marketing
surface, PDF font pairing and the existing forest identity move with it, and it buys
contrast the current palette can reach by fixing F2/F7 instead. Worth doing *later* as a
deliberate rebrand with the same component layer underneath.

### Direction 3 — "Editorial event house"
Expressive typography, image-led service pages, magazine-style portfolios for decor and
photography.
**Why not now:** this is the right language for the **public** service pages
(`/portfolio`, `/storefront`, `/p/[slug]`) and marketing, and the wrong one for a
bookkeeper's invoice table. Adopt it as a scoped sub-system for those three surfaces
after the core system lands.

**Recommendation:** Direction 1 for the workspace, Direction 3 scoped to public service
pages, Direction 2 documented as a future rebrand. One design system, three densities
(comfortable workspace, compact tables, expressive public).

---

## 4. Deliverable D — Token proposal (extends current `@theme`)

Keep every existing token name. Add:

```
Surfaces   --surface-canvas (canvas), --surface-raised (paper),
           --surface-sunken (canvas -1), --surface-accent (mint-subtle)
Text       --text-strong (ink), --text-default, --text-muted, --text-inverse
Status     --status-{success,warning,danger,info}-{bg,fg,border}
Elevation  --shadow-{sm,md,lg}: 1px 1px 2px / 0 4px 12px / 0 12px 32px, forest-tinted
Spacing    4-based; component padding tokens: --pad-control (12/16), --pad-card (20/24)
Type       8 steps: 12/13/14/16/18/22/28/36 with line-heights 1.25/1.4/1.5
Radii      --radius-card 16 (keep), --radius-control 10 (keep), --radius-pill
Motion     --duration-fast 120ms, --duration-base 180ms, --ease-out cubic-bezier(.2,.8,.2,1)
Density    --row-compact 44px, --row-comfortable 56px
Focus      --focus-ring 2px solid forest, offset 2px (already global — tokenise it)
```

Rules that matter more than the values: **no raw hex in `.tsx`**, **no bracket font
sizes**, **borders only where they separate**, **max two accent colours on a screen**.

---

## 5. Deliverable E — Iconography

**Current state:** lucide-react only, one family, **0 emoji**, consistent 4/5 sizes
(`h-4 w-4`, `h-5 w-5`) but no declared stroke rule.

Proposed rules: single family (lucide), 1.75 stroke, sizes 16 / 20 / 24 only, icon
container 32 or 40 with 8 radius, `currentColor` always, no icon without a label except
in already-labelled controls (rail, tab bar, icon button with `aria-label`).

Module map (all exist in lucide): dashboard `LayoutGrid`, events `CalendarDays`,
clients `Inbox`/`Users`, quotes `FileText`, invoices `Receipt`, finance `Wallet`,
reports `TrendingUp`, catering `UtensilsCrossed`, recipes `BookOpen`, decor `Palette`,
photography `Images`, makeup `Sparkles`, packages `Package`, inventory `Boxes`,
services `Layers`, portfolio/storefront `Store`, team `Users`, settings `Settings`,
submissions `Send`.

Gaps that need *custom* SVG (not emoji, not stock): empty-state marks for
quotes / events / catalogue / invoices, and a small set of service illustrations for the
public pages.

---

## 6. Deliverable F — Asset plan

| Asset | Source | Licence | Where |
|---|---|---|---|
| Product screenshots | **Captured from this app** (Playwright, demo org) | Owned | Homepage previews, feature sections |
| Food / décor / photography imagery | Unsplash or Pexels, individually recorded | Unsplash/Pexels licence (commercial OK, no attribution required) | Service catalogue cards, portfolio |
| Empty-state + workflow illustrations | Custom SVG in-repo | Owned | Every empty state |
| Icon set | lucide (already installed) | ISC | Everywhere |
| Charts | Rendered from real data | – | Dashboard, finance, reports |

Rules: no competitor screenshots, no hotlinking, no watermarked images, record
`source / author / licence` next to each downloaded file, and no image without a stated
purpose in the UI.

---

## 7. Deliverable G — Component matrix

| Proposed component | Replaces / consumes | Used by |
|---|---|---|
| `Button` + `LinkButton` | 43 hand-rolled actions | every page |
| `ActionGroup` | ad-hoc header clusters | every page header |
| `Surface` | 64 identical bordered boxes | every page |
| `DataTable` (+ `Row`, `Cell`, mobile card) | inline rows | quotes, clients, events, invoices, inventory, team, submissions |
| `EmptyState` | dashed paragraphs | all lists |
| `StatusBadge` | `Badge` + 5 tone maps | quotes, invoices, events, submissions, tasks |
| `Money` | `tabular` + `formatINR` calls | quotes, invoices, finance, PDF |
| `KpiCard` | `stat.tsx` | dashboard, finance, reports |
| `Chart` (3 recipes) | none | dashboard, finance, reports |
| `Field` + `Input`/`Select`/`Textarea`/`Switch` | mixed inputs | all forms |
| `FormSection` | bespoke grouping | events, settings, services |
| `Dialog` / `Drawer` | none (no modal primitive yet) | confirmations, quote actions |
| `Timeline` | calendar + event detail lists | events, photography delivery |
| `Tabs` | ad-hoc segmented controls | menu, translations, service pages |
| `Skeleton` (exists) | – | all lists |
| `Toast` (sonner, exists) | – | all mutations |
| `PageHeader` (exists, extend) | – | all pages |
| `AuthShell` (exists, redesign) | – | login, signup, forgot, reset, invite |

Charts and dialogs are the only **new dependencies** worth adding; everything else is
composition of what exists. That keeps the dependency line in `docs/04` honest.

---

## 8. Deliverable H — Module proposals (condensed)

- **Dashboard** — KPI row with real hierarchy (one hero metric, three supporting), attention
  list as the actionable column, one pipeline/margin chart, upcoming events as a timeline.
- **Events** — table ⇄ card toggle, date block as the anchor, status + service chips;
  detail page becomes a timeline with money tab.
- **Clients** — directory with avatars/initials, detail with enquiry history and events
  joined; keep the existing "enquiry → client → event" narrative.
- **Quotes** — the strongest existing screen. Separate *build* (sections, sticky totals)
  from *review* (document + send/share). Internal margin stays visually distinct (dashed
  or tinted, labelled internal).
- **Catering / menu** — dish cards with dietary and session chips, category rail; keep
  list view for bulk edits.
- **Decor / photography / makeup / portfolio** — the editorial sub-system: image-led
  cards, 2:3 ratios, captions with price unit.
- **Finance / reports** — numbers first, then one chart, then the ledger table; status
  colours only for overdue/paid.
- **Settings / services** — grouped sections with descriptions and activation switches;
  this is the best place for progressive disclosure.
- **Auth** — two-column branded shell, password reveal, inline validation, clear step
  indicator on signup.

---

## 9. Deliverable I — Responsive and accessibility

**Fixed this week (already shipped):** mobile navigation had a hardcoded four-item list,
so quotes, catalogue, catering, reports and settings were unreachable on a phone. Fifth
"More" tab now opens the same grouped registry as the desktop rail — verified live at
390×780 with 15 links.

**Open:**
- Tables have no mobile strategy (horizontal scroll or squeeze). Needs the card fallback.
- Touch targets: rail rows are `h-9` (36 px) — below the 44 px guidance in
  `ui-skills-collection`.
- No modal/dialog primitive, so confirmations are either inline or absent.
- Contrast: `ink-muted` on `canvas` and `mint-subtle` pairs need a measured pass with the
  contrast checker before the palette is frozen.
- Reduced-motion: no motion exists yet, so nothing to respect — add
  `prefers-reduced-motion` when motion lands.

**Good:** global focus ring, semantic HTML headings on the pages inspected, `aria-current`
on navigation, labelled icon buttons, no emoji.

---

## 10. Deliverable J — Roadmap

| Checkpoint | Contents | Risk |
|---|---|---|
| 1 · Foundation | Tokens, type scale, `Surface`, `Button`/`LinkButton`, `ActionGroup`, `StatusBadge`, `Money`, `EmptyState` | Low — additive, no page rewrite |
| 2 · Shell | Rail + mobile (done), header, breadcrumbs, page header, auth shell | Low |
| 3 · Data | `DataTable`, `KpiCard`, charts, timeline, dialogs | Medium — new chart dependency |
| 4 · Migration | All 48 pages to the components above, service by service | Medium — Tamil strings must be re-verified per page |
| 5 · Polish | Marketing screenshots, public service pages, a11y sweep, screenshots at 5 widths | Low |

Every checkpoint must pass: `tsc`, i18n tests, `next build`, and a Tamil screenshot of
each migrated screen.

---

## 11. Deliverable K — Not produced yet, deliberately

The brief asks for six visual explorations and a moodboard before implementation. I have
**not** built those in this turn, because they should be approved before code and because
producing them means committing to Direction 1's concrete look. What exists now is the
audit, the token plan, the component matrix and the direction argument.

Next step on approval: three static HTML explorations (dashboard, quotation builder,
catering) rendered at 1440 and 390 in the real token vocabulary — no app code touched —
so you can pick the visual language before the migration starts.

---

## 12. Honest status

| Deliverable | Status |
|---|---|
| A Route inventory | COMPLETE (48 pages, from the filesystem) |
| B Page audit | PARTIAL — 6 routes visually, 42 source-inspected |
| C Directions | COMPLETE (3, with recommendation) |
| D Tokens | PROPOSED (extends existing `@theme`) |
| E Iconography | COMPLETE (rules + map + custom gaps) |
| F Assets | PLAN (sources, licensing, placement) |
| G Component matrix | COMPLETE |
| H Module proposals | COMPLETE (condensed per module) |
| I Responsive/a11y | PARTIAL — mobile nav fixed and verified; contrast and table strategy open |
| J Roadmap | COMPLETE (5 checkpoints) |
| K Visual explorations | NOT STARTED (needs direction approval) |

No production file was modified in producing this report.
