import type { SnapshotServiceChoice } from './storefront-snapshot'

/**
 * The service keys a published version actually shows.
 *
 * Three rules meet here, and the sitemap must not disagree with the public page:
 * entitlement (the workspace still offers it), the frozen choice (the owner showed
 * it at publish time), and version age (v1/v2 snapshots froze no choice, so their
 * published behaviour was "everything enabled" and must stay that way).
 *
 * Pure so the rule can be tested without a database.
 */
export function shownServiceKeys(
  choices: readonly SnapshotServiceChoice[] | null,
  entitled: ReadonlySet<string>,
): string[] {
  if (choices === null) return [...entitled]
  return choices
    .filter((choice) => choice.visible && entitled.has(choice.verticalKey))
    .map((choice) => choice.verticalKey)
}
