import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getEnabledServices } from '@/lib/db/queries'
import { setServiceConfig, setServiceEnabled } from '../actions'
import { verticalDescriptor } from '@/lib/domain/verticals'

export const metadata = { title: 'Service configuration' }

export default async function ServiceConfigPage({
  params,
}: {
  params: Promise<{ vertical: string }>
}) {
  const { vertical } = await params
  const ctx = await requireWorkspace()
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const descriptor = verticalDescriptor(vertical)

  if (!ctx.demo && !canEdit) {
    redirect('/services')
  }

  const services = await withWorkspace(ctx, () => getEnabledServices(ctx.orgId, ctx.demo))
  const row = services.find((service) => service.key === vertical)
  const enabled = row?.enabled ?? false
  const config = row?.config ?? {}

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Service configuration"
        title={descriptor.label}
        description={`Configure how ${descriptor.label.toLowerCase()} works for this business. Every field is stored per organisation and applied to the customer-facing catalogue and event workspace.`}
        actions={
          <Link
            href="/services"
            className="btn btn-md btn-outline hover:bg-mint-subtle"
          >
            ← Back to services
          </Link>
        }
      />

      {!canEdit ? (
        <div className="card-flat bg-mint-subtle px-4 py-3 text-sm text-forest">
          {ctx.demo
            ? 'Demo mode: service configuration is disabled until a database is connected.'
            : 'Only an owner or manager can configure services.'}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Availability</CardTitle>
              <CardDescription>
                A disabled service disappears from navigation and cannot be attached to new
                events. Services already on a confirmed event keep their snapshot.
              </CardDescription>
            </div>
            <Badge tone={enabled ? 'success' : 'outline'}>{enabled ? 'Enabled' : 'Off'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form action={setServiceEnabled} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="verticalKey" value={vertical} />
            <input type="hidden" name="enable" value={enabled ? '0' : '1'} />
            <Button type="submit" variant={enabled ? 'secondary' : 'primary'} disabled={!canEdit}>
              {enabled ? `Turn off ${descriptor.label}` : `Enable ${descriptor.label}`}
            </Button>
            <p className="text-xs text-ink-muted">
              {enabled
                ? 'Turning it off keeps every existing event and quote intact.'
                : 'Enabling adds this service to the sidebar and to the event composer.'}
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Each field saves on its own, so a long form cannot silently drop earlier values.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {descriptor.configFields.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No configurable fields for {descriptor.label}. The service uses defaults.
            </p>
          ) : (
            descriptor.configFields.map((field) => {
              const current = config[field.key] ?? ''
              const inputId = `config-${vertical}-${field.key}`
              return (
                <form
                  key={field.key}
                  action={setServiceConfig}
                  className="grid gap-3 rounded-control border border-hairline bg-canvas/60 p-3 sm:grid-cols-[1fr_auto]"
                >
                  <input type="hidden" name="verticalKey" value={vertical} />
                  <input type="hidden" name="key" value={field.key} />
                  <Field label={field.label} htmlFor={inputId} hint={field.hint}>
                    {field.kind === 'textarea' ? (
                      <Textarea
                        id={inputId}
                        name="value"
                        defaultValue={current}
                        maxLength={1000}
                        disabled={!canEdit}
                      />
                    ) : field.kind === 'select' ? (
                      <Select id={inputId} name="value" defaultValue={current} disabled={!canEdit}>
                        <option value="">Not set</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        id={inputId}
                        name="value"
                        type={field.kind === 'number' ? 'number' : 'text'}
                        inputMode={field.kind === 'number' ? 'numeric' : undefined}
                        defaultValue={current}
                        maxLength={1000}
                        disabled={!canEdit}
                      />
                    )}
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary" disabled={!canEdit}>
                      Save
                    </Button>
                  </div>
                </form>
              )
            })
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>What this service can do in EventsMa.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {descriptor.capabilities.map((capability) => (
                <Badge key={capability} tone="outline" className="text-[10px] px-2 py-1">
                  {capability}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace routes</CardTitle>
            <CardDescription>
              Added to the sidebar automatically while the service is enabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {descriptor.routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className="flex items-center justify-between gap-3 rounded-control border border-hairline bg-paper/50 p-2 text-sm text-ink hover:bg-mint-subtle"
              >
                <span>{route.label}</span>
                <span className="text-[10px] text-ink-muted">{route.group}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
