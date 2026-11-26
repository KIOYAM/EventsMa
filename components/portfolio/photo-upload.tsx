'use client'

import { useRef, useState, useTransition } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { uploadPortfolioPhoto } from '@/app/(app)/portfolio/actions'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'

/**
 * Compressed in the browser, then uploaded.
 *
 * A modern phone photo is 3–8 MB. Re-encoding it to WebP at 1600px before it
 * leaves the device means the owner uploads on mobile data in a second, the
 * bucket stays small, and the public page sends a fraction of the bytes. No
 * dependency: `createImageBitmap` and `canvas.toBlob` are browser built-ins.
 */
const MAX_EDGE = 1600
const QUALITY = 0.82

const ERROR_KEYS: Record<string, string> = {
  permission: 'portfolio.photo.errorPermission',
  demo: 'portfolio.photo.errorDemo',
  missing: 'portfolio.photo.errorMissing',
  type: 'portfolio.photo.errorType',
  size: 'portfolio.photo.errorSize',
  storage: 'portfolio.photo.errorStorage',
}

async function compress(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return file

    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY),
    )
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${name}.webp`, { type: 'image/webp' })
  } catch {
    // An old browser that cannot decode the file still gets to upload it; the
    // server's own size and type checks decide whether it is acceptable.
    return file
  }
}

export function PhotoUpload({
  itemId,
  hasPhoto,
  disabled,
  locale,
}: {
  itemId: string
  hasPhoto: boolean
  disabled: boolean
  locale: Locale
}) {
  const t = createTranslator(locale)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    startTransition(async () => {
      try {
        const compressed = await compress(file)
        if (compressed.size > 400 * 1024) {
          setError(t('portfolio.photo.errorSize'))
          return
        }
        const body = new FormData()
        body.set('id', itemId)
        body.set('photo', compressed)
        const result = await uploadPortfolioPhoto(body)
        if ('code' in result) {
          setError(t(ERROR_KEYS[result.code] ?? 'portfolio.photo.errorStorage'))
        }
      } catch {
        setError(t('portfolio.photo.errorStorage'))
      }
    })
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onChange}
        disabled={disabled || pending}
        id={`photo-${itemId}`}
      />
      <label
        htmlFor={`photo-${itemId}`}
        className="btn btn-sm btn-outline cursor-pointer"
        aria-disabled={disabled || pending}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="h-4 w-4" aria-hidden />
        )}
        {pending
          ? t('portfolio.photo.uploading')
          : hasPhoto
            ? t('portfolio.photo.replace')
            : t('portfolio.photo.upload')}
      </label>
      {error ? (
        <p role="alert" className="text-xs text-terracotta">
          {error}
        </p>
      ) : null}
    </div>
  )
}
