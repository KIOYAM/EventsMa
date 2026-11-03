import { and, asc, eq, gt } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { requireWorkspace } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { invitations, memberships } from '@/lib/db/schema'
import { inviteMember, setMemberActive, updateMemberRole } from './actions'

export const metadata = { title: 'Team' }

const ERROR_COPY: Record<string, string> = {
  permission: 'Only the owner can change the team.',
  email: 'Enter a valid email address.',
  role: 'That role is not valid.',
  missing: 'That member no longer exists.',
  already: 'That email is already on the team.',
  last_owner: 'A workspace must keep at least one active owner.',
  demo: 'Demo mode: connect a database before inviting anyone.',
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
  const params = await searchParams

  const demo = ctx.demo
  const members = demo
    ? DEMO_MEMBERS
    : await getDb()
        .select({
          id: memberships.id,
          displayName: memberships.displayName,
          email: memberships.email,
          role: memberships.role,
          status: memberships.status,
        })
        .from(memberships)
        .where(eq(memberships.orgId, ctx.orgId))
        .orderBy(asc(memberships.createdAt))

  const pending = demo
    ? []
    : await getDb()
        .select({ id: invitations.id, email: invitations.email, role: invitations.role, expiresAt: invitations.expiresAt })
        .from(invitations)
        .where(
          and(
            eq(invitations.orgId, ctx.orgId),
            gt(invitations.expiresAt, new Date()),
          ),
        )
        .orderBy(asc(invitations.createdAt))

  const isOwner = ctx.role === 'owner'
  const canEdit = isOwner && !ctx.demo

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Who can see prices, and who cannot"
        description="Roles are enforced in the database, not in the navigation. Employees work with events and stock; owners and managers see money."
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}
      {params.invited ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Invitation recorded. Email delivery is not wired yet — copy the link manually until it is.
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">Saved.</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
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
                    Save
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
                    {member.status === 'active' ? 'Deactivate' : 'Reactivate'}
                  </button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Invite a teammate</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={inviteMember} className="space-y-3">
                <Field label="Email" htmlFor="inviteEmail">
                  <Input id="inviteEmail" name="email" type="email" required placeholder="name@business.in" />
                </Field>
                <Field label="Role" htmlFor="inviteRole" hint="Managers see prices. Employees do not.">
                  <Select id="inviteRole" name="role" defaultValue="employee">
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                    <option value="owner">Owner</option>
                  </Select>
                </Field>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="inline-flex h-10 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send invitation
                </button>
                {!isOwner ? <p className="text-xs text-ink-muted">Owner only.</p> : null}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending invitations</CardTitle>
              <Badge tone="outline">{pending.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.length === 0 ? (
                <p className="text-xs text-ink-muted">Nothing waiting.</p>
              ) : (
                pending.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate text-ink">{invite.email}</span>
                    <span className="text-ink-muted">{ROLE_LABEL[invite.role] ?? invite.role}</span>
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
