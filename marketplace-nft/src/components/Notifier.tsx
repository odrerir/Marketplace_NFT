import { X } from 'lucide-react'
import { dismiss, useNotices } from '@/lib/notify'
import { cn } from '@/lib/utils'

export function Notifier() {
  const notices = useNotices()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {notices.map((n) => (
        <div
          key={n.id}
          role={n.kind === 'error' ? 'alert' : undefined}
          className={cn(
            'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[10px] border bg-card px-4 py-3 text-sm shadow-lg',
            n.kind === 'error' && 'border-destructive',
            n.kind === 'success' && 'border-success',
            n.kind === 'info' && 'border-border-soft',
          )}
        >
          <p className="flex-1">{n.message}</p>
          <button type="button" aria-label="Fechar aviso" onClick={() => dismiss(n.id)}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}