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
import { events } from './ta/events'
import { nav } from './ta/nav'
import { pdf } from './ta/pdf'
import { rule } from './ta/rule'
import { share } from './ta/share'
import type { MessagesOverride } from './en'

export const ta: MessagesOverride = {
  catering,
  clients,
  common,
  quotes,
  dashboard,
  submissions,
  invoices,
  events,
  nav,
  pdf,
  rule,
  share,
}
