/**
 * Tamil catalogue, assembled from one file per module.
 *
 * Every module is a deep partial of its English counterpart, so a missing key is
 * a type-level gap that falls back to English at runtime and shows up in
 * `translationCoverage('ta')`.
 *
 * The whole catalogue is SEED: none of it has been reviewed by a Tamil speaker.
 * The customer link, the signed-in shell, the dashboard and events are the
 * surfaces wired to it so far.
 */
import { catering } from './ta/catering'
import { clients } from './ta/clients'
import { common } from './ta/common'
import { quotes } from './ta/quotes'
import { dashboard } from './ta/dashboard'
import { submissions } from './ta/submissions'
import { invoices } from './ta/invoices'
import { inventory } from './ta/inventory'
import { reports } from './ta/reports'
import { settings } from './ta/settings'
import { team } from './ta/team'
import { events } from './ta/events'
import { nav } from './ta/nav'
import { auth } from './ta/auth'
import { marketing } from './ta/marketing'
import { pdf } from './ta/pdf'
import { portfolio } from './ta/portfolio'
import { rule } from './ta/rule'
import { share } from './ta/share'
import { storefront } from './ta/storefront'
import { storefrontPublic } from './ta/storefront-public'
import type { MessagesOverride } from './en'

export const ta: MessagesOverride = {
  catering,
  clients,
  common,
  quotes,
  dashboard,
  submissions,
  invoices,
  inventory,
  reports,
  settings,
  team,
  events,
  nav,
  auth,
  marketing,
  pdf,
  rule,
  share,
  portfolio,
  storefront,
  storefrontPublic,
}
