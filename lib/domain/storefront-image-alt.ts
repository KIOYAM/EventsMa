/**
 * Alt text for the only three images a storefront can show.
 *
 * The owner writes the business name, the city, the work title and the venue; the
 * alt text is assembled from those, so it says something real without adding a
 * second copy field nobody would keep up to date. No new user-facing sentence is
 * introduced, which also keeps `npm run i18n:audit` untouched.
 */
export function heroImageAlt(business: { name: string; city: string | null }): string {
  const name = business.name.trim()
  const city = business.city?.trim()
  if (!name) return city ?? ''
  return city ? `${name} — ${city}` : name
}

export function portfolioImageAlt(item: {
  title: string
  venueName: string | null
}): string {
  const title = item.title.trim()
  const venue = item.venueName?.trim()
  if (!title) return venue ?? ''
  return venue ? `${title} · ${venue}` : title
}

export function logoImageAlt(name: string): string {
  const clean = name.trim()
  return clean ? `${clean} logo` : ''
}
