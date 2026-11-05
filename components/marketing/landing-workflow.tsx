import Link from 'next/link'
import {
  ArrowRight,
  Calculator,
  Check,
  FileText,
  IndianRupee,
  Layers3,
  ReceiptIndianRupee,
  Share2,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { formatINR, formatPercentBp } from '@/lib/domain/money'
import { BuilderPreview } from './builder-preview'
import { marketingSample } from './product-preview'
import { SectionIntro, SectionShell } from './section'

const WORKFLOW = [
  {
    icon: Layers3,
    title: 'Configure the business',
    body: 'Enable the services you actually provide and set the defaults that apply across quotes.',
  },
  {
    icon: ReceiptIndianRupee,
    title: 'Set up catalogues',
    body: 'Add items, packages, units, prices, costs and the tax rate for each service.',
  },
  {
    icon: Calculator,
    title: 'Build the quotation',
    body: 'Choose an event, add lines, set quantities and let the server compute tax and round-off.',
  },
  {
    icon: Share2,
    title: 'Share and track',
    body: 'Send a public token link or PDF. The customer accepts; the business records the money.',
  },
]

const BUILDER_STEPS = [
  'Select the event',
  'Add the services',
  'Choose catalogue items',
  'Set quantities and price',
  'Apply tax and discount',
  'Review the customer document',
]

export function QuoteBuilderSection() {
  return (
    <SectionShell id="builder">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <div>
          <SectionIntro
            eyebrow="The quote builder"
            title={
              <>
                One event brief becomes{' '}
                <span className="text-mint-bright">one customer document.</span>
              </>
            }
            description="The composer keeps the service structure intact. Add catering by the guest, decor as a flat line, photography by the day â€” then review the same totals the customer will see."
          />
          <div className="mt-7 flex flex-wrap gap-2">
            {BUILDER_STEPS.map((step, index) => (
              <span
                key={step}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] text-white/60"
              >
                <span className="tabular text-mint-bright/80">0{index + 1}</span>
                {step}
              </span>
            ))}
          </div>
          <Link
            href="/signup"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-control bg-mint-bright px-4 text-sm font-medium text-forest transition-colors hover:bg-mint"
          >
            Build your first quote
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="min-w-0">
          <BuilderPreview />
          <p className="mt-3 text-center text-[11px] text-white/55">
            Illustrative product preview. The same calculation path as the app.
          </p>
        </div>
      </div>
    </SectionShell>
  )
}

export function FinanceSection() {
  const marginWidth = Math.max(8, Math.min(100, Math.round(marketingSample.marginBp / 100)))
  return (
    <SectionShell tone="soft">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div>
          <SectionIntro
            eyebrow="Financial intelligence"
            title={
              <>
                A quote is a promise. <span className="text-mint-bright">Margin is the decision.</span>
              </>
            }
            description="EventsMa separates the customer total from the delivered cost. You can see revenue, tax, cost, profit and margin on the same quote â€” before it leaves the workspace."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ['Quote value', formatINR(marketingSample.totalPaise), 'What the customer sees'],
              ['Delivered cost', formatINR(marketingSample.costPaise), 'Food, crew and vendors'],
              ['Gross margin', formatINR(marketingSample.marginPaise), 'Quote value minus cost'],
              ['Margin rate', formatPercentBp(marketingSample.marginBp), 'Not shown to the customer'],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
                  {label}
                </p>
                <p className="tabular mt-2 text-2xl font-semibold text-cream">{value}</p>
                <p className="mt-1 text-xs text-white/55">{hint}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-white/55">
            Illustrative sample calculated by the same pricing rules as the workspace. No real
            customer data.
          </p>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/10 bg-night p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mint-bright/80">
                Sample quote
              </p>
              <h3 className="mt-1 font-display text-2xl text-cream">Wedding lunch, 350 guests</h3>
            </div>
            <span className="rounded-full bg-mint/10 px-2.5 py-1 text-[10px] text-mint-bright">
              Illustrative
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <div className="flex justify-between text-xs text-white/55">
                <span>Customer total</span>
                <span className="tabular">{formatINR(marketingSample.totalPaise)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full rounded-full bg-mint-bright/70" aria-hidden />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-white/55">
                <span>Delivered cost</span>
                <span className="tabular">{formatINR(marketingSample.costPaise)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/35"
                  style={{
                    width: `${Math.round((marketingSample.costPaise / marketingSample.totalPaise) * 100)}%`,
                  }}
                  aria-hidden
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-white/55">
                <span>Gross margin</span>
                <span className="tabular text-mint-bright">
                  {formatINR(marketingSample.marginPaise)} Â· {formatPercentBp(marketingSample.marginBp)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-mint-bright"
                  style={{ width: `${marginWidth}%` }}
                  aria-hidden
                />
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Tax on quote</p>
              <p className="tabular mt-1 text-sm text-cream">{formatINR(marketingSample.taxPaise)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Invoice status</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-mint-bright">
                <Check className="h-3.5 w-3.5" aria-hidden />
                Manual ledger
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

export function HowItWorks() {
  return (
    <SectionShell id="how-it-works">
      <SectionIntro
        eyebrow="How it works"
        title={
          <>
            From setup to a sent quote in{' '}
            <span className="text-mint-bright">four deliberate steps.</span>
          </>
        }
        description="No data migration project. Start with the services you provide today and add the rest when you need them."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WORKFLOW.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={step.title}
              className="relative rounded-2xl border border-white/10 bg-white/[0.035] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint/10 text-mint-bright">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="tabular text-xs text-white/55">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-sm font-semibold text-cream">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{step.body}</p>
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}

const DIFFERENTIATORS = [
  {
    icon: Layers3,
    title: 'One workspace, every service',
    body: 'Stop stitching separate price lists into a single customer document.',
  },
  {
    icon: ShieldCheck,
    title: 'Money is computed, not typed',
    body: 'Totals live on the server in integer paise and are frozen into the sent version.',
  },
  {
    icon: FileText,
    title: 'Sent quotes are immutable',
    body: 'Edits create a new version; the customer link and PDF stay defensible.',
  },
  {
    icon: WalletCards,
    title: 'Manual payment ledger',
    body: 'Bank or UPI instructions on the quote; receipts recorded by hand, append-only.',
  },
  {
    icon: TrendingUp,
    title: 'Margin before send',
    body: 'See delivered cost and contribution before the customer sees a number.',
  },
  {
    icon: IndianRupee,
    title: 'Tax-aware by line',
    body: 'Catering and decor can carry different tax rates without a spreadsheet.',
  },
]

export function Differentiators() {
  return (
    <SectionShell tone="soft">
      <SectionIntro
        eyebrow="Why EventsMa"
        title={
          <>
            The advantages are concrete,{' '}
            <span className="text-mint-bright">not cosmetic.</span>
          </>
        }
        description="Every claim here maps to a feature in the workspace. There is no AI pricing, no invented customer count and no payment gateway collecting money behind your back."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DIFFERENTIATORS.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-night p-5">
              <Icon className="h-5 w-5 text-mint-bright" aria-hidden />
              <h3 className="mt-4 text-sm font-semibold text-cream">{item.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{item.body}</p>
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}
