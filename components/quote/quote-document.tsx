import type { UnitClass } from '@/lib/domain/units'
import { formatPercentBp } from '@/lib/domain/money'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { createTranslator } from '@/lib/i18n'
import { formatDateLocalised, formatPaiseLocalised } from '@/lib/i18n/format'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'

export interface QuoteDocLine {
  label: string
  unitClass: UnitClass
  basis: number
  unitRatePaise: number
  grossPaise: number
  taxPaise: number
  totalPaise: number
  included: boolean
}

export interface QuoteDoc {
  number: string
  status: string
  title: string
  eventDate: string
  venueName: string | null
  guests: number
  businessName: string
  businessPhone: string | null
  serviceGroups: { serviceKey: string; lines: QuoteDocLine[]; subtotalPaise: number }[]
  subtotalPaise: number
  discountPaise: number
  taxPaise: number
  roundOffPaise: number
  totalPaise: number
}

/**
 * A status or unit label with a safe fallback.
 *
 * The catalogue holds one key per enum value. A value this build has never seen
 * (an older quote, a new vertical) falls back to the stored string instead of
 * printing a bare key on a customer's document.
 */
function labelOr(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  const translated = t(key)
  return translated === key ? fallback : translated
}

/**
 * The customer-facing document. One quotation, lines grouped by the service that
 * produced them, one total. Nothing here is client-side arithmetic: every number
 * was computed by lib/domain/pricing and stored on the version.
 */
export function QuoteDocument({
  doc,
  print = false,
  locale = DEFAULT_LOCALE,
}: {
  doc: QuoteDoc
  print?: boolean
  locale?: Locale
}) {
  const t = createTranslator(locale)
  const money = (paise: number) => formatPaiseLocalised(paise, locale)
  const date = formatDateLocalised(doc.eventDate, locale, 'short', 'numeric')
  const terms = print
    ? `${t('quotes.document.terms')} ${t('quotes.document.printed')}`
    : t('quotes.document.terms')

  return (
    <article className="overflow-hidden card-surface">
      <header className="flex flex-col gap-4 border-b border-hairline p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            {t('quotes.document.label')}
          </p>
          <h2 className="font-display text-xl leading-tight text-forest sm:text-2xl">{doc.title}</h2>
          <p className="text-sm text-ink-muted">{t('quotes.document.meta', { number: doc.number, date, guests: doc.guests })}</p>
          {doc.venueName ? <p className="text-sm text-ink-muted">{doc.venueName}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-medium text-ink">{doc.businessName}</p>
          {doc.businessPhone ? <p className="text-sm text-ink-muted">{doc.businessPhone}</p> : null}
          <span className="mt-2 inline-flex rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-forest">
            {labelOr(t, `quotes.status.${doc.status}`, doc.status)}
          </span>
        </div>
      </header>

      <div className="divide-y divide-hairline">
        {doc.serviceGroups.map((group) => {
          const descriptor = verticalDescriptor(group.serviceKey)
          return (
            <section key={group.serviceKey} className="p-5">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  {labelOr(t, `quotes.service.${group.serviceKey}`, descriptor.label)}
                </h3>
                <p className="tabular text-sm text-ink-muted">{money(group.subtotalPaise)}</p>
              </div>

              <table className="w-full text-sm">
                <thead className="sr-only">
                  <tr>
                    <th>{t('quotes.document.item')}</th>
                    <th>{t('quotes.document.basis')}</th>
                    <th>{t('quotes.document.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.lines.map((line, index) => (
                    <tr key={`${group.serviceKey}-${index}`} className="align-top">
                      <td className="py-1.5 pr-3">
                        <p className="text-ink">{line.label}</p>
                        <p className="text-xs text-ink-muted">
                          {labelOr(t, `quotes.document.unitsByClass.${line.unitClass}`, line.unitClass)} ·{' '}
                          {line.basis}
                          {line.basis === 1 ? '' : ` ${t('quotes.document.units')}`} ×{' '}
                          {money(line.unitRatePaise)}
                          {line.included ? ` · ${t('quotes.document.includedInPackage')}` : ''}
                        </p>
                      </td>
                      <td className="tabular w-px whitespace-nowrap py-1.5 text-right text-ink">
                        {line.included ? t('quotes.document.included') : money(line.grossPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}
      </div>

      <div className="border-t border-hairline bg-canvas p-5">
        <dl className="ml-auto max-w-sm space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-muted">
            <dt>{t('quotes.document.subtotal')}</dt>
            <dd className="tabular">{money(doc.subtotalPaise)}</dd>
          </div>
          {doc.discountPaise > 0 ? (
            <div className="flex justify-between text-ink-muted">
              <dt>{t('quotes.document.discount')}</dt>
              <dd className="tabular">− {money(doc.discountPaise)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-ink-muted">
            <dt>{t('quotes.document.tax')}</dt>
            <dd className="tabular">{money(doc.taxPaise)}</dd>
          </div>
          {doc.roundOffPaise !== 0 ? (
            <div className="flex justify-between text-ink-muted">
              <dt>{t('quotes.document.roundOff')}</dt>
              <dd className="tabular">
                {doc.roundOffPaise > 0 ? '+' : '−'} {money(Math.abs(doc.roundOffPaise))}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-hairline pt-2 text-base font-semibold text-forest">
            <dt>{t('quotes.document.total')}</dt>
            <dd className="tabular">{money(doc.totalPaise)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-ink-muted">{terms}</p>
      </div>
    </article>
  )
}

export function MarginPanel({
  marginPaise,
  marginBp,
  totalPaise,
  locale = DEFAULT_LOCALE,
}: {
  marginPaise: number
  marginBp: number
  totalPaise: number
  locale?: Locale
}) {
  const t = createTranslator(locale)
  const money = (paise: number) => formatPaiseLocalised(paise, locale)
  const healthy = marginBp >= 2500
  return (
    <div className="card-surface p-5">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
        {t('quotes.margin.title')}
      </p>
      <p className="tabular mt-2 text-2xl font-semibold text-forest">{formatPercentBp(marginBp)}</p>
      <p className="tabular mt-1 text-sm text-ink-muted">
        {t('quotes.margin.amountLine', { margin: money(marginPaise), total: money(totalPaise) })}
      </p>
      <p
        className={
          healthy
            ? 'mt-3 rounded-control bg-[#e6f4ea] px-3 py-2 text-xs text-positive'
            : 'mt-3 rounded-control bg-[#fdf0e2] px-3 py-2 text-xs text-warning'
        }
      >
        {healthy ? t('quotes.margin.above') : t('quotes.margin.below')}
      </p>
      <p className="mt-3 text-[11px] text-ink-muted">{t('quotes.margin.hidden')}</p>
    </div>
  )
}
