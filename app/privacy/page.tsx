import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/marketing/legal-page'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How EventsMa stores and handles business, client, event, quotation and manual payment data.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="5 November 2026">
      <LegalSection title="Who we are">
        <p>
          EventsMa is a business workspace for event-service companies. It is operated from
          Coimbatore, Tamil Nadu, India. For privacy questions, write to{' '}
          <a
            href="mailto:admin@eventsma.in"
            className="text-mint-bright underline-offset-4 hover:underline"
          >
            admin@eventsma.in
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="What we store">
        <p>We store the information needed to run the workspace:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Account details such as name, email address, phone number and password hash.</li>
          <li>
            Business details such as the business name, city, service configuration, catalogue,
            prices, costs and tax settings.
          </li>
          <li>
            Client and event details you enter, including contact names, phone numbers, email
            addresses, event dates, venues and guest counts.
          </li>
          <li>
            Quotation, invoice and manual payment records, including amounts, dates, modes and
            references you record.
          </li>
          <li>Technical logs needed for security, authentication and troubleshooting.</li>
        </ul>
        <p>
          EventsMa does not collect or store card numbers, card security codes, bank passwords or
          UPI PINs. Customer payments are recorded manually by the business.
        </p>
      </LegalSection>

      <LegalSection title="Why we use it">
        <p>
          We use this information to provide the workspace, authenticate users, calculate and
          display quotations and invoices, record manual payments, send service emails, provide
          support, secure the service and meet legal obligations.
        </p>
        <p>
          We do not sell personal data. We do not use customer records to train advertising
          profiles.
        </p>
      </LegalSection>

      <LegalSection title="Where it is processed">
        <p>
          The application is hosted on Vercel. Data and authentication are stored in Supabase
          Postgres in the Mumbai region. Email may be delivered through Resend when email delivery
          is configured. These providers process data on our behalf under their own terms and
          security commitments.
        </p>
        <p>
          Access is limited to the organisation that owns the record. Tenant tables carry an
          organisation identifier, and row-level security policies are applied. No service is
          perfectly secure, but we design the workspace to keep one business&apos;s records out of
          another business&apos;s view.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep account and business records while the account is active and for a reasonable
          period afterwards where needed for legal, tax, security or dispute purposes. You can ask
          us to delete an account and its records; some records may need to be retained where the
          law requires it.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can ask for access to, correction of, or deletion of your personal data by writing to
          the contact address above. If you are a client of a business that uses EventsMa, contact
          that business first; it controls the client records it enters. We will help the business
          respond where appropriate.
        </p>
        <p>
          The service is intended for business use by adults. It is not directed at children under
          18.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy as the product changes. The date at the top of the page shows
          the latest revision. Material changes will be communicated through the workspace or by
          email where appropriate.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
