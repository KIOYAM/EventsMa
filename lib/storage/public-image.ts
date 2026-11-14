/**
 * Public URL for a stored menu photo, safe to import from a client component.
 *
 * Kept apart from `menu-images.ts` on purpose: that module pulls in the Supabase
 * service client and `node:crypto`, which must never reach the browser bundle.
 *
 * Returns null when storage is not configured, and every caller renders a
 * generated tile instead of a broken image.
 */
export function publicMenuImageUrl(path: string | null | undefined): string | null {
  const trimmed = path?.trim()
  if (!trimmed) return null
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!origin) return null
  const bucket = process.env.MENU_IMAGE_BUCKET?.trim() || 'menu'
  return `${origin.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${trimmed.replace(/^\//, '')}`
}
