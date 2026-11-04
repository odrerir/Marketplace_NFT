import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { NftSort } from '@/types/api'
import { SORT_LABELS } from './labels'

export function SortSelect({ value, onChange, className }: {
  value: NftSort
  onChange: (value: NftSort) => void
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <label htmlFor={id} className="text-muted-foreground">Ordenar por:</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as NftSort)}
        className="h-10 rounded-[10px] border border-input bg-card px-3 focus-visible:outline-2 focus-visible:outline-primary"
      >
        {(Object.entries(SORT_LABELS) as [NftSort, string][]).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
  )
}