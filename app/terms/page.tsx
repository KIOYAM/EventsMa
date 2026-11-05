import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/marketing/legal-page'

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms that apply when a business uses the EventsMa workspace.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="5 November 2026">
      <LegalSection title="Using EventsMa">
        <p>
          These terms apply when you create an account or use EventsMa. By using the service, you
          agree to them on behalf of yourself and the business you represent. If you do not agree,
          do not use the service.
        </p>
      </LegalSection>

      <LegalSection title="What the service does">
        <p>
          EventsMa helps event businesses configure services, maintain catalogues, create events
          and quotations, share customer documents, record invoices, enter manual payment receipts
          and review margins.
        </p>
        <p>
          EventsMa is not a payment processor, payment gateway, bank, tax adviser or law firm. We do
          not collect customer payments, hold funds, issue refunds or verify that a payment actually
          reached your bank.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You are responsible for keeping your login credentials secure and for the people you
          invite to your organisation. You must give accurate account and business information and
          tell us promptly if you believe an account has been compromised.
        </p>
        <p>
          You may not share an account outside the organisation it was created for or use another
          business&apos;s workspace.
        </p>
      </LegalSection>

      <LegalSection title="Your data and your customers">
        <p>
          You own the business, client, event, catalogue and quotation records you enter. You grant
          us permission to store and process them so we can provide the service.
        </p>
        <p>
          You are responsible for having a lawful basis to enter client contact details and for
          using them appropriately. Do not enter card numbers, bank passwords, UPI PINs or other
          authentication secrets into the workspace.
        </p>
      </LegalSection>

      <LegalSection title="Manual payments">
        <p>
          Payment instructions shown on a quotation belong to the business, not to EventsMa. The
          business is solely responsible for collecting money, issuing refunds, reconciling its bank
          account and meeting its tax and accounting obligations. A receipt entered in EventsMa is a
          record of what the business entered, not proof that funds settled.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You may not use EventsMa to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Break the law or infringe another person&apos;s rights.</li>
          <li>Send unlawful, misleading or unsolicited messages through a quote link.</li>
          <li>Attempt to access another organisation&apos;s records or bypass security controls.</li>
          <li>Upload malware, run denial-of-service attacks or interfere with the service.</li>
          <li>Resell or copy the platform without written permission.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          We aim to keep the service available and accurate, but it is provided on an as-available
          basis. Maintenance, provider incidents, network failures and events outside our control
          may interrupt it. We may change or withdraw features as the product develops; we will not
          intentionally remove access to your records without a reasonable opportunity to export
          them.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          EventsMa owns the platform, brand, design and software. You own the content you enter. We
          may use aggregated, de-identified information to understand product usage, but we do not
          publish your customer records or quote values.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers and liability">
        <p>
          The service is a business tool, not professional advice. You are responsible for the
          prices, taxes, costs, quotations and payment records you create. To the extent permitted
          by law, EventsMa is not liable for indirect or consequential loss, lost profit, or loss
          arising from a payment, tax or quotation decision made outside the service.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Ending use">
        <p>
          You may stop using the service at any time. We may suspend or close an account that
          breaches these terms or creates a security or legal risk. Where practical, we will give
          notice and a chance to export records first.
        </p>
      </LegalSection>

      <LegalSection title="Governing law and contact">
        <p>
          These terms are governed by the laws of India. Courts at Coimbatore, Tamil Nadu have
          jurisdiction, subject to any mandatory consumer or data-protection rights.
        </p>
        <p>
          Questions about these terms:{' '}
          <a
            href="mailto:admin@eventsma.in"
            className="text-mint-bright underline-offset-4 hover:underline"
          >
            admin@eventsma.in
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
