/**
 * Tamil catalogue, assembled from one file per module.
 *
 * Every module is a deep partial of its English counterpart, so a missing key is
 * a type-level gap that falls back to English at runtime and shows up in
 * `translationCoverage('ta')`.
 *
 * The whole catalogue is SEED: none of it has been reviewed by a Tamil speaker.
 * The customer link is the only surface wired to it so far, and it is complete
 * there — a customer who switches must never see a half-English screen.
 */
import { common } from './ta/common'
import { nav } from './ta/nav'
import { rule } from './ta/rule'
import { share } from './ta/share'
import type { MessagesOverride } from './en'

export const ta: MessagesOverride = {
  common,
  nav,
  rule,
  share,
}
