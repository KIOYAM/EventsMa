/**
 * The English catalogue: the source of truth, assembled from one file per module.
 *
 * The split is not cosmetic. Several agents translate different surfaces at the
 * same time; if every key lived in this file, every agent would edit it and the
 * last writer would silently drop the others' work. A module per surface means
 * parallel work touches disjoint files, and this aggregator only ever gains a
 * one-line import.
 *
 * Adding a module:
 *   1. `lib/i18n/messages/en/<module>.ts` exporting one `const` object
 *   2. `lib/i18n/messages/ta/<module>.ts` with the same shape
 *   3. register both here and in `ta.ts`
 */
import { common } from './en/common'
import { dashboard } from './en/dashboard'
import { events } from './en/events'
import { nav } from './en/nav'
import { rule } from './en/rule'
import { share } from './en/share'

export const en = {
  common,
  dashboard,
  events,
  nav,
  rule,
  share,
} as const

/** Deep partial of the English catalogue: the shape every locale must fit. */
export type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends string ? string : DeepPartial<T[Key]>
}

export type Messages = typeof en
export type MessagesOverride = DeepPartial<Messages>
