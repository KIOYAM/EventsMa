import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { setServiceConfig, setServiceEnabled } from '../actions'
import { descriptorFor, serviceConfigSchema } from '@/lib/domain/service-registry'
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

  const schema = serviceConfigSchema({
    key: vertical,
    label: descriptor.label,
    enabled: false,
    sortOrder: 0,
    config: {},
    descriptor,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Service configuration"
        title={descriptor.label}
        description={`Configure how ${descriptor.label.toLowerCase()} works for this business. Each field is stored per organisation and applied to every quote and event.`}
        actions={
          <Link href="/services" className="inline-flex h-11 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink hover:bg-mint-subtle">
            ← Back to services
          </Link>
        }
      />

      {!canEdit ? (
        <div className="rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-sm text-forest">
          {ctx.demo
            ? 'Demo mode: service configuration is disabled until a database is connected.'
            : 'Only an owner or manager can configure services.'}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Enable service</CardTitle>
          <CardDescription>
            Turn this service on or off for your workspace. Disabled services cannot be
            added to new events or shown to customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          <form action={setServiceEnabled} className="flex items-center gap-3">
            <input type="hidden" name="verticalKey" value={vertical} />
            <input type="hidden" name="enable" value="1" />
            <Button type="submit" variant="primary" disabled={!canEdit}>
              Enable {descriptor.label}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Set the default configuration for {descriptor.label}. These values appear on
            quotes and guide the customer-facing selection experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schema.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No configurable fields for {descriptor.label}. The service uses defaults.
            </p>
          ) : (
            <form action={setServiceConfig} className="space-y-4">
              <input type="hidden" name="verticalKey" value={vertical} />
              {schema.map((field) => (
                <Field key={field.key} label={field.label} htmlFor={`config-${field.key}`} hint={field.hint}>
                  {field.kind === 'textarea' ? (
                    <Textarea
                      id={`config-${field.key}`}
                      name="value"
                      defaultValue={field.value ?? ''}
                      maxLength={1000}
                    />
                  ) : field.kind === 'select' ? (
                    <Select id={`config-${field.key}`} name="value" defaultValue={field.value ?? ''}>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={`config-${field.key}`}
                      name="value"
                      type={field.kind === 'number' ? 'number' : 'text'}
                      inputMode={field.kind === 'number' ? 'numeric' : undefined}
                      defaultValue={field.value ?? ''}
                      maxLength={1000}
                    />
                  )}
                </Field>
              ))}
              <Button type="submit" disabled={!canEdit}>
                Save configuration
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capabilities</CardTitle>
          <CardDescription>
            What this service can do in EventsMa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
            Enabled capabilities
          </p>
          <div className="flex flex-wrap gap-2">
            {descriptor.capabilities.map((cap) => (
              <Badge key={cap} tone="outline" className="text-[10px] px-2 py-1">
                {cap}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Routes</CardTitle>
          <CardDescription>
            Owner-facing pages for this service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
            Workspace navigation
          </p>
          <div className="space-y-1.5">
            {descriptor.routes.map((route) => (
              <div key={route.path} className="flex items-center justify-between gap-3 p-2 rounded-control border border-hairline bg-paper/50">
                <span className="text-sm text-ink">{route.label}</span>
                <span className="text-[10px] text-ink-muted">{route.group}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
