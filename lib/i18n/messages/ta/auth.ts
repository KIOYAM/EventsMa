import type { DeepPartial } from '../en'
import { auth as enAuth } from '../en/auth'

/**
 * Auth in Tamil. SEED — not native-reviewed.
 *
 * English fallback is used throughout; a native reviewer should replace these
 * strings with clean Tamil.
 */
export const auth: DeepPartial<typeof enAuth> = {
  title: 'EventsMa',
  shell: {
    stepSignin: 'Existing business - sign in',
    stepSignup: 'Step 1 of 2 - your login',
    stepRecovery: 'Account recovery',
    footer: 'Built for event businesses — catering, decor, photography, planning. Quotes, invoices and margin in one workspace.',
    tabs: {
      signin: 'Sign in',
      signup: 'Create account',
    },
  },
  signin: {
    title: 'Sign in to your business workspace',
    description: 'Use the work email and password you created for your event business. Your quotes, invoices and team are already inside.',
    newHere: 'New here?',
    createAccount: 'Create your business account',
    createAccountBody: '- it takes about a minute.',
    emailLabel: 'Work email',
    emailHint: 'The email you signed up with.',
    emailPlaceholder: 'you@yourbusiness.in',
    passwordLabel: 'Password',
    forgotPassword: 'Forgot your password?',
    signIn: 'Sign in to my workspace',
    signingIn: 'Signing in…',
    error: 'Enter your work email and password.',
    notConfirmed: 'That account exists but hasn’t been confirmed yet. Check your email for the confirmation link, or contact admin@eventsma.in.',
    noMatch: 'That email and password do not match an account.',
    notConfigured: 'Sign-in is not configured on this deployment.',
    notConfiguredBody: 'Set {env} and {anon}, then redeploy.',
    envVar: 'NEXT_PUBLIC_SUPABASE_URL',
    anonVar: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  },
  signup: {
    title: 'Create your business account',
    description: 'This is the login for your event business, not a personal profile. One email and password give you and your team the workspace.',
    alreadyHave: 'Already have a workspace?',
    signIn: 'Sign in',
    emailLabel: 'Work email',
    emailHint: 'This becomes your login for the business.',
    emailPlaceholder: 'you@yourbusiness.in',
    passwordLabel: 'Create password',
    passwordHint: 'At least 8 characters, a letter and a number.',
    confirmLabel: 'Confirm password',
    createAccount: 'Create account and continue',
    creating: 'Creating your account…',
    confirmEmail: 'Confirm your email to finish. We sent a link to {email}.',
    confirmEmailBody: 'Open the link, then sign in. The next screen asks for your business name, city and the services you sell.',
    goToSignIn: 'Go to sign in',
    nextStep: 'Next step: your business name, city, phone and the services you provide. No card, no trial countdown.',
    notConfigured: 'Sign-up is not configured on this deployment.',
    notConfiguredBody: 'Set {env} and {anon}, then redeploy.',
  },
  forgot: {
    title: 'Reset your password',
    description: 'Enter the work email on the account. We send one short-lived link; no password is ever emailed.',
    emailLabel: 'Work email',
    emailPlaceholder: 'you@yourbusiness.in',
    sendReset: 'Send reset link',
    sending: 'Sending…',
    sent: 'If that email has an account, a reset link is on its way. The link expires after one use.',
    backToSignIn: 'Back to sign in',
    notConfigured: 'Sign-in is not configured on this deployment.',
  },
  errors: {
    config: 'Sign-in is not configured on this deployment.',
    expired: 'That link has expired. Request a new one and try again.',
    passwordChanged: 'Password changed. Sign in with the new password.',
  },
}
