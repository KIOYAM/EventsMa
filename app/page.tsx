import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { QuotePreview } from '@/components/marketing/product-preview'
import { CapabilityStrip, ProblemSolution, ProductShowcase, SolutionsSection } from '@/components/marketing/landing-features'
import { Differentiators, FinanceSection, HowItWorks, QuoteBuilderSection } from '@/components/marketing/landing-workflow'
import { FaqSection, FinalCta, PricingSection } from '@/components/marketing/landing-close'

export const metadata: Metadata = {
  title: { absolute: 'EventsMa | Multi-Service Event Management & Quotation Platform' },
  description:
    'Manage catering, decoration, photography and event services in one workspace. Create structured quotations, manage pricing and understand your event business margins with EventsMa.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'EventsMa | Multi-Service Event Management & Quotation Platform',
    description:
      'Every service. One event. One profitable quotation. Manage event services, catalogues, quotations and margins in one workspace.',
    siteName: 'EventsMa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EventsMa | Multi-Service Event Management & Quotation Platform',
    description:
      'Every service. One event. One profitable quotation. Manage event services, catalogues, quotations and margins in one workspace.',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EventsMa',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://eventsma.vercel.app',
  description:
    'A multi-service event management and quotation workspace for catering, decoration, photography and other event businesses.',
  featureList: [
    'Configurable event services and catalogues',
    'Multi-service quotation builder',
    'Server-computed tax and totals',
    'Cost and margin visibility',
    'Public quote sharing and acceptance',
    'Manual payment receipts and invoices',
  ],
}

export default function LandingPage() {
  return (
    <div className="landing-dark min-h-dvh bg-night text-cream">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-mint-bright focus:px-4 focus:py-2 focus:text-sm focus:text-forest"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        <section className="relative overflow-hidden bg-night">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(199,234,216,0.14),transparent_48%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-forest/40 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:px-10 lg:pb-28 lg:pt-24">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mint-bright/80">
                Event management platform
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,5.6vw,5rem)] leading-[1.02] tracking-[-0.035em] text-cream">
                Every service.
                <br />
                One event.
                <br />
                <span className="text-mint-bright">One profitable quotation.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/65 sm:text-base">
                Manage catering, decoration, photography and other event services in one
                workspace. Build detailed quotations, calculate taxes and understand your profit
                before sending an offer.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-mint-bright px-5 text-sm font-medium text-forest transition-colors hover:bg-mint"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href="#product"
                  className="inline-flex h-12 items-center justify-center rounded-control border border-white/15 px-5 text-sm text-cream transition-colors hover:bg-white/5"
                >
                  Explore the product
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-mint-bright" aria-hidden />
                  No payment gateway
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-mint-bright" aria-hidden />
                  No card data
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-mint-bright" aria-hidden />
                  Server-verified totals
                </span>
              </div>
            </div>

            <div className="min-w-0 lg:pl-2">
              <QuotePreview />
            </div>
          </div>
        </section>

        <CapabilityStrip />
        <ProblemSolution />
        <ProductShowcase />
        <SolutionsSection />
        <QuoteBuilderSection />
        <FinanceSection />
        <HowItWorks />
        <Differentiators />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  )
}
