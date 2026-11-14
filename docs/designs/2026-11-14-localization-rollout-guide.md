# Localization rollout guide — translating every remaining page

**Audience:** AI coding agents (and humans) working on EventsMa's multilingual support.
**Status:** foundation shipped, customer link complete (en + ta), everything else still English.
**Read first:** `docs/designs/2026-11-14-localization-engine.md` (why the architecture is the way it is).

This file is written to be followed literally. It documents what actually broke during
the first translated surface, so you do not have to rediscover it.

---

## 0. Ground rules for parallel agents

Several agents work on this repository at the same time. The most damaging failure here is
not a bad translation — it is one agent reverting another agent's work.

**Never do any of these:**

- `git checkout -- .`, `git reset --hard`, `git stash`, `git clean -fd`, `git restore .`
- `git add -A` / `git add .` — stage only the files you edited, by explicit path
- Rewriting a file "for consistency" that you were not asked to translate
- Force-pushing, amending someone else's commit, or rebasing the branch
- Deleting or rewriting another agent's message module to "fix" its order or formatting

**Always do these:**

- `git status --short` before you start and before you commit. Files that are already
  modified and are not yours are **someone else's in-flight work**: leave them alone.
- If `git log` shows commits you did not make, that is expected — the branch is shared.
  Build on top; never try to undo them.
- Add keys, do not renumber or rename existing keys. A rename breaks every caller.
- One namespace per module, one module per surface (see §3). Two agents must never need
  the same file.

### File ownership

| Path | Owner / rule |
|---|---|
| `lib/i18n/messages/en/<module>.ts` + `ta/<module>.ts` | The agent translating that surface. **One module = one surface.** |
| `lib/i18n/messages/en.ts` / `ta.ts` (aggregators) | Add one `import` + one key. These lines are the only shared edit; keep them adjacent and alphabetical so merges stay trivial. |
| `lib/i18n/index.ts`, `locales.ts`, `format.ts`, `server.ts`, `rule-copy.ts` | Infrastructure. Change only with a reason and a test; other agents depend on the behaviour. |
| `app/share/**`, `lib/db/share-*` | The customer link (already done). Do not "improve" it while translating elsewhere. |
| `db/migrations/**`, `lib/pdf/**`, owner content-translation tables | Reserved for the content-translation phase. Do not create schema while doing UI copy. |

If you need a shared key that exists but reads wrong for your screen, **add a
surface-specific key** instead of editing the shared one — five surfaces sharing one
string is how one bad edit breaks four pages.

---

## 1. What is already done

- `lib/i18n/` — locale registry, catalogue with English fallback, `Intl` formatting,
  cookie-backed server helpers, coverage report.
- `lib/i18n/messages/{en,ta}/` — per-module catalogues: `common`, `nav`, `rule`, `share`.
- **The customer link `/share/[token]` is fully bilingual** with a language switch.
- `npm run i18n:audit` — counts untranslated strings (930 today).
- 25 i18n tests, including "every `share.*` and `rule.*` key exists in Tamil".

Everything else — dashboard, events, catering planner, quotes, invoices, clients,
inventory, reports, settings, staff, storefront, marketing, auth — is still hardcoded
English in the components.

---

## 2. How the system works (5 minutes)

```
lib/i18n/locales.ts     LOCALES (code, native name, Intl tag, dir), resolveLocale,
                        LOCALE_COOKIE ('eventsma_locale'), SHIPPED_LOCALES
lib/i18n/messages/en/   complete catalogues, one file per module (source of truth)
lib/i18n/messages/ta/   deep partials of the same shape
lib/i18n/index.ts       deep-merge over English, t(), interpolation, coverage
lib/i18n/format.ts      money / dates / numbers via Intl (display only)
lib/i18n/server.ts      getLocale() (cookie) and translatorFor(locale) — server only
lib/i18n/rule-copy.ts   builds rule sentences from machine reasons
```

Four properties that matter:

1. **English is the fallback.** A missing Tamil key renders English, not a crash and not
   a key. Never "fix" a gap by deleting the English key.
2. **`t()` returns the key path when both are missing** and warns in development. If you
   see `events.title` on screen, the key is misspelled — fix the key, not the screen.
3. **The cookie is the interface language.** No `[locale]` route segment, so shared links
   and quote tokens keep working. `SHIPPED_LOCALES` gates what the switcher offers.
4. **Translations never touch data.** Enum values, API fields, route paths, permission
   keys, service keys and money stay exactly as they are; only display strings change.

---

## 3. Translate a surface: the recipe

Work one surface at a time (one page or one feature directory). Do not run a project-wide
replace.

**Step 1 — measure it.**

```bash
npm run i18n:audit
grep -rn "placeholder=\|aria-label=\|title=" app/(app)/events | head -40
wc -l app/(app)/events/*.tsx app/(app)/events/_components/*.tsx
```

Write down the starting number. It must fall by the amount you translated.

**Step 2 — name the module.** `events`, `catering`, `quotes`, `clients`, `settings`, …
Short, plural-agnostic, matching the route.

**Step 3 — create the English module** `lib/i18n/messages/en/<module>.ts`:

```ts
/** Events: list, detail, create and edit. */
export const events = {
  title: 'Events',
  empty: 'No events yet. Create your first one.',
  guestsLabel: '{count} guests',
  // …
} as const
```

Rules for keys:

- Group by use (`list.*`, `form.*`, `errors.*`) when a surface has more than ~20 keys.
- Placeholders are named after their content: `{count}`, `{name}`, `{date}`, `{amount}`.
- Never store a sentence in two keys and join them in JSX — word order differs per
  language. Interpolate one sentence instead.
- Plurals: two explicit keys (`dishOne`, `dishMany`) chosen by `count === 1`. Do not add a
  plural library; `Intl.PluralRules` is only worth it when a language needs more than two
  forms (Tamil, Telugu, Kannada and Malayalam all use two for these nouns).

**Step 4 — create the Tamil module** `lib/i18n/messages/ta/<module>.ts`:

```ts
import type { DeepPartial } from '../en'
import { events as enEvents } from '../en/events'

export const events: DeepPartial<typeof enEvents> = {
  title: 'நிகழ்வுகள்',
  empty: 'இன்னும் நிகழ்வுகள் இல்லை. முதல் நிகழ்வை உருவாக்குங்கள்.',
  guestsLabel: '{count} விருந்தினர்கள்',
}
```

`DeepPartial` is what lets you ship a module before it is finished: type-checked against
the English shape, silently falling back per key.

**Step 5 — register both** in `messages/en.ts` and `messages/ta.ts` (one import + one
property each). This is the only file two agents touch; keep it alphabetical.

**Step 6 — replace the copy in the component.**

Server component:

```tsx
import { translatorFor } from '@/lib/i18n/server'
import { getLocale } from '@/lib/i18n/server'

const locale = await getLocale()
const t = translatorFor(locale)      // or: const { locale, t } = await getTranslator()
…
<h1>{t('events.title')}</h1>
```

Client component — take `locale` as a prop from the server component; do not read the
cookie in the browser, and do not pass functions across the boundary:

```tsx
'use client'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'

export function EventFilters({ locale }: { locale: Locale }) {
  const t = createTranslator(locale)
}
```

**Step 7 — cover the invisible strings.** These are the ones that get missed and make an
otherwise Tamil screen feel broken:

- `placeholder`, `title`, `aria-label`, `alt`
- empty states, loading states, toasts, confirm dialogs
- table headers, chart legends, filter chips, sort labels
- validation messages and `ERROR_COPY` maps (35 files have one)
- `metadata.title` / `description` on public pages
- email subjects and bodies, notification text

**Step 8 — server-generated errors must send codes, not sentences.** A translated client
cannot display an English error. Follow the customer-link pattern:

```ts
// lib/db/…: return a code + the numbers the sentence needs
return { ok: false, code: 'session_gone', error: 'One of the meal sessions is no longer available.', status: 400 }
// client: map code → catalogue key
const FAILURE_KEYS = { session_gone: 'share.errorSessionGone' } // per surface
```

Keep the English `error` string: logs and older callers still need it.

**Step 9 — format, do not stringify.**

```ts
formatPaiseLocalised(paise, locale)     // ₹4,87,500 — integer paise in, display out
formatDateLocalised(event.eventDate, locale)  // 14 பிப்., 2027
formatNumberLocalised(guests, locale)   // 1,250
```

Never do `paise / 100 + ' ₹'`, never `date.toLocaleDateString()` without a locale, and
never parse a translated number back into data.

**Step 10 — add the client-side language switch where a customer can reach it.** Today only
the share page has one. When you translate a signed-in surface, add a `LocaleSwitch` to
that layout and put `lang={localeMeta(locale).intl}` on the layout's content wrapper
(see §5, pitfall 2). Do **not** add a language to `SHIPPED_LOCALES` before its catalogues
are complete — offering a half-translated language is worse than offering none.

---

## 4. Adding a new language (te, kn, ml)

English and Tamil establish the pattern; the next three are mechanical, in this order.

1. `lib/i18n/locales.ts` already lists `te`, `kn`, `ml` with native names and Intl tags.
   No change needed unless you add a language that is not there.
2. Create `lib/i18n/messages/te/` with one file per module, typed exactly like the Tamil
   ones (`DeepPartial<typeof en…>`).
3. Create `lib/i18n/messages/te.ts` mirroring `ta.ts`.
4. Add `te` to `CATALOGUES` in `lib/i18n/index.ts` (replace the empty `te: {}`).
5. Only after every module you ship is complete: add `te` to `SHIPPED_LOCALES`.
6. Add a coverage test asserting the modules you claim are 100% for `te` (copy the Tamil
   assertions in `lib/i18n/share-copy.test.ts`).
7. Verify in the browser (§7) at 390px — Telugu and Kannada strings are frequently longer
   than Tamil and are the ones most likely to break a fixed-width control.

**Native review is a release gate, not a nice-to-have.** Mark every machine-written
catalogue with the `SEED — unreviewed` header the Tamil files use, and do not describe a
language as "supported" in product copy or marketing until a speaker has signed it off.
Catering terms, legal wording and financial wording are the three areas where a literal
translation is actively harmful.

---

## 5. Pitfalls catalogue — symptoms, causes, fixes

Everything below actually happened while translating the customer link.

### 1. Reading the locale in the root layout de-prerenders public pages

**Symptom:** after adding `await getLocale()` to `app/layout.tsx`, `next build` shows the
marketing pages as `ƒ (Dynamic)`. Measured: prerendered routes dropped from 10 to 5 —
`/`, `/terms`, `/privacy`, `/forgot-password`, `/_not-found` all became dynamic.

**Cause:** `cookies()` in a layout opts every route under it into dynamic rendering.

**Fix:** keep `app/layout.tsx` static. Read the locale inside the layouts/pages that are
already dynamic (share, quote, signed-in app). Check your change with:

```bash
node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes).length)"
```

### 2. React keeps resetting `<html lang>` — declare it on the content subtree

**Symptom:** `document.documentElement.lang` stays `en-IN` on a Tamil page, even after an
effect, an inline script, or an assignment in the click handler. After `router.refresh()`
the server tree is re-rendered and the tag is written back.

**Cause:** the root layout renders `<html lang="en-IN">`, so React owns that attribute and
re-applies it on every commit of that tree. Any assignment that happens before a commit
loses.

**Fix (shipped):** put `lang={localeMeta(locale).intl}` on the page's content wrapper.
Assistive technology and font selection both read the nearest `lang`, and React re-renders
that wrapper with the new locale, so it survives refreshes:

```tsx
<div lang={localeMeta(locale).intl} className="min-h-dvh …">
```

Do not spend more time fighting the document element. The trade-off is documented in the
architecture doc.

### 3. Language switch must not destroy the customer's work

**Symptom (avoided, but easy to reintroduce):** a switch that does `location.reload()` or
navigates to a new URL loses every dish the customer picked.

**Fix:** form state lives in client components; the switch calls a **server action** that
writes the cookie, then `router.refresh()`. Server components re-render, client state
stays. Verified: a selected dish survived switching to Tamil and back.

### 4. The dev server 404s the first request after an edit

**Symptom:** `GET /share/<token>?x=1 → 404`, a not-found page loads, and your DOM
assertions mysteriously fail (this cost real debugging time).

**Cause:** the request races the recompile.

**Fix:** poll before asserting, and never trust the first response after an edit:

```bash
for i in $(seq 1 20); do code=$(curl -s -o /dev/null -w "%{http_code}" "$URL"); [ "$code" = 200 ] && break; sleep 2; done
```

### 5. `innerText` reflects CSS `text-transform`

**Symptom:** the assertion "page contains `Catering menu`" fails on a page that clearly
shows it.

**Cause:** the element is styled `uppercase`, so `innerText` returns `CATERING MENU`.

**Fix:** assert on `textContent` (untransformed) or match the uppercase form. Do not
"fix" the page.

### 6. Selector pollution between components

**Symptom:** clicking `button[aria-pressed]` toggles the language instead of a dish.

**Fix:** scope selectors to the region (`section button[aria-pressed]`), and prefer
`data-testid` for anything that will be automated repeatedly.

### 7. Browser evaluation timeouts (10s cap)

**Symptom:** `preview_evaluate` fails with "exceeded the 10s limit" on an expression that
waits 5 seconds.

**Cause:** a background tab throttles timers; each evaluation also has overhead.

**Fix:** keep each evaluation under ~3s of waiting, split multi-step flows into separate
calls, and re-read state in a fresh call instead of sleeping inside one.

### 8. Files over 400 lines

**Symptom:** `portal-form.tsx` grew to 404 lines while adding `t()` calls.

**Rule (repo law, `AGENTS.md` §5):** nothing over 400 lines.

**Fix:** extract the chunky, self-contained block (`_components/details-form.tsx`) and pass
values + setters. Extraction is also the cheapest way to keep a client component from
re-rendering everything on each keystroke.

### 9. Placeholder names drifting between languages

**Symptom:** the Tamil string renders `{count} தேர்ந்தெடுக்கப்பட்டது` literally.

**Cause:** `{Count}` vs `{count}`, or a placeholder dropped during translation.

**Fix:** a test that renders every interpolated key with dummy values and asserts no `{`
remains (see `share-copy.test.ts`). Never rename a placeholder in only one language.

### 10. Text expansion breaking layout

**Symptom:** Tamil or Malayalam labels overflow a pill, a tab, or a table cell.

**Fix:** flexible widths, `flex-wrap`, no fixed-width label containers, and test the
longest string at 390px. When a control really cannot fit, shorten the copy — do not
shrink the type below 11px.

### 11. Fonts are Latin-only

**Symptom:** Tamil renders in an arbitrary device font; a PDF prints boxes.

**Cause:** `inter-latin.woff2` has no Indic glyphs, and `lib/pdf/quote-pdf.tsx` hardcodes
Helvetica, which has no Indic coverage at all.

**Fix:** the CSS stack already falls back to Noto families per glyph. Bundling subset
fonts per script is a later, measured decision. **Do not claim PDF support for a language
until `Font.register` embeds a Noto face and a real PDF has been opened** — that is a
separate, unfinished phase.

### 12. Translating things that must not be translated

Never translate: database enum values, status codes, API field names, route paths,
permission keys, service keys, `data-*` attributes, test ids, or file paths. A translated
enum silently breaks every `WHERE status = …` query.

---

## 6. Copy rules

- **Tone:** plain, second person, no exclamation marks. The English catalogues are the
  reference for length and register.
- **Money:** never translated; formatted with `Intl`. `₹` stays `₹`.
- **Dates and times:** `Intl` only, from the stored value.
- **Names:** business names, dish names and venues are content, not UI copy — they are not
  translated by the interface layer (that is the content-translation phase).
- **Keep brand words:** EventsMa, WhatsApp, UPI, GST stay as they are.
- **Tamil specifics:** prefer the formal/neutral register used in business software;
  avoid Sanskritised words where a common Tamil word exists, except for legal/financial
  terms where the formal word is what people expect on a quotation.
- **Length:** aim for the English string's visual length ±30%. If a translation is much
  longer than the English, check the layout before committing.

---

## 7. Verification checklist (before you say "done")

Run these, in this order, and paste the real output into your report:

```bash
npx tsc --noEmit                                   # must be 0
npx vitest run                                     # all pass; note skips
npx next build                                     # must be 0
node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes).length)"  # must not drop
npm run i18n:audit                                 # must fall by what you translated
```

Then check the actual screens in a browser (a passing build is not evidence the UI works):

1. English: the page looks **identical** to before your change — same words, same layout.
2. Switch to Tamil: **no English left** on that surface. Search the DOM text for a few
   known English strings; if any remain, you missed a key.
3. Switch back: state preserved, no flash of an error, no horizontal scroll at 390px.
4. Keyboard: tab through the switch and the main controls; focus is visible.
5. Coverage: the modules you shipped report 100% for the language you claim.

Report honestly: "checked the events list and detail at 390/1440; did not check the
create form" is a good report. "Fully localized" without that is not.

---

## 8. Definition of done for a surface

- [ ] All copy in `<module>.ts` for `en`, and the same keys for `ta`
- [ ] No hardcoded user-facing string left in the components (grep the file)
- [ ] Placeholders, `aria-label`s, empty/loading/error states and toasts covered
- [ ] Server errors return codes; the client maps them to catalogue keys
- [ ] Money/dates via `format*.ts`; nothing reformatted by hand
- [ ] `tsc`, `vitest`, `next build` green; prerender count unchanged
- [ ] Audit count down; coverage for shipped languages at 100% for this module
- [ ] Seen in a browser in both languages at 390px and 1440px
- [ ] Commit stages only your files, message names the surface

---

## 9. Ready-to-paste prompt for the translation agents

> You are working on **EventsMa** (`D:\Kannan-Projects\EventsMa`), a live multi-service
> event management app (Next.js App Router + TypeScript + Postgres). Other agents are
> working in the same checkout at the same time.
>
> **Read first, in this order:**
> 1. `AGENTS.md` — repo rules (hard: stay on `D:`, files under 400 lines, verify before claiming)
> 2. `docs/designs/2026-11-14-localization-rollout-guide.md` — the localization playbook
> 3. `docs/designs/2026-11-14-localization-engine.md` — the architecture and its trade-offs
> 4. `lib/i18n/` and `lib/i18n/messages/{en,ta}/share.ts` — the reference implementation
>
> **Your job:** translate the remaining surfaces into Tamil, one surface per commit, using
> the existing `lib/i18n` system. The customer link (`app/share/**`) is already complete —
> treat it as the reference and do not modify it.
>
> **Surfaces, in this order** (do as many as you can finish properly, not all badly):
> 1. Signed-in shell and navigation (`app/(app)/layout.tsx`, sidebar, page titles)
> 2. Dashboard (`app/(app)/page.tsx` or `/dashboard`)
> 3. Events — list, detail, create, edit
> 4. Catering — session planner, category rules, dish forms
> 5. Clients, submissions, quotes, invoices
> 6. Inventory, reports, settings, team
> 7. Marketing, auth (`app/login`, `app/signup`, `/forgot-password`), public quote page
>
> **Method (do not deviate):** for each surface, create `lib/i18n/messages/en/<module>.ts`
> and `lib/i18n/messages/ta/<module>.ts` typed as `DeepPartial<typeof enModule>`, register
> them in the two aggregators, replace the copy with `t('module.key')`, and cover
> placeholders, aria-labels, empty/loading/error states and toasts. Server-side validation
> must return a `code` the client maps to a key — never an English sentence the client
> displays. Add a coverage test per module. Add a `LocaleSwitch` to the layout of the
> surfaces you translate, and put `lang={localeMeta(locale).intl}` on that layout's content
> wrapper.
>
> **Hard constraints:** English output must be byte-identical to today. Never translate
> enum values, API fields, routes, permission keys or money. Never rename or delete an
> existing key. Never `git add -A`, `git checkout -- .`, `git reset`, `git stash` or
> `git clean` — other agents' uncommitted work is in this tree and losing it is worse than
> any translation bug. Stage only the files you edited. Never modify `app/share/**`,
> `db/migrations/**` or `lib/pdf/**` (owned by the localization infrastructure phase).
>
> **Verify before claiming:** `npx tsc --noEmit`, `npx vitest run`, `npx next build`,
> `npm run i18n:audit` (the count must fall), and open the page in a browser in both
> languages at 390px and 1440px. Report what you checked and what you did not.
>
> Mark the Tamil copy `SEED — unreviewed`: it needs a native speaker before release.
