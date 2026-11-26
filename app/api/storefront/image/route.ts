import { storefrontImageResponse } from '@/lib/storage/image-route'
import { signedStorefrontImageUrl } from '@/lib/storage/storefront-image'

/**
 * Public bytes for one tenant photograph.
 *
 * The URL carries an HMAC over the object path and a seven-day window; the storage
 * credential never reaches the browser. Responses are immutable for the token's
 * life, so the Next image optimizer and the CDN can cache one variant per width.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  return storefrontImageResponse(new URL(request.url).searchParams, {
    resolveSignedUrl: signedStorefrontImageUrl,
  })
}
