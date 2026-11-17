/**
 * English plural for a catalogue noun.
 *
 * Vertical descriptors carry a singular noun ("dish", "coverage item"), and the
 * public storefront used to append a bare `s`, which shipped "0 dishs" and
 * "0 makeup packages" onto a customer-facing page. Only the shapes English
 * actually uses are handled: the noun stays a descriptor token, never a sentence.
 */
const CONSONANT_Y = /[^aeiou]y$/i
const SIBILANT = /(?:s|x|z|ch|sh)$/i

export function pluralise(noun: string, count: number): string {
  const word = noun.trim()
  if (!word) return word
  if (count === 1) return word
  if (CONSONANT_Y.test(word)) return `${word.slice(0, -1)}ies`
  if (SIBILANT.test(word)) return `${word}es`
  return `${word}s`
}
