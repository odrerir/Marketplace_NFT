import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push('gap')
    out.push(p)
  })
  return out
}

const base = 'flex size-10 items-center justify-center rounded-md text-sm font-bold'

export function Pagination({ page, totalPages, onPage }: {
  page: number
  totalPages: number
  onPage: (page: number) => void
}) {
  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-2 pt-8">
      <p className="sr-only" aria-live="polite">Página {page} de {totalPages}</p>
      <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPage(page - 1)} className={cn(base, 'bg-card disabled:opacity-40')}>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      {pageWindow(page, totalPages).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1">…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPage(item)}
            className={cn(base, item === page ? 'bg-primary text-primary-foreground' : 'bg-card')}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" aria-label="Próxima página" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={cn(base, 'bg-card disabled:opacity-40')}>
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  )
}