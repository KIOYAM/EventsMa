/**
 * Business content translation semantics, in one place.
 *
 * A translation is a *partial* replacement of the source record: it can supply a
 * name, a description, both or neither. Each field falls back on its own, so a
 * half-filled translation never blanks a sentence on a customer's screen.
 *
 * This is deliberately separate from `lib/i18n`: that layer translates the
 * interface (buttons, labels, errors), this one translates what the business wrote.
 * Mixing them is how a product ends up translating a dish name into a UI key.
 */

export const TRANSLATABLE_LOCALES = ['ta', 'te', 'kn', 'ml'] as const
export type TranslatableLocale = (typeof TRANSLATABLE_LOCALES)[number]

export function isTranslatableLocale(value: unknown): value is TranslatableLocale {
  return typeof value === 'string' && (TRANSLATABLE_LOCALES as readonly string[]).includes(value)
}

export interface TranslationFields {
  readonly name: string
  readonly description: string | null
}

/**
 * Overlay a translation on the source text.
 *
 * Blank strings count as absent: an owner who clears the Tamil name box means
 * "use the English one", not "show nothing".
 */
export function localiseContent<T extends TranslationFields>(
  source: T,
  translation: TranslationFields | null | undefined,
): T {
  if (!translation) return source

  const name = translation.name?.trim()
  const description = translation.description?.trim()

  return {
    ...source,
    name: name ? name : source.name,
    description: description ? description : source.description,
  }
}

/** Resolve one record from a map of translations, or the source when absent. */
export function localiseFrom<T extends TranslationFields>(
  source: T,
  translations: ReadonlyMap<string, TranslationFields>,
  id: string,
): T {
  return localiseContent(source, translations.get(id))
}
