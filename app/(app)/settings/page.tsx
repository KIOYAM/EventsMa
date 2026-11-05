import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getSettings } from '@/lib/db/settings'
import { setPublished, updateSettings } from './actions'

export const metadata = { title: 'Settings' }

const ERROR_COPY: Record<string, string> = {
  permission: 'Only an owner or manager can change these settings.',
  demo: 'Demo mode: connect a database before saving settings.',
  name: 'A business needs a name.',
  email: 'That email address is not valid.',
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const data = await getSettings(ctx.orgId, ctx.demo)
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="The terms every quote inherits"
        description="Tax mode, advance percentage and quote validity are commercial decisions, not code. Set them once here so two quotes from the same business cannot disagree."
        actions={<Badge tone={data.published ? 'success' : 'outline'}>{data.published ? 'Public page live' : 'Public page hidden'}</Badge>}
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {params.saved === 'publish' ? 'Public page visibility updated.' : 'Settings saved.'}
        </div>
      ) : null}
      {ctx.demo ? (
        <div className="rounded-card border border-hairline bg-mint-subtle px-4 py-3 text-sm text-forest">
          Demo settings. Saving is disabled until a database is connected.
        </div>
      ) : null}

      <form action={updateSettings} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Business profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Business name" htmlFor="name">
                <Input id="name" name="name" required defaultValue={data.name} maxLength={120} />
              </Field>
              <Field label="Tagline" htmlFor="tagline">
                <Input id="tagline" name="tagline" defaultValue={data.tagline ?? ''} maxLength={200} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" htmlFor="city">
                  <Input id="city" name="city" defaultValue={data.city ?? ''} maxLength={80} />
                </Field>
                <Field label="District" htmlFor="district">
                  <Input id="district" name="district" defaultValue={data.district ?? ''} maxLength={80} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" htmlFor="phone">
                  <Input id="phone" name="phone" defaultValue={data.phone ?? ''} maxLength={24} />
                </Field>
                <Field label="Email" htmlFor="email">
                  <Input id="email" name="email" type="email" defaultValue={data.email ?? ''} maxLength={200} />
                </Field>
              </div>
              <p className="text-xs text-ink-muted">
                Public page: <code className="rounded bg-mint-subtle px-1">/p/{data.slug}</code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commercial defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Tax mode"
                htmlFor="taxMode"
                hint="Exclusive adds GST on top of line totals. Inclusive treats the price as tax-paid."
              >
                <Select id="taxMode" name="taxMode" defaultValue={data.settings.taxMode}>
                  <option value="exclusive">Exclusive — add tax</option>
                  <option value="inclusive">Inclusive — tax already included</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Advance %" htmlFor="advancePct">
                  <Input
                    id="advancePct"
                    name="advancePct"
                    inputMode="numeric"
                    defaultValue={data.settings.advancePct}
                  />
                </Field>
                <Field label="Quote validity (days)" htmlFor="quoteValidityDays">
                  <Input
                    id="quoteValidityDays"
                    name="quoteValidityDays"
                    inputMode="numeric"
                    defaultValue={data.settings.quoteValidityDays}
                  />
                </Field>
              </div>
              <Field
                label="Service areas"
                htmlFor="serviceAreas"
                hint="Comma separated. Used on the public page, never in the maths."
              >
                <Textarea
                  id="serviceAreas"
                  name="serviceAreas"
                  defaultValue={data.settings.serviceAreas.join(', ')}
                  className="min-h-20"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Brand colour" htmlFor="brandPrimary">
                  <Input
                    id="brandPrimary"
                    name="brandPrimary"
                    type="color"
                    defaultValue={data.settings.brandPrimary}
                    className="h-11 w-20 p-1"
                  />
                </Field>
                <Field label="Display font" htmlFor="brandFont">
                  <Select id="brandFont" name="brandFont" defaultValue={data.settings.brandFont}>
                    <option value="Inter">Inter</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="system-ui">System UI</option>
                  </Select>
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manual payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs leading-relaxed text-ink-muted">
              No payment gateway is connected. These details appear on the public quotation so a
              customer knows where to send money; you record the receipt against the invoice.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="UPI ID" htmlFor="upiVpa" hint="Optional. Example: business@okicici">
                <Input id="upiVpa" name="upiVpa" defaultValue={data.settings.payment.upiVpa} maxLength={120} />
              </Field>
              <Field label="Bank name" htmlFor="bankName">
                <Input id="bankName" name="bankName" defaultValue={data.settings.payment.bankName} maxLength={120} />
              </Field>
              <Field label="Account name" htmlFor="accountName">
                <Input id="accountName" name="accountName" defaultValue={data.settings.payment.accountName} maxLength={120} />
              </Field>
              <Field label="Account number" htmlFor="accountNumber">
                <Input id="accountNumber" name="accountNumber" defaultValue={data.settings.payment.accountNumber} maxLength={60} />
              </Field>
              <Field label="IFSC" htmlFor="ifsc">
                <Input id="ifsc" name="ifsc" defaultValue={data.settings.payment.ifsc} maxLength={20} />
              </Field>
              <Field label="Payment instructions" htmlFor="paymentInstructions" className="md:col-span-2">
                <Textarea
                  id="paymentInstructions"
                  name="paymentInstructions"
                  className="min-h-20"
                  defaultValue={data.settings.payment.instructions}
                  maxLength={600}
                  placeholder="Pay 30% advance, send the reference on WhatsApp, receipt follows."
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <button
          type="submit"
          disabled={!canEdit}
          className="inline-flex h-11 items-center justify-center rounded-control bg-forest px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          Save settings
        </button>
        {!canEdit ? (
          <p className="text-xs text-ink-muted">
            {ctx.demo ? 'Demo mode is read-only.' : 'Owner or manager only.'}
          </p>
        ) : null}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Public page</CardTitle>
          <Badge tone={data.published ? 'success' : 'outline'}>
            {data.published ? 'Published' : 'Hidden'}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-ink-muted">
            Publishing makes the profile and enquiry form reachable at{' '}
            <code className="rounded bg-mint-subtle px-1">/p/{data.slug}</code>. It does not claim
            new customers; it exists so someone can reach you.
          </p>
          <form action={setPublished}>
            <input type="hidden" name="published" value={data.published ? '0' : '1'} />
            <button
              type="submit"
              disabled={!canEdit}
              className="inline-flex h-10 items-center rounded-control border border-hairline px-4 text-sm text-ink disabled:opacity-50"
            >
              {data.published ? 'Hide public page' : 'Publish public page'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
