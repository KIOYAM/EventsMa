'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CopyPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { reviseQuotation } from '@/app/(app)/quotes/revision-actions'

export function ReviseButton({ quotationId }: { quotationId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await reviseQuotation(quotationId)
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          toast.success(`Version ${result.version} created. Version ${result.version - 1} is untouched.`)
          router.refresh()
        })
      }
      className="inline-flex h-11 items-center gap-2 rounded-control border border-hairline bg-paper px-4 text-sm text-ink disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <CopyPlus className="h-4 w-4" aria-hidden />
      )}
      New revision
    </button>
  )
}
