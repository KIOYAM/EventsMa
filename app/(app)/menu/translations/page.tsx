import Link from 'next/link'
import { Languages } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { withWorkspace } from '@/lib/db/workspace'
import { listMenuTranslations, type MenuTranslationRow } from '@/lib/db/content-translations'
import { TRANSLATABLE_LOCALES, isTranslatableLocale } from '@/lib/domain/translations'
import { LOCALES, localeMeta } from '@/lib/i18n/locales'
import { saveTranslations } from './actions'

export const metadata = { title: 'Menu translations' }

const ERROR_COPY: Record<string, string> = {
  permission: 'Only an owner or manager can edit translations.',
  demo: 'Demo mode: connect a database before editing translations.',
  locale: 'That language is not supported yet.',
}

/** Rows are tall; the list is long. One component keeps the page readable. */
function TranslationRow({
  row,
  prefix,
  secondField,
  secondLabel,
  sourcePlaceholder,
}: {
  row: MenuTranslationRow
  prefix: 'item' | 'category'
  secondField: 'description'
  secondLabel: string
  sourcePlaceholder: string
}) {
  return (
    <div className="grid gap-3 border-t border-hairline py-3 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)]">
      <div className="min-w-0">
        <p className="truncate text-sm text-ink">{row.sourceName}</p>
        {row.sourceDescription ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
            {row.sourceDescription}
          </p>
        ) : null}
        <Badge tone={row.translated ? 'success' : 'outline'} className="mt-1.5">
          {row.translated ? 'Translated' : 'Not translated'}
        </Badge>
      </div>
      <Field label="Name" htmlFor={`${prefix}_name:${row.id}`}>
        <Input
          id={`${prefix}_name:${row.id}`}
          name={`${prefix}_name:${row.id}`}
          defaultValue={row.name}
          maxLength={120}
          placeholder={sourcePlaceholder}
        />
      </Field>
      <Field label={secondLabel} htmlFor={`${prefix}_${secondField}:${row.id}`}>
        <Input
          id={`${prefix}_${secondField}:${row.id}`}
          name={`${prefix}_${secondField}:${row.id}`}
          defaultValue={row.description ?? ''}
          maxLength={500}
          placeholder="Optional"
        />
      </Field>
    </div>
  )
}

/**
 * The owner's side of business-content translation.
 *
 * These rows are what a customer reading the share link actually sees, so the page
 * shows the source text next to each field — translating without the original in
 * view is how "Chicken 65" becomes something else entirely.
 */
export default async function MenuTranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const locale = isTranslatableLocale(params.locale) ? params.locale : 'ta'

  const data = await withWorkspace(ctx, () =>
    listMenuTranslations(getDb(), ctx.orgId, locale),
  )

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const total = data.items.length + data.categories.length
  const translated =
    data.items.filter((row) => row.translated).length +
    data.categories.filter((row) => row.translated).length
  const percent = total === 0 ? 0 : Math.round((translated / total) * 100)
  const languageName = localeMeta(locale).native
  const errorCopy = params.error ? (ERROR_COPY[params.error] ?? 'That change was not saved.') : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Menu"
        title="Translations"
        description={`Dish and category names your customers read on the share link. English stays the original; ${languageName} is layered on top and a blank field falls back to English.`}
        actions={
          <Link
            href="/menu"
            className="inline-flex h-9 items-center rounded-xl border border-hairline px-3 text-sm text-ink hover:bg-mint-subtle"
          >
            Back to menu
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {TRANSLATABLE_LOCALES.map((code) => {
          const meta = LOCALES.find((entry) => entry.code === code)
          const active = code === locale
          return (
            <Link
              key={code}
              href={`/menu/translations?locale=${code}`}
              lang={meta?.intl}
              className={`inline-flex h-9 items-center rounded-full border px-3 text-sm ${
                active
                  ? 'border-forest bg-forest text-white'
                  : 'border-hairline text-ink hover:bg-mint-subtle'
              }`}
            >
              {meta?.native ?? code}
            </Link>
          )
        })}
        <span className="ml-auto text-xs text-ink-muted tabular">
          {translated} of {total} translated · {percent}%
        </span>
      </div>

      {errorCopy ? (
        <p className="rounded-xl border border-clay/30 bg-clay/10 px-3 py-2 text-sm text-clay">
          {errorCopy}
        </p>
      ) : null}
      {params.saved ? (
        <p className="rounded-xl border border-mint bg-mint-subtle px-3 py-2 text-sm text-forest">
          Saved {params.saved} translation{params.saved === '1' ? '' : 's'}.
        </p>
      ) : null}

      {!canEdit ? (
        <p className="rounded-xl border border-hairline bg-paper px-3 py-2 text-sm text-ink-muted">
          You can read translations but not change them. Ask an owner or manager.
        </p>
      ) : null}

      {total === 0 ? (
        <EmptyState
          title="Nothing to translate yet"
          description="Add dishes and categories to your menu first, then come back here."
        />
      ) : (
        <form action={saveTranslations} className="space-y-6">
          <input type="hidden" name="locale" value={locale} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Languages className="h-4 w-4 text-forest" aria-hidden />
                Dishes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.items.length === 0 ? (
                <p className="text-sm text-ink-muted">No active dishes yet.</p>
              ) : (
                data.items.map((row) => (
                  <TranslationRow
                    key={row.id}
                    row={row}
                    prefix="item"
                    secondField="description"
                    secondLabel="Description"
                    sourcePlaceholder={row.sourceName}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Menu categories</CardTitle>
            </CardHeader>
            <CardContent>
              {data.categories.length === 0 ? (
                <p className="text-sm text-ink-muted">No categories yet.</p>
              ) : (
                data.categories.map((row) => (
                  <TranslationRow
                    key={row.id}
                    row={row}
                    prefix="category"
                    secondField="description"
                    secondLabel="Description"
                    sourcePlaceholder={row.sourceName}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <div className="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-paper p-3 shadow-sm">
            <p className="text-xs text-ink-muted">
              Blank a name to remove its {languageName} translation and fall back to English.
            </p>
            <button
              type="submit"
              disabled={!canEdit}
              className="inline-flex h-10 items-center rounded-xl bg-forest px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save {languageName} translations
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
