import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq, isNull } from 'drizzle-orm'
import { AuthShell } from '@/components/auth-shell'
import { getCurrentUser } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { invitations, organisations } from '@/lib/db/schema'
import { acceptInvitation } from './actions'

export const metadata = {
  title: 'Join your team',
  robots: { index: false, follow: false },
}

const ERROR_COPY: Record<string, string> = {
  expired: 'This invitation has expired or was already used. Ask the owner for a fresh one.',
  account: 'This invitation belongs to a different email. Sign in with the invited address.',
  demo: 'Team invitations are not configured on this deployment.',
  signin: 'Sign in with the invited email first.',
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { token } = await params
  const query = await searchParams
  if (!isDatabaseConfigured()) notFound()

  const [invite] = await getDb()
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      orgName: organisations.name,
    })
    .from(invitations)
    .innerJoin(organisations, eq(invitations.orgId, organisations.id))
    .where(and(eq(invitations.token, token), isNull(invitations.acceptedAt)))
    .limit(1)

  if (!invite) {
    return (
      <AuthShell
        active="signin"
        step="Team invitation"
        title="This invitation is no longer open"
        description="It may have expired or already been accepted."
      >
        <div className="mt-5 space-y-3">
          {query.error && ERROR_COPY[query.error] ? (
            <p role="alert" className="rounded-control border border-terracotta/30 bg-terracotta-soft px-3 py-2.5 text-sm text-terracotta">
              {ERROR_COPY[query.error]}
            </p>
          ) : null}
          <Link href="/login" className="text-sm text-forest underline underline-offset-4">
            Sign in to your workspace
          </Link>
        </div>
      </AuthShell>
    )
  }

  const expired = invite.expiresAt.getTime() < Date.now()
  const user = await getCurrentUser()
  const next = `/invite/${token}`
  const canAccept = user?.email?.toLowerCase() === invite.email.toLowerCase() && !expired

  return (
    <AuthShell
      active="signin"
      step="Team invitation"
      title={`Join ${invite.orgName}`}
      description={`${invite.email} was invited as ${invite.role}. Accepting adds this login to the workspace; it does not share another business's data.`}
    >
      <div className="mt-5 space-y-4">
        {query.error && ERROR_COPY[query.error] ? (
          <p role="alert" className="rounded-control border border-terracotta/30 bg-terracotta-soft px-3 py-2.5 text-sm text-terracotta">
            {ERROR_COPY[query.error]}
          </p>
        ) : null}

        {expired ? (
          <p role="alert" className="rounded-control border border-terracotta/30 bg-terracotta-soft px-3 py-2.5 text-sm text-terracotta">
            This invitation expired on {invite.expiresAt.toLocaleDateString('en-IN')}. Ask the owner
            for a new link.
          </p>
        ) : null}

        {!user ? (
          <>
            <p className="text-sm text-ink-muted">
              Sign in with <span className="font-medium text-ink">{invite.email}</span>, or create
              that login first.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="inline-flex h-11 items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white"
              >
                Sign in
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(next)}`}
                className="inline-flex h-11 items-center justify-center rounded-control border border-hairline px-4 text-sm font-medium text-ink"
              >
                Create login
              </Link>
            </div>
          </>
        ) : canAccept ? (
          <form action={acceptInvitation}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white"
            >
              Accept invitation
            </button>
          </form>
        ) : (
          <p className="rounded-control border border-terracotta/30 bg-terracotta-soft px-3 py-2.5 text-sm text-terracotta">
            You are signed in as {user.email ?? 'another account'}. Sign out and use {invite.email}.
          </p>
        )}
      </div>
    </AuthShell>
  )
}
