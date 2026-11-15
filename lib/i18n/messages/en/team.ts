/**
 * Team: members, roles, invitations.
 *
 * Member names and emails are content; everything else is interface copy. Role
 * labels are stored values; the display words are translated.
 */
export const team = {
  title: 'Team',
  eyebrow: 'Team',
  heading: 'Who can see prices, and who cannot',
  intro:
    'Roles are enforced in the database, not in the navigation. Employees work with events and stock; owners and managers see money.',
  members: 'Members',
  invite: 'Invite a teammate',
  pending: 'Pending invitations',
  noPending: 'Nothing waiting.',
  role: 'Role',
  save: 'Save',
  deactivate: 'Deactivate',
  reactivate: 'Reactivate',
  email: 'Email',
  roleHint: 'Managers see prices. Employees do not.',
  manager: 'Manager',
  employee: 'Employee',
  owner: 'Owner',
  sendInvitation: 'Send invitation',
  ownerOnly: 'Owner only.',
  copy: 'Copy',
  copied: 'Copied',
  invitationRecorded:
    'Invitation recorded. Email delivery is not wired yet — copy the link manually until it is.',
  policiesNote:
    'Role checks run in db/policies.sql. Until those policies are applied to a real project, this screen is the only guard — see the handoff note.',
  errors: {
    permission: 'team.errors.permission',
    email: 'team.errors.email',
    role: 'team.errors.role',
    missing: 'team.errors.missing',
    already: 'team.errors.already',
    pending: 'team.errors.pending',
    lastOwner: 'team.errors.lastOwner',
    demo: 'team.errors.demo',
  },
  saved: {
    settings: 'Saved.',
  },
} as const
