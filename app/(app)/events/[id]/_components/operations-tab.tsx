import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { createTranslator } from '@/lib/i18n'
import { formatDateLocalised, formatPaiseLocalised } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/locales'
import { taskStatusKey } from '@/lib/i18n/ops-copy'
import { TASK_STATUSES, type EventDetail } from '@/lib/domain/ops'
import { addEventTask, addEventVendor, setTaskStatus } from '../../actions'

/** Tasks and vendors: the two lists the day is actually run from. */
export function OperationsTab({
  event,
  staff,
  demo,
  locale,
}: {
  event: EventDetail
  staff: { id: string; name: string }[]
  demo: boolean
  locale: Locale
}) {
  const t = createTranslator(locale)

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t('events.detail.runOfShow')}</CardTitle>
          <Badge tone="outline">{t('events.detail.tasksCount', { count: event.tasks.length })}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.tasks.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('events.detail.noTasks')}</p>
          ) : (
            <div className="divide-y divide-hairline">
              {event.tasks.map((task) => (
                <div key={task.id} className="flex flex-wrap items-center gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{task.title}</p>
                    <p className="text-xs text-ink-muted">
                      {task.dueOn
                        ? t('events.detail.taskMeta', {
                            owner: task.ownerName ?? t('events.detail.unassigned'),
                            date: formatDateLocalised(task.dueOn, locale, 'short', 'numeric'),
                          })
                        : t('events.detail.taskMetaNoDue', {
                            owner: task.ownerName ?? t('events.detail.unassigned'),
                          })}
                    </p>
                  </div>
                  <form action={setTaskStatus} className="flex items-center gap-1.5">
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <Select
                      name="status"
                      defaultValue={task.status}
                      aria-label={t('events.detail.taskStatus', { title: task.title })}
                      className="h-8 w-28 text-xs"
                      disabled={demo}
                    >
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(taskStatusKey(status))}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="submit"
                      disabled={demo}
                      className="text-[11px] font-medium text-forest underline underline-offset-2 disabled:opacity-40"
                    >
                      {t('events.detail.saveTask')}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <form action={addEventTask} className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
            <input type="hidden" name="eventId" value={event.id} />
            <Field label={t('events.detail.task')} htmlFor="taskTitle" className="sm:col-span-2">
              <Input
                id="taskTitle"
                name="title"
                required
                maxLength={160}
                placeholder={t('events.detail.taskPlaceholder')}
              />
            </Field>
            <Field label={t('events.detail.owner')} htmlFor="taskOwner">
              <Select id="taskOwner" name="ownerMembershipId" defaultValue="">
                <option value="">{t('events.detail.unassigned')}</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('events.detail.due')} htmlFor="taskDue">
              <Input id="taskDue" name="dueOn" type="date" />
            </Field>
            <button
              type="submit"
              disabled={demo}
              className="btn btn-md btn-primary disabled:opacity-50 sm:col-span-2"
            >
              {t('events.detail.addTask')}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('events.detail.vendors')}</CardTitle>
          <Badge tone="outline">{event.vendors.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.vendors.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('events.detail.noVendors')}</p>
          ) : (
            <div className="divide-y divide-hairline">
              {event.vendors.map((vendor) => (
                <div key={vendor.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{vendor.name}</p>
                    <p className="text-xs text-ink-muted">
                      {vendor.category ?? t('events.detail.vendorFallback')} · {vendor.status}
                    </p>
                  </div>
                  <p className="tabular text-xs text-ink">
                    {formatPaiseLocalised(vendor.amountPaise, locale)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form action={addEventVendor} className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
            <input type="hidden" name="eventId" value={event.id} />
            <Field label={t('events.detail.vendor')} htmlFor="vendorName" className="sm:col-span-2">
              <Input
                id="vendorName"
                name="name"
                required
                maxLength={120}
                placeholder={t('events.detail.vendorPlaceholder')}
              />
            </Field>
            <Field label={t('events.detail.category')} htmlFor="vendorCategory">
              <Input
                id="vendorCategory"
                name="category"
                maxLength={60}
                placeholder={t('events.detail.categoryPlaceholder')}
              />
            </Field>
            <Field label={t('events.detail.amount')} htmlFor="vendorAmount">
              <Input id="vendorAmount" name="amount" inputMode="decimal" placeholder="8500" />
            </Field>
            <button
              type="submit"
              disabled={demo}
              className="btn btn-md btn-primary disabled:opacity-50 sm:col-span-2"
            >
              {t('events.detail.addVendor')}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
