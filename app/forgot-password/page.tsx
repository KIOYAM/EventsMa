import { AuthShell } from '@/components/auth-shell'
import { ForgotForm } from './forgot-form'

export const metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      active="signin"
      step="Account recovery"
      title="Reset your password"
      description="Enter the work email on the account. We send one short-lived link; no password is ever emailed."
    >
      <ForgotForm />
    </AuthShell>
  )
}
