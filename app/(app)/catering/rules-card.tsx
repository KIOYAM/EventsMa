import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import type { CateringCategoryView, CateringRuleView, CateringSessionView } from '@/lib/db/catering'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { pricingModeLabel, selectionSummaryLabel } from '@/lib/i18n/ops-copy'
import { saveSelectionRule } from './actions'

/**
 * The rules matrix: one row per category inside one session.
 *
 * Rendered on the server because the rule values are the authority — the browser
 * sends four fields back and the action re-validates against the stored row.
 */
export function RulesCard({
  sessions,
  categories,
  rules,
  selectedSession,
  canEdit,
  locale,
}: {
  sessions: readonly CateringSessionView[]
  categories: readonly CateringCategoryView[]
  rules: readonly CateringRuleView[]
  selectedSession: CateringSessionView | null
  canEdit: boolean
  locale: Locale
}) {
  const t = createTranslator(locale)
  const key = (sessionId: string, categoryId: string) => `${sessionId}:${categoryId}`
  const ruleMap = new Map(rules.map((rule) => [key(rule.sessionId, rule.categoryId), rule]))
  const sessionRuleCount = rules.filter((rule) => rule.sessionId === selectedSession?.id).length

  return (
    <Card id="rules">
      <CardHeader>
        <CardTitle>{t('catering.rules.title')}</CardTitle>
        <CardDescription>{t('catering.rules.intro')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <EmptyState
            title={t('catering.rules.emptyTitle')}
            description={t('catering.rules.emptyBody')}
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/catering?session=${session.id}#rules`}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    session.id === selectedSession?.id
                      ? 'border-forest bg-mint-subtle text-forest'
                      : 'border-hairline bg-paper text-ink-muted hover:text-ink'
                  }`}
                >
                  {session.name}
                </Link>
              ))}
              <span className="self-center text-xs text-ink-muted">
                {sessionRuleCount === 1
                  ? t('catering.rules.countOne', { count: sessionRuleCount })
                  : t('catering.rules.countMany', { count: sessionRuleCount })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    <th className="py-2 pr-3 font-medium">{t('catering.rules.category')}</th>
                    <th className="py-2 pr-3 font-medium">{t('catering.rules.rule')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const rule = selectedSession
                      ? ruleMap.get(key(selectedSession.id, category.id))
                      : undefined
                    const summary = selectionSummaryLabel(t, {
                      minSelections: rule?.minSelections ?? 0,
                      maxSelections: rule?.maxSelections ?? null,
                    })
                    return (
                      <tr key={category.id} className="border-b border-hairline/60">
                        <td className="py-2 pr-3">
                          <p className="font-medium text-ink">{category.name}</p>
                          <p className="text-xs text-ink-muted">{summary}</p>
                        </td>
                        <td className="py-2">
                          {canEdit && selectedSession ? (
                            <form
                              action={saveSelectionRule}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <input type="hidden" name="sessionId" value={selectedSession.id} />
                              <input type="hidden" name="categoryId" value={category.id} />
                              <input type="hidden" name="selectedSession" value={selectedSession.id} />
                              <Input
                                name="minSelections"
                                defaultValue={rule?.minSelections ?? 0}
                                inputMode="numeric"
                                className="h-8 w-16"
                                aria-label={t('catering.rules.minimum', { category: category.name })}
                              />
                              <Input
                                name="maxSelections"
                                defaultValue={rule?.maxSelections ?? ''}
                                inputMode="numeric"
                                placeholder="∞"
                                className="h-8 w-16"
                                aria-label={t('catering.rules.maximum', { category: category.name })}
                              />
                              <label className="flex items-center gap-1 text-xs text-ink-muted">
                                <input
                                  type="checkbox"
                                  name="required"
                                  defaultChecked={rule?.required ?? false}
                                />
                                {t('catering.rules.required')}
                              </label>
                              <Select
                                name="pricingMode"
                                defaultValue={rule?.pricingMode ?? 'per_guest'}
                                className="h-8 w-32"
                                aria-label={t('catering.rules.pricing', { category: category.name })}
                              >
                                <option value="per_guest">{t('catering.pricingOption.perGuest')}</option>
                                <option value="per_unit">{t('catering.pricingOption.perUnit')}</option>
                                <option value="flat">{t('catering.pricingOption.flat')}</option>
                              </Select>
                              <Button type="submit" variant="secondary" size="sm">
                                {t('catering.rules.save')}
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-ink-muted">
                              {rule
                                ? t('catering.rules.savedLine', {
                                    pricing: pricingModeLabel(t, rule.pricingMode),
                                  })
                                : t('catering.rules.noRule')}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
