import { and, asc, eq, gt } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { requestOrigin } from '@/lib/http/request-origin.server'
import { requireWorkspace } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { withWorkspace } from '@/lib/db/workspace'
import { invitations, memberships } from '@/lib/db/schema'
import { inviteMember, setMemberActive, updateMemberRole } from './actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('team.title') }
}

const ERROR_KEYS: Record<string, string> = {
  permission: 'team.errors.permission',
  email: 'team.errors.email',
  role: 'team.errors.role',
  missing: 'team.errors.missing',
  already: 'team.errors.already',
  pending: 'team.errors.pending',
  last_owner: 'team.errors.lastOwner',
  demo: 'team.errors.demo',
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  employee: 'Employee',
}

const DEMO_MEMBERS = [
  { id: 'demo-1', displayName: 'Kannan R.', email: 'kannan@annapoorna.example', role: 'owner', status: 'active' },
  { id: 'demo-2', displayName: 'Meera S.', email: 'meera@annapoorna.example', role: 'manager', status: 'active' },
  { id: 'demo-3', displayName: 'Arun K.', email: 'arun@annapoorna.example', role: 'employee', status: 'active' },
]

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = translatorFor(locale)
  const params = await searchParams
  // Invite links are copied into WhatsApp or email by the owner, so they carry the
  // origin they are actually using rather than the deployment's configured one.
  const origin = await requestOrigin()

  const demo = ctx.demo
  const members = demo
    ? DEMO_MEMBERS
    : await withWorkspace(ctx, () =>
        getDb()
          .select({
            id: memberships.id,
            displayName: memberships.displayName,
            email: memberships.email,
            role: memberships.role,
            status: memberships.status,
          })
          .from(memberships)
          .where(eq(memberships.orgId, ctx.orgId))
          .orderBy(asc(memberships.createdAt)),
      )

  const pending = demo
    ? []
    : await withWorkspace(ctx, () =>
        getDb()
          .select({ id: invitations.id, email: invitations.email, role: invitations.role, token: invitations.token, expiresAt: invitations.expiresAt })
          .from(invitations)
          .where(
            and(
              eq(invitations.orgId, ctx.orgId),
              gt(invitations.expiresAt, new Date()),
            ),
          )
          .orderBy(asc(invitations.createdAt)),
      )

  const isOwner = ctx.role === 'owner'
  const canEdit = isOwner && !ctx.demo

  const errorKey = params.error ? ERROR_KEYS[params.error] : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('team.eyebrow')}
        title={t('team.heading')}
        description={t('team.intro')}
      />

      {errorKey ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {t(errorKey)}
        </div>
      ) : null}
      {params.invited ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('team.invitationRecorded')}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('team.saved.settings')}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('team.members')}</CardTitle>
            <Badge tone="outline">{members.length}</Badge>
          </CardHeader>
          <CardContent className="divide-y divide-hairline">
            {members.map((member) => (
              <div key={member.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {member.displayName ?? member.email ?? 'Unnamed member'}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{member.email ?? 'No email cached'}</p>
                </div>

                {member.status !== 'active' ? <Badge tone="warning">Inactive</Badge> : null}

                <form action={updateMemberRole} className="flex items-center gap-1.5">
                  <input type="hidden" name="membershipId" value={member.id} />
                  <Select
                    name="role"
                    defaultValue={member.role}
                    disabled={!canEdit}
                    className="h-9 w-28 text-xs"
                    aria-label={`Role for ${member.email ?? member.id}`}
                  >
                    {Object.entries(ROLE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className="text-xs font-medium text-forest underline underline-offset-2 disabled:opacity-40"
                  >
                    {t('team.save')}
                  </button>
                </form>

                <form action={setMemberActive}>
                  <input type="hidden" name="membershipId" value={member.id} />
                  <input type="hidden" name="status" value={member.status === 'active' ? 'inactive' : 'active'} />
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className="text-xs text-ink-muted underline underline-offset-2 disabled:opacity-40"
                  >
                    {member.status === 'active' ? t('team.deactivate') : t('team.reactivate')}
                  </button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t('team.invite')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={inviteMember} className="space-y-3">
                <Field label={t('team.email')} htmlFor="inviteEmail">
                  <Input id="inviteEmail" name="email" type="email" required placeholder="name@business.in" />
                </Field>
                <Field label={t('team.role')} htmlFor="inviteRole" hint={t('team.roleHint')}>
                  <Select id="inviteRole" name="role" defaultValue="employee">
                    <option value="manager">{t('team.manager')}</option>
                    <option value="employee">{t('team.employee')}</option>
                    <option value="owner">{t('team.owner')}</option>
                  </Select>
                </Field>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="btn btn-md btn-primary w-full disabled:opacity-50"
                >
                  {t('team.sendInvitation')}
                </button>
                {!isOwner ? <p className="text-xs text-ink-muted">{t('team.ownerOnly')}</p> : null}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('team.pending')}</CardTitle>
              <Badge tone="outline">{pending.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.length === 0 ? (
                <p className="text-xs text-ink-muted">{t('team.noPending')}</p>
              ) : (
                pending.map((invite) => (
                  <div key={invite.id} className="space-y-1.5 border-b border-hairline pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate text-ink">{invite.email}</span>
                      <span className="text-ink-muted">{ROLE_LABEL[invite.role] ?? invite.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded bg-canvas px-1.5 py-1 text-[10px] text-ink-muted">
                        {origin}/invite/{invite.token}
                      </code>
                      <CopyButton
                        value={`${origin}/invite/${invite.token}`}
                        label={t('team.copy')}
                        copiedLabel={t('team.copied')}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-ink-muted">
        Role checks run in <code className="rounded bg-mint-subtle px-1">db/policies.sql</code>. Until those policies
        are applied to a real project, this screen is the only guard — see the handoff note.
      </p>
    </div>
  )
}
