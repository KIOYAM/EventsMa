import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, Mail } from 'lucide-react'
import { SectionIntro, SectionShell } from './section'

const INCLUDED = [
  'Configurable services and catalogues',
  'Events, clients and enquiry pipeline',
  'Multi-service quotation builder',
  'Server-computed tax and round-off',
  'Public quote link, PDF and WhatsApp share',
  'Quote acceptance recorded',
  'Invoices with manual receipts',
  'Finance and margin reporting',
]

const FAQS = [
  {
    question: 'What is EventsMa?',
    answer:
      'EventsMa is a workspace for event businesses that provide more than one service. It keeps services, catalogues, events, clients, quotations, invoices and manual payment receipts in one place.',
  },
  {
    question: 'Who can use EventsMa?',
    answer:
      'Caterers, event planners, decorators, photographers, videographers and multi-service event companies. If you price an event and send a quotation, the workflow is designed for you.',
  },
  {
    question: 'Can I manage multiple services?',
    answer:
      'Yes. Enable the services you provide and configure each one with its own catalogue, billing units and tax treatment. Specialist services can be added without a new deployment.',
  },
  {
    question: 'Can I use my own catalogue and pricing?',
    answer:
      'Yes. Add your own items or packages, choose the unit basis (per guest, per unit, per day, per hour or flat), and store both the selling price and your cost.',
  },
  {
    question: 'How are totals and taxes calculated?',
    answer:
      'The server computes every total in integer paise. It applies per-line tax, allocates order discounts, applies rupee round-off and freezes the result into the sent quotation version. The browser preview is not the stored total.',
  },
  {
    question: 'Can I share a quote and take acceptance?',
    answer:
      'Yes. Send the public token link, download the PDF or share it through WhatsApp. The customer can accept from the quote page without creating an account; the business sees the acceptance and optional email.',
  },
  {
    question: 'How are payments recorded?',
    answer:
      'Manually. The business puts its own bank or UPI instructions on the quote and records each receipt with an amount, mode, date and reference. There is no payment gateway, no pay-now button and no card data in EventsMa.',
  },
  {
    question: 'Is my business and customer data secure?',
    answer:
      'Data is stored in Supabase Postgres in Mumbai. Tenant tables carry an organisation id, row-level security policies are applied, and every workspace query is scoped to the signed-in organisation. No card data is ever collected.',
  },
  {
    question: 'What does EventsMa cost?',
    answer:
      'Public subscription pricing is not switched on yet. We are onboarding early businesses and will agree the plan before charging. Creating an account or building a quotation does not require a card.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Create an account, complete the short onboarding, enable your first services and build a quotation. If you already have an account, sign in to open the workspace.',
  },
]

export function PricingSection() {
  return (
    <SectionShell id="pricing">
      <SectionIntro
        eyebrow="Pricing"
        title={
          <>
            No invented plans. <span className="text-mint-bright">No surprise charge.</span>
          </>
        }
        description="Billing is not switched on yet. We are working with the first event businesses, and we will agree the plan before anyone is charged."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mint-bright/80">
            Early access
          </p>
          <h3 className="mt-3 font-display text-2xl leading-tight text-cream sm:text-3xl">
            Start with the workspace. Agree the plan before you pay.
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
            There is no card gate, no free-trial countdown and no automated subscription. Create an
            account, use the product and decide with us whether it earns a place in your business.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-control bg-mint-bright px-5 text-sm font-medium text-forest transition-colors hover:bg-mint"
            >
              Create an account
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-control border border-white/15 px-5 text-sm text-cream transition-colors hover:bg-white/5"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-5 text-[11px] leading-relaxed text-white/55">
            No payment gateway is connected. No card data is collected or stored. Customer payments
            are recorded manually by the business.
          </p>
        </div>

        <div className="rounded-3xl border border-mint/20 bg-mint/[0.06] p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mint-bright">
            What is in the workspace today
          </p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-white/65">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-bright" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-white/55">
            <Mail className="h-4 w-4 text-mint-bright" aria-hidden />
            Questions?{' '}
            <a href="mailto:admin@eventsma.in" className="text-cream underline-offset-4 hover:underline">
              admin@eventsma.in
            </a>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

export function FaqSection() {
  return (
    <SectionShell id="faq" tone="soft">
      <SectionIntro
        eyebrow="Questions"
        title="The answers a business asks before switching."
        description="Straight answers about the product, the money and the data. If something is not built yet, it is not claimed here."
        align="center"
      />

      <div className="mx-auto mt-10 max-w-3xl divide-y divide-white/10 border-y border-white/10">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group py-1">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium text-cream marker:hidden [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-mint-bright transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="pb-4 pr-8 text-[13px] leading-relaxed text-white/55">{faq.answer}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  )
}

export function FinalCta() {
  return (
    <SectionShell className="pb-20 sm:pb-24 lg:pb-28">
      <div className="relative overflow-hidden rounded-3xl bg-mint-bright px-6 py-12 text-forest sm:px-10 sm:py-14 lg:px-14">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-forest/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full border border-forest/10"
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-forest/80">
            Start with one event
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-[-0.025em] sm:text-4xl lg:text-5xl">
            Bring every part of your event business together.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-forest/80 sm:text-base">
            Set up your services, build a quotation and see the margin before you send it. No
            gateway, no card data and no invented customer count.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-control bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-hover"
            >
              Get started with EventsMa
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-control border border-forest/25 px-5 text-sm text-forest transition-colors hover:bg-forest/5"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
