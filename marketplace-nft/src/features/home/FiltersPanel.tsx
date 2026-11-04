import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { toWei } from '@/lib/eth'
import { cn } from '@/lib/utils'
import type { NftCategory, NftFacets, NftNetwork } from '@/types/api'
import { CATEGORY_LABELS, NETWORK_LABELS } from './labels'
import type { HomeSearch } from './search'

const PRICE_RE = /^\d+(\.\d{1,18})?$/
const normalize = (v: string) => v.trim().replace(',', '.')

function Option({ label, count, active, onClick }: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-secondary',
          active ? 'font-bold text-primary' : 'text-muted-foreground',
        )}
      >
        <span>{label}</span>
        {count !== undefined && <span>({count})</span>}
      </button>
    </li>
  )
}

function PriceFilter({ minPrice, maxPrice, range, onApply }: {
  minPrice?: string
  maxPrice?: string
  range?: { min: string; max: string }
  onApply: (patch: Pick<HomeSearch, 'minPrice' | 'maxPrice'>) => void
}) {
  const uid = useId()
  const [min, setMin] = useState(minPrice ?? '')
  const [max, setMax] = useState(maxPrice ?? '')
  const [error, setError] = useState<string>()

  function submit(e: FormEvent) {
    e.preventDefault()
    const a = normalize(min)
    const b = normalize(max)
    if ((a && !PRICE_RE.test(a)) || (b && !PRICE_RE.test(b))) {
      setError('Informe valores em ETH, como 0.50 ou 1.25.')
      return
    }
    if (a && b && toWei(a) > toWei(b)) {
      setError('O valor mínimo não pode ser maior que o máximo.')
      return
    }
    setError(undefined)
    onApply({ minPrice: a || undefined, maxPrice: b || undefined })
  }

  const input =
    'h-10 w-full rounded-[10px] border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary'

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor={`${uid}-min`} className="mb-1 block text-xs text-muted-foreground">Mínimo (ETH)</label>
          <input
            id={`${uid}-min`}
            inputMode="decimal"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder={range?.min}
            aria-invalid={!!error}
            aria-describedby={error ? `${uid}-err` : undefined}
            className={input}
          />
        </div>
        <div className="flex-1">
          <label htmlFor={`${uid}-max`} className="mb-1 block text-xs text-muted-foreground">Máximo (ETH)</label>
          <input
            id={`${uid}-max`}
            inputMode="decimal"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder={range?.max}
            aria-invalid={!!error}
            aria-describedby={error ? `${uid}-err` : undefined}
            className={input}
          />
        </div>
      </div>
      {range && (
        <p className="text-xs text-muted-foreground">Disponível: {range.min} a {range.max} ETH</p>
      )}
      {error && <p id={`${uid}-err`} role="alert" className="text-xs text-coral">{error}</p>}
      <button type="submit" className="rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
        Aplicar
      </button>
    </form>
  )
}

export function FiltersPanel({ search, facets, onChange }: {
  search: HomeSearch
  facets?: NftFacets
  onChange: (patch: Partial<HomeSearch>) => void
}) {
  const uid = useId()
  const hasFilters = !!(search.category || search.network || search.minPrice || search.maxPrice)

  return (
    <div className="space-y-6">
      <section aria-labelledby={`${uid}-cat`}>
        <h2 id={`${uid}-cat`} className="mb-2 text-lg font-bold">Coleções</h2>
        <ul>
          {(Object.entries(CATEGORY_LABELS) as [NftCategory, string][]).map(([id, label]) => (
            <Option
              key={id}
              label={label}
              count={facets?.categories[id] ?? (facets ? 0 : undefined)}
              active={search.category === id}
              onClick={() => onChange({ category: search.category === id ? undefined : id })}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${uid}-price`}>
        <h2 id={`${uid}-price`} className="mb-2 text-lg font-bold">Faixa de preço</h2>
        <PriceFilter
          // remonta quando a URL muda por fora (voltar/avançar do navegador)
          key={`${search.minPrice ?? ''}|${search.maxPrice ?? ''}`}
          minPrice={search.minPrice}
          maxPrice={search.maxPrice}
          range={facets?.priceRange}
          onApply={onChange}
        />
      </section>

      <section aria-labelledby={`${uid}-net`}>
        <h2 id={`${uid}-net`} className="mb-2 text-lg font-bold">Rede</h2>
        <ul>
          {(Object.entries(NETWORK_LABELS) as [NftNetwork, string][]).map(([id, label]) => (
            <Option
              key={id}
              label={label}
              count={facets?.networks[id] ?? (facets ? 0 : undefined)}
              active={search.network === id}
              onClick={() => onChange({ network: search.network === id ? undefined : id })}
            />
          ))}
        </ul>
      </section>

      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({ category: undefined, network: undefined, minPrice: undefined, maxPrice: undefined })}
          className="text-sm font-bold text-primary underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}