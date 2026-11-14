import { MAX_IMAGE_BYTES } from '@/lib/storage/menu-images'

/**
 * Copy for the `?error=` codes the menu actions redirect with.
 *
 * Kept beside the page rather than inside it: the page is at the size the repo
 * allows, and these strings are the ones a translation pass needs to move into
 * `messages/<locale>/menu.ts` next.
 */
export const ERROR_COPY: Record<string, string> = {
  name: 'A name and a price are required.',
  time: 'Service times must be written as 07:00 or 19:30.',
  section: 'That meal period no longer exists.',
  group: 'That group no longer exists.',
  permission: 'Only an owner or manager can edit the menu.',
  demo: 'Demo mode: connect a database before changing the menu.',
  image_empty: 'The selected file was empty.',
  image_type: 'Images must be WebP, JPEG or PNG.',
  image_size: `Each image must be under ${Math.round(MAX_IMAGE_BYTES / 1024)} KB.`,
  image_quota: 'This workspace has reached its 25 MB menu-image quota.',
  image_storage: 'Image storage is not configured yet. Add the Supabase keys to enable uploads.',
  image_failed: 'The upload failed. The dish was not saved; try again.',
}
