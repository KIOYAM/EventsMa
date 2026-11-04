/**
 * Server-side pagination. Lists are always cut in SQL, never in the browser:
 * a workspace with 4,000 events must not ship 4,000 rows to render 20.
 */
export const PAGE_SIZE = 20

export function parsePage(raw: string | undefined): number {
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < 1 || value > 10_000) return 1
  return value
}

export function pageOffset(page: number, size = PAGE_SIZE): number {
  return (page - 1) * size
}

export function pageCount(total: number, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size))
}

export function pageHref(basePath: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return query ? `${basePath}?${query}` : basePath
}
