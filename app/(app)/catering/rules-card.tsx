import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import type { CateringCategoryView, CateringRuleView, CateringSessionView } from '@/lib/db/catering'
import { describeRule } from '@/lib/domain/catering'
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
}: {
  sessions: readonly CateringSessionView[]
  categories: readonly CateringCategoryView[]
  rules: readonly CateringRuleView[]
  selectedSession: CateringSessionView | null
  canEdit: boolean
}) {
  const key = (sessionId: string, categoryId: string) => `${sessionId}:${categoryId}`
  const ruleMap = new Map(rules.map((rule) => [key(rule.sessionId, rule.categoryId), rule]))
  const sessionRuleCount = rules.filter((rule) => rule.sessionId === selectedSession?.id).length

  return (
    <Card id="rules">
      <CardHeader>
        <CardTitle>Selection rules</CardTitle>
        <CardDescription>
          How many dishes a guest may pick from each category, in each session. An empty maximum
          means unlimited.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <EmptyState title="Add a session first" description="Rules belong to a session." />
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
                {sessionRuleCount} rule{sessionRuleCount === 1 ? '' : 's'} in this session
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const rule = selectedSession
                      ? ruleMap.get(key(selectedSession.id, category.id))
                      : undefined
                    const summary = describeRule({
                      minSelections: rule?.minSelections ?? 0,
                      maxSelections: rule?.maxSelections ?? null,
                      required: rule?.required ?? false,
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
                                aria-label={`Minimum ${category.name}`}
                              />
                              <Input
                                name="maxSelections"
                                defaultValue={rule?.maxSelections ?? ''}
                                inputMode="numeric"
                                placeholder="∞"
                                className="h-8 w-16"
                                aria-label={`Maximum ${category.name}`}
                              />
                              <label className="flex items-center gap-1 text-xs text-ink-muted">
                                <input
                                  type="checkbox"
                                  name="required"
                                  defaultChecked={rule?.required ?? false}
                                />
                                Required
                              </label>
                              <Select
                                name="pricingMode"
                                defaultValue={rule?.pricingMode ?? 'per_guest'}
                                className="h-8 w-32"
                                aria-label={`Pricing for ${category.name}`}
                              >
                                <option value="per_guest">Per guest</option>
                                <option value="per_unit">Per unit</option>
                                <option value="flat">Fixed</option>
                              </Select>
                              <Button type="submit" variant="secondary" size="sm">
                                Save
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-ink-muted">
                              {rule ? `${rule.pricingMode.replace('_', ' ')} · rule saved` : 'No rule yet'}
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
