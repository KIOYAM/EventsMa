import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { translatorFor } from '@/lib/i18n/server'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getSettings } from '@/lib/db/settings'
import { setPublished, updateSettings } from './actions'

export const metadata = { title: 'Settings' }

const ERROR_KEYS: Record<string, string> = {
  permission: 'settings.errors.permission',
  demo: 'settings.errors.demo',
  name: 'settings.errors.name',
  email: 'settings.errors.email',
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = 'en'
  const t = translatorFor(locale)
  const params = await searchParams
  const data = await withWorkspace(ctx, () => getSettings(ctx.orgId, ctx.demo))
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  const errorKey = params.error ? ERROR_KEYS[params.error] : undefined
  const savedKey = params.saved === 'publish' ? 'settings.saved.publish' : 'settings.saved.settings'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('settings.eyebrow')}
        title={t('settings.heading')}
        description={t('settings.intro')}
        actions={
          <Badge tone={data.published ? 'success' : 'outline'}>
            {data.published ? t('settings.publicPageLive') : t('settings.publicPageHidden')}
          </Badge>
        }
      />

      {errorKey ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t(errorKey)}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t(savedKey)}
        </div>
      ) : null}
      {ctx.demo ? (
        <div className="card-flat bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('settings.demoNotice')}
        </div>
      ) : null}

      <form action={updateSettings} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessProfile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label={t('settings.field.businessName')} htmlFor="name">
                <Input id="name" name="name" required defaultValue={data.name} maxLength={120} />
              </Field>
              <Field label={t('settings.field.tagline')} htmlFor="tagline">
                <Input id="tagline" name="tagline" defaultValue={data.tagline ?? ''} maxLength={200} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('settings.field.city')} htmlFor="city">
                  <Input id="city" name="city" defaultValue={data.city ?? ''} maxLength={80} />
                </Field>
                <Field label={t('settings.field.district')} htmlFor="district">
                  <Input id="district" name="district" defaultValue={data.district ?? ''} maxLength={80} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('settings.field.phone')} htmlFor="phone">
                  <Input id="phone" name="phone" defaultValue={data.phone ?? ''} maxLength={24} />
                </Field>
                <Field label={t('settings.field.email')} htmlFor="email">
                  <Input id="email" name="email" type="email" defaultValue={data.email ?? ''} maxLength={200} />
                </Field>
              </div>
              <p className="text-xs text-ink-muted">
                Public page: <code className="rounded bg-mint-subtle px-1">
                  {t('settings.field.publicPageUrl', { slug: data.slug })}
                </code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.commercialDefaults')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label={t('settings.taxMode')}
                htmlFor="taxMode"
                hint={t('settings.taxModeHint')}
              >
                <Select id="taxMode" name="taxMode" defaultValue={data.settings.taxMode}>
                  <option value="exclusive">{t('settings.taxExclusive')}</option>
                  <option value="inclusive">{t('settings.taxInclusive')}</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('settings.advancePct')} htmlFor="advancePct">
                  <Input
                    id="advancePct"
                    name="advancePct"
                    inputMode="numeric"
                    defaultValue={data.settings.advancePct}
                  />
                </Field>
                <Field label={t('settings.quoteValidityDays')} htmlFor="quoteValidityDays">
                  <Input
                    id="quoteValidityDays"
                    name="quoteValidityDays"
                    inputMode="numeric"
                    defaultValue={data.settings.quoteValidityDays}
                  />
                </Field>
              </div>
              <Field
                label={t('settings.serviceAreas')}
                htmlFor="serviceAreas"
                hint={t('settings.serviceAreasHint')}
              >
                <Textarea
                  id="serviceAreas"
                  name="serviceAreas"
                  defaultValue={data.settings.serviceAreas.join(', ')}
                  className="min-h-20"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('settings.brandColour')} htmlFor="brandPrimary">
                  <Input
                    id="brandPrimary"
                    name="brandPrimary"
                    type="color"
                    defaultValue={data.settings.brandPrimary}
                    className="h-11 w-20 p-1"
                  />
                </Field>
                <Field label={t('settings.brandFont')} htmlFor="brandFont">
                  <Select id="brandFont" name="brandFont" defaultValue={data.settings.brandFont}>
                    <option value="Inter">{t('settings.fontInter')}</option>
                    <option value="Playfair Display">{t('settings.fontPlayfair')}</option>
                    <option value="system-ui">{t('settings.fontSystem')}</option>
                  </Select>
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.manualPayments')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs leading-relaxed text-ink-muted">
              {t('settings.noGateway')}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('settings.upiVpa')} htmlFor="upiVpa" hint={t('settings.upiVpaHint')}>
                <Input id="upiVpa" name="upiVpa" defaultValue={data.settings.payment.upiVpa} maxLength={120} />
              </Field>
              <Field label={t('settings.bankName')} htmlFor="bankName">
                <Input id="bankName" name="bankName" defaultValue={data.settings.payment.bankName} maxLength={120} />
              </Field>
              <Field label={t('settings.accountName')} htmlFor="accountName">
                <Input id="accountName" name="accountName" defaultValue={data.settings.payment.accountName} maxLength={120} />
              </Field>
              <Field label={t('settings.accountNumber')} htmlFor="accountNumber">
                <Input id="accountNumber" name="accountNumber" defaultValue={data.settings.payment.accountNumber} maxLength={60} />
              </Field>
              <Field label={t('settings.ifsc')} htmlFor="ifsc">
                <Input id="ifsc" name="ifsc" defaultValue={data.settings.payment.ifsc} maxLength={20} />
              </Field>
              <Field label={t('settings.paymentInstructions')} htmlFor="paymentInstructions" className="md:col-span-2">
                <Textarea
                  id="paymentInstructions"
                  name="paymentInstructions"
                  className="min-h-20"
                  defaultValue={data.settings.payment.instructions}
                  maxLength={600}
                  placeholder={t('settings.paymentInstructionsPlaceholder')}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <button
          type="submit"
          disabled={!canEdit}
          className="btn btn-md btn-primary disabled:opacity-50"
        >
          {t('settings.saveSettings')}
        </button>
        {!canEdit ? (
          <p className="text-xs text-ink-muted">
            {ctx.demo ? t('settings.readOnly.demo') : t('settings.readOnly.ownerOnly')}
          </p>
        ) : null}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.publicPage')}</CardTitle>
          <Badge tone={data.published ? 'success' : 'outline'}>
            {data.published ? t('settings.published') : t('settings.hidden')}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-ink-muted">
            {t('settings.publishingNote')}
          </p>
          <form action={setPublished}>
            <input type="hidden" name="published" value={data.published ? '0' : '1'} />
            <button
              type="submit"
              disabled={!canEdit}
              className="inline-flex h-10 items-center rounded-control border border-hairline px-4 text-sm text-ink disabled:opacity-50"
            >
              {data.published ? t('settings.hidePublicPage') : t('settings.publishPublicPage')}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
