'use client'

import { useState } from 'react'
import { publicMenuImageUrl } from '@/lib/storage/public-image'

/**
 * A dish photo when the business has one, otherwise a generated tile.
 *
 * The fallback is not a grey box: a stable warm gradient per dish name plus its
 * initials keeps a photoless catalogue looking deliberate on a phone.
 */
const GRADIENTS = [
  'from-[#FDF2E4] via-[#F6E3C8] to-[#EAD0AE]',
  'from-[#EFF6EC] via-[#DCEBD6] to-[#C3DCBA]',
  'from-[#FBF0ED] via-[#F5DFD7] to-[#EAC7B9]',
  'from-[#F2F1FB] via-[#E4E2F5] to-[#CECAE8]',
  'from-[#FFF7E8] via-[#FBEAC8] to-[#F1D79C]',
]

function hashOf(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100_000
  }
  return hash
}

export function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return (words[0]!.slice(0, 1) + words[1]!.slice(0, 1)).toUpperCase()
}

export function DishThumb({
  name,
  imagePath,
  className = '',
}: {
  name: string
  imagePath: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = publicMenuImageUrl(imagePath)
  const gradient = GRADIENTS[hashOf(name) % GRADIENTS.length]

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${gradient} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] ${className}`}
      aria-hidden
    >
      {src && !failed ? (
        // Plain img: the portal is server-rendered and the URL is already sized by
        // the card, so the Next image pipeline would add cost for no gain here.
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-display text-base leading-none tracking-wide text-forest/65 sm:text-lg">
          {initialsOf(name)}
        </span>
      )}
    </span>
  )
}
