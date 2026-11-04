import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { listNfts } from '@/api/nfts'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { NftTab } from '@/types/api'
import { BottomNav } from './BottomNav'
import { FiltersPanel } from './FiltersPanel'
import { HeroBanner } from './HeroBanner'
import { NftCard, NftCardSkeleton } from './NftCard'
import { Pagination } from './Pagination'
import type { HomeSearch } from './search'
import { SortSelect } from './SortSelect'
import { TopNav } from './TopNav'

const route = getRouteApi('/')
// 36 NFTs / 9 = 4 páginas, igual à paginação do Figma desktop
const PAGE_SIZE = 9

const tabs: { id: NftTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-5 pb-8 md:grid-cols-3 md:gap-x-6 md:pb-0 lg:grid-cols-2 xl:grid-cols-3'

/** Só no mobile (2 colunas): a segunda coluna fica 32 px mais baixa, como no Figma. */
const stagger = (i: number) => (i % 2 === 1 ? 'max-md:translate-y-8' : '')

function SearchRow({ q, onSearch, onOpenFilters }: {
  q?: string
  onSearch: (q?: string) => void
  onOpenFilters: () => void
}) {
  const [value, setValue] = useState(q ?? '')
  const pushed = useRef(q ?? '')

  // A URL mudou por fora (voltar/avançar do navegador): atualiza o campo
  useEffect(() => {
    if ((q ?? '') !== pushed.current) {
      pushed.current = q ?? ''
      setValue(q ?? '')
    }
  }, [q])

  // Só escreve na URL depois de 300 ms sem digitar
  useEffect(() => {
    const next = value.trim()
    if (next === pushed.current) return
    const id = setTimeout(() => {
      pushed.current = next
      onSearch(next || undefined)
    }, 300)
    return () => clearTimeout(id)
  }, [value, onSearch])

  return (
    <div className="flex gap-2 lg:max-w-md">
      <form role="search" className="relative flex-1" onSubmit={(e) => e.preventDefault()}>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-[11.5px] size-[22px] text-muted-foreground" />
        <input
          id="busca"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Explorar coleções"
          aria-label="Buscar NFTs"
          className="h-[45px] w-full rounded-[10px] bg-card pl-[42px] pr-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
        />
      </form>
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label="Abrir filtros"
        className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-gradient-filter text-primary-foreground lg:hidden"
      >
        <SlidersHorizontal className="size-[22px]" />
      </button>
    </div>
  )
}

export function HomePage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const page = search.page ?? 1
  const tab = search.tab ?? 'all'

  const params = {
    page,
    pageSize: PAGE_SIZE,
    q: search.q,
    tab,
    sort: search.sort,
    category: search.category,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
  }

  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: ['nfts', 'list', params],
    queryFn: ({ signal }) => listNfts(params, signal),
    placeholderData: keepPreviousData,
  })

  // Mudar qualquer filtro reinicia a paginação
  const changeFilter = (patch: Partial<HomeSearch>, replace = false) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }), replace })
  const goToPage = (p: number) =>
    navigate({ search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }) })
  const reset = () => navigate({ search: {} })

  const sortControl = (className?: string) => (
    <SortSelect
      className={className}
      value={search.sort ?? 'recent'}
      onChange={(v) => changeFilter({ sort: v === 'recent' ? undefined : v })}
    />
  )

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-[1200px] px-6 pb-[calc(94.95px+2rem)] pt-6 lg:pb-16">
        <SearchRow
          q={search.q}
          onSearch={(q) => changeFilter({ q }, true)}
          onOpenFilters={() => setFiltersOpen(true)}
        />
        <HeroBanner />

        <div className="mt-8 lg:grid lg:grid-cols-[310px_1fr] lg:gap-[50px]">
          <aside aria-label="Filtros" className="hidden lg:block">
            <div className="rounded-[12px] bg-card p-5">
              <FiltersPanel search={search} facets={data?.facets} onChange={changeFilter} />
            </div>
          </aside>

          <div id="catalogo" className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Filtrar NFTs" className="flex gap-3 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={tab === t.id}
                    onClick={() => changeFilter({ tab: t.id === 'all' ? undefined : t.id })}
                    className={cn(
                      'shrink-0 whitespace-nowrap border-b-2 pb-1 text-sm font-medium',
                      tab === t.id ? 'border-primary text-primary' : 'border-transparent text-foreground',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {sortControl('hidden lg:flex')}
            </div>

            <p role="status" className="sr-only">{isFetching ? 'Carregando NFTs' : ''}</p>

            <section aria-busy={isFetching} className={cn('pt-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
              {isPending ? (
                <ul className={gridClass}>
                  {Array.from({ length: PAGE_SIZE }, (_, i) => (
                    <li key={i} className={stagger(i)}><NftCardSkeleton /></li>
                  ))}
                </ul>
              ) : isError ? (
                <div role="alert" className="py-12 text-center">
                  <p className="mb-4">Não foi possível carregar os NFTs.</p>
                  <button type="button" onClick={() => refetch()} className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">
                    Tentar novamente
                  </button>
                </div>
              ) : data.items.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-4">{data.total > 0 ? 'Esta página não existe.' : 'Nenhum NFT encontrado.'}</p>
                  <button type="button" onClick={reset} className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">
                    Limpar busca e filtros
                  </button>
                </div>
              ) : (
                <>
                  <ul className={gridClass}>
                    {data.items.map((nft, i) => (
                      <li key={nft.id} className={stagger(i)}><NftCard nft={nft} /></li>
                    ))}
                  </ul>
                  {data.totalPages > 1 && (
                    <Pagination page={data.page} totalPages={data.totalPages} onPage={goToPage} />
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <div className="lg:hidden"><BottomNav /></div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 px-4 pb-6">
            {sortControl()}
            <FiltersPanel search={search} facets={data?.facets} onChange={changeFilter} />
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="w-full rounded-[10px] bg-primary py-3 font-bold text-primary-foreground"
            >
              Ver resultados
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}